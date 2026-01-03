import { Link } from 'react-router-dom';
import { ExternalLink, Code } from 'lucide-react';

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-white font-['Press_Start_2P'] text-3xl md:text-4xl mb-6" data-testid="explore-heading">
            Explore
          </h1>
          <p className="text-white font-['VT323'] text-xl md:text-2xl">
            Choose your learning path
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <ExploreCard
            title="Academics"
            description="Study materials, notes, and academic resources"
            icon="📚"
            isExternal
            link="https://studybuddykkw.jimdofree.com/contact/"
            buttonText="Visit Study Buddy"
          />

          <ExploreCard
            title="Coding"
            description="Interactive roadmaps, tutorials, and practice"
            icon="💻"
            link="/roadmap/frontend_dev"
            buttonText="Explore Roadmaps"
          />
        </div>

        <div className="mt-16">
          <h2 className="text-white font-['Press_Start_2P'] text-2xl mb-8 text-center">
            Featured Roadmaps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RoadmapCard
              title="Frontend Developer"
              difficulty="Beginner"
              time="4-6 months"
              link="/roadmap/frontend_dev"
            />
            <RoadmapCard
              title="Backend Developer"
              difficulty="Intermediate"
              time="5-7 months"
              link="/roadmap/backend_dev"
            />
            <RoadmapCard
              title="Full Stack Developer"
              difficulty="Advanced"
              time="8-12 months"
              link="/roadmap/fullstack_dev"
            />
            <RoadmapCard
              title="Python Developer"
              difficulty="Beginner"
              time="4-6 months"
              link="/roadmap/python_dev"
            />
            <RoadmapCard
              title="Data Science"
              difficulty="Intermediate"
              time="6-10 months"
              link="/roadmap/data_science"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ExploreCard({ title, description, icon, link, isExternal, buttonText }) {
  const CardContent = (
    <div className="bg-black border-4 border-white p-8 hover:border-[#00ff00] transition-colors duration-0 h-full flex flex-col">
      <div className="text-6xl mb-6 text-center">{icon}</div>
      <h2 className="text-white font-['Press_Start_2P'] text-xl mb-4 text-center">
        {title}
      </h2>
      <p className="text-white font-['VT323'] text-xl mb-8 text-center flex-grow">
        {description}
      </p>
      <div className="text-center">
        <span className="inline-flex items-center gap-2 pixel-button-secondary">
          {isExternal && <ExternalLink className="w-4 h-4" />}
          {buttonText}
        </span>
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" data-testid="academics-card">
        {CardContent}
      </a>
    );
  }

  return (
    <Link to={link} data-testid="coding-card">
      {CardContent}
    </Link>
  );
}

function RoadmapCard({ title, difficulty, time, link }) {
  return (
    <Link
      to={link}
      className="bg-black border-2 border-white p-6 hover:border-[#00ff00] transition-colors duration-0"
      data-testid="roadmap-card"
    >
      <div className="flex items-center gap-2 mb-4">
        <Code className="text-white w-8 h-8" />
        <h3 className="text-white font-['Press_Start_2P'] text-xs">
          {title}
        </h3>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-white font-['VT323'] text-lg">Difficulty:</span>
          <span className="text-[#00ff00] font-['VT323'] text-lg">{difficulty}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-['VT323'] text-lg">Time:</span>
          <span className="text-[#00ff00] font-['VT323'] text-lg">{time}</span>
        </div>
      </div>
    </Link>
  );
}