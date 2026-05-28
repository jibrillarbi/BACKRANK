import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, ThumbsUp, MessageCircle } from 'lucide-react';
import { api, type PostDetail } from '../api/index';
import { getCurrentUser } from '../api/useAuth';

export default function PostPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [strategyName, setStrategyName] = useState('');
  const [savingStrategy, setSavingStrategy] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!postId || !currentUser) {
      alert('Please login to like posts');
      return;
    }

    const previousLiked = isLiked;
    const previousVotes = post?.votes || 0;
    
    setIsLiked(!isLiked);
    setPost(prevPost => {
      if (!prevPost) return prevPost;
      return {
        ...prevPost,
        votes: isLiked ? previousVotes - 1 : previousVotes + 1
      };
    });

    try {
      console.log('Toggling like for post:', postId);
      const result = await api.toggleLike(postId);
      console.log('Like result:', result);
      
      // Update with actual server response
      setIsLiked(result.liked);
      setPost(prevPost => {
        if (!prevPost) return prevPost;
        return {
          ...prevPost,
          votes: result.likes
        };
      });
    } catch (err) {
      console.error('Failed to toggle like:', err);
      
      // Revert optimistic update on error
      setIsLiked(previousLiked);
      setPost(prevPost => {
        if (!prevPost) return prevPost;
        return {
          ...prevPost,
          votes: previousVotes
        };
      });
      
      alert('Failed to like post. Please try again.');
    }
  };

  const handlePostComment = async () => {
    if (!commentBody.trim() || !postId || !currentUser) {
      return;
    }

    setSubmittingComment(true);
    try {
      const newComment = await api.createComment(currentUser.uid, postId, commentBody);
      
      // Add comment to the list
      setPost(prevPost => {
        if (!prevPost) return prevPost;
        return {
          ...prevPost,
          commentsList: [...prevPost.commentsList, newComment],
          comments: prevPost.comments + 1
        };
      });
      
      // Clear input
      setCommentBody('');
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSaveStrategy = async () => {
    if (!strategyName.trim() || !post?.strategy) {
      alert('Please enter a strategy name');
      return;
    }

    if (!currentUser) {
      alert('Please login to save strategies');
      return;
    }

    setSavingStrategy(true);
    try {
      const result = await api.saveStrategy({
        name: strategyName,
        entry_rule: post.strategy.entry_rule,
        exit_rule: post.strategy.exit_rule,
        is_published: false,
      });
      console.log('Save strategy response:', result);

      if (result.duplicate && result.strategy) {
        alert(`This strategy already exists as "${result.strategy.name}"`);
      } else if (result.success) {
        alert(`✓ Strategy "${strategyName}" saved to your profile!`);
        setShowSaveModal(false);
        setStrategyName('');
      } else {
        alert('Strategy saved successfully!');
        setShowSaveModal(false);
        setStrategyName('');
      }
    } catch (err) {
      console.error('Failed to save strategy:', err);
      alert(err instanceof Error ? err.message : 'Failed to save strategy');
    } finally {
      setSavingStrategy(false);
    }
  };

  const formatSignedPercent = (value: number | undefined | null) => {
    const numericValue = Number(value ?? 0);
    const sign = numericValue > 0 ? '+' : '';
    return `${sign}${numericValue.toFixed(2)}%`;
  };

  const formatOptionalPercent = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '' || String(value).toLowerCase() === 'none') {
      return null;
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return String(value);
    return `${numericValue.toFixed(2)}%`;
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (!postId) {
          setError('Post ID not found');
          return;
        }

        // Fetch from dedicated post endpoint
        const data = await api.getPost(postId);

        if ('error' in data) {
          setError(data.error);
        } else {
          setPost(data);
          
          // Check if user has already liked this post
          if (currentUser) {
            try {
              const likeData = await api.checkPostLiked(postId);
              setIsLiked(likeData.liked || false);
            } catch (err) {
              console.error('Failed to check like status:', err);
              setIsLiked(false);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch post:', err);
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 p-4 md:p-8 lg:p-12">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost gap-2 mb-6"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <div className="text-center py-16">
            <p className="text-base-content/60">Loading post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-base-100 p-4 md:p-8 lg:p-12">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost gap-2 mb-6"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <div className="alert alert-error">
            <div>
              <span>{error || 'Post not found'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const scoreValue = Number(post.deployment?.score ?? post.score);
  const strategyScore = Number.isFinite(scoreValue) ? scoreValue.toFixed(2) : 'N/A';
  const stopLoss = formatOptionalPercent(post.deployment?.sl);
  const takeProfit = formatOptionalPercent(post.deployment?.tp);

  return (
    <div className="min-h-screen bg-base-100 p-4 md:p-8 lg:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost gap-2 mb-6"
        >
          <ArrowLeft size={20} /> Back
        </button>

        {/* Post Card */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body space-y-6">
            {/* Header */}
            <div>
              <h1 className="card-title text-3xl mb-2">{post.strategyTitle}</h1>
              <p className="text-base-content/60">{post.timestamp}</p>
            </div>

            {/* Author Info */}
            <div className="divider my-0"></div>
            <button
              onClick={() => navigate(`/profile/${post.author.toLowerCase()}`)}
              className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-base-300/60 sm:w-fit"
            >
              <div className="avatar placeholder shrink-0">
                <div className="bg-primary text-primary-content rounded-full w-12">
                  <span className="text-xl">{post.author.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-base-content/50">Posted by</p>
                <p className="font-semibold">{post.author}</p>
              </div>
            </button>

            {/* Strategy Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-base-content/60">Asset</p>
                <p className="font-semibold">{post.asset}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/60">Timeframe</p>
                <p className="font-semibold">{post.timeframe}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/60">Direction</p>
                <p className="font-semibold">{post.deployment?.direction || 'LONG'}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/60">Sizing</p>
                <p className="font-semibold">{post.deployment?.sizing || 'N/A'}%</p>
              </div>
              {stopLoss && (
                <div>
                  <p className="text-xs text-base-content/60">Stop Loss</p>
                  <p className="font-semibold">{stopLoss}</p>
                </div>
              )}
              {takeProfit && (
                <div>
                  <p className="text-xs text-base-content/60">Take Profit</p>
                  <p className="font-semibold">{takeProfit}</p>
                </div>
              )}
            </div>

            {/* Entry/Exit Rules */}
            <div className="divider my-2"></div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Entry Rules</h3>
                <div className="bg-base-100 rounded p-3 border border-base-300">
                  <p className="text-sm font-mono">{post.strategy?.entry_rule || 'No entry rule defined'}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Exit Rules</h3>
                <div className="bg-base-100 rounded p-3 border border-base-300">
                  <p className="text-sm font-mono">{post.strategy?.exit_rule || 'No exit rule defined'}</p>
                </div>
              </div>
            </div>

            {/* Backtest Results */}
            <div className="divider my-2"></div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Backtest Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className={`p-3 rounded border ${
                  (post.backtest?.total_return_pct ?? 0) >= 0
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <p className={`text-xs ${
                    (post.backtest?.total_return_pct ?? 0) >= 0 ? 'text-emerald-300' : 'text-red-300'
                  }`}>Total Return</p>
                  <p className={`text-2xl font-bold ${
                    (post.backtest?.total_return_pct ?? 0) >= 0 ? 'text-emerald-300' : 'text-red-300'
                  }`}>{formatSignedPercent(post.backtest?.total_return_pct)}</p>
                </div>
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <p className="text-xs text-yellow-300">Strategy Score</p>
                  <p className="text-2xl font-bold text-yellow-300">
                    {strategyScore}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                  <p className="text-xs text-blue-300">Sharpe Ratio</p>
                  <p className="text-2xl font-bold text-blue-300">{post.backtest?.sharpe_ratio?.toFixed(2) || 0}</p>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded">
                  <p className="text-xs text-amber-300">Max Drawdown</p>
                  <p className="text-2xl font-bold text-amber-300">{post.backtest?.max_dd?.toFixed(2) || 0}%</p>
                </div>
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                  <p className="text-xs text-green-300">Win Rate</p>
                  <p className="text-2xl font-bold text-green-300">{post.backtest?.win_rate?.toFixed(2) || 0}%</p>
                </div>
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded">
                  <p className="text-xs text-purple-300">Total Trades</p>
                  <p className="text-2xl font-bold text-purple-300">{post.backtest?.total_trades || 0}</p>
                </div>
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded">
                  <p className="text-xs text-cyan-300">Final Capital</p>
                  <p className="text-2xl font-bold text-cyan-300">${post.backtest?.final_capital?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || 0}</p>
                </div>
              </div>
            </div>

            {/* Post Body */}
            <div className="divider my-0"></div>
            <div className="prose prose-sm max-w-none">
              <p className="text-base leading-relaxed">{post.body || 'No description provided'}</p>
            </div>

            {/* Engagement Section */}
            <div className="divider my-0"></div>
            <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-6">
                <button
                  onClick={handleLike}
                  disabled={!currentUser}
                  className={`flex items-center gap-2 font-semibold transition-colors ${
                    isLiked
                      ? 'text-success'
                      : 'text-base-content/60 hover:text-success'
                  } ${!currentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <ThumbsUp 
                    size={20} 
                    fill={isLiked ? 'currentColor' : 'none'}
                    stroke={isLiked ? 'currentColor' : 'currentColor'}
                  /> 
                  {post.votes}
                </button>
                <button className="flex items-center gap-2 font-semibold text-base-content/60 hover:text-info transition-colors">
                  <MessageCircle size={20} /> {post.comments}
                </button>
              </div>
              <button 
                onClick={() => setShowSaveModal(true)}
                className="btn btn-primary w-full sm:w-auto"
                disabled={!currentUser}
              >
                Save Strategy
              </button>
            </div>
          </div>
        </div>

        {/* Save Strategy Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card bg-base-100 shadow-xl max-w-sm w-full">
              <div className="card-body">
                <h2 className="card-title">Save Strategy</h2>
                <p className="text-sm text-base-content/60">Give this strategy a unique name</p>
                
                <div className="form-control mt-4">
                  <label className="label">
                    <span className="label-text">Strategy Name</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g., Momentum Strategy v2" 
                    className="input input-bordered"
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && strategyName.trim()) {
                        handleSaveStrategy();
                      }
                    }}
                  />
                </div>

                <div className="card-actions justify-end mt-6">
                  <button 
                    className="btn btn-ghost"
                    onClick={() => {
                      setShowSaveModal(false);
                      setStrategyName('');
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={handleSaveStrategy}
                    disabled={!strategyName.trim() || savingStrategy}
                  >
                    {savingStrategy ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="mt-8 card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Comments ({post.commentsList?.length || 0})</h2>
            
            {/* Add Comment Form */}
            <div className="form-control mb-6">
              <textarea
                className="textarea textarea-bordered"
                placeholder="Add a comment..."
                rows={3}
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                disabled={!currentUser}
              ></textarea>
              <button 
                className="btn btn-primary btn-sm mt-2 w-fit"
                onClick={handlePostComment}
                disabled={!commentBody.trim() || !currentUser || submittingComment}
              >
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
              {!currentUser && (
                <p className="text-sm text-warning mt-2">Please login to comment</p>
              )}
            </div>

            {/* Comments List */}
            <div className="divider my-2"></div>
            {post.commentsList && post.commentsList.length > 0 ? (
              <div className="space-y-4">
                {post.commentsList.map((comment) => (
                  <div key={comment.id} className="bg-base-100 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{comment.author}</p>
                        <p className="text-xs text-base-content/60">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-base leading-relaxed">{comment.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-base-content/60 text-center py-6">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
