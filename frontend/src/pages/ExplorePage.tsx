import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

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

const mockStrategies: PublishedStrategy[] = [
  {
    id: 's1',
    name: 'Bollinger Band Squeeze',
    username: 'TradingMaster92',
    userId: '1',
    avatar: '👤',
    indicators: ['Bollinger Bands', 'SMA'],
    bestRun: { asset: 'NVDA', timeframe: '1D', returnPct: 31.5, winRate: 64, sharpeRatio: 1.85 },
    votes: 234,
    comments: 18,
    publishedDate: '2026-03-15'
  },
  {
    id: 's2',
    name: 'SMA Crossover Pro',
    username: 'QuantJunkie',
    userId: '2',
    avatar: '👨‍💼',
    indicators: ['SMA'],
    bestRun: { asset: 'AAPL', timeframe: '1D', returnPct: 24.5, winRate: 58, sharpeRatio: 1.42 },
    votes: 156,
    comments: 12,
    publishedDate: '2026-03-10'
  },
  {
    id: 's3',
    name: 'RSI Mean Reversion',
    username: 'CryptoWizard',
    userId: '3',
    avatar: '🧙',
    indicators: ['RSI'],
    bestRun: { asset: 'BTC', timeframe: '4H', returnPct: 18.2, winRate: 55, sharpeRatio: 0.98 },
    votes: 89,
    comments: 7,
    publishedDate: '2026-02-28'
  },
  {
    id: 's4',
    name: 'Multi-MA Support',
    username: 'StrategySeeker',
    userId: '4',
    avatar: '🔍',
    indicators: ['EMA', 'SMA'],
    bestRun: { asset: 'SPY', timeframe: '4H', returnPct: 42.1, winRate: 62, sharpeRatio: 2.15 },
    votes: 812,
    comments: 45,
    publishedDate: '2026-03-20'
  },
  {
    id: 's5',
    name: 'MACD Momentum',
    username: 'MarketAlpha',
    userId: '5',
    avatar: '📊',
    indicators: ['MACD'],
    bestRun: { asset: 'MSFT', timeframe: '1D', returnPct: 28.3, winRate: 60, sharpeRatio: 1.72 },
    votes: 345,
    comments: 23,
    publishedDate: '2026-03-18'
  },
  {
    id: 's6',
    name: 'Stochastic Overbought',
    username: 'TrendFollower',
    userId: '6',
    avatar: '📈',
    indicators: ['Stochastic', 'RSI'],
    bestRun: { asset: 'TSLA', timeframe: '1H', returnPct: 15.7, winRate: 52, sharpeRatio: 0.87 },
    votes: 67,
    comments: 5,
    publishedDate: '2026-03-12'
  },
  {
    id: 's7',
    name: 'ATR Breakout',
    username: 'VolatilityHunter',
    userId: '7',
    avatar: '💨',
    indicators: ['ATR', 'SMA'],
    bestRun: { asset: 'ETH', timeframe: '4H', returnPct: 35.2, winRate: 58, sharpeRatio: 1.91 },
    votes: 421,
    comments: 31,
    publishedDate: '2026-03-19'
  },
  {
    id: 's8',
    name: 'EMA Confluence',
    username: 'TradingMaster92',
    userId: '1',
    avatar: '👤',
    indicators: ['EMA'],
    bestRun: { asset: 'GLD', timeframe: '1D', returnPct: 12.4, winRate: 56, sharpeRatio: 0.76 },
    votes: 123,
    comments: 9,
    publishedDate: '2026-03-08'
  }
];

