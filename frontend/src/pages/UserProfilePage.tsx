import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BarChart3, Edit, Loader, MessageCircle, ThumbsUp } from 'lucide-react';
import { api } from '../api/index';
import { getCurrentUser } from '../api/useAuth';

type SortBy = 'recent' | 'voted' | 'return';

interface ProfilePost {
  id: number;
  did: number;
  body: string;
  likes: number;
  comments: number;
  created_at: string;
  deployment?: {
    id: number;
    asset: string;
    timeframe: string;
    direction: string;
    score?: number | null;
    strategy?: {
      name?: string;
    };
    backtest_data?: Array<{
      total_return_pct: number;
      sharpe_ratio: number;
      win_rate: number;
      max_dd: number;
      total_trades: number;
      final_capital: number;
    }>;
  };
}

interface ProfileResponse {
  profile: {
    uid: string;
    username: string;
    email: string;
  } | null;
  posts: ProfilePost[];
}

const formatDate = (date: string) => {
  if (!date) return 'Unknown date';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const postReturn = (post: ProfilePost) => Number(post.deployment?.backtest_data?.[0]?.total_return_pct ?? 0);

export default function UserProfilePage() {
  const navigate = useNavigate();
  const { username = '' } = useParams<{ username: string }>();
  const currentUser = getCurrentUser();
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [profile, setProfile] = useState<ProfileResponse['profile']>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.getProfilePosts(username) as ProfileResponse;
        setProfile(data.profile);
        setPosts(data.posts || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load profile';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  const isOwnProfile = Boolean(
    currentUser?.username?.toLowerCase() === username.toLowerCase() ||
    currentUser?.email?.split('@')[0]?.toLowerCase() === username.toLowerCase()
  );

  const sortedPosts = useMemo(() => {
    const copy = [...posts];
    switch (sortBy) {
      case 'voted':
        return copy.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      case 'return':
        return copy.sort((a, b) => postReturn(b) - postReturn(a));
      case 'recent':
      default:
        return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [posts, sortBy]);

  const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
  const totalComments = posts.reduce((sum, post) => sum + (post.comments || 0), 0);
  const avgReturn = posts.length
    ? posts.reduce((sum, post) => sum + postReturn(post), 0) / posts.length
    : 0;
  const bestPost = posts.reduce<ProfilePost | null>((best, post) => {
    if (!best) return post;
    return postReturn(post) > postReturn(best) ? post : best;
  }, null);

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-4 pt-24 md:p-8 md:pt-24">
        <div className="flex items-center justify-center py-20">
          <Loader className="animate-spin text-blue-400 mr-3" size={32} />
          <p className="text-base-content/70 text-white">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black p-4 pt-24 md:p-8 md:pt-24">
        <div className="max-w-3xl mx-auto rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
          {error || 'User not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 pt-24 md:p-8 md:pt-24">
      <div className="max-w-6xl mx-auto space-y-8">
        <section className="rounded-xl border border-base-300 bg-base-100/40 p-5 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-secondary text-3xl font-bold text-secondary-content">
                {profile.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="break-words text-3xl font-bold text-white md:text-4xl">{profile.username}</h1>
                <p className="mt-2 break-words text-base-content/70">
                  {isOwnProfile ? 'Your published trading ideas and deployment posts.' : 'Published trading ideas and deployment posts.'}
                </p>
              </div>
            </div>
            {isOwnProfile && (
              <button
                onClick={() => navigate('/settings')}
                className="btn btn-outline btn-secondary w-full sm:w-auto"
              >
                <Edit size={18} />
                Edit Profile
              </button>
            )}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg bg-base-300/50 p-4">
              <p className="text-sm text-base-content/60">Posts</p>
              <p className="text-2xl font-bold text-white">{posts.length}</p>
            </div>
            <div className="rounded-lg bg-base-300/50 p-4">
              <p className="text-sm text-base-content/60">Likes</p>
              <p className="text-2xl font-bold text-emerald-400">{totalLikes}</p>
            </div>
            <div className="rounded-lg bg-base-300/50 p-4">
              <p className="text-sm text-base-content/60">Comments</p>
              <p className="text-2xl font-bold text-blue-400">{totalComments}</p>
            </div>
            <div className="rounded-lg bg-base-300/50 p-4">
              <p className="text-sm text-base-content/60">Avg Return</p>
              <p className={`text-2xl font-bold ${avgReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {avgReturn >= 0 ? '+' : ''}{avgReturn.toFixed(1)}%
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <main className="lg:col-span-8">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold text-white">
                {isOwnProfile ? 'My Posts' : `${profile.username}'s Posts`}
              </h2>
              {posts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(['recent', 'voted', 'return'] as const).map((sort) => (
                    <button
                      key={sort}
                      onClick={() => setSortBy(sort)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        sortBy === sort
                          ? 'bg-secondary text-secondary-content'
                          : 'bg-base-300 text-base-content/70 hover:bg-base-300/80'
                      }`}
                    >
                      {sort === 'recent' && 'Recent'}
                      {sort === 'voted' && 'Top Liked'}
                      {sort === 'return' && 'Best Return'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {sortedPosts.length > 0 ? (
              <div className="space-y-4">
                {sortedPosts.map((post) => {
                  const deployment = post.deployment;
                  const backtest = deployment?.backtest_data?.[0];
                  const totalReturn = Number(backtest?.total_return_pct ?? 0);

                  return (
                    <article
                      key={post.id}
                      onClick={() => navigate(`/post/${post.id}`)}
                      className="cursor-pointer rounded-xl border border-base-300 bg-base-100/40 p-5 transition-colors hover:border-secondary/70 md:p-6"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-xs text-base-content/50">{formatDate(post.created_at)}</p>
                          <h3 className="mt-1 break-words text-xl font-semibold text-white">
                            {deployment?.strategy?.name || 'Strategy Post'}
                          </h3>
                          <p className="mt-1 text-sm text-base-content/60">
                            {deployment?.asset || 'Unknown'} {deployment?.timeframe || ''} • {deployment?.direction || ''}
                          </p>
                        </div>
                        {backtest && (
                          <div className={`shrink-0 rounded-lg border px-3 py-2 text-right ${
                            totalReturn >= 0
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                              : 'border-red-500/30 bg-red-500/10 text-red-300'
                          }`}>
                            <p className="text-xs opacity-70">Return</p>
                            <p className="font-bold">{totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%</p>
                          </div>
                        )}
                      </div>

                      <p className="mt-4 line-clamp-3 whitespace-pre-wrap text-base-content/80">{post.body}</p>

                      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-base-300 pt-4 text-sm text-base-content/70">
                        <span className="flex items-center gap-1">
                          <ThumbsUp size={16} />
                          {post.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle size={16} />
                          {post.comments || 0}
                        </span>
                        {backtest && (
                          <span className="flex items-center gap-1">
                            <BarChart3 size={16} />
                            Sharpe {Number(backtest.sharpe_ratio || 0).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-base-300 bg-base-100/40 p-10 text-center">
                <p className="text-base-content/70">
                  {isOwnProfile ? "You haven't published any posts yet." : `${profile.username} hasn't published any posts yet.`}
                </p>
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/create-post')}
                    className="btn btn-primary mt-6"
                  >
                    Create Your First Post
                  </button>
                )}
              </div>
            )}
          </main>

          <aside className="lg:col-span-4">
            <div className="rounded-xl border border-base-300 bg-base-100/40 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/70">Profile Summary</h3>
              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-xs text-base-content/60">Best Post</p>
                  {bestPost ? (
                    <>
                      <p className="mt-1 font-semibold text-blue-300">{bestPost.deployment?.strategy?.name || 'Strategy Post'}</p>
                      <p className="text-sm text-emerald-400">
                        {postReturn(bestPost) >= 0 ? '+' : ''}{postReturn(bestPost).toFixed(2)}%
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-base-content/50">No posts yet</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-base-content/60">Member</p>
                  <p className="mt-1 text-base-content/80">{profile.email || profile.username}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
