import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Rocket, 
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

// Mock data for the dropdowns
const WATCHLIST_TICKERS = ['AAPL', 'MSFT', 'TSLA', 'NVDA'];
const TIMEFRAMES = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1D', label: '1 Day' }
];


const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-950 ${
      checked ? 'bg-blue-600' : 'bg-gray-700'
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
  const { strategyName: contextStrategyName, entryRule, exitRule } = useStrategy();
  // Form State
  const [ticker, setTicker] = useState<string>('AAPL');
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  
  const [positionSize, setPositionSize] = useState<number>(5);
  
  const [useStopLoss, setUseStopLoss] = useState<boolean>(false);
  const [stopLossPct, setStopLossPct] = useState<number>(2);
  
  const [useTakeProfit, setUseTakeProfit] = useState<boolean>(false);
  const [takeProfitPct, setTakeProfitPct] = useState<number>(6);

  const handleDeploy = () => {
    const payload = {
      NAME: contextStrategyName || 'My strategy',
      ENTRY: entryRule,
      EXIT: exitRule,
      DIRECTION: direction,
      TIMEFRAME: timeframe,
      TICKER: ticker,
      SIZE: `${positionSize}`,
      SL: useStopLoss ? `${stopLossPct}` : 'None',
      TP: useTakeProfit ? `${takeProfitPct}` : 'None'
    };
    console.log("📊 DEPLOYMENT CONFIG:");
    console.log(JSON.stringify(payload, null, 2));
    alert("Strategy deployed! Check console for config.");
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 p-4 md:p-8 lg:p-12 font-sans selection:bg-blue-500/30">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">
            Deployment Setup
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Launch Strategy
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
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
                <h3 className="text-xl font-bold text-blue-100">{contextStrategyName || 'Trend Follower Alpha'}</h3>
                {entryRule && (
                  <p className="text-xs text-blue-300/70 mt-2">
                    Entry: <span className="font-mono text-blue-300">{entryRule.substring(0, 50)}...</span>
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={() => navigate('/strategy')}
              className="px-4 py-2 border border-blue-800/50 rounded-md text-sm font-medium text-blue-300 hover:bg-blue-900/30 transition-colors"
            >
              Edit Logic
            </button>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="bg-gray-950/50 border border-gray-800 rounded-xl shadow-xl overflow-hidden">
          
          <div className="border-b border-gray-800/50 bg-gray-900/20 px-6 py-5">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <LineChart className="text-emerald-400" size={20} />
              Market Parameters
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Define where and how frequently this strategy trades.
            </p>
          </div>
          
          <div className="p-6 space-y-8">
            
            {/* Ticker & Timeframe Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 relative">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <LineChart size={16} className="text-gray-500" /> Target Asset
                </label>
                <div className="relative">
                  <select 
                    value={ticker} 
                    onChange={(e) => setTicker(e.target.value)}
                    className="w-full appearance-none bg-gray-900 border border-gray-700 text-gray-100 rounded-md px-4 h-12 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <optgroup label="Your Watchlist">
                      {WATCHLIST_TICKERS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-3 relative">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Clock size={16} className="text-gray-500" /> Timeframe (Candle Size)
                </label>
                <div className="relative">
                  <select 
                    value={timeframe} 
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="w-full appearance-none bg-gray-900 border border-gray-700 text-gray-100 rounded-md px-4 h-12 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {TIMEFRAMES.map(tf => (
                      <option key={tf.value} value={tf.value}>{tf.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            <hr className="border-gray-800/60" />

            {/* Direction */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300 block">Direction</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setDirection('LONG')}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                    direction === 'LONG'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  📈 LONG
                </button>
                <button
                  onClick={() => setDirection('SHORT')}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                    direction === 'SHORT'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  📉 SHORT
                </button>
              </div>
            </div>

            <hr className="border-gray-800/60" />

            {/* Position Sizing */}
            <div className="space-y-4">
              <label className="font-semibold text-gray-300 flex items-center gap-2 text-lg">
                <DollarSign size={20} className="text-emerald-400" /> Position Sizing
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={positionSize}
                  onChange={(e) => setPositionSize(parseFloat(e.target.value) || 0)}
                  className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-md px-4 pr-12 h-12 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={0}
                  max={100}
                />
                <span className="absolute right-4 top-3.5 text-gray-400 font-medium text-lg">%</span>
              </div>
              <p className="text-sm text-gray-500">
                Allocates {positionSize}% of your total available portfolio balance per trade.
              </p>
            </div>

            <hr className="border-gray-800/60" />

            {/* Risk Management */}
            <div className="space-y-6">
              <label className="font-semibold text-gray-300 flex items-center gap-2 text-lg">
                <ShieldAlert size={20} className="text-amber-400" /> Risk Management (Optional)
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Stop Loss Card */}
                <div className={`p-4 rounded-xl border transition-colors ${useStopLoss ? 'bg-red-500/5 border-red-500/20' : 'bg-gray-900/30 border-gray-800'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2 cursor-pointer" onClick={() => setUseStopLoss(!useStopLoss)}>
                      Stop Loss
                    </label>
                    <ToggleSwitch checked={useStopLoss} onChange={setUseStopLoss} />
                  </div>
                  
                  {useStopLoss && (
                    <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="relative">
                        <input 
                          type="number" 
                          value={stopLossPct}
                          onChange={(e) => setStopLossPct(parseFloat(e.target.value) || 0)}
                          className="w-full bg-gray-950 border border-red-900/50 text-gray-100 rounded-md pl-3 pr-10 h-10 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <Percent className="absolute right-3 top-2.5 h-5 w-5 text-gray-500 pointer-events-none" />
                      </div>
                      <p className="text-xs text-red-400/80 mt-2">
                        Closes position if price drops {stopLossPct}% from entry.
                      </p>
                    </div>
                  )}
                </div>

                {/* Take Profit Card */}
                <div className={`p-4 rounded-xl border transition-colors ${useTakeProfit ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-gray-900/30 border-gray-800'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2 cursor-pointer" onClick={() => setUseTakeProfit(!useTakeProfit)}>
                      Take Profit
                    </label>
                    <ToggleSwitch checked={useTakeProfit} onChange={setUseTakeProfit} />
                  </div>
                  
                  {useTakeProfit && (
                    <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="relative">
                        <input 
                          type="number" 
                          value={takeProfitPct}
                          onChange={(e) => setTakeProfitPct(parseFloat(e.target.value) || 0)}
                          className="w-full bg-gray-950 border border-emerald-900/50 text-gray-100 rounded-md pl-3 pr-10 h-10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <Percent className="absolute right-3 top-2.5 h-5 w-5 text-gray-500 pointer-events-none" />
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
          
          <div className="bg-gray-900/40 border-t border-gray-800 px-6 py-5 flex items-center justify-between">
            <button className="px-4 py-2 rounded-md text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
            <div className="flex gap-3">
              <button className="px-4 py-2 rounded-md text-sm font-medium border border-gray-700 bg-gray-800 text-white hover:bg-gray-700 transition-colors flex items-center gap-2">
                <PlayCircle size={16} /> Run Backtest
              </button>
              <button 
                onClick={handleDeploy} 
                className="px-5 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-colors flex items-center gap-2"
              >
                <Rocket size={16} /> Deploy to Live
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}