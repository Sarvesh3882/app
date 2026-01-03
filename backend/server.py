from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Cookie
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import httpx
from functools import wraps

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    xp: int = 0
    level: int = 1
    created_at: str


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class RoadmapNode(BaseModel):
    id: str
    label: str
    description: Optional[str] = None
    resources: List[Dict[str, str]] = []


class Roadmap(BaseModel):
    model_config = ConfigDict(extra="ignore")
    roadmap_id: str
    title: str
    description: str
    difficulty: str
    estimated_time: str
    nodes: List[RoadmapNode]
    created_at: str


class UserProgress(BaseModel):
    model_config = ConfigDict(extra="ignore")
    progress_id: str
    user_id: str
    roadmap_id: str
    completed_nodes: List[str] = []
    progress_percentage: float = 0.0
    last_updated: str


class Achievement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    achievement_id: str
    name: str
    description: str
    icon: str
    xp_reward: int


class UserAchievement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_achievement_id: str
    user_id: str
    achievement_id: str
    earned_at: str


async def get_current_user(request: Request):
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user_doc)


def calculate_level_from_xp(xp: int) -> int:
    return max(1, int(xp / 100) + 1)


async def award_achievement(user_id: str, achievement_id: str):
    existing = await db.user_achievements.find_one({"user_id": user_id, "achievement_id": achievement_id}, {"_id": 0})
    if existing:
        return
    
    achievement_doc = await db.achievements.find_one({"achievement_id": achievement_id}, {"_id": 0})
    if not achievement_doc:
        return
    
    user_achievement_id = f"ua_{uuid.uuid4().hex[:12]}"
    await db.user_achievements.insert_one({
        "user_achievement_id": user_achievement_id,
        "user_id": user_id,
        "achievement_id": achievement_id,
        "earned_at": datetime.now(timezone.utc).isoformat()
    })
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$inc": {"xp": achievement_doc["xp_reward"]}}
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    new_level = calculate_level_from_xp(user_doc["xp"])
    await db.users.update_one({"user_id": user_id}, {"$set": {"level": new_level}})


