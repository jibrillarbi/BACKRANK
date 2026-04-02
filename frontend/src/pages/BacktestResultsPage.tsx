import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';

interface BacktestData {
  pnl: number;
  avg_returns: number;
  time_in_years: number;
  total_time_in_market_bars: number;
  total_time_in_market_years: number;
  cagr: number;
  max_drawdown: number;
  avg_drawdown: number;
  calmar: number;
  volatility: number;
  sharpe_ratio: number;
  annual_sharpe: number;
  downside_deviation: number;
  sortino: number;
  annual_sortino: number;
  number_of_trades: number;
  win_rate: number;
  avg_win: number;
  avg_loss: number;
  profit_factor: number;
  expectancy: number;
  avg_trade_duration: number;
  exposure: number;
  equity_evolution: number[];
  positions?: string[];
}

interface LocationState {
  results: BacktestData;
  strategy: {
    NAME: string;
    TICKER: string;
    TIMEFRAME: string;
    DIRECTION: string;
    ENTRY: string;
    EXIT: string;
  };
}

const StatCard = ({ label, value, color = 'blue' }: { label: string; value: string | number; color?: 'green' | 'red' | 'blue' | 'amber' }) => {
  const colorClass = {
    green: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    red: 'bg-red-500/10 border-red-500/30 text-red-300',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-300'
  }[color];

  return (
    <div className={`p-4 rounded-lg border ${colorClass}`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

const EquityCurve = ({ data }: { data: number[] }) => {
  if (!data || data.length === 0) return <p className="text-base-content/70">No equity data</p>;

  // Filter out None/null values
  const validData = data.filter(v => v !== null && v !== undefined);
  if (validData.length === 0) return <p className="text-base-content/70">No valid equity data</p>;

  return (
    <div className="max-h-96 overflow-y-auto">
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {validData.map((value, index) => (
          <div key={index} className="p-2 bg-base-200/50 rounded border border-base-300">
            <p className="text-xs text-base-content/70">Bar {index + 1}</p>
            <p className="text-sm font-bold text-blue-300">${(value as number).toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function BacktestResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  if (!state) {
    return (
      <div className="min-h-screen bg-black text-base-content p-8">
        <button
          onClick={() => navigate('/deploy')}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8"
        >
          <ArrowLeft size={20} /> Back to Backtest
        </button>
        <div className="text-center py-12">
          <p className="text-xl text-base-content/70">No results found. Run a backtest first.</p>
        </div>
      </div>
    );
  }

  const { results, strategy } = state;
  const isProfitable = results.pnl >= 0;

  const formatNumber = (num: number, decimals = 2) => {
    if (typeof num !== 'number') return num;
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    });
  };

  const formatCurrency = (num: number) => {
    return '$' + num.toLocaleString('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    });
  };

  return (
    <div className="min-h-screen bg-black text-base-content p-4 md:p-8 lg:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <button
          onClick={() => navigate('/deploy')}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-4"
        >
          <ArrowLeft size={20} /> Back to Backtest
        </button>

        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-4">
            Backtest Results
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            {strategy.NAME}
          </h1>
          <p className="text-base-content/70 text-lg">
            {strategy.TICKER} • {strategy.TIMEFRAME} • {strategy.DIRECTION}
          </p>
        </header>

        {/* Strategy Rules */}
        <div className="bg-base-100/50 border border-base-300 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Strategy Rules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-base-content/70 mb-2">Entry Rule</p>
              <p className="font-mono text-blue-300 bg-base-200/50 p-3 rounded">{strategy.ENTRY}</p>
            </div>
            <div>
              <p className="text-sm text-base-content/70 mb-2">Exit Rule</p>
              <p className="font-mono text-blue-300 bg-base-200/50 p-3 rounded">{strategy.EXIT}</p>
            </div>
          </div>
        </div>

        {/* Equity Curve */}
        <div className="bg-base-100/50 border border-base-300 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Equity Curve</h2>
          <EquityCurve data={results.equity_evolution} />
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            label="Total P&L" 
            value={formatCurrency(results.pnl)} 
            color={isProfitable ? 'green' : 'red'}
          />
          <StatCard 
            label="CAGR" 
            value={`${formatNumber(results.cagr * 100, 2)}%`}
            color={results.cagr >= 0 ? 'green' : 'red'}
          />
          <StatCard 
            label="Sharpe Ratio" 
            value={formatNumber(results.sharpe_ratio, 2)}
            color="blue"
          />
        </div>

        {/* Risk Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard label="Max Drawdown" value={`${formatNumber(results.max_drawdown * 100, 2)}%`} color="red" />
          <StatCard label="Win Rate" value={`${formatNumber(results.win_rate, 1)}%`} color="blue" />
          <StatCard label="Volatility" value={`${formatNumber(results.volatility * 100, 2)}%`} color="amber" />
          <StatCard label="Sortino Ratio" value={formatNumber(results.sortino, 2)} color="blue" />
          <StatCard label="Profit Factor" value={formatNumber(results.profit_factor, 2)} color="green" />
          <StatCard label="Calmar Ratio" value={formatNumber(results.calmar, 2)} color="blue" />
        </div>

        {/* Trade Statistics */}
        <div className="bg-base-100/50 border border-base-300 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <BarChart3 size={24} className="text-blue-400" /> Trade Statistics
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-base-content/70">Number of Trades</p>
              <p className="text-3xl font-bold text-white">{results.number_of_trades}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-base-content/70">Avg Trade Duration</p>
              <p className="text-3xl font-bold text-white">{formatNumber(results.avg_trade_duration, 1)} bars</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-base-content/70">Average Win</p>
              <p className="text-3xl font-bold text-emerald-400">{formatCurrency(results.avg_win)}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-base-content/70">Average Loss</p>
              <p className="text-3xl font-bold text-red-400">{formatCurrency(results.avg_loss)}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-base-content/70">Expectancy</p>
              <p className={`text-3xl font-bold ${results.expectancy >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(results.expectancy)}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-base-content/70">Exposure</p>
              <p className="text-3xl font-bold text-blue-400">{formatNumber(results.exposure, 1)}%</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-base-content/70">Time in Market (Years)</p>
              <p className="text-3xl font-bold text-blue-400">{formatNumber(results.total_time_in_market_years, 3)}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-base-content/70">Time in Market (Bars)</p>
              <p className="text-3xl font-bold text-blue-400">{results.total_time_in_market_bars}</p>
            </div>
          </div>
        </div>

        {/* Returns & Volatility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-base-100/50 border border-base-300 rounded-xl p-6 space-y-4">
            <h3 className="text-xl font-semibold text-white">Returns</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-base-content/70">Average Daily Return</span>
                <span className={`font-semibold ${results.avg_returns >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatNumber(results.avg_returns * 100, 3)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-base-content/70">Annual Return</span>
                <span className={`font-semibold ${results.cagr >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatNumber(results.cagr * 100, 2)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-base-content/70">Total Time Period (Years)</span>
                <span className="font-semibold text-blue-300">{formatNumber(results.time_in_years, 2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-base-100/50 border border-base-300 rounded-xl p-6 space-y-4">
            <h3 className="text-xl font-semibold text-white">Risk Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-base-content/70">Volatility (Std Dev)</span>
                <span className="font-semibold text-amber-400">{formatNumber(results.volatility * 100, 2)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-base-content/70">Max Drawdown</span>
                <span className="font-semibold text-red-400">{formatNumber(results.max_drawdown * 100, 2)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-base-content/70">Avg Drawdown</span>
                <span className="font-semibold text-red-400">{formatNumber(results.avg_drawdown * 100, 2)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Positions */}
        {results.positions && results.positions.length > 0 && (
          <div className="bg-base-100/50 border border-base-300 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">All Positions</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.positions.map((position, index) => {
                // Parse position string to extract pnl and determine color
                const pnlMatch = position.match(/PNL: ([\d.-]+)/);
                const pnl = pnlMatch ? parseFloat(pnlMatch[1]) : 0;
                const pnlColor = pnl >= 0 ? 'text-emerald-400' : 'text-red-400';
                
                return (
                  <div
                    key={index}
                    className="p-4 bg-base-200/50 rounded-lg border border-base-300 hover:border-base-300/50 transition-colors font-mono text-sm"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-base-content">{position}</span>
                      <span className={`font-bold ml-4 whitespace-nowrap ${pnlColor}`}>
                        {formatCurrency(pnl)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end pt-4">
          <button
            onClick={() => navigate('/deploy')}
            className="px-6 py-3 rounded-lg border border-base-300 bg-base-300 text-white hover:bg-base-300 transition-colors font-medium"
          >
            Run Another Backtest
          </button>
          <button
            onClick={() => navigate('/strategy')}
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors font-medium"
          >
            Edit Strategy
          </button>
        </div>

      </div>
    </div>
  );
}
