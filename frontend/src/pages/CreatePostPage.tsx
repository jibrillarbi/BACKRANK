import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Send, Loader } from 'lucide-react';
import { api } from '../api/index';

interface Deployment {
  id: number;
  asset: string;
  timeframe: string;
  direction: string;
  sizing: number;
  sl: number | null;
  tp: number | null;
  uid: string;
  strategyName: string;
  backtest_data: Array<{
    total_return_pct: number;
    sharpe_ratio: number;
    max_dd: number;
    win_rate: number;
    total_trades: number;
    final_capital: number;
  }>;
}

interface GroupedDeployments {
  [strategyName: string]: Deployment[];
}

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [groupedDeployments, setGroupedDeployments] = useState<GroupedDeployments>({});
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<number | null>(null);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch all user's deployments on mount
  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        // Get all deployments across all strategies in one call
        const allDeps = await api.getAllDeployments();
        
        // Group by strategy name
        const grouped: GroupedDeployments = {};
        allDeps.forEach((dep: any) => {
          const strategyName = dep.strategy?.name || 'Unknown';
          const deploymentWithStrategy: Deployment = {
            ...dep,
            strategyName
          };
          
          if (!grouped[strategyName]) {
            grouped[strategyName] = [];
          }
          grouped[strategyName].push(deploymentWithStrategy);
        });
        
        setGroupedDeployments(grouped);
      } catch (err: any) {
        console.error('Error fetching deployments:', err);
        setError('Failed to load deployments');
      } finally {
        setLoading(false);
      }
    };

    fetchDeployments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDeploymentId) {
      setError('Please select a deployment');
      return;
    }
    
    if (!body.trim()) {
      setError('Please add a description');
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      await api.addPost(selectedDeploymentId.toString(), body);
      setSuccessMessage('Post shared successfully!');
      setBody('');
      setSelectedDeploymentId(null);
      setTimeout(() => {
        navigate('/explore');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to share post');
    } finally {
      setSubmitting(false);
    }
  };

    const allDeployments = Object.values(groupedDeployments).flat();
    const selectedDeployment = allDeployments.find(d => d.id === selectedDeploymentId);

  return (
    <div className="min-h-screen bg-black text-base-content p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/strategies')}
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-white">Share a Deployment</h1>
            <p className="text-base-content/70">Post your strategy to the community</p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader className="animate-spin text-blue-400 mr-3" size={32} />
            <p className="text-base-content/70 text-white">Loading deployments...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 rounded-lg border bg-red-500/10 border-red-500/30 text-red-300">
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
            {successMessage}
          </div>
        )}

        {/* Form */}
        {!loading && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Deployment Selection */}
            <div className="bg-base-100/50 border border-base-300 rounded-xl p-6 space-y-4">
              <h2 className="text-xl font-semibold text-white">Select Deployment</h2>
              
              {Object.keys(groupedDeployments).length === 0 ? (
                <div className="p-6 text-center text-base-content/70">
                  <p>No deployments yet. Create one on the strategy page.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedDeployments).map(([strategyName, deployments]) => (
                    <div key={strategyName} className="space-y-3">
                      <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">{strategyName}</h3>
                      <div className="space-y-2 pl-4 border-l-2 border-blue-500/30">
                        {deployments.map((deployment) => {
                          const backtest = deployment.backtest_data?.[0];
                          return (
                            <label
                              key={deployment.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                selectedDeploymentId === deployment.id
                                  ? 'bg-blue-500/10 border-blue-500/50'
                                  : 'bg-base-200/20 border-base-300 hover:border-base-300/70'
                              }`}
                            >
                              <input
                                type="radio"
                                name="deployment"
                                value={deployment.id}
                                checked={selectedDeploymentId === deployment.id}
                                onChange={(e) => setSelectedDeploymentId(Number(e.target.value))}
                                className="mr-3"
                              />
                              <span className="font-semibold text-white">{deployment.asset}</span>
                              <span className="text-base-content/60 ml-2">{deployment.timeframe} • {deployment.direction}</span>
                              {backtest && (
                                <span className={`ml-4 font-bold ${
                                  backtest.total_return_pct >= 0 ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                  {backtest.total_return_pct.toFixed(2)}%
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Deployment Preview */}
            {selectedDeployment && selectedDeployment.backtest_data?.[0] && (
              <div className="bg-base-100/50 border border-blue-500/30 rounded-xl p-6 space-y-3">
                <h3 className="text-lg font-semibold text-white">Preview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-base-content/60">Asset</p>
                    <p className="text-lg font-bold text-white">{selectedDeployment.asset}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/60">Return</p>
                    <p className={`text-lg font-bold ${
                      selectedDeployment.backtest_data[0].total_return_pct >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {selectedDeployment.backtest_data[0].total_return_pct.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/60">Win Rate</p>
                    <p className="text-lg font-bold text-blue-400">{selectedDeployment.backtest_data[0].win_rate.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/60">Final Equity</p>
                    <p className={`text-lg font-bold ${
                      selectedDeployment.backtest_data[0].final_capital >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      ${selectedDeployment.backtest_data[0].final_capital.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Body Textarea */}
            <div className="bg-base-100/50 border border-base-300 rounded-xl p-6 space-y-4">
              <h2 className="text-xl font-semibold text-white">Description</h2>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Add a description... Share your strategy insights, why you think it works, market conditions, etc."
                className="w-full h-32 bg-base-200/50 border border-base-300 rounded-lg p-4 text-base-content placeholder-base-content/40 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-xs text-base-content/60">{body.length} characters</p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/strategies')}
                className="px-6 py-3 rounded-lg border border-base-300 hover:border-base-300/70 text-base-content transition-colors font-medium flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedDeploymentId || !body.trim()}
                className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors font-medium disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-1"
              >
                <Send size={18} />
                {submitting ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
