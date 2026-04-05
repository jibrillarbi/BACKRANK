import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/index';

type ViewType = 'grid' | 'list';
type SortBy = 'top' | 'new' | 'return' | 'discussed';

interface BacktestRun {
  asset: string;
  timeframe: string;
  returnPct: number;
  winRate: number;
  sharpeRatio: number;
}

interface PublishedStrategy {
  id: string;
  name: string;
  username: string;
  userId: string;
  avatar: string;
  indicators: string[];
  bestRun: BacktestRun;
  votes: number;
  comments: number;
  publishedDate: string;
}

const INDICATORS = ['SMA', 'RSI', 'EMA', 'MACD', 'Bollinger Bands', 'Stochastic', 'ATR'];
const ASSETS = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'SPY', 'BTC', 'ETH', 'GLD'];
const TIMEFRAMES = ['1M', '5M', '15M', '1H', '4H', '1D'];

// Placeholder values for fields not yet in backend
const PLACEHOLDER_STRATEGIES = {
  avatar: '👤',
  indicators: ['Bollinger Bands', 'SMA'],
  bestRun: { asset: 'NVDA', timeframe: '1D', returnPct: 31.5, winRate: 64, sharpeRatio: 1.85 }
};

export default function ExplorePage() {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortBy>('top');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectedTimeframes, setSelectedTimeframes] = useState<string[]>([]);
  const [minReturn, setMinReturn] = useState(0);
  const [minVotes, setMinVotes] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [strategies, setStrategies] = useState<PublishedStrategy[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch posts from backend
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const posts = await api.getPosts();
        // Transform backend posts to PublishedStrategy format with placeholder values
        const transformedStrategies: PublishedStrategy[] = posts.map((post: any) => ({
          id: post.id,
          name: post.strategy?.name || 'Unknown Strategy',
          username: post.user?.username || 'Anonymous',
          userId: post.user?.uid || 'unknown',
          avatar: PLACEHOLDER_STRATEGIES.avatar,
          indicators: PLACEHOLDER_STRATEGIES.indicators,
          bestRun: PLACEHOLDER_STRATEGIES.bestRun,
          votes: post.votes || 0,
          comments: post.comments || 0,
          publishedDate: post.published_date || new Date().toISOString()
        }));
        setStrategies(transformedStrategies);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setStrategies([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Filtering and sorting logic
  const filtered = useMemo(() => {
    let result = strategies.filter((strategy) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !strategy.name.toLowerCase().includes(query) &&
          !strategy.username.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Indicator filter
      if (selectedIndicators.length > 0) {
        if (!selectedIndicators.some((ind) => strategy.indicators.includes(ind))) {
          return false;
        }
      }

      // Asset filter
      if (selectedAssets.length > 0 && !selectedAssets.includes(strategy.bestRun.asset)) {
        return false;
      }

      // Timeframe filter
      if (
        selectedTimeframes.length > 0 &&
        !selectedTimeframes.includes(strategy.bestRun.timeframe)
      ) {
        return false;
      }

      // Return filter
      if (strategy.bestRun.returnPct < minReturn) {
        return false;
      }

      // Vote filter
      if (strategy.votes < minVotes) {
        return false;
      }

      return true;
    });

    // Sorting
    switch (sortBy) {
      case 'top':
        result.sort((a, b) => b.votes - a.votes);
        break;
      case 'new':
        result.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
        break;
      case 'return':
        result.sort((a, b) => b.bestRun.returnPct - a.bestRun.returnPct);
        break;
      case 'discussed':
        result.sort((a, b) => b.comments - a.comments);
        break;
    }

    return result;
  }, [searchQuery, selectedIndicators, selectedAssets, selectedTimeframes, minReturn, minVotes, sortBy, strategies]);

  const toggleIndicator = (indicator: string) => {
    setSelectedIndicators((prev) =>
      prev.includes(indicator) ? prev.filter((i) => i !== indicator) : [...prev, indicator]
    );
  };

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
    setSelectedIndicators([]);
    setSelectedAssets([]);
    setSelectedTimeframes([]);
    setMinReturn(0);
    setMinVotes(0);
  };

  const hasActiveFilters =
    selectedIndicators.length > 0 ||
    selectedAssets.length > 0 ||
    selectedTimeframes.length > 0 ||
    minReturn > 0 ||
    minVotes > 0;

  return (
    <div className="min-h-screen bg-black text-base-content p-4 md:p-0">
      <div className="max-w-6xl mx-auto">
        {/* Header - Sticky Top */}
        <div className="sticky top-0 z-40 bg-black/80 backdrop-blur border-b border-base-300 p-4 md:p-6">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-1">Explore Strategies</h1>
            <p className="text-base-content/70 text-sm mb-4">
              Discover published strategies from the community
            </p>
            <input
              type="text"
              placeholder="Search strategies or usernames..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-base-200 border border-base-300 text-base-content rounded-full px-4 py-2 placeholder-base-content/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-0">
          {/* Sidebar Filters */}
          <div className="col-span-12 lg:col-span-3 border-r border-base-300 min-h-screen">
            <div className="lg:sticky lg:top-24 max-h-[calc(100vh-96px)] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 px-4 py-6 lg:mb-0 border-b border-base-300 lg:border-b-0">
                <h2 className="text-lg font-bold text-white">Filters</h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden text-sm text-blue-400 hover:text-blue-300"
                >
                  {showFilters ? 'Hide' : 'Show'}
                </button>
              </div>

              <div
                className={`${
                  showFilters ? 'block' : 'hidden'
                } lg:block p-4 space-y-6 border-b border-base-300 lg:border-b-0`}
              >
                {/* Indicators */}
                <div>
                  <h3 className="font-semibold mb-3 text-white text-sm uppercase tracking-wide">Indicators</h3>
                  <div className="space-y-2">
                    {INDICATORS.map((ind) => (
                      <label key={ind} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedIndicators.includes(ind)}
                          onChange={() => toggleIndicator(ind)}
                          className="w-4 h-4 rounded border-base-300 bg-base-200"
                        />
                        <span className="text-sm text-base-content/80 group-hover:text-white transition-colors">{ind}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Assets */}
                <div>
                  <h3 className="font-semibold mb-3 text-white text-sm uppercase tracking-wide">Assets</h3>
                  <div className="space-y-2">
                    {ASSETS.map((asset) => (
                      <label key={asset} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedAssets.includes(asset)}
                          onChange={() => toggleAsset(asset)}
                          className="w-4 h-4 rounded border-base-300 bg-base-200"
                        />
                        <span className="text-sm text-base-content/80 group-hover:text-white transition-colors">{asset}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Timeframes */}
                <div>
                  <h3 className="font-semibold mb-3 text-white text-sm uppercase tracking-wide">Timeframes</h3>
                  <div className="space-y-2">
                    {TIMEFRAMES.map((tf) => (
                      <label key={tf} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedTimeframes.includes(tf)}
                          onChange={() => toggleTimeframe(tf)}
                          className="w-4 h-4 rounded border-base-300 bg-base-200"
                        />
                        <span className="text-sm text-base-content/80 group-hover:text-white transition-colors">{tf}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Minimum Return */}
                <div>
                  <label className="text-white text-sm font-semibold mb-3 block">Min Return: <span className="text-emerald-400">{minReturn}%</span></label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={minReturn}
                    onChange={(e) => setMinReturn(Number(e.target.value))}
                    className="w-full h-2 bg-base-300 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Minimum Votes */}
                <div>
                  <label className="text-white text-sm font-semibold mb-3 block">Min Votes: <span className="text-blue-400">{minVotes}</span></label>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="50"
                    value={minVotes}
                    onChange={(e) => setMinVotes(Number(e.target.value))}
                    className="w-full h-2 bg-base-300 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9 border-r border-base-300 lg:border-r-0">
            {/* Sort Toolbar - Sticky */}
            <div className="sticky top-20 z-30 bg-black/80 backdrop-blur border-b border-base-300 px-4 py-3 flex gap-2 overflow-x-auto">
              {['top', 'new', 'return', 'discussed'].map((sort) => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort as SortBy)}
                  className={`px-3 py-1 text-sm font-medium whitespace-nowrap rounded-full transition-colors ${
                    sortBy === sort
                      ? 'bg-blue-600 text-white'
                      : 'bg-base-200 text-base-content/70 hover:bg-base-300'
                  }`}
                >
                  {{
                    top: '🔥 Top',
                    new: '✨ New',
                    return: '📈 Best Return',
                    discussed: '💬 Discussed'
                  }[sort]}
                </button>
              ))}
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="space-y-4 p-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-base-100/30 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-base-300 rounded w-1/4 mb-3"></div>
                    <div className="h-5 bg-base-300 rounded w-2/3 mb-3"></div>
                    <div className="flex gap-2 mb-3">
                      <div className="h-6 bg-base-300 rounded-full w-24"></div>
                      <div className="h-6 bg-base-300 rounded-full w-24"></div>
                    </div>
                    <div className="h-4 bg-base-300 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="space-y-0 divide-y divide-base-300"
              >
                {filtered.map((strategy) => (
                  <div
                    key={strategy.id}
                    className="bg-base-100/30 hover:bg-base-100/50 transition-colors cursor-pointer p-4 group"
                    onClick={() => navigate(`/strategy/${strategy.id}`)}
                  >
                    {/* Author Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-2xl flex-shrink-0">{strategy.avatar}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              className="font-bold text-white hover:underline truncate"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${strategy.username.toLowerCase()}`);
                              }}
                            >
                              {strategy.username}
                            </p>
                            <span className="text-base-content/50 text-sm">@{strategy.userId}</span>
                          </div>
                          <p className="text-xs text-base-content/60">
                            {new Date(strategy.publishedDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/strategies');
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full transition-colors"
                      >
                        Use Strategy
                      </button>
                    </div>

                    {/* Strategy Title */}
                    <h3 className="text-lg font-bold text-white mb-3 group-hover:text-blue-400 transition-colors leading-snug">
                      {strategy.name}
                    </h3>

                    {/* Indicators & Asset Info */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {strategy.indicators.map((ind) => (
                        <span key={ind} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full border border-blue-500/30">
                          {ind}
                        </span>
                      ))}
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-medium rounded-full border border-emerald-500/30">
                        {strategy.bestRun.asset} • {strategy.bestRun.timeframe}
                      </span>
                    </div>

                    {/* Performance Metrics */}
                    <div className="bg-base-200/30 rounded-lg p-3 mb-3 border border-base-300">
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <p className="text-xs text-base-content/60 mb-1">Return</p>
                          <p className="text-sm font-bold text-emerald-400">+{strategy.bestRun.returnPct}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-base-content/60 mb-1">Win Rate</p>
                          <p className="text-sm font-bold text-blue-400">{strategy.bestRun.winRate}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-base-content/60 mb-1">Sharpe</p>
                          <p className="text-sm font-bold text-amber-400">{strategy.bestRun.sharpeRatio}</p>
                        </div>
                        <div>
                          <p className="text-xs text-base-content/60 mb-1">Score</p>
                          <p className="text-sm font-bold text-violet-400">{Math.round(strategy.votes / 10)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Engagement Footer */}
                    <div className="flex items-center justify-between text-sm text-base-content/60 border-t border-base-300 pt-3">
                      <div className="flex items-center gap-6">
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 hover:text-emerald-400 transition-colors group/btn"
                        >
                          <span className="group-hover/btn:bg-emerald-500/20 px-2 py-1 rounded">👍</span>
                          <span className="text-xs">{strategy.votes}</span>
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 hover:text-blue-400 transition-colors group/btn"
                        >
                          <span className="group-hover/btn:bg-blue-500/20 px-2 py-1 rounded">💬</span>
                          <span className="text-xs">{strategy.comments}</span>
                        </button>
                      </div>
                      {strategy.votes > 500 && (
                        <span className="px-2 py-1 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-full border border-amber-500/30">
                          🔥 Trending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : isLoading ? (
              // Loading state already displayed above
              null
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <p className="text-base-content/70 mb-4 text-center">No strategies match your filters.</p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-full transition-colors"
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
