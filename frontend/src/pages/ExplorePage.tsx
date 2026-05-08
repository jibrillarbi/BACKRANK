import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/index';

type SortBy = 'new' | 'return' | 'votes' | 'winrate';

interface Strategy {
  id: string;
  name: string;
  author: string;
  asset: string;
  timeframe: string;
  direction: string;
  return: number;
  winRate: number;
  sharpeRatio: number;
  trades: number;
  likes: number;
  comments: number;
  publishedDate?: string;
}

const ASSETS = ['AAPL', 'MSFT', 'NVDA', 'TSLA'];
const TIMEFRAMES = ['1m', '5m', '15m', '1h', '1d'];

export default function ExplorePage() {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortBy>('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectedTimeframes, setSelectedTimeframes] = useState<string[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch strategies from backend
  useEffect(() => {
    const fetchStrategies = async () => {
      setIsLoading(true);
      try {
        const posts = await api.getPosts();
        const transformedStrategies: Strategy[] = posts.map((post: any) => {
          const backtest = post.deployment?.backtest_data?.[0] || {};
          return {
            id: post.id,
            name: post.deployment?.strategy?.name || 'Unknown',
            author: post.user?.username || 'Anonymous',
            asset: post.deployment?.asset || 'Unknown',
            timeframe: post.deployment?.timeframe || '1d',
            direction: post.deployment?.direction || 'LONG',
            return: backtest.total_return_pct || 0,
            winRate: backtest.win_rate || 0,
            sharpeRatio: backtest.sharpe_ratio || 0,
            trades: backtest.total_trades || 0,
            likes: post.likes || 0,
            comments: post.comments || 0,
            publishedDate: post.created_at || new Date().toISOString()
          };
        });
        setStrategies(transformedStrategies);
      } catch (err) {
        console.error('Error fetching strategies:', err);
        setStrategies([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStrategies();
  }, []);

  // Filtering and sorting logic
  const filtered = useMemo(() => {
    let result = strategies.filter((strategy) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !strategy.name.toLowerCase().includes(query) &&
          !strategy.author.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Asset filter
      if (selectedAssets.length > 0 && !selectedAssets.includes(strategy.asset)) {
        return false;
      }

      // Timeframe filter
      if (
        selectedTimeframes.length > 0 &&
        !selectedTimeframes.includes(strategy.timeframe.toLowerCase())
      ) {
        return false;
      }

      return true;
    });

    // Sorting
    switch (sortBy) {
      case 'new':
        result.sort((a, b) => {
          const aDate = new Date(a.publishedDate || 0).getTime();
          const bDate = new Date(b.publishedDate || 0).getTime();
          return bDate - aDate;
        });
        break;
      case 'return':
        result.sort((a, b) => b.return - a.return);
        break;
      case 'votes':
        result.sort((a, b) => b.likes - a.likes);
        break;
      case 'winrate':
        result.sort((a, b) => b.winRate - a.winRate);
        break;
    }

    return result;
  }, [searchQuery, selectedAssets, selectedTimeframes, sortBy, strategies]);

  const toggleAsset = (asset: string) => {
    setSelectedAssets((prev) =>
      prev.includes(asset) ? prev.filter((a) => a !== asset) : [...prev, asset]
    );
  };

  const toggleTimeframe = (timeframe: string) => {
    setSelectedTimeframes((prev) =>
      prev.includes(timeframe) ? prev.filter((t) => t !== timeframe) : [...prev, timeframe]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedAssets([]);
    setSelectedTimeframes([]);
  };

  return (
    <div className="min-h-screen bg-base-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Explore</h1>
          <p className="text-base-content/70">Browse published strategies from the community</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search strategies or authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-base-200 border border-base-300 rounded-lg px-4 py-3 placeholder-base-content/50 focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="card bg-base-200 shadow-md sticky top-20">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">Filter</h2>

                {/* Assets */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Assets</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {ASSETS.map((asset) => (
                      <label key={asset} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAssets.includes(asset)}
                          onChange={() => toggleAsset(asset)}
                          className="checkbox checkbox-sm"
                        />
                        <span className="text-sm">{asset}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="divider my-3"></div>

                {/* Timeframes */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Timeframe</h3>
                  <div className="space-y-2">
                    {TIMEFRAMES.map((tf) => (
                      <label key={tf} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTimeframes.includes(tf)}
                          onChange={() => toggleTimeframe(tf)}
                          className="checkbox checkbox-sm"
                        />
                        <span className="text-sm uppercase">{tf}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {(selectedAssets.length > 0 || selectedTimeframes.length > 0 || searchQuery) && (
                  <button
                    onClick={clearFilters}
                    className="btn btn-sm btn-outline w-full mt-4"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Sort Toolbar */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['new', 'return', 'votes', 'winrate'].map((sort) => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort as SortBy)}
                  className={`btn btn-sm whitespace-nowrap ${
                    sortBy === sort
                      ? 'btn-primary'
                      : 'btn-outline'
                  }`}
                >
                  {{
                    new: 'Newest',
                    return: 'Best Return',
                    votes: 'Most Liked',
                    winrate: 'Win Rate'
                  }[sort]}
                </button>
              ))}
            </div>

            {/* Results */}
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="card bg-base-200 shadow-md animate-pulse">
                    <div className="card-body">
                      <div className="h-6 bg-base-300 rounded w-1/3 mb-2"></div>
                      <div className="h-4 bg-base-300 rounded w-2/3 mb-4"></div>
                      <div className="h-4 bg-base-300 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="space-y-4">
                {filtered.map((strategy) => (
                  <div
                    key={strategy.id}
                    onClick={() => navigate(`/post/${strategy.id}`)}
                    className="card bg-base-200 shadow-md hover:shadow-lg hover:bg-base-300 transition-all cursor-pointer"
                  >
                    <div className="card-body">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="card-title text-lg">{strategy.name}</h3>
                          <p className="text-sm text-base-content/70">by {strategy.author}</p>
                        </div>
                      </div>

                      {/* Asset Info */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="badge badge-outline">{strategy.asset}</div>
                        <div className="badge badge-outline uppercase">{strategy.timeframe}</div>
                        <div className="badge badge-outline">{strategy.direction}</div>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-base-100 rounded-lg">
                        <div>
                          <p className="text-xs text-base-content/70 mb-1">Return</p>
                          <p className={`font-bold ${strategy.return >= 0 ? 'text-success' : 'text-error'}`}>
                            {strategy.return >= 0 ? '+' : ''}{strategy.return.toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-base-content/70 mb-1">Win Rate</p>
                          <p className="font-bold">{strategy.winRate.toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-base-content/70 mb-1">Sharpe</p>
                          <p className="font-bold">{strategy.sharpeRatio.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-base-content/70 mb-1">Trades</p>
                          <p className="font-bold">{strategy.trades}</p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-sm text-base-content/70 border-t border-base-300 pt-3">
                        <div className="flex gap-4">
                          <button 
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-base-content transition"
                          >
                            👍 {strategy.likes}
                          </button>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-base-content transition"
                          >
                            💬 {strategy.comments}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-base-content/70 mb-4">No strategies match your filters</p>
                <button
                  onClick={clearFilters}
                  className="btn btn-outline"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
