import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  UserPlus,
  UserCheck,
  Edit,
  Users,
  ThumbsUp,
  MessageCircle,
  TrendingUp,
  Copy,
  Share2
} from 'lucide-react';
import { getCurrentUser } from '../api/useAuth';

type SortBy = 'recent' | 'voted' | 'return';

interface BacktestRun {
  asset: string;
  timeframe: string;
  returnPct: number;
  winRate: number;
}

interface PublishedStrategy {
  id: string;
  name: string;
  bestRun: BacktestRun;
  votes: number;
  comments: number;
  publishedDate: string;
}

interface UserProfile {
  id: string;
  username: string;
  bio: string;
  avatar: string;
  publishedStrategies: PublishedStrategy[];
  votes: number;
  followers: number;
  following: number;
  followersList: Array<{ id: string; username: string; avatar: string }>;
  followingList: Array<{ id: string; username: string; avatar: string }>;
  isFollowing?: boolean;
}

// Mock data
const mockProfiles: Record<string, UserProfile> = {
  'tradingmaster92': {
    id: '1',
    username: 'TradingMaster92',
    bio: '📈 Algo trader | Strategy backtest enthusiast | Always learning',
    avatar: '👤',
    publishedStrategies: [
      {
        id: 's1',
        name: 'Bollinger Band Squeeze',
        bestRun: { asset: 'NVDA', timeframe: '1D', returnPct: 31.5, winRate: 64 },
        votes: 234,
        comments: 18,
        publishedDate: '2024-03-15'
      },
      {
        id: 's2',
        name: 'SMA Crossover Pro',
        bestRun: { asset: 'AAPL', timeframe: '1D', returnPct: 24.5, winRate: 58 },
        votes: 156,
        comments: 12,
        publishedDate: '2024-03-10'
      },
      {
        id: 's3',
        name: 'RSI Mean Reversion',
        bestRun: { asset: 'MSFT', timeframe: '4H', returnPct: 18.2, winRate: 55 },
        votes: 89,
        comments: 7,
        publishedDate: '2024-02-28'
      }
    ],
    votes: 479,
    followers: 342,
    following: 128,
    followersList: [
      { id: '2', username: 'QuantJunkie', avatar: '👨‍💼' },
      { id: '3', username: 'CryptoWizard', avatar: '🧙' },
      { id: '4', username: 'StrategySeeker', avatar: '🔍' }
    ],
    followingList: [
      { id: '5', username: 'MarketAlpha', avatar: '📊' },
      { id: '6', username: 'TrendFollower', avatar: '📈' }
    ]
  },
  'quantjunkie': {
    id: '2',
    username: 'QuantJunkie',
    bio: 'Python enthusiast | Machine learning + trading | Data-driven',
    avatar: '👨‍💼',
    publishedStrategies: [
      {
        id: 's4',
        name: 'Multi-MA Support',
        bestRun: { asset: 'SPY', timeframe: '4H', returnPct: 42.1, winRate: 62 },
        votes: 812,
        comments: 45,
        publishedDate: '2024-03-20'
      }
    ],
    votes: 812,
    followers: 512,
    following: 89,
    followersList: [
      { id: '1', username: 'TradingMaster92', avatar: '👤' }
    ],
    followingList: []
  },
  'jibrillarbi.pro': {
    id: '3',
    username: 'JibrilLarbi.Pro',
    bio: '🚀 Strategy Builder | Backtesting Expert | Passionate about algo trading',
    avatar: '👨‍💻',
    publishedStrategies: [
      {
        id: 's5',
        name: 'Momentum Breakout',
        bestRun: { asset: 'BTC', timeframe: '1H', returnPct: 45.3, winRate: 68 },
        votes: 456,
        comments: 32,
        publishedDate: '2024-03-22'
      },
      {
        id: 's6',
        name: 'Trend Follower Elite',
        bestRun: { asset: 'ETH', timeframe: '4H', returnPct: 38.7, winRate: 61 },
        votes: 289,
        comments: 21,
        publishedDate: '2024-03-18'
      },
      {
        id: 's7',
        name: 'Volume Spike Detector',
        bestRun: { asset: 'AAPL', timeframe: '5m', returnPct: 22.1, winRate: 52 },
        votes: 145,
        comments: 8,
        publishedDate: '2024-03-10'
      }
    ],
    votes: 890,
    followers: 234,
    following: 156,
    followersList: [
      { id: '1', username: 'TradingMaster92', avatar: '👤' },
      { id: '2', username: 'QuantJunkie', avatar: '👨‍💼' }
    ],
    followingList: [
      { id: '1', username: 'TradingMaster92', avatar: '👤' },
      { id: '5', username: 'MarketAlpha', avatar: '📊' }
    ]
  }
};

