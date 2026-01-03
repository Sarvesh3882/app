import { Link } from 'react-router-dom';
import { Code, Trophy, Users, Zap, TrendingUp, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [stats, setStats] = useState({ users: 0, roadmaps: 5, resources: 0, projects: 0 });

  useEffect(() => {
    const animateValue = (start, end, duration, setter) => {
      let startTimestamp = null;
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        setter(Math.floor(progress * (end - start) + start));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    };

    animateValue(0, 10000, 2000, (val) => setStats(prev => ({ ...prev, users: val })));
    setTimeout(() => animateValue(0, 1000, 1500, (val) => setStats(prev => ({ ...prev, resources: val }))), 500);
    setTimeout(() => animateValue(0, 500, 1500, (val) => setStats(prev => ({ ...prev, projects: val }))), 1000);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <section className="relative min-h-[80vh] flex flex-col justify-center items-center overflow-hidden border-b-4 border-white" data-testid="hero-section">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-0 left-1/4 text-9xl animate-bounce" style={{ animationDuration: '3s' }}>
            🦖
          </div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl">
          <img
            src="https://customer-assets.emergentagent.com/job_836eb7ab-8a25-41b0-accb-56e6c23944fe/artifacts/2oeof37e_Untitled%20design.png"
            alt="T-Rex Mascot"
            className="w-32 h-32 mx-auto mb-8 animate-pulse"
          />
          
          <h1 className="text-white font-['Press_Start_2P'] text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight mb-8" data-testid="hero-heading">
            One stop solution for your whole coding journey
          </h1>

          <p className="text-white font-['VT323'] text-xl md:text-2xl mb-12 max-w-2xl mx-auto">
            Master coding through gamified learning. Track progress, earn achievements, and level up your skills.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              to="/explore"
              className="pixel-button"
              data-testid="hero-explore-btn"
            >
              Explore Roadmaps
            </Link>
            <Link
              to="/register"
              className="pixel-button-secondary"
              data-testid="hero-start-learning-btn"
            >
              Start Learning
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 border-b-4 border-white" data-testid="features-section">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-white font-['Press_Start_2P'] text-2xl md:text-3xl text-center mb-16">
            Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Code className="w-12 h-12" />}
              title="Interactive Roadmaps"
              description="Follow structured paths to master frontend, backend, full-stack, and more"
            />
            <FeatureCard
              icon={<Trophy className="w-12 h-12" />}
              title="Achievement System"
              description="Earn badges, level up, and track your learning streak"
            />
            <FeatureCard
              icon={<Zap className="w-12 h-12" />}
              title="Live Code Editor"
              description="Practice coding with Monaco Editor right in your browser"
            />
            <FeatureCard
              icon={<Users className="w-12 h-12" />}
              title="Community"
              description="Connect with fellow learners and share your progress"
            />
            <FeatureCard
              icon={<TrendingUp className="w-12 h-12" />}
              title="Progress Tracking"
              description="Visualize your learning journey with detailed analytics"
            />
            <FeatureCard
              icon={<Star className="w-12 h-12" />}
              title="Curated Resources"
              description="Access handpicked tutorials, articles, and videos"
            />
          </div>
        </div>
      </section>

      <section className="py-24 px-4 border-b-4 border-white bg-[#0a0a0a]" data-testid="stats-section">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard number={stats.users.toLocaleString() + '+'} label="Learners" />
            <StatCard number="5+" label="Roadmaps" />
            <StatCard number={stats.resources.toLocaleString() + '+'} label="Resources" />
            <StatCard number={stats.projects.toLocaleString() + '+'} label="Projects" />
          </div>
        </div>
      </section>

      <section className="py-24 px-4" data-testid="cta-section">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-white font-['Press_Start_2P'] text-2xl md:text-3xl mb-8">
            Ready to Level Up?
          </h2>
          <p className="text-white font-['VT323'] text-xl md:text-2xl mb-12">
            Join thousands of developers on their coding journey
          </p>
          <Link
            to="/register"
            className="pixel-button inline-block"
            data-testid="cta-get-started-btn"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-black border-2 border-white p-6 hover:border-[#00ff00] transition-colors duration-0 group" data-testid="feature-card">
      <div className="text-white mb-4 group-hover:text-[#00ff00] transition-colors duration-0">
        {icon}
      </div>
      <h3 className="text-white font-['Press_Start_2P'] text-xs mb-4">
        {title}
      </h3>
      <p className="text-white font-['VT323'] text-lg">
        {description}
      </p>
    </div>
  );
}

function StatCard({ number, label }) {
  return (
    <div className="text-center" data-testid="stat-card">
      <div className="text-white font-['Press_Start_2P'] text-3xl md:text-4xl mb-4">
        {number}
      </div>
      <div className="text-white font-['VT323'] text-xl">
        {label}
      </div>
    </div>
  );
}