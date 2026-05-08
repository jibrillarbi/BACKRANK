import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Play,
  Share2,
  ExternalLink,
  Zap,
  Loader,
  MessageSquare
} from 'lucide-react';
import { api, type SavedStrategy } from '../api/index';

type StrategyStatus = 'Draft' | 'Tested' | 'Published';

interface BacktestRun {
  id: string;
  asset: string;
  timeframe: string;
  returnPct: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  runDate: string;
}

interface Strategy {
  id: string;
  name: string;
  entryRule: string;
  exitRule: string;
  isPublished: boolean;
  status: StrategyStatus;
  createdDate: string;
  description: string;
  backtestruns: BacktestRun[];
  votes: number;
  comments: number;
}

const deploymentToRun = (deployment: any): BacktestRun | null => {
  const backtest = Array.isArray(deployment.backtest_data) ? deployment.backtest_data[0] : null;
  if (!backtest) return null;

  return {
    id: String(deployment.id),
    asset: deployment.asset || '',
    timeframe: deployment.timeframe || '',
    returnPct: Number(backtest.total_return_pct || 0),
    winRate: Number(backtest.win_rate || 0),
    sharpeRatio: Number(backtest.sharpe_ratio || 0),
    maxDrawdown: Number(backtest.max_dd || 0),
    runDate: new Date().toISOString().split('T')[0]
  };
};

