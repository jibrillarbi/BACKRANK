import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-base-200">
      {/* Hero Section */}
      <section className="hero min-h-screen bg-base-100">
        <div className="hero-content max-w-5xl flex-col lg:flex-row gap-12">
          <div className="flex-1">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Test Trading Strategies
            </h1>
            <p className="text-lg text-base-content/70 mb-8 leading-relaxed">
              Build trading strategies using technical indicators. Backtest them against historical market data. See what works and what doesn't.
            </p>
            <div className="flex items-center gap-4 mb-8 flex-wrap">
              <button
                onClick={() => navigate('/register')}
                className="btn btn-primary btn-lg"
              >
                Get Started
              </button>
              <button
                onClick={() => navigate('/explore')}
                className="btn btn-outline btn-lg"
              >
                Explore
              </button>
            </div>
          </div>

          {/* Hero Visual - Strategy Builder Mockup */}
          <div className="flex-1">
            <div className="card bg-base-200 shadow-xl border border-base-300">
              <div className="card-body space-y-4">
                <div className="space-y-3">
                  <p className="text-xs font-semibold">Entry Rule</p>
                  <div className="bg-base-300 rounded p-3 text-sm font-mono">
                    RSI(14) &lt; 30 AND SMA(50) &gt; SMA(200)
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold">Exit Rule</p>
                  <div className="bg-base-300 rounded p-3 text-sm font-mono">
                    RSI(14) &gt; 70 OR Stop Loss 2%
                  </div>
                </div>

                <button className="btn btn-primary btn-block btn-sm">
                  Run Backtest
                </button>
              </div>
            </div>

            {/* Results card */}
            <div className="card bg-base-100 shadow-md border border-base-300 mt-6">
              <div className="card-body gap-2 p-4">
                <p className="text-xs font-semibold">Results</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="opacity-70">Return</p>
                    <p className="font-bold text-success">+24.5%</p>
                  </div>
                  <div>
                    <p className="opacity-70">Win Rate</p>
                    <p className="font-bold text-info">58%</p>
                  </div>
                  <div>
                    <p className="opacity-70">Sharpe</p>
                    <p className="font-bold">1.42</p>
                  </div>
                  <div>
                    <p className="opacity-70">Trades</p>
                    <p className="font-bold">145</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-24 bg-base-300">
        <div className="max-w-5xl mx-auto px-8">
          <h2 className="text-3xl font-bold mb-12 text-center">How it works</h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                title: 'Create',
                description: 'Define your trading rules using technical indicators'
              },
              {
                title: 'Test',
                description: 'Run against 5+ years of real market data'
              },
              {
                title: 'Analyze',
                description: 'Get detailed metrics and performance stats'
              },
              {
                title: 'Share',
                description: 'Publish and see how others improve your strategy'
              }
            ].map((item, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl font-bold text-secondary">{idx + 1}</div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                </div>
                <p className="text-sm text-base-content/70">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-base-100">
        <div className="max-w-5xl mx-auto px-8">
          <h2 className="text-3xl font-bold mb-12 text-center">Features</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Visual Strategy Builder',
                description: 'No coding required. Combine indicators like RSI, SMA, EMA  to define entry and exit rules.'
              },
              {
                title: 'Backtesting Engine',
                description: 'Test strategies against historical data. Simulate realistic market conditions and slippage.'
              },
              {
                title: 'Performance Metrics',
                description: 'Get return %, win rate, Sharpe ratio, max drawdown, equity curves, and trade history.'
              },
              {
                title: 'Community & Leaderboard',
                description: 'Share your research, get feedback, explore other strategies, and track performance.'
              }
            ].map((feature, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="font-bold text-lg">{feature.title}</h3>
                <p className="text-base-content/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-base-100">
        <div className="max-w-2xl mx-auto text-center px-8">
          <h2 className="text-3xl font-bold mb-4">Ready to test your ideas?</h2>
          <p className="text-base-content/70 mb-8">
            Create an account and start building strategies.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="btn btn-primary btn-lg"
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer footer-center bg-base-300 text-base-content border-t border-base-400 p-8">
        <div>
          <p className="font-bold text-secondary mb-2">BackRank</p>
          <p className="text-sm text-base-content/70">A platform for testing trading strategies</p>
        </div>
        <nav className="flex gap-6">
          <button onClick={() => navigate('/login')} className="link link-hover text-sm">
            Login
          </button>
          <button onClick={() => navigate('/register')} className="link link-hover text-sm">
            Register
          </button>
        </nav>
        <p className="text-xs text-base-content/60">© 2026 BackRank</p>
      </footer>
    </div>
  );
}