@api_router.post("/auth/register")
async def register(user_create: UserCreate):
    existing = await db.users.find_one({"email": user_create.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    password_hash = bcrypt.hashpw(user_create.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    
    user_doc = {
        "user_id": user_id,
        "email": user_create.email,
        "name": user_create.name,
        "password_hash": password_hash,
        "picture": None,
        "xp": 0,
        "level": 1,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    await award_achievement(user_id, "first_step")
    
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    response = JSONResponse(content={"message": "Registration successful", "user_id": user_id})
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    return response


@api_router.post("/auth/login")
async def login(user_login: UserLogin):
    user_doc = await db.users.find_one({"email": user_login.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(user_login.password.encode('utf-8'), user_doc["password_hash"].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_doc["user_id"],
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    response = JSONResponse(content={"message": "Login successful", "user_id": user_doc["user_id"]})
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    return response


@api_router.post("/auth/session")
async def exchange_session(request: Request):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid session_id")
        
        data = response.json()
    
    user_doc = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    
    if user_doc:
        user_id = user_doc["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": data.get("name", user_doc.get("name", "")),
                "picture": data.get("picture", user_doc.get("picture"))
            }}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": data["email"],
            "name": data.get("name", ""),
            "picture": data.get("picture"),
            "xp": 0,
            "level": 1,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
        await award_achievement(user_id, "first_step")
    
    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    response_data = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    
    json_response = JSONResponse(content=response_data)
    json_response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    return json_response


@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user


@api_router.post("/auth/logout")
async def logout(request: Request):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie(key="session_token", path="/")
    return response


@api_router.get("/roadmaps")
async def get_roadmaps():
    roadmaps = await db.roadmaps.find({}, {"_id": 0}).to_list(100)
    return roadmaps


@api_router.get("/roadmaps/{roadmap_id}")
async def get_roadmap(roadmap_id: str):
    roadmap = await db.roadmaps.find_one({"roadmap_id": roadmap_id}, {"_id": 0})
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    return roadmap


@api_router.get("/progress")
async def get_user_progress(request: Request):
    user = await get_current_user(request)
    progress_list = await db.user_progress.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    return progress_list


@api_router.post("/progress/{roadmap_id}/complete-node")
async def complete_node(roadmap_id: str, request: Request):
    user = await get_current_user(request)
    body = await request.json()
    node_id = body.get("node_id")
    
    if not node_id:
        raise HTTPException(status_code=400, detail="node_id required")
    
    progress = await db.user_progress.find_one({"user_id": user.user_id, "roadmap_id": roadmap_id}, {"_id": 0})
    
    if not progress:
        progress_id = f"progress_{uuid.uuid4().hex[:12]}"
        progress = {
            "progress_id": progress_id,
            "user_id": user.user_id,
            "roadmap_id": roadmap_id,
            "completed_nodes": [node_id],
            "progress_percentage": 0.0,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        await db.user_progress.insert_one(progress)
    else:
        if node_id not in progress["completed_nodes"]:
            completed_nodes = progress["completed_nodes"] + [node_id]
            await db.user_progress.update_one(
                {"user_id": user.user_id, "roadmap_id": roadmap_id},
                {"$set": {
                    "completed_nodes": completed_nodes,
                    "last_updated": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            await db.users.update_one({"user_id": user.user_id}, {"$inc": {"xp": 10}})
    
    roadmap = await db.roadmaps.find_one({"roadmap_id": roadmap_id}, {"_id": 0})
    if roadmap:
        progress_doc = await db.user_progress.find_one({"user_id": user.user_id, "roadmap_id": roadmap_id}, {"_id": 0})
        total_nodes = len(roadmap["nodes"])
        completed_count = len(progress_doc["completed_nodes"])
        progress_percentage = (completed_count / total_nodes) * 100 if total_nodes > 0 else 0
        
        await db.user_progress.update_one(
            {"user_id": user.user_id, "roadmap_id": roadmap_id},
            {"$set": {"progress_percentage": progress_percentage}}
        )
        
        if progress_percentage == 100:
            await award_achievement(user.user_id, "roadmap_master")
    
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    new_level = calculate_level_from_xp(user_doc["xp"])
    await db.users.update_one({"user_id": user.user_id}, {"$set": {"level": new_level}})
    
    return {"message": "Node completed", "xp_gained": 10}


@api_router.get("/achievements")
async def get_achievements():
    achievements = await db.achievements.find({}, {"_id": 0}).to_list(100)
    return achievements


@api_router.get("/user-achievements")
async def get_user_achievements(request: Request):
    user = await get_current_user(request)
    user_achievements = await db.user_achievements.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    
    achievement_details = []
    for ua in user_achievements:
        achievement = await db.achievements.find_one({"achievement_id": ua["achievement_id"]}, {"_id": 0})
        if achievement:
            achievement_details.append({
                **achievement,
                "earned_at": ua["earned_at"]
            })
    
    return achievement_details


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


@app.on_event("startup")
async def initialize_data():
    achievements_count = await db.achievements.count_documents({})
    if achievements_count == 0:
        achievements = [
            {
                "achievement_id": "first_step",
                "name": "First Step",
                "description": "Welcome to Pixel Coders!",
                "icon": "🎮",
                "xp_reward": 10
            },
            {
                "achievement_id": "week_warrior",
                "name": "Week Warrior",
                "description": "7-day learning streak",
                "icon": "🔥",
                "xp_reward": 50
            },
            {
                "achievement_id": "roadmap_rookie",
                "name": "Roadmap Rookie",
                "description": "Started your first roadmap",
                "icon": "🗺️",
                "xp_reward": 20
            },
            {
                "achievement_id": "roadmap_master",
                "name": "Roadmap Master",
                "description": "Completed an entire roadmap",
                "icon": "🏆",
                "xp_reward": 100
            },
            {
                "achievement_id": "problem_solver",
                "name": "Problem Solver",
                "description": "Solved your first challenge",
                "icon": "💡",
                "xp_reward": 15
            },
            {
                "achievement_id": "community_member",
                "name": "Community Member",
                "description": "Made your first forum post",
                "icon": "👥",
                "xp_reward": 25
            },
            {
                "achievement_id": "night_owl",
                "name": "Night Owl",
                "description": "Studied after midnight",
                "icon": "🦉",
                "xp_reward": 30
            },
            {
                "achievement_id": "early_bird",
                "name": "Early Bird",
                "description": "Studied before 6 AM",
                "icon": "🌅",
                "xp_reward": 30
            }
        ]
        await db.achievements.insert_many(achievements)
        logger.info("Initialized achievements")
    
    roadmaps_count = await db.roadmaps.count_documents({})
    if roadmaps_count == 0:
        roadmaps = [
            {
                "roadmap_id": "frontend_dev",
                "title": "Frontend Developer",
                "description": "Master modern frontend development with React, HTML, CSS, and JavaScript",
                "difficulty": "Beginner to Advanced",
                "estimated_time": "4-6 months",
                "nodes": [
                    {"id": "html_basics", "label": "HTML Basics", "description": "Learn HTML structure, tags, and semantic elements", "resources": [{"type": "article", "url": "https://developer.mozilla.org/en-US/docs/Web/HTML", "title": "MDN HTML Guide"}]},
                    {"id": "css_fundamentals", "label": "CSS Fundamentals", "description": "Styling, layouts, and responsive design", "resources": [{"type": "article", "url": "https://developer.mozilla.org/en-US/docs/Web/CSS", "title": "MDN CSS Guide"}]},
                    {"id": "javascript_basics", "label": "JavaScript Basics", "description": "Variables, functions, and DOM manipulation", "resources": [{"type": "article", "url": "https://javascript.info/", "title": "JavaScript.info"}]},
                    {"id": "react_fundamentals", "label": "React Fundamentals", "description": "Components, props, state, and hooks", "resources": [{"type": "article", "url": "https://react.dev/learn", "title": "React Official Docs"}]},
                    {"id": "state_management", "label": "State Management", "description": "Redux, Context API, Zustand", "resources": []},
                    {"id": "api_integration", "label": "API Integration", "description": "Fetch, Axios, REST APIs", "resources": []},
                    {"id": "build_tools", "label": "Build Tools", "description": "Webpack, Vite, npm", "resources": []},
                    {"id": "testing", "label": "Testing", "description": "Jest, React Testing Library", "resources": []}
                ],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "roadmap_id": "backend_dev",
                "title": "Backend Developer",
                "description": "Build scalable server-side applications with Node.js, databases, and APIs",
                "difficulty": "Intermediate",
                "estimated_time": "5-7 months",
                "nodes": [
                    {"id": "nodejs_basics", "label": "Node.js Basics", "description": "Event loop, modules, npm", "resources": []},
                    {"id": "express_framework", "label": "Express Framework", "description": "Routing, middleware, REST APIs", "resources": []},
                    {"id": "databases", "label": "Databases", "description": "SQL (PostgreSQL) and NoSQL (MongoDB)", "resources": []},
                    {"id": "authentication", "label": "Authentication", "description": "JWT, OAuth, sessions", "resources": []},
                    {"id": "api_design", "label": "API Design", "description": "RESTful principles, GraphQL", "resources": []},
                    {"id": "security", "label": "Security", "description": "HTTPS, CORS, input validation", "resources": []},
                    {"id": "deployment", "label": "Deployment", "description": "Docker, AWS, Heroku", "resources": []},
                    {"id": "testing_backend", "label": "Testing", "description": "Unit tests, integration tests", "resources": []}
                ],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "roadmap_id": "fullstack_dev",
                "title": "Full Stack Developer",
                "description": "Combine frontend and backend skills to build complete web applications",
                "difficulty": "Advanced",
                "estimated_time": "8-12 months",
                "nodes": [
                    {"id": "frontend_skills", "label": "Frontend Skills", "description": "React, Vue, or Angular", "resources": []},
                    {"id": "backend_skills", "label": "Backend Skills", "description": "Node.js, Python, or Java", "resources": []},
                    {"id": "database_design", "label": "Database Design", "description": "Schema design, relationships", "resources": []},
                    {"id": "api_architecture", "label": "API Architecture", "description": "REST, GraphQL, WebSockets", "resources": []},
                    {"id": "devops_basics", "label": "DevOps Basics", "description": "CI/CD, Docker, Kubernetes", "resources": []},
                    {"id": "cloud_platforms", "label": "Cloud Platforms", "description": "AWS, Azure, GCP", "resources": []},
                    {"id": "monitoring", "label": "Monitoring", "description": "Logging, error tracking, analytics", "resources": []},
                    {"id": "scalability", "label": "Scalability", "description": "Load balancing, caching, microservices", "resources": []}
                ],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "roadmap_id": "python_dev",
                "title": "Python Developer",
                "description": "Master Python for web development, automation, and data science",
                "difficulty": "Beginner to Intermediate",
                "estimated_time": "4-6 months",
                "nodes": [
                    {"id": "python_basics", "label": "Python Basics", "description": "Syntax, data types, functions", "resources": []},
                    {"id": "oop_python", "label": "OOP in Python", "description": "Classes, inheritance, polymorphism", "resources": []},
                    {"id": "python_web", "label": "Web Frameworks", "description": "Django, Flask, FastAPI", "resources": []},
                    {"id": "database_python", "label": "Database with Python", "description": "SQLAlchemy, PyMongo", "resources": []},
                    {"id": "python_testing", "label": "Testing", "description": "pytest, unittest", "resources": []},
                    {"id": "python_async", "label": "Async Programming", "description": "asyncio, concurrent execution", "resources": []},
                    {"id": "python_packages", "label": "Package Management", "description": "pip, virtual environments", "resources": []},
                    {"id": "python_deployment", "label": "Deployment", "description": "Gunicorn, Docker", "resources": []}
                ],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "roadmap_id": "data_science",
                "title": "Data Science",
                "description": "Analyze data, build models, and extract insights with Python and ML",
                "difficulty": "Intermediate to Advanced",
                "estimated_time": "6-10 months",
                "nodes": [
                    {"id": "statistics", "label": "Statistics", "description": "Probability, distributions, hypothesis testing", "resources": []},
                    {"id": "python_data", "label": "Python for Data", "description": "NumPy, Pandas, Matplotlib", "resources": []},
                    {"id": "data_cleaning", "label": "Data Cleaning", "description": "Handling missing data, outliers", "resources": []},
                    {"id": "machine_learning", "label": "Machine Learning", "description": "Supervised, unsupervised learning", "resources": []},
                    {"id": "deep_learning", "label": "Deep Learning", "description": "Neural networks, TensorFlow, PyTorch", "resources": []},
                    {"id": "data_viz", "label": "Data Visualization", "description": "Seaborn, Plotly, dashboards", "resources": []},
                    {"id": "sql_data", "label": "SQL for Data", "description": "Queries, joins, aggregations", "resources": []},
                    {"id": "big_data", "label": "Big Data", "description": "Spark, Hadoop", "resources": []}
                ],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.roadmaps.insert_many(roadmaps)
        logger.info("Initialized roadmaps")