export default function MyStrategiesPage() {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const routeStateFor = (strategy: Strategy) => ({
    strategy: {
      name: strategy.name,
      entry_rule: strategy.entryRule,
      exit_rule: strategy.exitRule,
      is_published: strategy.isPublished
    }
  });

  const handleEdit = (strategy: Strategy) => {
    navigate('/strategy/edit', { state: routeStateFor(strategy) });
  };

  const handleRun = (strategy: Strategy) => {
    navigate('/strategy', { state: routeStateFor(strategy) });
  };

  const handlePublish = (strategy: Strategy) => {
    if (strategy.backtestruns.length === 0) {
      handleRun(strategy);
      return;
    }
    navigate('/create-post');
  };

  const handleViewPublished = () => {
    navigate('/explore');
  };

  useEffect(() => {
    const fetchStrategies = async () => {
      setLoading(true);
      setError(null);
      try {
        const [data, deployments] = await Promise.all([
          api.getStrategies(),
          api.getAllDeployments().catch(() => [])
        ]);
        
        const transformedStrategies: Strategy[] = (data || []).map((saved: SavedStrategy) => {
          const strategy = saved.strategy;
          const strategyDeployments = (deployments || []).filter((deployment: any) => String(deployment.sid) === String(saved.sid));
          const runs = strategyDeployments.map(deploymentToRun).filter(Boolean) as BacktestRun[];
          const isPublished = Boolean(strategy.is_published || strategyDeployments.some((deployment: any) => deployment.is_published));

          return {
            id: String(saved.sid),
            name: strategy.name || 'Untitled Strategy',
            entryRule: strategy.entry_rule || '',
            exitRule: strategy.exit_rule || '',
            isPublished,
            status: isPublished ? 'Published' : runs.length > 0 ? 'Tested' : 'Draft' as StrategyStatus,
            createdDate: new Date().toISOString().split('T')[0],
            description: strategy.entry_rule && strategy.exit_rule
              ? `Entry: ${strategy.entry_rule} | Exit: ${strategy.exit_rule}`
              : 'No rules saved yet',
            backtestruns: runs,
            votes: 0,
            comments: 0
          };
        });
        
        setStrategies(transformedStrategies);
      } catch (err: any) {
        console.error('Error fetching strategies:', err);
        setError(err.message || 'Failed to load strategies');
        setStrategies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStrategies();
  }, []);



  const getStatusColor = (status: StrategyStatus) => {
    switch (status) {
      case 'Draft':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'Tested':
        return 'bg-blue-500/20 text-blue-300';
      case 'Published':
        return 'bg-emerald-500/20 text-emerald-300';
    }
  };

  const getBestRun = (runs: BacktestRun[]) => {
    if (!runs.length) return null;
    return runs.reduce((best, run) => 
      run.returnPct > best.returnPct ? run : best
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-base-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader className="animate-spin text-blue-400 mr-3" size={32} />
            <p className="text-base-content/70 text-lg">Loading your strategies...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg mb-8">
            <p className="text-red-300 font-medium">Error loading strategies: {error}</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <div>
                <h1 className="text-4xl font-bold mb-2">My Strategies</h1>
                <p className="text-base-content/70">
                  {strategies.length} {strategies.length === 1 ? 'strategy' : 'strategies'}
                </p>
              </div>
              <button
                onClick={() => navigate('/strategy/edit')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 rounded-lg font-semibold transition-all"
              >
                <Plus size={20} />
                New Strategy
              </button>
            </div>

            {/* Empty State */}
            {strategies.length === 0 && (
              <div className="text-center py-16">
                <div className="text-base-content/60 text-lg mb-4">
                  No strategies yet. Create your first one!
                </div>
                <button
                  onClick={() => navigate('/strategy/edit')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 rounded-lg font-semibold transition-all"
                >
                  <Plus size={20} />
                  Create Strategy
                </button>
              </div>
            )}

            {/* Grid View */}
            {strategies.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {strategies.map((strategy) => {
                  const bestRun = getBestRun(strategy.backtestruns);
                  return (
                    <div
                      key={strategy.id}
                      className="bg-base-200 border border-base-300 rounded-xl p-6 hover:border-blue-500 transition-colors flex flex-col"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{strategy.name}</h3>
                          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusColor(strategy.status)}`}>
                            {strategy.status === 'Published' ? 'Published' : 'Not Published'}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-base-content/60 mb-4 flex-1">{strategy.description}</p>

                      {/* Metrics */}
                      {bestRun && (
                        <div className="bg-base-300/50 rounded-lg p-3 mb-4">
                          <p className="text-xs text-base-content/60 mb-2">
                            Best run: {bestRun.asset} {bestRun.timeframe}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs text-base-content/60">Return</p>
                              <p className="text-sm font-bold text-emerald-400">
                                {bestRun.returnPct > 0 ? '+' : ''}{bestRun.returnPct}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-base-content/60">Win Rate</p>
                              <p className="text-sm font-bold text-blue-400">{bestRun.winRate}%</p>
                            </div>
                          </div>
                          <p className="text-xs text-base-content/60 mt-2">
                            {strategy.backtestruns.length} {strategy.backtestruns.length === 1 ? 'run' : 'runs'}
                          </p>
                        </div>
                      )}

                      {/* Metadata */}
                      <p className="text-xs text-base-content/50 mb-4">Created {formatDate(strategy.createdDate)}</p>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(strategy)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-base-300 hover:bg-base-300 rounded-lg text-sm transition-colors"
                          >
                            <Edit size={16} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleRun(strategy)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-colors"
                          >
                            <Play size={16} />
                            Run
                          </button>
                          {strategy.status === 'Published' ? (
                            <button
                              onClick={handleViewPublished}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm transition-colors"
                            >
                              <ExternalLink size={16} />
                              View
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePublish(strategy)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-base-300 hover:bg-base-300 rounded-lg text-sm transition-colors"
                            >
                              <Share2 size={16} />
                              {strategy.backtestruns.length > 0 ? 'Publish' : 'Deploy First'}
                            </button>
                          )}
                        </div>
                        <button 
                          onClick={() => navigate(`/deployments/${strategy.id}`)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-colors"
                        >
                          <Zap size={16} />
                          View Deployments
                        </button>
                        <button
                          onClick={() => navigate(`/strategies/${strategy.id}/posts`)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm transition-colors"
                        >
                          <MessageSquare size={16} />
                          View Posts
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