export default function UserProfilePage() {
  const navigate = useNavigate();
  const { username = 'tradingmaster92' } = useParams<{ username: string }>();
  const currentUser = getCurrentUser();
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const profile = mockProfiles[username?.toLowerCase() || ''] as UserProfile | undefined;
  const isOwnProfile = currentUser?.email?.split('@')[0].toLowerCase() === username?.toLowerCase();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">User not found</h1>
          <p className="text-base-content/70">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const sorted = useMemo(() => {
    const strategies = [...profile.publishedStrategies];
    switch (sortBy) {
      case 'recent':
        return strategies.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
      case 'voted':
        return strategies.sort((a, b) => b.votes - a.votes);
      case 'return':
        return strategies.sort((a, b) => b.bestRun.returnPct - a.bestRun.returnPct);
      default:
        return strategies;
    }
  }, [profile.publishedStrategies, sortBy]);

  const avgReturn = profile.publishedStrategies.length > 0
    ? (profile.publishedStrategies.reduce((sum, s) => sum + s.bestRun.returnPct, 0) / profile.publishedStrategies.length).toFixed(1)
    : 0;

  const totalRuns = profile.publishedStrategies.reduce((sum, s) => sum + 1, 0);

  const bestStrategy = profile.publishedStrategies.reduce((best, s) =>
    s.bestRun.returnPct > best.bestRun.returnPct ? s : best,
    profile.publishedStrategies[0]
  );

  return (
    <div className="min-h-screen p-8 pt-24">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="bg-base-200 border border-base-300 rounded-xl p-8 mb-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="text-6xl">{profile.avatar}</div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{profile.username}</h1>
                <p className="text-base-content/70 mb-4">{profile.bio}</p>
              </div>
            </div>
            {!isOwnProfile ? (
              <button className="flex items-center gap-2 px-6 py-2 bg-secondary hover:bg-secondary/80 rounded-lg font-semibold transition-all">
                <UserPlus size={18} />
                Follow
              </button>
            ) : (
              <button className="flex items-center gap-2 px-6 py-2 border border-secondary text-secondary hover:bg-secondary/10 rounded-lg font-semibold transition-all">
                <Edit size={18} />
                Edit Profile
              </button>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-base-300/50 rounded-lg p-4">
              <p className="text-sm text-base-content/60 mb-1">Published</p>
              <p className="text-2xl font-bold">{profile.publishedStrategies.length}</p>
            </div>
            <div className="bg-base-300/50 rounded-lg p-4">
              <p className="text-sm text-base-content/60 mb-1">Total Votes</p>
              <p className="text-2xl font-bold text-emerald-400">{profile.votes}</p>
            </div>
            <div
              onClick={() => setShowFollowersModal(true)}
              className="bg-base-300/50 rounded-lg p-4 cursor-pointer hover:bg-base-300 transition-colors"
            >
              <p className="text-sm text-base-content/60 mb-1">Followers</p>
              <p className="text-2xl font-bold">{profile.followers}</p>
            </div>
            <div
              onClick={() => setShowFollowingModal(true)}
              className="bg-base-300/50 rounded-lg p-4 cursor-pointer hover:bg-base-300 transition-colors"
            >
              <p className="text-sm text-base-content/60 mb-1">Following</p>
              <p className="text-2xl font-bold">{profile.following}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-8">
            {/* Sorting Controls */}
            {profile.publishedStrategies.length > 0 && (
              <div className="flex gap-3 mb-6">
                {['recent', 'voted', 'return'].map((sort) => (
                  <button
                    key={sort}
                    onClick={() => setSortBy(sort as SortBy)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      sortBy === sort
                        ? 'bg-secondary text-secondary-content'
                        : 'bg-base-300 text-base-content/70 hover:bg-base-300'
                    }`}
                  >
                    {sort === 'recent' && 'Most Recent'}
                    {sort === 'voted' && 'Top Voted'}
                    {sort === 'return' && 'Best Return'}
                  </button>
                ))}
              </div>
            )}

            {/* Published Strategies */}
            {profile.publishedStrategies.length > 0 ? (
              <div className="space-y-4">
                {sorted.map((strategy) => (
                  <div
                    key={strategy.id}
                    className="bg-base-200 border border-base-300 rounded-xl p-6 hover:border-secondary transition-colors group cursor-pointer"
                    onClick={() => navigate(`/strategy/${strategy.id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1 group-hover:text-secondary transition-colors">
                          {strategy.name}
                        </h3>
                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-success/20 text-success">
                          Published
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/strategies');
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-base-300 hover:bg-base-300 rounded-lg text-sm transition-colors"
                      >
                        <Copy size={16} />
                        Clone
                      </button>
                    </div>

                    {/* Metrics */}
                    <div className="bg-base-300/50 rounded-lg p-3 mb-4">
                      <p className="text-xs text-base-content/60 mb-2">
                        Best run: {strategy.bestRun.asset} {strategy.bestRun.timeframe}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-base-content/60">Return</p>
                          <p className="text-lg font-bold text-emerald-400">+{strategy.bestRun.returnPct}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-base-content/60">Win Rate</p>
                          <p className="text-lg font-bold text-blue-400">{strategy.bestRun.winRate}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Engagement */}
                    <div className="flex items-center justify-between text-sm text-base-content/70 pt-4 border-t border-base-300">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <ThumbsUp size={16} />
                          {strategy.votes}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle size={16} />
                          {strategy.comments}
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
                ))}
              </div>
            ) : (
              <div className="bg-base-200 border border-base-300 rounded-xl p-12 text-center">
                <p className="text-base-content/70 mb-4">
                  {isOwnProfile
                    ? "You haven't published any strategies yet."
                    : `${profile.username} hasn't published any strategies yet.`}
                </p>
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/strategies')}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-secondary hover:bg-secondary/80 rounded-lg font-semibold transition-all"
                  >
                    <Share2 size={18} />
                    Publish Your First Strategy
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Stats */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-base-200 border border-base-300 rounded-xl p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-base-content/70 mb-4">Credibility Signal</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-base-content/60 mb-1">Average Return</p>
                    <p className="text-2xl font-bold text-emerald-400">+{avgReturn}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/60 mb-1">Total Backtest Runs</p>
                    <p className="text-2xl font-bold">{totalRuns}</p>
                  </div>
                  {bestStrategy && (
                    <div>
                      <p className="text-xs text-base-content/60 mb-1">Best Strategy</p>
                      <p className="text-sm font-semibold text-blue-400">{bestStrategy.name}</p>
                      <p className="text-xs text-base-content/50">+{bestStrategy.bestRun.returnPct}%</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-base-300 pt-6">
                <p className="text-xs text-base-content/60 font-semibold uppercase mb-3">About this user</p>
                <div className="space-y-3 text-sm text-base-content/70">
                  <p>Member for 6 months</p>
                  <p>Active contributor</p>
                  <p>Strategy quality: ⭐⭐⭐⭐⭐</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-base-200 border border-base-300 rounded-xl max-w-md w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-base-200 border-b border-base-300 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Followers ({profile.followers})</h2>
              <button onClick={() => setShowFollowersModal(false)} className="text-base-content/70 hover:text-base-content">✕</button>
            </div>
            <div className="p-4 space-y-3">
              {profile.followersList.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-3 cursor-pointer flex-1"
                    onClick={() => navigate(`/profile/${user.username.toLowerCase()}`)}
                  >
                    <div className="text-2xl">{user.avatar}</div>
                    <p className="font-semibold hover:text-secondary">{user.username}</p>
                  </div>
                  <button className="flex items-center gap-1 px-3 py-1 bg-base-300 hover:bg-base-300 rounded text-sm transition-colors">
                    <UserPlus size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-base-200 border border-base-300 rounded-xl max-w-md w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-base-200 border-b border-base-300 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Following ({profile.following})</h2>
              <button onClick={() => setShowFollowingModal(false)} className="text-base-content/70 hover:text-base-content">✕</button>
            </div>
            <div className="p-4 space-y-3">
              {profile.followingList.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-3 cursor-pointer flex-1"
                    onClick={() => navigate(`/profile/${user.username.toLowerCase()}`)}
                  >
                    <div className="text-2xl">{user.avatar}</div>
                    <p className="font-semibold hover:text-secondary">{user.username}</p>
                  </div>
                  <button className="flex items-center gap-1 px-3 py-1 bg-secondary/20 hover:bg-secondary/30 text-secondary rounded text-sm transition-colors">
                    <UserCheck size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
