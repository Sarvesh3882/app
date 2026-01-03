import { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy, Map, TrendingUp, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, progressRes, achievementsRes] = await Promise.all([
          axios.get(`${API}/auth/me`, { withCredentials: true }),
          axios.get(`${API}/progress`, { withCredentials: true }),
          axios.get(`${API}/user-achievements`, { withCredentials: true })
        ]);

        setUser(userRes.data);
        setProgress(progressRes.data);
        setAchievements(achievementsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-['Press_Start_2P'] text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  const xpForNextLevel = user ? user.level * 100 : 100;
  const xpProgress = user ? (user.xp % 100) : 0;

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-white font-['Press_Start_2P'] text-3xl mb-4" data-testid="dashboard-heading">
            Dashboard
          </h1>
          <p className="text-white font-['VT323'] text-xl">Welcome back, {user?.name}!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-black border-4 border-white p-6" data-testid="level-card">
            <div className="flex items-center gap-4 mb-4">
              <Trophy className="text-white w-12 h-12" />
              <div>
                <div className="text-white font-['Press_Start_2P'] text-2xl">Level {user?.level}</div>
                <div className="text-white font-['VT323'] text-lg">{user?.xp} XP</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="bg-[#333] h-6 border-2 border-white relative">
                <div
                  className="bg-[#00ff00] h-full transition-all duration-300"
                  style={{ width: `${xpProgress}%` }}
                ></div>
              </div>
              <div className="text-white font-['VT323'] text-sm mt-2">
                {xpProgress}% to Level {user ? user.level + 1 : 2}
              </div>
            </div>
          </div>

          <div className="bg-black border-4 border-white p-6" data-testid="progress-card">
            <div className="flex items-center gap-4 mb-4">
              <Map className="text-white w-12 h-12" />
              <div>
                <div className="text-white font-['Press_Start_2P'] text-xl">Roadmaps</div>
                <div className="text-white font-['VT323'] text-lg">{progress.length} Active</div>
              </div>
            </div>
          </div>

          <div className="bg-black border-4 border-white p-6" data-testid="achievements-card">
            <div className="flex items-center gap-4 mb-4">
              <Award className="text-white w-12 h-12" />
              <div>
                <div className="text-white font-['Press_Start_2P'] text-xl">Achievements</div>
                <div className="text-white font-['VT323'] text-lg">{achievements.length} Earned</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-white font-['Press_Start_2P'] text-xl mb-6">Your Progress</h2>
            {progress.length > 0 ? (
              <div className="space-y-4">
                {progress.map((p) => (
                  <div key={p.progress_id} className="bg-black border-2 border-white p-4" data-testid="progress-item">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-white font-['VT323'] text-lg">{p.roadmap_id}</div>
                      <div className="text-[#00ff00] font-['Press_Start_2P'] text-xs">
                        {p.progress_percentage.toFixed(0)}%
                      </div>
                    </div>
                    <div className="bg-[#333] h-4 border-2 border-white">
                      <div
                        className="bg-[#00ff00] h-full transition-all duration-300"
                        style={{ width: `${p.progress_percentage}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-white font-['VT323'] text-sm">
                      {p.completed_nodes.length} nodes completed
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-black border-2 border-white p-8 text-center">
                <p className="text-white font-['VT323'] text-xl mb-4">No roadmaps started yet</p>
                <Link to="/explore" className="pixel-button-secondary inline-block">
                  Start Learning
                </Link>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-white font-['Press_Start_2P'] text-xl mb-6">Achievements</h2>
            {achievements.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.achievement_id}
                    className="bg-black border-2 border-white p-4 text-center"
                    data-testid="achievement-badge"
                  >
                    <div className="text-4xl mb-2">{achievement.icon}</div>
                    <div className="text-white font-['Press_Start_2P'] text-xs mb-2">
                      {achievement.name}
                    </div>
                    <div className="text-white font-['VT323'] text-sm">
                      {achievement.description}
                    </div>
                    <div className="text-[#00ff00] font-['VT323'] text-sm mt-2">
                      +{achievement.xp_reward} XP
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-black border-2 border-white p-8 text-center">
                <p className="text-white font-['VT323'] text-xl">No achievements yet. Keep learning!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}