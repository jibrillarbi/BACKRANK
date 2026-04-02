import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Copy,
  Share2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface BacktestRun {
  id: string;
  asset: string;
  timeframe: string;
  stopLoss: number;
  takeProfit: number;
  returnPct: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  trades: number;
  dateRun: string;
}

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  votes: number;
  replies: Comment[];
  datePosted: string;
  userVote?: 'up' | 'down';
}

interface Strategy {
  id: string;
  name: string;
  username: string;
  userId: string;
  avatar: string;
  description: string;
  indicators: Array<{ name: string; params: string }>;
  entryRules: string[];
  exitRules: string[];
  backtestRuns: BacktestRun[];
  votes: number;
  comments: number;
  publishedDate: string;
  userVote?: 'up' | 'down';
}

const mockStrategy: Strategy = {
  id: 's1',
  name: 'Bollinger Band Squeeze',
  username: 'TradingMaster92',
  userId: '1',
  avatar: '👤',
  description: `This strategy exploits Bollinger Band squeezes — periods of low volatility that often precede strong directional moves. 
  
The core idea: when the bands compress (squeeze phase), volatility is unusually low. When they expand rapidly with price breaking out, that's our entry signal.

I use a 20-period SMA with 2-standard deviation bands. Works particularly well on 1D timeframes for less noisy signals. Revenue-generating on NVDA, MSFT, and other high-liquidity tech stocks.

Warning: Be careful with position sizing during earnings. The strategy struggles in extreme gaps. Recommend using 1-2% risk per trade.`,
  indicators: [
    { name: 'Bollinger Bands', params: 'Period: 20, StdDev: 2' },
    { name: 'SMA', params: 'Period: 50' }
  ],
  entryRules: [
    'Bollinger Bands width < 5% of SMA',
    'Price breaks above upper band with volume',
    'RSI > 50 (confirmation)'
  ],
  exitRules: [
    'Take profit: 2% above entry',
    'Stop loss: 1% below entry',
    'Trail stop: move up by 50% of gains'
  ],
  backtestRuns: [
    {
      id: 'bt1',
      asset: 'NVDA',
      timeframe: '1D',
      stopLoss: 1.0,
      takeProfit: 2.0,
      returnPct: 31.5,
      winRate: 64,
      sharpeRatio: 1.85,
      maxDrawdown: 8.2,
      trades: 45,
      dateRun: '2026-03-20'
    },
    {
      id: 'bt2',
      asset: 'MSFT',
      timeframe: '1D',
      stopLoss: 1.0,
      takeProfit: 2.0,
      returnPct: 26.8,
      winRate: 61,
      sharpeRatio: 1.64,
      maxDrawdown: 9.1,
      trades: 42,
      dateRun: '2026-03-19'
    },
    {
      id: 'bt3',
      asset: 'AAPL',
      timeframe: '1D',
      stopLoss: 1.0,
      takeProfit: 2.0,
      returnPct: 18.3,
      winRate: 58,
      sharpeRatio: 1.21,
      maxDrawdown: 11.5,
      trades: 39,
      dateRun: '2026-03-18'
    }
  ],
  votes: 234,
  comments: 18,
  publishedDate: '2026-03-15'
};

const mockComments: Comment[] = [
  {
    id: 'c1',
    author: 'QuantJunkie',
    avatar: '👨‍💼',
    content: 'Love this strategy. Just ran it on QQQ and got 28% return. The squeeze setup is really clean.',
    votes: 45,
    replies: [
      {
        id: 'c1r1',
        author: 'TradingMaster92',
        avatar: '👤',
        content: 'Nice! QQQ has been trending well. Make sure to watch the earnings calendar — that can destroy the squeeze setup.',
        votes: 23,
        replies: [],
        datePosted: '2026-03-16'
      }
    ],
    datePosted: '2026-03-16'
  },
  {
    id: 'c2',
    author: 'CryptoWizard',
    avatar: '🧙',
    content: 'Does this work on crypto? Tested on BTC and got rekt. Volatility is too high maybe?',
    votes: 12,
    replies: [],
    datePosted: '2026-03-15'
  }
];