export default function ExplorePage() {
  const navigate = useNavigate();
  const [viewType, setViewType] = useState<ViewType>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('top');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectedTimeframes, setSelectedTimeframes] = useState<string[]>([]);
  const [minReturn, setMinReturn] = useState(0);
  const [minVotes, setMinVotes] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Filtering and sorting logic
  const filtered = useMemo(() => {
    let result = mockStrategies.filter((strategy) => {
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
  }, [searchQuery, selectedIndicators, selectedAssets, selectedTimeframes, minReturn, minVotes, sortBy]);

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
    <div className="min-h-screen bg-base-200 p-8 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Explore Strategies</h1>
          <p className="text-base-content/70">
            Discover published strategies from the community. Learn, clone, and discuss.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search strategies or usernames..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Filters */}
          <div className="col-span-12 lg:col-span-3">
            <div className="lg:sticky lg:top-8">
              <div className="flex items-center justify-between mb-4 lg:mb-0">
                <h2 className="text-lg font-bold">Filters</h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden btn btn-ghost btn-sm"
                >
                  {showFilters ? 'Hide' : 'Show'}
                </button>
              </div>

              <div
                className={`${
                  showFilters ? 'block' : 'hidden'
                } lg:block card bg-base-100 shadow-md p-6 space-y-6`}
              >
                {/* Indicators */}
                <div>
                  <h3 className="font-semibold mb-3">Indicators</h3>
                  <div className="space-y-2">
                    {INDICATORS.map((ind) => (
                      <div key={ind} className="form-control">
                        <label className="cursor-pointer label">
                          <input
                            type="checkbox"
                            checked={selectedIndicators.includes(ind)}
                            onChange={() => toggleIndicator(ind)}
                            className="checkbox checkbox-sm"
                          />
                          <span className="label-text text-sm">{ind}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assets */}
                <div>
                  <h3 className="font-semibold mb-3">Assets</h3>
                  <div className="space-y-2">
                    {ASSETS.map((asset) => (
                      <div key={asset} className="form-control">
                        <label className="cursor-pointer label">
                          <input
                            type="checkbox"
                            checked={selectedAssets.includes(asset)}
                            onChange={() => toggleAsset(asset)}
                            className="checkbox checkbox-sm"
                          />
                          <span className="label-text text-sm">{asset}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeframes */}
                <div>
                  <h3 className="font-semibold mb-3">Timeframes</h3>
                  <div className="space-y-2">
                    {TIMEFRAMES.map((tf) => (
                      <div key={tf} className="form-control">
                        <label className="cursor-pointer label">
                          <input
                            type="checkbox"
                            checked={selectedTimeframes.includes(tf)}
                            onChange={() => toggleTimeframe(tf)}
                            className="checkbox checkbox-sm"
                          />
                          <span className="label-text text-sm">{tf}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Minimum Return */}
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Min Return: {minReturn}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={minReturn}
                    onChange={(e) => setMinReturn(Number(e.target.value))}
                    className="range range-sm"
                  />
                </div>

                {/* Minimum Votes */}
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Min Votes: {minVotes}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="50"
                    value={minVotes}
                    onChange={(e) => setMinVotes(Number(e.target.value))}
                    className="range range-sm"
                  />
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="btn btn-outline btn-sm w-full"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
              <div className="flex items-center gap-1 flex-wrap">
                {['top', 'new', 'return', 'discussed'].map((sort) => (
                  <button
                    key={sort}
                    onClick={() => setSortBy(sort as SortBy)}
                    className={`btn btn-sm ${
                      sortBy === sort
                        ? 'btn-primary'
                        : 'btn-ghost'
                    }`}
                  >
                    {{
                      top: 'Top',
                      new: 'New',
                      return: 'Best Return',
                      discussed: 'Most Discussed'
                    }[sort]}
                  </button>
                ))}
              </div>

              {/* View Toggle */}
              <div className="join">
                <button
                  onClick={() => setViewType('grid')}
                  className={`join-item btn btn-sm ${viewType === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  ⊞ Grid
                </button>
                <button
                  onClick={() => setViewType('list')}
                  className={`join-item btn btn-sm ${viewType === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  ☰ List
                </button>
              </div>
            </div>

            {/* Results */}
            {filtered.length > 0 ? (
              <div
                className={
                  viewType === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                    : 'space-y-4'
                }
              >
                {filtered.map((strategy) => (
                  <div
                    key={strategy.id}
                    className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow border border-base-300 hover:border-secondary cursor-pointer"
                    onClick={() => navigate(`/strategy/${strategy.id}`)}
                  >
                    <div className="card-body p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="text-2xl flex-shrink-0">{strategy.avatar}</div>
                          <div className="min-w-0">
                            <p className="text-sm text-base-content/60">by</p>
                            <p
                              className="font-semibold hover:text-secondary transition-colors truncate"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${strategy.username.toLowerCase()}`);
                              }}
                            >
                              {strategy.username}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/strategies');
                          }}
                          className="btn btn-ghost btn-sm gap-1 whitespace-nowrap"
                        >
                          📋 Clone
                        </button>
                      </div>

                      {/* Strategy Name */}
                      <h3 className="text-lg font-bold mb-3 hover:text-secondary transition-colors line-clamp-2">
                        {strategy.name}
                      </h3>

                      {/* Indicators */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {strategy.indicators.map((ind) => (
                          <span key={ind} className="badge badge-primary badge-sm">
                            {ind}
                          </span>
                        ))}
                      </div>

                      {/* Best Run Info */}
                      <div className="bg-base-200 rounded-lg p-3 mb-4">
                        <p className="text-xs text-base-content/60 mb-2">
                          Best run: {strategy.bestRun.asset} {strategy.bestRun.timeframe}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <p className="text-xs text-base-content/60">Return</p>
                            <p className="font-bold text-success">+{strategy.bestRun.returnPct}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-base-content/60">Win Rate</p>
                            <p className="font-bold text-info">{strategy.bestRun.winRate}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-base-content/60">Sharpe</p>
                            <p className="font-bold text-warning">{strategy.bestRun.sharpeRatio}</p>
                          </div>
                        </div>
                      </div>

                      {/* Engagement */}
                      <div className="flex items-center justify-between text-sm text-base-content/60 pt-4 border-t border-base-300">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 hover:text-base-content/80 transition-colors">
                            👍 {strategy.votes}
                          </div>
                          <div className="flex items-center gap-1 hover:text-base-content/80 transition-colors">
                            💬 {strategy.comments}
                          </div>
                        </div>
                        <p className="text-xs text-base-content/50">
                          {new Date(strategy.publishedDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card bg-base-100 shadow-md p-12 text-center">
                <div className="card-body">
                  <p className="text-base-content/70 mb-4">No strategies match your filters.</p>
                  <button
                    onClick={clearFilters}
                    className="btn btn-primary"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
