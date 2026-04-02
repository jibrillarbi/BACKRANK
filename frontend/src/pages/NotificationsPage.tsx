import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ThumbsUp,
  MessageCircle,
  UserPlus,
  Copy,
  X,
  Check
} from 'lucide-react';

type NotificationType = 'vote' | 'comment' | 'reply' | 'follow' | 'clone';
type FilterType = 'all' | 'votes' | 'comments' | 'follows' | 'clones';

interface NotificationData {
  id: string;
  type: NotificationType;
  actorUsername: string;
  actorId: string;
  actorAvatar: string;
  strategyName?: string;
  strategyId?: string;
  excerpt?: string;
  voteType?: 'up' | 'down';
  timestamp: Date;
  isRead: boolean;
  groupCount?: number; // For grouped notifications (multiple votes)
  isFollowing?: boolean; // For follow notifications
}

// Mock data - notifications from most recent to oldest
const mockNotifications: NotificationData[] = [
  {
    id: 'n1',
    type: 'vote',
    actorUsername: 'QuantJunkie',
    actorId: '2',
    actorAvatar: '👨‍💼',
    strategyName: 'Bollinger Band Squeeze',
    strategyId: 's1',
    voteType: 'up',
    timestamp: new Date(Date.now() - 30 * 60000), // 30 min ago
    isRead: false,
    groupCount: 12 // Grouped: 12 people upvoted
  },
  {
    id: 'n2',
    type: 'comment',
    actorUsername: 'CryptoWizard',
    actorId: '3',
    actorAvatar: '🧙',
    strategyName: 'SMA Crossover Pro',
    strategyId: 's2',
    excerpt: 'Great strategy! Just tested it on BTC and got 28% return. The squeeze setup is really clean and consistent.',
    timestamp: new Date(Date.now() - 2 * 60 * 60000), // 2 hours ago
    isRead: false
  },
  {
    id: 'n3',
    type: 'follow',
    actorUsername: 'StrategySeeker',
    actorId: '4',
    actorAvatar: '🔍',
    timestamp: new Date(Date.now() - 3 * 60 * 60000), // 3 hours ago
    isRead: false,
    isFollowing: false
  },
  {
    id: 'n4',
    type: 'clone',
    actorUsername: 'MarketAlpha',
    actorId: '5',
    actorAvatar: '📊',
    strategyName: 'RSI Mean Reversion',
    strategyId: 's3',
    timestamp: new Date(Date.now() - 4 * 60 * 60000), // 4 hours ago
    isRead: true
  },
  {
    id: 'n5',
    type: 'reply',
    actorUsername: 'TrendFollower',
    actorId: '6',
    actorAvatar: '📈',
    strategyName: 'Multi-MA Support',
    strategyId: 's4',
    excerpt: 'I totally agree with your point about volatility. Testing this on QQQ now.',
    timestamp: new Date(Date.now() - 5 * 60 * 60000), // 5 hours ago
    isRead: true
  },
  {
    id: 'n6',
    type: 'vote',
    actorUsername: 'VolatilityHunter',
    actorId: '7',
    actorAvatar: '💨',
    strategyName: 'MACD Momentum',
    strategyId: 's5',
    voteType: 'down',
    timestamp: new Date(Date.now() - 6 * 60 * 60000), // 6 hours ago
    isRead: true
  },
  {
    id: 'n7',
    type: 'follow',
    actorUsername: 'EliteTrader88',
    actorId: '8',
    actorAvatar: '⭐',
    timestamp: new Date(Date.now() - 8 * 60 * 60000), // 8 hours ago
    isRead: true,
    isFollowing: true
  },
  {
    id: 'n8',
    type: 'comment',
    actorUsername: 'DataDriven',
    actorId: '9',
    actorAvatar: '🔬',
    strategyName: 'ATR Breakout',
    strategyId: 's6',
    excerpt: 'Have you backtested this on crypto? Would love to see how it performs on BTC.',
    timestamp: new Date(Date.now() - 12 * 60 * 60000), // 12 hours ago
    isRead: true
  },
  {
    id: 'n9',
    type: 'clone',
    actorUsername: 'GrowthHacker',
    actorId: '10',
    actorAvatar: '📱',
    strategyName: 'EMA Confluence',
    strategyId: 's7',
    timestamp: new Date(Date.now() - 24 * 60 * 60000), // 24 hours ago
    isRead: true
  },
  {
    id: 'n10',
    type: 'vote',
    actorUsername: 'SystemTrader',
    actorId: '11',
    actorAvatar: '🤖',
    strategyName: 'Bollinger Band Squeeze',
    strategyId: 's1',
    voteType: 'up',
    timestamp: new Date(Date.now() - 48 * 60 * 60000), // 48 hours ago
    isRead: true
  }
];

