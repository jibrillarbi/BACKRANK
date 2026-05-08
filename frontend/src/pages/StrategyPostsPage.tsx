import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader, Trash2 } from 'lucide-react';
import { api } from '../api/index';

interface StrategyPost {
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

const formatDate = (date: string) => {
  if (!date) return 'Unknown date';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatPercent = (value: number | undefined, decimals = 2) => {
  const number = Number(value ?? 0);
  return `${number >= 0 ? '+' : ''}${number.toFixed(decimals)}%`;
};

export default function StrategyPostsPage() {
  const { strategyId } = useParams<{ strategyId: string }>();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<StrategyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!strategyId) return;

      setLoading(true);
      setError(null);
      try {
        const data = await api.getStrategyPosts(strategyId);
        setPosts(data || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load posts';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [strategyId]);

  const handleDelete = async (postId: number) => {
    const confirmed = window.confirm('Delete this post? This also removes its comments and likes.');
    if (!confirmed) return;

    setDeletingId(postId);
    setError(null);
    try {
      await api.deletePost(postId);
      setPosts((current) => current.filter((post) => post.id !== postId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete post';
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-base-content p-4 pt-24 md:p-8 md:pt-24">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/strategies')}
              className="btn btn-ghost btn-circle"
              aria-label="Back to strategies"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white">Strategy Posts</h1>
              <p className="text-base-content/70">
                Posts linked to deployments for strategy {strategyId}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/create-post')}
            className="btn btn-primary"
          >
            Create Post
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader className="animate-spin text-blue-400 mr-3" size={32} />
            <p className="text-base-content/70 text-white">Loading posts...</p>
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="rounded-xl border border-base-300 bg-base-100/20 p-10 text-center">
            <p className="text-lg text-base-content/70">No posts yet for this strategy.</p>
            <button
              onClick={() => navigate('/create-post')}
              className="btn btn-primary mt-6"
            >
              Share a Deployment
            </button>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => {
              const deployment = post.deployment;
              const backtest = deployment?.backtest_data?.[0];
              const totalReturn = Number(backtest?.total_return_pct ?? 0);
              const score = Number(deployment?.score ?? 0);

              return (
                <div
                  key={post.id}
                  className="rounded-xl border border-base-300 bg-base-100/30 p-6 transition-colors hover:border-blue-500/50"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1 space-y-4">
                      <div>
                        <p className="text-xs text-base-content/50">{formatDate(post.created_at)}</p>
                        <h2 className="mt-1 text-xl font-bold text-white">
                          {deployment?.strategy?.name || 'Strategy Post'}
                        </h2>
                        <p className="mt-1 text-sm text-base-content/60">
                          Deployment #{post.did} • {deployment?.asset || 'Unknown'} {deployment?.timeframe || ''} • {deployment?.direction || ''}
                        </p>
                      </div>

                      <p className="whitespace-pre-wrap text-base-content/90">{post.body}</p>

                      <div className="flex flex-wrap gap-3">
                        <span className="rounded border border-base-300 bg-base-200/40 px-3 py-1 text-xs">
                          {post.likes || 0} likes
                        </span>
                        <span className="rounded border border-base-300 bg-base-200/40 px-3 py-1 text-xs">
                          {post.comments || 0} comments
                        </span>
                        {backtest && (
                          <>
                            <span className={`rounded border px-3 py-1 text-xs ${
                              totalReturn >= 0
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                : 'border-red-500/30 bg-red-500/10 text-red-300'
                            }`}>
                              {formatPercent(totalReturn)} return
                            </span>
                            <span className="rounded border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                              Sharpe {Number(backtest.sharpe_ratio || 0).toFixed(2)}
                            </span>
                            <span className="rounded border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-300">
                              Score {score ? score.toFixed(1) : 'N/A'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 md:flex-col">
                      <button
                        onClick={() => navigate(`/post/${post.id}`)}
                        className="btn btn-sm btn-ghost flex-1 md:flex-none"
                      >
                        <ExternalLink size={16} />
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingId === post.id}
                        className="btn btn-sm flex-1 border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 md:flex-none"
                      >
                        <Trash2 size={16} />
                        {deletingId === post.id ? 'Deleting...' : 'Delete'}
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
