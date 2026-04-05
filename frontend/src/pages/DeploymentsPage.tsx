import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Loader } from 'lucide-react';
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
  backtest_data: Array<{
    total_return_pct: number;
    sharpe_ratio: number;
    max_dd: number;
    win_rate: number;
    total_trades: number;
    final_capital: number;
  }>;
}

export default function DeploymentsPage() {
  const { strategyId } = useParams<{ strategyId: string }>();
  const navigate = useNavigate();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeployments = async () => {
      if (!strategyId) return;
      
      setLoading(true);
      setError(null);
      try {
        const data = await api.getDeployments(strategyId);
        setDeployments(data || []);
      } catch (err: any) {
        console.error('Error fetching deployments:', err);
        setError(err.message || 'Failed to load deployments');
      } finally {
        setLoading(false);
      }
    };

    fetchDeployments();
  }, [strategyId]);

  return (
    <div className="min-h-screen bg-black text-base-content p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/strategies')}
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-white">Strategy Deployments</h1>
            <p className="text-base-content/70">Strategy ID: {strategyId}</p>
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
        {error && !loading && (
          <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-300">Error: {error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && deployments.length === 0 && (
          <div className="text-center py-20">
            <p className="text-base-content/70 text-lg text-white">No deployments yet for this strategy</p>
            <button
              onClick={() => navigate('/strategies')}
              className="btn btn-primary mt-6"
            >
              Back to Strategies
            </button>
          </div>
        )}

        {/* Share Message */}
        

        {/* Deployments Grid */}
        {!loading && deployments.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {deployments.map((deployment) => (
              <div
                key={deployment.id}
                className="bg-base-100/20 border border-base-300 rounded-xl p-6 hover:border-blue-500 transition-colors space-y-6"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-base-content/60">Asset</p>
                    <p className="text-3xl font-bold text-white">{deployment.asset}</p>
                    <p className="text-sm text-base-content/60 mt-1">{deployment.timeframe} • {deployment.direction}</p>
                  </div>
                </div>

                {/* Configuration */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-base-300">
                  <div>
                    <p className="text-xs text-base-content/60 mb-1">Position Size</p>
                    <p className="font-semibold text-white">{deployment.sizing}%</p>
                  </div>
                  {deployment.sl && (
                    <div>
                      <p className="text-xs text-base-content/60 mb-1">Stop Loss</p>
                      <p className="font-semibold text-red-400">{deployment.sl}%</p>
                    </div>
                  )}
                  {deployment.tp && (
                    <div>
                      <p className="text-xs text-base-content/60 mb-1">Take Profit</p>
                      <p className="font-semibold text-green-400">{deployment.tp}%</p>
                    </div>
                  )}
                </div>

                {/* Backtest Results */}
                {deployment.backtest_data?.map((backtest, idx) => {
                  const isProfit = backtest.final_capital >= 0;
                  return (
                    <div key={idx} className="space-y-3">
                      <h3 className="font-semibold text-white mb-3">Backtest Results</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-base-200/50 p-3 rounded-lg">
                          <p className="text-xs text-base-content/60 mb-1">Total Annualised Return</p>
                          <p className={`text-lg font-bold ${backtest.total_return_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {backtest.total_return_pct.toFixed(2)}%
                          </p>
                        </div>
                        <div className="bg-base-200/50 p-3 rounded-lg">
                          <p className="text-xs text-base-content/60 mb-1">Sharpe Ratio</p>
                          <p className="text-lg font-bold text-blue-400">{backtest.sharpe_ratio.toFixed(3)}</p>
                        </div>
                        <div className="bg-base-200/50 p-3 rounded-lg">
                          <p className="text-xs text-base-content/60 mb-1">Max Drawdown</p>
                          <p className="text-lg font-bold text-red-400">{(backtest.max_dd * 100).toFixed(2)}%</p>
                        </div>
                        <div className="bg-base-200/50 p-3 rounded-lg">
                          <p className="text-xs text-base-content/60 mb-1">Win Rate</p>
                          <p className="text-lg font-bold text-blue-400">{backtest.win_rate.toFixed(2)}%</p>
                        </div>
                        <div className="bg-base-200/50 p-3 rounded-lg">
                          <p className="text-xs text-base-content/60 mb-1">Total Trades</p>
                          <p className="text-lg font-bold text-white">{backtest.total_trades}</p>
                        </div>
                        <div className={`rounded-lg p-3 ${
                          isProfit
                            ? 'bg-emerald-500/10 border border-emerald-500/30'
                            : 'bg-red-500/10 border border-red-500/30'
                        }`}>
                          <p className="text-xs text-base-content/60 mb-1">PnL</p>
                          <p className={`text-lg font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                            ${backtest.final_capital.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