// Helper function to format relative time
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Get notification description text
const getNotificationText = (notification: NotificationData): string => {
  switch (notification.type) {
    case 'vote':
      return `${notification.voteType === 'up' ? 'upvoted' : 'downvoted'} your strategy`;
    case 'comment':
      return 'commented on your strategy';
    case 'reply':
      return 'replied to your comment';
    case 'follow':
      return 'followed you';
    case 'clone':
      return 'cloned your strategy';
    default:
      return '';
  }
};

// Get notification icon
const getNotificationIcon = (notification: NotificationData): React.ReactNode => {
  switch (notification.type) {
    case 'vote':
      return <ThumbsUp size={18} className={notification.voteType === 'up' ? 'text-emerald-400' : 'text-red-400'} />;
    case 'comment':
      return <MessageCircle size={18} className="text-blue-400" />;
    case 'reply':
      return <MessageCircle size={18} className="text-blue-400" />;
    case 'follow':
      return <UserPlus size={18} className="text-purple-400" />;
    case 'clone':
      return <Copy size={18} className="text-amber-400" />;
    default:
      return null;
  }
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'votes') return notif.type === 'vote';
      if (activeFilter === 'comments') return notif.type === 'comment' || notif.type === 'reply';
      if (activeFilter === 'follows') return notif.type === 'follow';
      if (activeFilter === 'clones') return notif.type === 'clone';
      return true;
    });
  }, [notifications, activeFilter]);

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
  };

  // Delete notification
  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  // Follow back handler
  const handleFollowBack = (notification: NotificationData) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notification.id ? { ...notif, isFollowing: !notif.isFollowing } : notif
      )
    );
  };

  return (
    <div className="min-h-screen bg-base-100 text-base-content p-8 pt-24">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Notifications</h1>
            <p className="text-base-content/70">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: 'all', label: 'All' },
            { id: 'votes', label: 'Votes' },
            { id: 'comments', label: 'Comments' },
            { id: 'follows', label: 'Follows' },
            { id: 'clones', label: 'Clones' }
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveFilter(id as FilterType)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === id
                  ? 'bg-blue-500 text-white'
                  : 'bg-base-300 text-base-content/70 hover:bg-base-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Notifications Feed */}
        {filteredNotifications.length > 0 ? (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={`p-4 rounded-lg border transition-all group cursor-pointer ${
                  !notification.isRead
                    ? 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/50'
                    : 'bg-base-200 border-base-300 hover:border-base-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="text-2xl flex-shrink-0 mt-1">{notification.actorAvatar}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Action Line */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className="font-semibold hover:text-blue-400 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/profile/${notification.actorUsername.toLowerCase()}`);
                          }}
                        >
                          {notification.actorUsername}
                        </p>
                        <span className="text-base-content/70">{getNotificationText(notification)}</span>
                        {notification.groupCount && notification.groupCount > 1 && (
                          <span className="text-base-content/60 text-sm">
                            (+{notification.groupCount - 1} more)
                          </span>
                        )}
                      </div>

                      {/* Unread Indicator & Delete */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-base-content/60 whitespace-nowrap">
                          {formatRelativeTime(notification.timestamp)}
                        </span>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-1" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-base-content/50 hover:text-base-content/70 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Strategy Name Link (for non-follow notifications) */}
                    {notification.strategyName && (
                      <p
                        className="text-blue-400 hover:text-blue-300 transition-colors mb-2 truncate cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/strategy/${notification.strategyId}`);
                        }}
                      >
                        {notification.strategyName}
                      </p>
                    )}

                    {/* Comment Excerpt */}
                    {notification.excerpt && (
                      <p className="text-sm text-base-content/70 italic line-clamp-2 mb-2">
                        "{notification.excerpt}"
                      </p>
                    )}

                    {/* Follow Back Button */}
                    {notification.type === 'follow' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowBack(notification);
                        }}
                        className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors ${
                          notification.isFollowing
                            ? 'bg-base-300 text-base-content/70 hover:bg-base-300'
                            : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                        }`}
                      >
                        {notification.isFollowing ? (
                          <>
                            <Check size={14} />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus size={14} />
                            Follow Back
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Icon */}
                  <div className="flex-shrink-0 text-base-content/50 group-hover:text-base-content/60 transition-colors mt-1">
                    {getNotificationIcon(notification)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-base-200 border border-base-300 rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
            <p className="text-base-content/70 mb-6">
              When you publish a strategy, other traders will be able to upvote, comment, and clone it. 
              Activity on your strategies will show up here.
            </p>
            <button
              onClick={() => navigate('/strategies')}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors"
            >
              Publish Your First Strategy
            </button>
          </div>
        )}

        {/* Clear Cache Notice (for unread count badge) */}
        {unreadCount === 0 && notifications.length > 0 && (
          <div className="mt-8 p-4 bg-base-300/50 rounded-lg border border-base-300 text-sm text-base-content/70 text-center">
            💡 Tip: The notification badge in the navigation will show your unread count and update in real time.
          </div>
        )}
      </div>
    </div>
  );
}
