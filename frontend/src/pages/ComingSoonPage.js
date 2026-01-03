export default function ComingSoonPage() {
  const upcomingFeatures = [
    { name: 'Mobile Apps', desc: 'iOS & Android', icon: '📱' },
    { name: 'AI Code Review', desc: 'Get instant feedback', icon: '🤖' },
    { name: 'Live Competitions', desc: 'Compete with others', icon: '🏆' },
    { name: 'Certifications', desc: 'Earn verified certificates', icon: '🎓' },
    { name: 'Premium Courses', desc: 'Expert-led learning', icon: '📚' },
    { name: 'Hackathon Platform', desc: 'Build & compete', icon: '🛠️' }
  ];

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-8xl mb-8 animate-bounce">🚧</div>
          <h1 className="text-white font-['Press_Start_2P'] text-3xl md:text-4xl mb-6" data-testid="coming-soon-heading">
            Coming Soon
          </h1>
          <p className="text-white font-['VT323'] text-2xl">
            We're building something awesome!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {upcomingFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-black border-2 border-white p-6 hover:border-[#00ff00] transition-colors duration-0 text-center"
              data-testid="feature-card"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-white font-['Press_Start_2P'] text-xs mb-2">
                {feature.name}
              </h3>
              <p className="text-white font-['VT323'] text-lg">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-black border-4 border-white p-8 max-w-2xl mx-auto">
          <h2 className="text-white font-['Press_Start_2P'] text-xl mb-6 text-center">
            Stay Updated
          </h2>
          <p className="text-white font-['VT323'] text-xl text-center mb-6">
            Want early access? Check back soon!
          </p>
          <div className="text-center">
            <div className="inline-block bg-[#333] border-2 border-white px-8 py-4">
              <div className="text-[#00ff00] font-['Press_Start_2P'] text-sm animate-pulse">
                In Development
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}