export default function StrategyDetailPage() {
  const navigate = useNavigate();
  const { id = 's1' } = useParams<{ id: string }>();
  const [selectedRunId, setSelectedRunId] = useState('bt1');
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [newComment, setNewComment] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const strategy = mockStrategy;
  const selectedRun = strategy.backtestRuns.find((r) => r.id === selectedRunId) || strategy.backtestRuns[0];

  const handleVote = (direction: 'up' | 'down') => {
    setUserVote(userVote === direction ? null : direction);
  };

  const toggleCommentExpand = (commentId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen p-8 pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Strategy Header */}
        <div className="bg-base-200 border border-base-300 rounded-xl p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="text-4xl">{strategy.avatar}</div>
              <div className="flex-1">
                <p className="text-sm text-base-content/70 mb-1">by</p>
                <p
                  className="font-semibold text-lg hover:text-blue-400 cursor-pointer transition-colors"
                  onClick={() => navigate(`/profile/${strategy.username.toLowerCase()}`)}
                >
                  {strategy.username}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/strategies')}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 rounded-lg font-semibold transition-all whitespace-nowrap"
            >
              <Copy size={18} />
              Clone
            </button>
          </div>

          <h1 className="text-4xl font-bold mb-4">{strategy.name}</h1>

          <div className="flex items-center justify-between mb-6 text-sm text-base-content/70 border-b border-base-300 pb-6">
            <div className="flex items-center gap-4">
              <span>Published {new Date(strategy.publishedDate).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Vote Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-base-300 rounded-lg p-2">
              <button
                onClick={() => handleVote('up')}
                className={`p-2 rounded transition-colors ${
                  userVote === 'up' ? 'bg-emerald-500/20 text-emerald-400' : 'text-base-content/70 hover:text-base-content'
                }`}
              >
                <ThumbsUp size={18} />
              </button>
              <span className="px-3 font-semibold">{strategy.votes + (userVote ? 1 : 0)}</span>
              <button
                onClick={() => handleVote('down')}
                className={`p-2 rounded transition-colors ${
                  userVote === 'down' ? 'bg-red-500/20 text-red-400' : 'text-base-content/70 hover:text-base-content'
                }`}
              >
                <ThumbsDown size={18} />
              </button>
            </div>
            <div className="flex items-center gap-1 text-base-content/70 hover:text-base-content cursor-pointer transition-colors">
              <MessageCircle size={18} />
              <span>{strategy.comments}</span>
            </div>
            <button className="flex items-center gap-1 text-base-content/70 hover:text-base-content transition-colors">
              <Share2 size={18} />
              Share
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-3 lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-base-200 border border-base-300 rounded-xl p-8">
              <h2 className="text-xl font-bold mb-4">Strategy Overview</h2>
              <div className="text-base-content whitespace-pre-line leading-relaxed">
                {strategy.description}
              </div>
            </div>

            {/* Indicators and Rules */}
            <div className="bg-base-200 border border-base-300 rounded-xl p-8">
              <h2 className="text-xl font-bold mb-6">Rules & Indicators</h2>

              <div className="space-y-6">
                {/* Indicators */}
                <div>
                  <h3 className="font-semibold text-blue-400 mb-3">Indicators Used</h3>
                  <div className="space-y-2">
                    {strategy.indicators.map((ind, idx) => (
                      <div key={idx} className="bg-base-300/50 rounded-lg p-3">
                        <p className="font-medium">{ind.name}</p>
                        <p className="text-sm text-base-content/70">{ind.params}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Entry Rules */}
                <div>
                  <h3 className="font-semibold text-emerald-400 mb-3">Entry Conditions</h3>
                  <ul className="space-y-2">
                    {strategy.entryRules.map((rule, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Exit Rules */}
                <div>
                  <h3 className="font-semibold text-red-400 mb-3">Exit Conditions</h3>
                  <ul className="space-y-2">
                    {strategy.exitRules.map((rule, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-red-400 font-bold">✕</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Backtest Results */}
            <div className="bg-base-200 border border-base-300 rounded-xl p-8">
              <h2 className="text-xl font-bold mb-6">Backtest Results</h2>

              {/* Run Selector */}
              <div className="mb-6 flex flex-wrap gap-2">
                {strategy.backtestRuns.map((run) => (
                  <button
                    key={run.id}
                    onClick={() => setSelectedRunId(run.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedRunId === run.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-base-300 text-base-content/70 hover:bg-base-300'
                    }`}
                  >
                    {run.asset} {run.timeframe}
                  </button>
                ))}
              </div>

              {/* Selected Run Details */}
              <div className="bg-base-300/50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-base-content/60 mb-1">Return</p>
                    <p className="text-2xl font-bold text-emerald-400">+{selectedRun.returnPct}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/60 mb-1">Win Rate</p>
                    <p className="text-2xl font-bold text-blue-400">{selectedRun.winRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/60 mb-1">Sharpe Ratio</p>
                    <p className="text-2xl font-bold text-purple-400">{selectedRun.sharpeRatio}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/60 mb-1">Max Drawdown</p>
                    <p className="text-2xl font-bold text-red-400">-{selectedRun.maxDrawdown}%</p>
                  </div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-base-300/50 rounded-lg p-4">
                  <p className="text-sm text-base-content/60 mb-2">Trades</p>
                  <p className="text-lg font-bold">{selectedRun.trades}</p>
                </div>
                <div className="bg-base-300/50 rounded-lg p-4">
                  <p className="text-sm text-base-content/60 mb-2">Stop Loss</p>
                  <p className="text-lg font-bold">{selectedRun.stopLoss}%</p>
                </div>
                <div className="bg-base-300/50 rounded-lg p-4">
                  <p className="text-sm text-base-content/60 mb-2">Take Profit</p>
                  <p className="text-lg font-bold">{selectedRun.takeProfit}%</p>
                </div>
              </div>

              {/* Equity Curve Placeholder */}
              <div className="bg-base-300/50 rounded-lg p-6 mt-6 text-center">
                <p className="text-base-content/60 mb-4">📈 Equity Curve Chart</p>
                <div className="h-64 bg-base-200 rounded-lg flex items-center justify-center border border-base-300">
                  <p className="text-base-content/50">Chart integration coming soon</p>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-base-200 border border-base-300 rounded-xl p-8">
              <h2 className="text-xl font-bold mb-6">Discussion ({strategy.comments})</h2>

              {/* New Comment */}
              <div className="mb-6 pb-6 border-b border-base-300">
                <textarea
                  placeholder="Share your thoughts, results, or questions..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-4 py-3 bg-base-300 border border-base-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                  rows={3}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    disabled={!newComment.trim()}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-base-300 disabled:text-base-content/50 rounded-lg font-semibold transition-colors"
                  >
                    Post Comment
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-6">
                {mockComments.map((comment) => (
                  <div key={comment.id}>
                    {/* Top-level comment */}
                    <div className="flex gap-4">
                      <div className="text-2xl flex-shrink-0">{comment.avatar}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold hover:text-blue-400 cursor-pointer transition-colors">
                            {comment.author}
                          </p>
                          <p className="text-xs text-base-content/50">
                            {new Date(comment.datePosted).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-base-content mb-3">{comment.content}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-base-content/70 hover:text-base-content cursor-pointer transition-colors">
                            <ThumbsUp size={14} />
                            {comment.votes}
                          </div>
                          <button className="text-base-content/70 hover:text-base-content transition-colors">
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Replies */}
                    {comment.replies.length > 0 && (
                      <div className="ml-4 mt-4 border-l border-base-300 pl-4 space-y-4">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3">
                            <div className="text-xl flex-shrink-0">{reply.avatar}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold hover:text-blue-400 cursor-pointer transition-colors text-sm">
                                  {reply.author}
                                </p>
                                <p className="text-xs text-base-content/50">
                                  {new Date(reply.datePosted).toLocaleDateString()}
                                </p>
                              </div>
                              <p className="text-base-content text-sm mb-2">{reply.content}</p>
                              <div className="flex items-center gap-2 text-xs">
                                <div className="flex items-center gap-1 text-base-content/70 hover:text-base-content cursor-pointer transition-colors">
                                  <ThumbsUp size={12} />
                                  {reply.votes}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-3 lg:col-span-1">
            <div className="bg-base-200 border border-base-300 rounded-xl p-6 sticky top-8">
              <h3 className="font-bold mb-4 text-sm uppercase text-base-content/60">About This Strategy</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-base-content/60 mb-1">Best Return</p>
                  <p className="text-2xl font-bold text-emerald-400">+31.5%</p>
                </div>

                <div>
                  <p className="text-xs text-base-content/60 mb-1">Avg Return</p>
                  <p className="text-2xl font-bold text-emerald-400">+25.5%</p>
                </div>

                <div>
                  <p className="text-xs text-base-content/60 mb-1">Total Backtests</p>
                  <p className="text-2xl font-bold">{strategy.backtestRuns.length}</p>
                </div>

                <div className="pt-4 border-t border-base-300">
                  <p className="text-xs text-base-content/60 mb-3">Tested On</p>
                  <div className="space-y-1">
                    {strategy.backtestRuns.map((run) => (
                      <p key={run.id} className="text-sm">
                        {run.asset} {run.timeframe}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
