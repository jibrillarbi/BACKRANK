import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, TrendingUp, Users } from 'lucide-react';

type Tab = 'strategies' | 'users';
type Timeframe = 'all' | 'month' | 'week';
type SortStrategy = 'return' | 'sharpe' | 'winRate' | 'votes' | 'cloned';
type SortUser = 'bestReturn' | 'avgReturn' | 'votes' | 'followers';

interface StrategyRank {
  rank: number;
  name: string;
  author: string;
  userId: string;
  avatar: string;
  bestReturn: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  asset: string;
  timeframe: string;
  votes: number;
  clones: number;
}

interface UserRank {
  rank: number;
  username: string;
  userId: string;
  avatar: string;
  published: number;
  bestReturn: number;
  avgReturn: number;
  votes: number;
  followers: number;
}

const mockStrategyRanks: StrategyRank[] = [
  {
    rank: 1,
    name: 'Multi-MA Support',
    author: 'StrategySeeker',
    userId: '4',
    avatar: '🔍',
    bestReturn: 42.1,
    winRate: 62,
    sharpeRatio: 2.15,
    maxDrawdown: 7.8,
    asset: 'SPY',
    timeframe: '4H',
    votes: 812,
    clones: 156
  },
  {
    rank: 2,
    name: 'ATR Breakout',
    author: 'VolatilityHunter',
    userId: '7',
    avatar: '💨',
    bestReturn: 35.2,
    winRate: 58,
    sharpeRatio: 1.91,
    maxDrawdown: 9.2,
    asset: 'ETH',
    timeframe: '4H',
    votes: 421,
    clones: 92
  },
  {
    rank: 3,
    name: 'Bollinger Band Squeeze',
    author: 'TradingMaster92',
    userId: '1',
    avatar: '👤',
    bestReturn: 31.5,
    winRate: 64,
    sharpeRatio: 1.85,
    maxDrawdown: 8.2,
    asset: 'NVDA',
    timeframe: '1D',
    votes: 234,
    clones: 67
  },
  {
    rank: 4,
    name: 'MACD Momentum',
    author: 'MarketAlpha',
    userId: '5',
    avatar: '📊',
    bestReturn: 28.3,
    winRate: 60,
    sharpeRatio: 1.72,
    maxDrawdown: 10.1,
    asset: 'MSFT',
    timeframe: '1D',
    votes: 345,
    clones: 78
  },
  {
    rank: 5,
    name: 'SMA Crossover Pro',
    author: 'QuantJunkie',
    userId: '2',
    avatar: '👨‍💼',
    bestReturn: 24.5,
    winRate: 58,
    sharpeRatio: 1.42,
    maxDrawdown: 11.3,
    asset: 'AAPL',
    timeframe: '1D',
    votes: 156,
    clones: 43
  }
];

