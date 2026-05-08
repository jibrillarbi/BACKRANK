import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, BarChart3, Loader, MessageSquare, Trophy } from 'lucide-react';
import { api } from '../api/index';

interface BacktestData {
  id?: number;
  total_return_pct: number;
  sharpe_ratio: number;
  max_dd: number;
  win_rate: number;
  total_trades: number;
  final_capital: number;
  profit_factor?: number;
  deployment_score?: number;
}

interface Deployment {
  id: number;
  asset: string;
  timeframe: string;
  direction: string;
  sizing: number | string;
  sl: number | string | null;
  tp: number | string | null;
  uid: string;
  sid?: string;
  score?: number | null;
  is_published?: boolean;
  strategy?: {
    name?: string;
  };
  backtest_data: BacktestData[];
}

const formatNumber = (value: number | string | null | undefined, decimals = 2) => {
  const num = Number(value ?? 0);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formatPercent = (value: number | string | null | undefined, decimals = 2) => {
  return `${formatNumber(value, decimals)}%`;
};

const formatCurrency = (value: number | string | null | undefined) => {
  const num = Number(value ?? 0);
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
};

const bestBacktest = (deployment: Deployment) => deployment.backtest_data?.[0] ?? null;

const StatBox = ({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'green' | 'red' | 'blue' | 'yellow' | 'neutral';
}) => {
  const toneClass = {
    green: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
    red: 'text-red-300 border-red-500/30 bg-red-500/10',
    blue: 'text-blue-300 border-blue-500/30 bg-blue-500/10',
    yellow: 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10',
    neutral: 'text-base-content border-base-300 bg-base-200/40',
  }[tone];

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <p className="text-xs opacity-70 mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
};

export default function DeploymentsPage() {
  const { strategyId } = useParams<{ strategyId: string }>();
  const navigate = useNavigate();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeployments = async () => {
      if (!strategyId) return;
      
      setLoading(true);
      setError(null);
      try {
        const data = await api.getDeployments(strategyId);
        const fetched = data || [];
        setDeployments(fetched);
        setSelectedDeployment(fetched[0] ?? null);
      } catch (err: any) {
        console.error('Error fetching deployments:', err);
        setError(err.message || 'Failed to load deployments');
      } finally {
        setLoading(false);
      }
    };

    fetchDeployments();
  }, [strategyId]);

  const selectedBacktest = selectedDeployment ? bestBacktest(selectedDeployment) : null;
  const selectedReturn = Number(selectedBacktest?.total_return_pct ?? 0);
  const selectedPnl = Number(selectedBacktest?.final_capital ?? 0);
  const selectedScore = Number(selectedDeployment?.score ?? selectedBacktest?.deployment_score ?? 0);

  return (
    <div className="min-h-screen bg-black text-base-content p-4 pt-24 md:p-8 md:pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/strategies')}
            className="btn btn-ghost btn-circle"
            aria-label="Back to strategies"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-white">Strategy Deployments</h1>
            <p className="text-base-content/70">
              {deployments.length} {deployments.length === 1 ? 'deployment' : 'deployments'} for strategy {strategyId}
            </p>
          </div>
          <button
            onClick={() => navigate(`/strategies/${strategyId}/posts`)}
            className="btn btn-primary ml-auto hidden md:flex"
          >
            <MessageSquare size={16} />
            View Posts
          </button>
        </div>
        <button
          onClick={() => navigate(`/strategies/${strategyId}/posts`)}
          className="btn btn-primary w-full md:hidden"
        >
          <MessageSquare size={16} />
          View Posts
        </button>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader className="animate-spin text-blue-400 mr-3" size={32} />
            <p className="text-base-content/70 text-white">Loading deployments...</p>
          </div>
        )}

        {error && !loading && (
          <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-300">Error: {error}</p>
          </div>
        )}

        {!loading && !error && deployments.length === 0 && (
          <div className="text-center py-20 border border-base-300 rounded-xl bg-base-100/20">
            <p className="text-base-content/70 text-lg text-white">No deployments yet for this strategy</p>
            <button
              onClick={() => navigate('/strategy')}
              className="btn btn-primary mt-6"
            >
              Run a Backtest
            </button>
          </div>
        )}

        {!loading && deployments.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <div className="xl:col-span-2 space-y-4">
              {deployments.map((deployment) => {
                const backtest = bestBacktest(deployment);
                const isSelected = selectedDeployment?.id === deployment.id;
                const score = Number(deployment.score ?? backtest?.deployment_score ?? 0);
                const totalReturn = Number(backtest?.total_return_pct ?? 0);

                return (
                  <button
                    type="button"
                    key={deployment.id}
                    onClick={() => setSelectedDeployment(deployment)}
                    className={`w-full text-left rounded-xl border p-5 transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-base-300 bg-base-100/20 hover:border-blue-500/60 hover:bg-base-100/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-base-content/60">Deployment #{deployment.id}</p>
                        <h2 className="text-2xl font-bold text-white mt-1">{deployment.asset}</h2>
                        <p className="text-sm text-base-content/60 mt-1">
                          {deployment.timeframe} • {deployment.direction}
                        </p>
                      </div>
                      {deployment.is_published && (
                        <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300">
                          Published
                        </span>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-base-content/50">Score</p>
                        <p className="font-bold text-yellow-300">{score ? score.toFixed(1) : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-base-content/50">Return</p>
                        <p className={`font-bold ${totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-base-content/50">Trades</p>
                        <p className="font-bold text-white">{backtest?.total_trades ?? 0}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="xl:col-span-3">
              {selectedDeployment && (
                <div className="rounded-xl border border-base-300 bg-base-100/30 p-6 space-y-8">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <p className="text-sm text-base-content/60">Selected Deployment</p>
                      <h2 className="text-3xl font-bold text-white mt-1">
                        {selectedDeployment.asset} • {selectedDeployment.timeframe}
                      </h2>
                      <p className="text-base-content/70 mt-2">
                        {selectedDeployment.direction} strategy using {selectedDeployment.sizing}% position sizing
                      </p>
                    </div>
                    <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-yellow-300">
                        <Trophy size={18} />
                        <p className="text-xs uppercase tracking-wide">Score</p>
                      </div>
                      <p className="text-3xl font-bold text-yellow-300 mt-1">
                        {selectedScore ? selectedScore.toFixed(1) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <BarChart3 size={20} className="text-blue-400" />
                      Backtest Stats
                    </h3>
                    {selectedBacktest ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatBox
                          label="Total Annualised Return"
                          value={`${selectedReturn >= 0 ? '+' : ''}${formatPercent(selectedReturn)}`}
                          tone={selectedReturn >= 0 ? 'green' : 'red'}
                        />
                        <StatBox
                          label="Sharpe Ratio"
                          value={formatNumber(selectedBacktest.sharpe_ratio, 3)}
                          tone="blue"
                        />
                        <StatBox
                          label="Max Drawdown"
                          value={formatPercent(Number(selectedBacktest.max_dd) * 100)}
                          tone="red"
                        />
                        <StatBox
                          label="Win Rate"
                          value={formatPercent(selectedBacktest.win_rate)}
                          tone="blue"
                        />
                        <StatBox
                          label="Total Trades"
                          value={formatNumber(selectedBacktest.total_trades, 0)}
                          tone="neutral"
                        />
                        <StatBox
                          label="PnL / Final Capital"
                          value={formatCurrency(selectedPnl)}
                          tone={selectedPnl >= 0 ? 'green' : 'red'}
                        />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-base-300 bg-base-200/40 p-6 text-base-content/70">
                        No backtest stats were stored for this deployment.
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <StatBox label="Asset" value={selectedDeployment.asset} />
                      <StatBox label="Timeframe" value={selectedDeployment.timeframe} />
                      <StatBox label="Direction" value={selectedDeployment.direction} />
                      <StatBox label="Position Size" value={formatPercent(selectedDeployment.sizing)} />
                      <StatBox label="Stop Loss" value={selectedDeployment.sl ? formatPercent(selectedDeployment.sl) : 'None'} tone="red" />
                      <StatBox label="Take Profit" value={selectedDeployment.tp ? formatPercent(selectedDeployment.tp) : 'None'} tone="green" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
