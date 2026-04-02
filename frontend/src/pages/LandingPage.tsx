import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-base-200">
      {/* Navigation Bar */}
      <div className="navbar bg-black sticky top-0 z-40 shadow-lg">
        <div className="flex-1">
          <button
            onClick={() => navigate('/landing')}
            className="btn btn-ghost gap-3"
          >
            <img src="/src/assets/logo.png" alt="BackRank" className="h-12 w-12" />
            <span className="text-2xl font-bold text-secondary">BackRank</span>
          </button>
        </div>
        <div className="flex-none gap-6">
          <button onClick={() => navigate('/login')} className="btn btn-ghost btn-sm">
            Login
          </button>
          <button onClick={() => navigate('/register')} className="btn btn-primary btn-sm">
            Get Started
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero min-h-screen bg-base-100">
        <div className="hero-content max-w-7xl flex-col lg:flex-row gap-12">
          <div className="flex-1">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Build and test trading strategies —{' '}
              <span className="text-secondary">
                no code required
              </span>
            </h1>
            <p className="text-lg text-base-content/70 mb-8 leading-relaxed">
              Turn your trading ideas into verifiable strategies. Use our visual strategy builder to combine technical indicators, backtest against real historical data, and discover your edge. Then share with the community and learn from the best traders on the platform.
            </p>
            <div className="flex items-center gap-4 mb-8 flex-wrap">
              <button
                onClick={() => navigate('/register')}
                className="btn btn-primary btn-lg gap-2"
              >
                Get Started Free
                →
              </button>
              <button
                onClick={() => navigate('/explore')}
                className="btn btn-outline btn-lg"
              >
                Explore Strategies
              </button>
            </div>
            <p className="text-sm text-base-content/60">No credit card required. Free forever plan available.</p>
          </div>

          {/* Hero Visual - Strategy Builder Mockup */}
          <div className="flex-1">
            <div className="card bg-base-200 shadow-xl border-2 border-secondary/20">
              <div className="card-body space-y-4">
                {/* Mockup of strategy builder */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Entry Conditions</p>
                    <div className="badge badge-success badge-sm">Active</div>
                  </div>
                  <div className="space-y-2 bg-base-300 rounded p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-secondary rounded-full"></div>
                      <span>RSI(14) &lt; 30</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-secondary rounded-full"></div>
                      <span>SMA(50) &gt; SMA(200)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold">Exit Conditions</p>
                  <div className="space-y-2 bg-base-300 rounded p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-error rounded-full"></div>
                      <span>Stop Loss: 2%</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span>Take Profit: 5%</span>
                    </div>
                  </div>
                </div>

                <button className="btn btn-primary btn-block btn-sm">
                  Test Strategy
                </button>
              </div>
            </div>

            {/* Floating backtest results card */}
            <div className="card bg-base-100 shadow-lg border border-secondary/20 mt-6 max-w-xs ml-auto">
              <div className="card-body gap-3 p-4">
                <p className="text-xs font-semibold opacity-70">Backtest Results</p>
                <div className="stat stat-vertical p-0">
                  <div className="stat-title text-xs">Return</div>
                  <div className="stat-value text-lg text-success">+24.5%</div>
                </div>
                <div className="stat stat-vertical p-0">
                  <div className="stat-title text-xs">Win Rate</div>
                  <div className="stat-value text-lg text-info">58%</div>
                </div>
                <div className="stat stat-vertical p-0">
                  <div className="stat-title text-xs">Sharpe</div>
                  <div className="stat-value text-lg text-warning">1.42</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 lg:py-32 bg-base-300">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-4xl font-bold mb-4 text-center">How BackRank Works</h2>
          <p className="text-base-content/70 text-center mb-16 max-w-2xl mx-auto">
            From idea to tested strategy in four simple steps. No programming experience needed.
          </p>

          <ul className="steps steps-vertical lg:steps-horizontal w-full mb-8">
            <li className="step step-primary">Build</li>
            <li className="step step-primary">Backtest</li>
            <li className="step step-primary">Analyze</li>
            <li className="step step-primary">Share</li>
          </ul>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '1',
                icon: '💻',
                title: 'Build',
                description: 'Use our visual strategy builder to define your entry and exit rules using technical indicators like RSI, SMA, and EMA.'
              },
              {
                step: '2',
                icon: '📈',
                title: 'Backtest',
                description: 'Choose an asset, timeframe, stop loss, and take profit. Run your strategy against 5+ years of historical market data.'
              },
              {
                step: '3',
                icon: '📊',
                title: 'Analyse',
                description: 'Get complete analytics — return %, win rate, Sharpe ratio, max drawdown, equity curves, and detailed trade history.'
              },
              {
                step: '4',
                icon: '🔗',
                title: 'Share',
                description: 'Publish your strategy to the community, get feedback from other traders, and explore thousands of tested strategies.'
              }
            ].map((item, idx) => (
              <div key={idx} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
                <div className="card-body">
                  <h3 className="text-3xl mb-3">{item.icon}</h3>
                  <h2 className="card-title text-xl">{item.title}</h2>
                  <p className="text-sm text-base-content/70">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-base-100">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-4xl font-bold mb-4 text-center">Powerful Features</h2>
          <p className="text-base-content/70 text-center mb-16 max-w-2xl mx-auto">
            Everything you need to build, test, and refine your trading strategies.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '💻',
                title: 'No-Code Strategy Builder',
                description:
                  'Combine indicators and logical conditions visually to define entry and exit rules. No programming or technical expertise required.'
              },
              {
                icon: '📈',
                title: 'Historical Backtesting',
                description:
                  'Run strategies against real market data from the past 5+ years. Get results in seconds, not hours.'
              },
              {
                icon: '🎖️',
                title: 'Reusable Strategies',
                description:
                  'Strategies are not locked to one ticker. Test the same rule set across any asset or timeframe to uncover your edge.'
              },
              {
                icon: '📊',
                title: 'Complete Metrics',
                description:
                  'Total return %, Sharpe ratio, max drawdown, win rate, equity curves, and full trade history for rigorous evaluation.'
              },
              {
                icon: '👥',
                title: 'Community Feed',
                description:
                  'Publish strategies, browse what others have built, upvote, comment, and clone strategies into your library.'
              },
              {
                icon: '🏆',
                title: 'Leaderboard',
                description:
                  'See which strategies and traders are performing best. Benchmark yourself and discover new trading approaches.'
              }
            ].map((feature, idx) => (
              <div key={idx} className="card bg-base-200 shadow-md hover:shadow-lg hover:border-secondary transition-all border border-base-300">
                <div className="card-body">
                  <h3 className="text-3xl mb-3">{feature.icon}</h3>
                  <h2 className="card-title text-lg">{feature.title}</h2>
                  <p className="text-sm text-base-content/70">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Stats Section */}
      <section className="py-20 lg:py-32 bg-base-300">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { number: '12,400+', label: 'Backtests Run' },
              { number: '3,200+', label: 'Strategies Published' },
              { number: '1,800+', label: 'Registered Traders' },
              { number: '98%', label: 'Uptime' }
            ].map((stat, idx) => (
              <div key={idx} className="card bg-base-200 shadow-md border border-base-300 p-6 text-center">
                <div className="text-4xl font-bold text-secondary mb-2">{stat.number}</div>
                <div className="text-sm font-semibold text-base-content/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="hero min-h-[300px] bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold mb-6">Start building your first strategy today</h1>
            <p className="mb-10 text-lg">
              Join hundreds of traders discovering their edge through systematic backtesting and community feedback.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="btn btn-primary btn-lg gap-2"
            >
              Get Started Free
              →
            </button>
          </div>
        </div>
      </section>

      {/* Footer - DaisyUI Footer */}
      <footer className="footer footer-center bg-base-300 text-base-content border-t border-base-400 p-10">
        <aside>
          <p className="font-bold text-lg text-secondary mb-4">
            BackRank
          </p>
          <p>Building the future of systematic trading</p>
        </aside>
        <nav className="grid grid-flow-col gap-4">
          
          <button onClick={() => navigate('/login')} className="link link-hover">
            Login
          </button>
          <button onClick={() => navigate('/register')} className="link link-hover">
            Register
          </button>
        </nav>
        <aside>
          <p>© 2026 BackRank. All rights reserved.</p>
        </aside>
      </footer>
    </div>
  );
}