const mockUserRanks: UserRank[] = [
  {
    rank: 1,
    username: 'QuantJunkie',
    userId: '2',
    avatar: '👨‍💼',
    published: 12,
    bestReturn: 45.3,
    avgReturn: 28.7,
    votes: 2341,
    followers: 512
  },
  {
    rank: 2,
    username: 'TradingMaster92',
    userId: '1',
    avatar: '👤',
    published: 18,
    bestReturn: 42.1,
    avgReturn: 26.5,
    votes: 1893,
    followers: 342
  },
  {
    rank: 3,
    username: 'MarketAlpha',
    userId: '5',
    avatar: '📊',
    published: 9,
    bestReturn: 38.9,
    avgReturn: 24.2,
    votes: 1456,
    followers: 267
  },
  {
    rank: 4,
    username: 'StrategySeeker',
    userId: '4',
    avatar: '🔍',
    published: 7,
    bestReturn: 35.2,
    avgReturn: 22.1,
    votes: 987,
    followers: 189
  },
  {
    rank: 5,
    username: 'VolatilityHunter',
    userId: '7',
    avatar: '💨',
    published: 5,
    bestReturn: 31.5,
    avgReturn: 19.8,
    votes: 823,
    followers: 156
  }
];

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('strategies');
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [sortStrategy, setSortStrategy] = useState<SortStrategy>('return');
  const [sortUser, setSortUser] = useState<SortUser>('bestReturn');

  const userRank = 42; // Simulate user's rank
  const userIsVisible = false; // Simulate user not in top 5

  return (
    <div className="min-h-screen p-8 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="text-yellow-500" size={32} />
            <h1 className="text-4xl font-bold">Leaderboard</h1>
          </div>
          <p className="text-base-content/70">
            See the top performing strategies and most respected traders on the platform.
          </p>
        </div>

        {/* Your Rank Pin */}
        {userIsVisible && (
          <div className="bg-gradient-to-r from-yellow-500/20 to-emerald-500/20 border border-yellow-500/50 rounded-xl p-4 mb-8">
            <p className="font-bold text-yellow-400">
              Your Rank: #{userRank}
            </p>
          </div>
        )}

        {/* Tabs and Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          {/* Tabs */}
          <div className="flex gap-2 bg-base-200 border border-base-300 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('strategies')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'strategies'
                  ? 'bg-blue-500 text-white'
                  : 'text-base-content/70 hover:text-base-content'
              }`}
            >
              <TrendingUp size={18} className="inline mr-2" />
              Strategies
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-blue-500 text-white'
                  : 'text-base-content/70 hover:text-base-content'
              }`}
            >
              <Users size={18} className="inline mr-2" />
              Users
            </button>
          </div>

          {/* Time Filter */}
          <div className="flex gap-2">
            {(['all', 'month', 'week'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeframe === tf
                    ? 'bg-blue-500 text-white'
                    : 'bg-base-300 text-base-content/70 hover:bg-base-300'
                }`}
              >
                {tf === 'all' && 'All Time'}
                {tf === 'month' && 'This Month'}
                {tf === 'week' && 'This Week'}
              </button>
            ))}
          </div>
        </div>

        {/* Strategies Tab */}
        {activeTab === 'strategies' && (
          <div className="bg-base-200 border border-base-300 rounded-xl overflow-hidden">
            {/* Sort Controls */}
            <div className="p-6 border-b border-base-300">
              <div className="flex gap-2 flex-wrap">
                {(['return', 'sharpe', 'winRate', 'votes', 'cloned'] as const).map((sort) => (
                  <button
                    key={sort}
                    onClick={() => setSortStrategy(sort)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      sortStrategy === sort
                        ? 'bg-blue-500 text-white'
                        : 'bg-base-300 text-base-content/70 hover:bg-base-300'
                    }`}
                  >
                    {{
                      return: 'Best Return',
                      sharpe: 'Highest Sharpe',
                      winRate: 'Best Win Rate',
                      votes: 'Most Voted',
                      cloned: 'Most Cloned'
                    }[sort]}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-base-300 bg-base-300/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-base-content/70">#</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-base-content/70">Strategy</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-base-content/70">Return</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-base-content/70">Win Rate</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-base-content/70">Sharpe</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-base-content/70">Max DD</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-base-content/70">Asset</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-base-content/70">Votes</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-base-content/70">Clones</th>
                  </tr>
                </thead>
                <tbody>
                  {mockStrategyRanks.map((strategy) => (
                    <tr
                      key={strategy.rank}
                      onClick={() => navigate(`/strategy/${strategy.name}`)}
                      className="border-b border-base-300 hover:bg-base-300/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          {strategy.rank === 1 && <span className="text-2xl">🥇</span>}
                          {strategy.rank === 2 && <span className="text-2xl">🥈</span>}
                          {strategy.rank === 3 && <span className="text-2xl">🥉</span>}
                          {strategy.rank > 3 && (
                            <span className="font-bold text-base-content/70">#{strategy.rank}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="text-lg">{strategy.avatar}</div>
                          <div>
                            <p className="font-semibold hover:text-blue-400 transition-colors">
                              {strategy.name}
                            </p>
                            <p className="text-xs text-base-content/60">{strategy.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-emerald-400">+{strategy.bestReturn}%</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-blue-400">{strategy.winRate}%</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-purple-400">{strategy.sharpeRatio}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-red-400">-{strategy.maxDrawdown}%</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-base-content/70">
                          {strategy.asset} {strategy.timeframe}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold">{strategy.votes}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-blue-400">{strategy.clones}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-base-200 border border-base-300 rounded-xl overflow-hidden">
            {/* Sort Controls */}
            <div className="p-6 border-b border-base-300">
              <div className="flex gap-2 flex-wrap">
                {(['bestReturn', 'avgReturn', 'votes', 'followers'] as const).map((sort) => (
                  <button
                    key={sort}
                    onClick={() => setSortUser(sort)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      sortUser === sort
                        ? 'bg-blue-500 text-white'
                        : 'bg-base-300 text-base-content/70 hover:bg-base-300'
                    }`}
                  >
                    {{
                      bestReturn: 'Best Return',
                      avgReturn: 'Avg Return',
                      votes: 'Total Votes',
                      followers: 'Followers'
                    }[sort]}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-base-300 bg-base-300/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-base-content/70">#</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-base-content/70">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-base-content/70">Published</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-base-content/70">Best Return</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-base-content/70">Avg Return</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-base-content/70">Total Votes</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-base-content/70">Followers</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUserRanks.map((user) => (
                    <tr
                      key={user.userId}
                      onClick={() => navigate(`/profile/${user.username.toLowerCase()}`)}
                      className="border-b border-base-300 hover:bg-base-300/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          {user.rank === 1 && <span className="text-2xl">🥇</span>}
                          {user.rank === 2 && <span className="text-2xl">🥈</span>}
                          {user.rank === 3 && <span className="text-2xl">🥉</span>}
                          {user.rank > 3 && (
                            <span className="font-bold text-base-content/70">#{user.rank}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="text-lg">{user.avatar}</div>
                          <p className="font-semibold hover:text-blue-400 transition-colors">
                            {user.username}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold">{user.published}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-emerald-400">+{user.bestReturn}%</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-emerald-400">+{user.avgReturn}%</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold">{user.votes}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold">{user.followers}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
