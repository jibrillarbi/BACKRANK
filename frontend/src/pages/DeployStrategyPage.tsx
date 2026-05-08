import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Settings2, 
  ShieldAlert, 
  LineChart, 
  Clock, 
  DollarSign, 
  Percent,
  PlayCircle,
  ChevronDown
} from 'lucide-react';
import { useStrategy } from '../contexts/StrategyContext';
import { api, type StrategyBacktest, type Strategy as SavedStrategy } from '../api';
import { getCurrentUser } from '../api/useAuth';

// Mock data for the dropdowns
const WATCHLIST_TICKERS = ['AAPL', 'MSFT', 'TSLA', 'NVDA'];
const TIMEFRAMES = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '1D', label: '1 Day' }
];


const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-950 ${
      checked ? 'bg-blue-600' : 'bg-base-300'
    }`}
  >
    <span
      className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export default function DeployStrategyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { strategyName: contextStrategyName, entryRule, exitRule } = useStrategy();
  const routeStrategy = (location.state as { strategy?: SavedStrategy } | null)?.strategy;
  const activeStrategyName = routeStrategy?.name || contextStrategyName || 'My Strategy';
  const activeEntryRule = routeStrategy?.entry_rule || entryRule;
  const activeExitRule = routeStrategy?.exit_rule || exitRule;
  
  useEffect(() => {
    const user = getCurrentUser();
    if (user?.email) {
      console.log('User email:', user.email);
    }
  }, []);
  
  // Form State
  const [ticker, setTicker] = useState<string>('AAPL');
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  
  const [positionSize, setPositionSize] = useState<number>(5);
  
  const [useStopLoss, setUseStopLoss] = useState<boolean>(false);
  const [stopLossPct, setStopLossPct] = useState<number>(2);
  
  const [useTakeProfit, setUseTakeProfit] = useState<boolean>(false);
  const [takeProfitPct, setTakeProfitPct] = useState<number>(6);

  // Backtest State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunBacktest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const strategy: StrategyBacktest = {
        NAME: activeStrategyName,
        ENTRY: activeEntryRule,
        EXIT: activeExitRule,
        DIRECTION: direction,
        TIMEFRAME: timeframe,
        TICKER: ticker,
        SIZE: `${positionSize}`,
        SL: useStopLoss ? `${stopLossPct}` : 'None',
        TP: useTakeProfit ? `${takeProfitPct}` : 'None'
      };
      
      const data = await api.runBacktest(strategy);
      console.log(' BACKTEST RESULTS:');
      console.log(JSON.stringify(data, null, 2));
      
      // Navigate to results page with data
      navigate('/backtest-results', { 
        state: { 
          results: data,
          strategy: strategy
        } 
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to run backtest';
      setError(message);
      console.error(err);
      alert(` Backtest failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-base-content p-4 md:p-8 lg:p-12 font-sans selection:bg-blue-500/30">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">
            Deployment Setup
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Launch Strategy
          </h1>
          <p className="text-base-content/70 text-lg leading-relaxed">
            Configure market parameters, position sizing, and risk management for your selected algorithm.
          </p>
        </header>

        {/* Selected Strategy Summary */}
        <div className="bg-blue-950/20 border border-blue-900/50 rounded-xl overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                <Settings2 size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-400/80 mb-1">Active Strategy</p>
                <h3 className="text-xl font-bold text-blue-100">{activeStrategyName || 'Trend Follower Alpha'}</h3>
                {activeEntryRule && (
                  <p className="text-xs text-blue-300/70 mt-2">
                    Entry: <span className="font-mono text-blue-300">{activeEntryRule.substring(0, 50)}...</span>
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={() => navigate('/strategy/edit')}
              className="px-4 py-2 border border-blue-800/50 rounded-md text-sm font-medium text-blue-300 hover:bg-blue-900/30 transition-colors"
            >
              Edit Logic
            </button>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="bg-base-100/50 border border-base-300 rounded-xl shadow-xl overflow-hidden">
          
          <div className="border-b border-base-300/50 bg-base-200/20 px-6 py-5">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <LineChart className="text-emerald-400" size={20} />
              Market Parameters
            </h2>
            <p className="text-sm text-base-content/70 mt-1">
              Define where and how frequently this strategy trades.
            </p>
          </div>
          
          <div className="p-6 space-y-8">
            
            {/* Ticker & Timeframe Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 relative">
                <label className="text-sm font-medium text-base-content flex items-center gap-2">
                  <LineChart size={16} className="text-base-content/60" /> Target Asset
                </label>
                <div className="relative">
                  <select 
                    value={ticker} 
                    onChange={(e) => setTicker(e.target.value)}
                    className="w-full appearance-none bg-base-200 border border-base-300 text-base-content rounded-md px-4 h-12 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <optgroup label="Your Watchlist">
                      {WATCHLIST_TICKERS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-base-content/60 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-3 relative">
                <label className="text-sm font-medium text-base-content flex items-center gap-2">
                  <Clock size={16} className="text-base-content/60" /> Timeframe (Candle Size)
                </label>
                <div className="relative">
                  <select 
                    value={timeframe} 
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="w-full appearance-none bg-base-200 border border-base-300 text-base-content rounded-md px-4 h-12 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {TIMEFRAMES.map(tf => (
                      <option key={tf.value} value={tf.value}>{tf.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-base-content/60 pointer-events-none" />
                </div>
              </div>
            </div>

            <hr className="border-base-300/60" />

            {/* Direction */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-base-content block">Direction</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setDirection('LONG')}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                    direction === 'LONG'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-base-300 text-base-content hover:bg-base-300'
                  }`}
                >
                  📈 LONG
                </button>
                <button
                  onClick={() => setDirection('SHORT')}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                    direction === 'SHORT'
                      ? 'bg-red-600 text-white'
                      : 'bg-base-300 text-base-content hover:bg-base-300'
                  }`}
                >
                  📉 SHORT
                </button>
              </div>
            </div>

            <hr className="border-base-300/60" />

            {/* Position Sizing */}
            <div className="space-y-4">
              <label className="font-semibold text-base-content flex items-center gap-2 text-lg">
                <DollarSign size={20} className="text-emerald-400" /> Position Sizing
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={positionSize}
                  onChange={(e) => setPositionSize(parseFloat(e.target.value) || 0)}
                  className="w-full bg-base-200 border border-base-300 text-base-content rounded-md px-4 pr-12 h-12 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={0}
                  max={100}
                />
                <span className="absolute right-4 top-3.5 text-base-content/70 font-medium text-lg">%</span>
              </div>
              <p className="text-sm text-base-content/60">
                Allocates {positionSize}% of your total available portfolio balance per trade.
              </p>
            </div>

            <hr className="border-base-300/60" />

            {/* Risk Management */}
            <div className="space-y-6">
              <label className="font-semibold text-base-content flex items-center gap-2 text-lg">
                <ShieldAlert size={20} className="text-amber-400" /> Risk Management (Optional)
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Stop Loss Card */}
                <div className={`p-4 rounded-xl border transition-colors ${useStopLoss ? 'bg-red-500/5 border-red-500/20' : 'bg-base-200/30 border-base-300'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-base-content flex items-center gap-2 cursor-pointer" onClick={() => setUseStopLoss(!useStopLoss)}>
                      Stop Loss
                    </label>
                    <ToggleSwitch checked={useStopLoss} onChange={setUseStopLoss} />
                  </div>
                  
                  {useStopLoss && (
                    <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="relative">
                        <input 
                          type="number" 
                          min={0}
                          step="0.01"
                          inputMode="decimal"
                          value={stopLossPct}
                          onChange={(e) => setStopLossPct(parseFloat(e.target.value) || 0)}
                          className="w-full bg-base-100 border border-red-900/50 text-base-content rounded-md pl-3 pr-10 h-10 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <Percent className="absolute right-3 top-2.5 h-5 w-5 text-base-content/60 pointer-events-none" />
                      </div>
                      <p className="text-xs text-red-400/80 mt-2">
                        Closes position if price drops {stopLossPct}% from entry.
                      </p>
                    </div>
                  )}
                </div>

                {/* Take Profit Card */}
                <div className={`p-4 rounded-xl border transition-colors ${useTakeProfit ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-base-200/30 border-base-300'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-base-content flex items-center gap-2 cursor-pointer" onClick={() => setUseTakeProfit(!useTakeProfit)}>
                      Take Profit
                    </label>
                    <ToggleSwitch checked={useTakeProfit} onChange={setUseTakeProfit} />
                  </div>
                  
                  {useTakeProfit && (
                    <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="relative">
                        <input 
                          type="number" 
                          min={0}
                          step="0.01"
                          inputMode="decimal"
                          value={takeProfitPct}
                          onChange={(e) => setTakeProfitPct(parseFloat(e.target.value) || 0)}
                          className="w-full bg-base-100 border border-emerald-900/50 text-base-content rounded-md pl-3 pr-10 h-10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <Percent className="absolute right-3 top-2.5 h-5 w-5 text-base-content/60 pointer-events-none" />
                      </div>
                      <p className="text-xs text-emerald-400/80 mt-2">
                        Secures gains if price rises {takeProfitPct}% from entry.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
          
          <div className="bg-base-200/40 border-t border-base-300 px-6 py-5">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-300 text-sm">
                {error}
              </div>
            )}
            {!entryRule || !exitRule ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300">
                <p className="font-medium">⚠️ No strategy has been selected</p>
                <p className="text-sm mt-1">Please create or select a strategy first using the Backtest button in the navbar.</p>
              </div>
            ) : (
              <div className="flex items-center justify-end">
                <button 
                  onClick={handleRunBacktest}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlayCircle size={18} /> {loading ? 'Running Backtest...' : 'Run Backtest'}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
