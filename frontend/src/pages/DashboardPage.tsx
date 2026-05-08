import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, BarChart3 } from 'lucide-react';
import { getCurrentUser } from '../api/useAuth';
import type { UserStrategy, FeedItem } from '../api/index';
import { api } from '../api/index';

const StatCard = ({ label, value, color = 'blue' }: { label: string; value: string | number; color?: 'green' | 'red' | 'blue' | 'amber' }) => {
  const colorClass = {
    green: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    red: 'bg-red-500/10 border-red-500/30 text-red-300',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-300'
  }[color];

  return (
    <div className={`p-4 rounded-lg border ${colorClass}`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [personalStrategies, setPersonalStrategies] = useState<UserStrategy[]>([]);
  const [communityFeed, setCommunityFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [strategies, feed] = await Promise.all([
          api.getUserStrategies(),
          api.getCommunityFeed(10, 0)
        ]);
        setPersonalStrategies(strategies);
        setCommunityFeed(feed);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        // Fallback to empty arrays
        setPersonalStrategies([]);
        setCommunityFeed([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const bactestedStrategies = personalStrategies.filter(s => s.backtested);
  const bestPerformer = bactestedStrategies.length > 0
    ? bactestedStrategies.reduce((prev, current) => 
        (prev.returnPct > current.returnPct) ? prev : current
      )
    : { backtested: false, returnPct: 0, name: 'N/A' };

  return (
    <div className="min-h-screen bg-black text-base-content p-4 md:p-8 lg:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Error State */}
        {error && (
          <div className="alert alert-error">
            <div>
              <span>Error loading dashboard: {error}</span>
            </div>
          </div>
        )}

        {loading && (
          <div className="border border-base-300 bg-base-100/50 rounded-lg p-4 text-base-content/70">
            Loading dashboard...
          </div>
        )}
        
        {/* Header */}
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">
            Trading Dashboard
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Welcome back, <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">{currentUser?.email || 'Trader'}</span>
          </h1>
          <p className="text-base-content/70 text-lg">
            Monitor your strategies and explore community insights
          </p>
        </header>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            label="Total Strategies" 
            value={personalStrategies.length}
            color="blue"
          />
          <StatCard 
            label="Best Performer" 
            value={bestPerformer.backtested ? `+${bestPerformer.returnPct.toFixed(2)}%` : 'N/A'}
            color={bestPerformer.backtested && bestPerformer.returnPct >= 0 ? 'green' : 'red'}
          />
          <StatCard 
            label="Total Backtests" 
            value={personalStrategies.reduce((sum, s) => sum + s.backtestRuns, 0)}
            color="amber"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* Personal Strategies Section */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <BarChart3 size={28} className="text-blue-400" /> Your Strategies
                </h2>
              </div>
              <button
                onClick={() => navigate('/strategy/edit')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
              >
                <Plus size={18} /> New
              </button>
            </div>

            <div className="space-y-4">
              {personalStrategies.map((strategy) => (
                <div
                  key={strategy.id}
                  onClick={() => navigate('/strategy')}
                  className="bg-base-100/50 border border-base-300 rounded-lg p-5 hover:border-blue-500/50 hover:bg-base-100/70 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-white">
                        {strategy.name}
                      </h3>
                      <p className="text-sm text-base-content/70">
                        {strategy.backtested && strategy.bestRunAsset
                          ? `Best: ${strategy.bestRunAsset} • ${strategy.bestRunTimeframe}`
                          : `${strategy.backtestRuns} backtest${strategy.backtestRuns !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    {!strategy.backtested && (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Draft
                      </span>
                    )}
                  </div>

                  {strategy.backtested ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-base-content/60 mb-1">Return</p>
                        <p className={`text-lg font-bold ${strategy.returnPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {strategy.returnPct > 0 ? '+' : ''}{strategy.returnPct}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-base-content/60 mb-1">Win Rate</p>
                        <p className="text-lg font-bold text-blue-300">{strategy.winRate}%</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-base-content/60">No backtest yet • Run backtest to see metrics</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Community Feed Section */}
          <div className="col-span-12 lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp size={28} className="text-emerald-400" /> Community Feed
              </h2>
              <span className="text-2xl">📰</span>
            </div>

            <div className="space-y-4">
              {communityFeed.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/post/${item.id}`)}
                  className="bg-base-100/50 border border-base-300 rounded-lg p-5 hover:border-emerald-500/50 hover:bg-base-100/70 transition-all cursor-pointer group"
                >
                  {/* Author Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-lg">
                      {item.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">
                        {item.author}
                      </p>
                      <p className="text-xs text-base-content/60">{item.timestamp}</p>
                    </div>
                  </div>

                  {/* Strategy Info */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg text-white mb-2">
                      {item.strategyTitle}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-base-200/30 text-base-content/80 border border-base-300">
                        {item.asset}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-base-200/30 text-base-content/80 border border-base-300">
                        {item.timeframe}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        +{item.returnPct}%
                      </span>
                    </div>
                  </div>

                  {/* Engagement Metrics */}
                  <div className="flex items-center justify-between pt-4 border-t border-base-300">
                    <div className="flex items-center gap-6">
                      <button className="flex items-center gap-1 text-base-content/70 hover:text-emerald-400 transition-colors text-sm">
                        👍 {item.votes}
                      </button>
                      <button className="flex items-center gap-1 text-base-content/70 hover:text-blue-400 transition-colors text-sm">
                        💬 {item.comments}
                      </button>
                    </div>
                    <button className="px-3 py-1 text-xs font-medium rounded border border-base-300 text-base-content/80 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors">
                      View Strategy
                    </button>
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
