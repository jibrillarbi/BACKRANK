import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Grid3x3,
  List,
  Edit,
  Play,
  Share2,
  ExternalLink,
  MessageCircle,
  ThumbsUp,
  Trash2,
  ChevronDown
} from 'lucide-react';

type StrategyStatus = 'Draft' | 'Tested' | 'Published';
type SortBy = 'lastUpdated' | 'bestReturn' | 'mostRuns' | 'highestVotes';
type ViewMode = 'grid' | 'list';

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
  status: StrategyStatus;
  createdDate: string;
  lastUpdatedDate: string;
  description: string;
  backtestruns: BacktestRun[];
  votes: number;
  comments: number;
}

const mockStrategies: Strategy[] = [
  {
    id: '1',
    name: 'SMA Crossover',
    status: 'Published',
    createdDate: '2024-03-15',
    lastUpdatedDate: '2024-03-28',
    description: 'Golden cross / dead cross with 50/200 SMAs',
    backtestruns: [
      { id: '1a', asset: 'AAPL', timeframe: '1D', returnPct: 24.5, winRate: 58, sharpeRatio: 1.2, maxDrawdown: -8.3, runDate: '2024-03-28' },
      { id: '1b', asset: 'MSFT', timeframe: '1D', returnPct: 18.2, winRate: 55, sharpeRatio: 1.0, maxDrawdown: -6.5, runDate: '2024-03-27' }
    ],
    votes: 234,
    comments: 18
  },
  {
    id: '2',
    name: 'RSI Divergence',
    status: 'Tested',
    createdDate: '2024-03-10',
    lastUpdatedDate: '2024-03-20',
    description: 'Hidden divergence detector on RSI',
    backtestruns: [
      { id: '2a', asset: 'BTC/USD', timeframe: '4H', returnPct: 31.5, winRate: 62, sharpeRatio: 1.45, maxDrawdown: -5.2, runDate: '2024-03-20' },
      { id: '2b', asset: 'ETH/USD', timeframe: '4H', returnPct: 12.3, winRate: 48, sharpeRatio: 0.8, maxDrawdown: -12.1, runDate: '2024-03-19' }
    ],
    votes: 0,
    comments: 0
  },
  {
    id: '3',
    name: 'EMA Momentum',
    status: 'Draft',
    createdDate: '2024-03-25',
    lastUpdatedDate: '2024-03-25',
    description: 'Fast EMA above slow EMA with MACD confirmation',
    backtestruns: [],
    votes: 0,
    comments: 0
  },
  {
    id: '4',
    name: 'Bollinger Squeeze',
    status: 'Published',
    createdDate: '2024-02-28',
    lastUpdatedDate: '2024-03-22',
    description: 'Entry on squeeze, exit on band touch',
    backtestruns: [
      { id: '4a', asset: 'NVDA', timeframe: '1D', returnPct: 42.1, winRate: 64, sharpeRatio: 1.8, maxDrawdown: -4.1, runDate: '2024-03-22' }
    ],
    votes: 812,
    comments: 45
  },
  {
    id: '5',
    name: 'Support Resistance',
    status: 'Tested',
    createdDate: '2024-03-01',
    lastUpdatedDate: '2024-03-18',
    description: 'Auto-detected S/R levels with mean reversion',
    backtestruns: [
      { id: '5a', asset: 'SPY', timeframe: '1H', returnPct: 15.7, winRate: 51, sharpeRatio: 0.9, maxDrawdown: -7.8, runDate: '2024-03-18' }
    ],
    votes: 0,
    comments: 0
  }
];

