import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../api/useAuth';

interface UserStrategy {
  id: string;
  name: string;
  backtestRuns: number;
  bestRunAsset?: string;
  bestRunTimeframe?: string;
  returnPct: number;
  winRate: number;
  backtested: boolean;
}

interface FeedItem {
  id: string;
  author: string;
  avatar: string;
  strategyTitle: string;
  asset: string;
  timeframe: string;
  returnPct: number;
  votes: number;
  comments: number;
  timestamp: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Mock personal strategies
  const personalStrategies: UserStrategy[] = [
    {
      id: '1',
      name: 'SMA Crossover',
      backtestRuns: 5,
      bestRunAsset: 'AAPL',
      bestRunTimeframe: '1D',
      returnPct: 24.5,
      winRate: 58,
      backtested: true
    },
    {
      id: '2',
      name: 'RSI Divergence',
      backtestRuns: 8,
      bestRunAsset: 'BTC',
      bestRunTimeframe: '4H',
      returnPct: 18.2,
      winRate: 52,
      backtested: true
    },
    {
      id: '3',
      name: 'EMA Momentum',
      backtestRuns: 0,
      returnPct: 0,
      winRate: 0,
      backtested: false
    }
  ];

  // Mock community feed
  const communityFeed: FeedItem[] = [
    {
      id: '1',
      author: 'TradingMaster92',
      avatar: '👤',
      strategyTitle: 'Bollinger Band Squeeze',
      asset: 'NVDA',
      timeframe: '1D',
      returnPct: 31.5,
      votes: 234,
      comments: 18,
      timestamp: '2h ago'
    },
    {
      id: '2',
      author: 'QuantJunkie',
      avatar: '👨‍💼',
      strategyTitle: 'Multi-MA Support',
      asset: 'SPY',
      timeframe: '4H',
      returnPct: 42.1,
      votes: 812,
      comments: 45,
      timestamp: '4h ago'
    },
    {
      id: '3',
      author: 'CryptoWizard',
      avatar: '🧙',
      strategyTitle: 'MACD Confluence',
      asset: 'ETH/USD',
      timeframe: '1H',
      returnPct: 28.7,
      votes: 456,
      comments: 32,
      timestamp: '6h ago'
    }
  ];

  return (
    <div className="min-h-screen bg-base-200 p-6 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, <span className="text-primary">{currentUser?.email || 'Trader'}</span>
          </h1>
          <p className="text-base-content/70">Your trading strategy dashboard</p>
        </div>

        {/* Performance Snapshot - DaisyUI Stats */}
        <div className="stats stats-vertical sm:stats-horizontal shadow-lg bg-base-100 mb-10 w-full">
          <div className="stat">
            <div className="stat-figure text-accent">📊</div>
            <div className="stat-title">Total Strategies</div>
            <div className="stat-value ">{personalStrategies.length}</div>
            <div className="stat-desc">+1 this week</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-accent">📈</div>
            <div className="stat-title">Best Performer</div>
            <div className="stat-value text-success">+24.5%</div>
            <div className="stat-desc">SMA Crossover (AAPL)</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-accent">🎯</div>
            <div className="stat-title">Total Backtests</div>
            <div className="stat-value text-warning">142</div>
            <div className="stat-desc">Across all strategies</div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Personal Strategies Section */}
          <div className="col-span-12 lg:col-span-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Your Strategies</h2>
              <button
                onClick={() => navigate('/strategy/edit')}
                className="btn btn-primary btn-sm gap-1"
              >
                ➕ New
              </button>
            </div>

            <div className="space-y-4">
              {personalStrategies.map((strategy) => (
                <div
                  key={strategy.id}
                  onClick={() => navigate('/strategy')}
                  className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-base-300 hover:border-secondary"
                >
                  <div className="card-body p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {strategy.name}
                        </h3>
                        <p className="text-sm text-base-content/70">
                          {strategy.backtested && strategy.bestRunAsset
                            ? `Best run: ${strategy.bestRunAsset} ${strategy.bestRunTimeframe}`
                            : `${strategy.backtestRuns} backtest ${strategy.backtestRuns === 1 ? 'run' : 'runs'}`}
                        </p>
                      </div>
                      {!strategy.backtested && (
                        <span className="badge badge-warning badge-sm">
                          Draft
                        </span>
                      )}
                    </div>

                    {strategy.backtested ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-base-content/60 mb-1">Return</p>
                          <p className="text-lg font-bold text-success">
                            {strategy.returnPct > 0 ? '+' : ''}{strategy.returnPct}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-base-content/60 mb-1">Win Rate</p>
                          <p className="text-lg font-bold text-info">{strategy.winRate}%</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-base-content/60">No backtest yet • Run backtest to see metrics</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Community Feed Section */}
          <div className="col-span-12 lg:col-span-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Community Feed</h2>
              <span className="text-2xl">📰</span>
            </div>

            <div className="space-y-4">
              {communityFeed.map((item) => (
                <div
                  key={item.id}
                  className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-base-300 hover:border-secondary"
                >
                  <div className="card-body p-4">
                    {/* Author Info */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="avatar placeholder">
                        <div className="bg-secondary text-secondary-content rounded-full w-8 text-lg">
                          {item.avatar}
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {item.author}
                        </p>
                        <p className="text-xs text-base-content/60">{item.timestamp}</p>
                      </div>
                    </div>

                    {/* Strategy Info */}
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg mb-2">
                        {item.strategyTitle}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge badge-ghost">
                          {item.asset}
                        </span>
                        <span className="badge badge-ghost">
                          {item.timeframe}
                        </span>
                        <span className="badge badge-success gap-1">
                          +{item.returnPct}%
                        </span>
                      </div>
                    </div>

                    {/* Engagement Metrics */}
                    <div className="flex items-center justify-between pt-4 border-t border-base-300">
                      <div className="flex items-center gap-4">
                        <button className="btn btn-ghost btn-xs gap-1">
                          👍 {item.votes}
                        </button>
                        <button className="btn btn-ghost btn-xs gap-1">
                          💬 {item.comments}
                        </button>
                      </div>
                      <button className="btn btn-outline btn-xs">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