export default function MyStrategiesPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('strategyViewMode');
    return (saved as ViewMode) || 'grid';
  });
  const [strategies, setStrategies] = useState<Strategy[]>(mockStrategies);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StrategyStatus | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortBy>('lastUpdated');

  useEffect(() => {
    localStorage.setItem('strategyViewMode', viewMode);
  }, [viewMode]);

  // Filtered strategies
  const filtered = strategies
    .filter(s => statusFilter === 'All' || s.status === statusFilter)
    .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'lastUpdated':
          return new Date(b.lastUpdatedDate).getTime() - new Date(a.lastUpdatedDate).getTime();
        case 'bestReturn':
          const aReturn = a.backtestruns[0]?.returnPct || 0;
          const bReturn = b.backtestruns[0]?.returnPct || 0;
          return bReturn - aReturn;
        case 'mostRuns':
          return b.backtestruns.length - a.backtestruns.length;
        case 'highestVotes':
          return b.votes - a.votes;
        default:
          return 0;
      }
    });

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
    <div className="min-h-screen bg-base-100 p-8 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Strategies</h1>
            <p className="text-base-content/70">
              {filtered.length} {filtered.length === 1 ? 'strategy' : 'strategies'}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
          <button
            onClick={() => navigate('/strategy')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 rounded-lg font-semibold transition-all"
          >
            <Plus size={20} />
            New Strategy
          </button>
        </div>

        {/* Controls */}
        <div className="bg-base-200 border border-base-300 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search size={18} className="absolute left-3 top-3 text-base-content/60" />
              <input
                type="text"
                placeholder="Search strategies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-base-200 border border-base-300 rounded-lg pl-10 pr-4 py-2 text-base-content placeholder-base-content/50 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StrategyStatus | 'All')}
                className="w-full bg-base-300 border border-base-300 rounded-lg px-4 py-2 text-base-content focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Tested">Tested</option>
                <option value="Published">Published</option>
              </select>
              <ChevronDown size={18} className="absolute right-3 top-2 text-base-content/60 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="w-full bg-base-300 border border-base-300 rounded-lg px-4 py-2 text-base-content focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="lastUpdated">Last Updated</option>
                <option value="bestReturn">Best Return</option>
                <option value="mostRuns">Most Runs</option>
                <option value="highestVotes">Highest Votes</option>
              </select>
              <ChevronDown size={18} className="absolute right-3 top-2 text-base-content/60 pointer-events-none" />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-base-content/70">View:</span>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-base-content/60 hover:text-base-content'
              }`}
            >
              <Grid3x3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-base-content/60 hover:text-base-content'
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-base-content/60 text-lg mb-4\">
              {strategies.length === 0
                ? 'No strategies yet. Create your first one!'
                : 'No strategies match your search.'}
            </div>
            {strategies.length === 0 && (
              <button
                onClick={() => navigate('/strategy')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 rounded-lg font-semibold transition-all"
              >
                <Plus size={20} />
                Create Strategy
              </button>
            )}
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((strategy) => {
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
                        {strategy.status}
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

                  {/* Engagement */}
                  {strategy.status === 'Published' && (
                    <div className="flex items-center gap-4 text-sm text-base-content/70 mb-4 py-2 border-y border-base-300">
                      <div className="flex items-center gap-1">
                        <ThumbsUp size={16} />
                        {strategy.votes}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle size={16} />
                        {strategy.comments}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <p className="text-xs text-base-content/50 mb-4">Updated {formatDate(strategy.lastUpdatedDate)}</p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-base-300 hover:bg-base-300 rounded-lg text-sm transition-colors">
                      <Edit size={16} />
                      Edit
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-colors">
                      <Play size={16} />
                      Run
                    </button>
                    {strategy.status === 'Published' ? (
                      <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm transition-colors">
                        <ExternalLink size={16} />
                        View
                      </button>
                    ) : (
                      <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-base-300 hover:bg-base-300 rounded-lg text-sm transition-colors">
                        <Share2 size={16} />
                        Publish
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((strategy) => {
              const bestRun = getBestRun(strategy.backtestruns);
              return (
                <div
                  key={strategy.id}
                  className="bg-base-200 border border-base-300 rounded-lg p-4 hover:border-blue-500 transition-colors flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{strategy.name}</h3>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getStatusColor(strategy.status)}`}>
                        {strategy.status}
                      </span>
                    </div>
                    <p className="text-sm text-base-content/60">{strategy.description}</p>
                  </div>

                  <div className="flex items-center gap-8 ml-8">
                    {bestRun && (
                      <div className="text-right">
                        <p className="text-xs text-base-content/60">Best run</p>
                        <p className="text-sm font-semibold">
                          {bestRun.asset} • <span className="text-emerald-400">+{bestRun.returnPct}%</span>
                        </p>
                      </div>
                    )}

                    <div className="text-right">
                      <p className="text-xs text-base-content/60">Runs</p>
                      <p className="text-sm font-semibold">{strategy.backtestruns.length}</p>
                    </div>

                    {strategy.status === 'Published' && (
                      <div className="flex items-center gap-3 text-sm text-base-content/70">
                        <div className="flex items-center gap-1">
                          <ThumbsUp size={16} />
                          {strategy.votes}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle size={16} />
                          {strategy.comments}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-base-300 rounded transition-colors">
                        <Edit size={16} />
                      </button>
                      <button className="p-2 hover:bg-base-300 rounded transition-colors">
                        <Play size={16} />
                      </button>
                      <button className="p-2 hover:bg-base-300 rounded transition-colors">
                        {strategy.status === 'Published' ? <ExternalLink size={16} /> : <Share2 size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
