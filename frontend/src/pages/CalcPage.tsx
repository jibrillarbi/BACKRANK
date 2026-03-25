import React, { useState } from 'react';
import { ChessPawn, Clock, Plus, X, Trash2 } from 'lucide-react';

export default function CalcPage() {
  const [tradeSettings, setTradeSettings] = useState({
    ticker: '',
    timeframe: '1d',
    positionSize: '',
    direction: 'long',
    stopLoss: '',
    takeProfit: ''
  });

  const [stopLossEnabled, setStopLossEnabled] = useState(false);
  const [stopLossValue, setStopLossValue] = useState('');
  const [takeProfitEnabled, setTakeProfitEnabled] = useState(false);
  const [takeProfitValue, setTakeProfitValue] = useState('');

  const [entryConditions, setEntryConditions] = useState([]);
  const [entryLogicOps, setEntryLogicOps] = useState([]);

  const addCondition = () => {
    setEntryConditions([...entryConditions, { id: Date.now(), left: '', operator: '>', right: '' }]);
    if (entryConditions.length > 0) {
      setEntryLogicOps([...entryLogicOps, 'AND']);
    }
  };

  const removeCondition = (id) => {
    const index = entryConditions.findIndex(c => c.id === id);
    setEntryConditions(entryConditions.filter(c => c.id !== id));
    setEntryLogicOps(entryLogicOps.filter((_, i) => i !== index - 1));
  };

  const updateCondition = (id, field, value) => {
    setEntryConditions(entryConditions.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  return (
    <div className="grid grid-cols-3 gap-4 h-screen">
      {/* Left col - 1/3 */}
      <div className="col-span-1 bg-white border-r border-slate-200 p-5 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <ChessPawn className="w-6 h-6 text-slate-900" />
          <h1 className="text-2xl font-bold text-slate-900">BackRank</h1>
        </div>
        
        <div className="flex flex-col gap-4 flex-1">
          <div className="bg-white rounded p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Trade Settings</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Ticker</label>
                <select value={tradeSettings.ticker} onChange={(e) => setTradeSettings({...tradeSettings, ticker: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded text-sm bg-white">
                  <option value="">Select ticker</option>
                  <option value="AAPL">AAPL</option>
                  <option value="GOOGL">GOOGL</option>
                  <option value="MSFT">MSFT</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Timeframe</label>
                <select value={tradeSettings.timeframe} onChange={(e) => setTradeSettings({...tradeSettings, timeframe: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded text-sm bg-white">
                  <option value="1d">1 Day</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Position Size (%)</label>
                <input type="number" min="0.1" max="10" step="0.1" value={tradeSettings.positionSize} onChange={(e) => setTradeSettings({...tradeSettings, positionSize: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded text-sm bg-white" placeholder="0.1 - 10" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Direction</label>
                <select value={tradeSettings.direction} onChange={(e) => setTradeSettings({...tradeSettings, direction: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded text-sm bg-white">
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Stop Loss</label>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={stopLossEnabled} onChange={(e) => setStopLossEnabled(e.target.checked)} className="w-4 h-4" />
                  {stopLossEnabled && <input type="number" min="0.1" max="100" step="0.1" value={stopLossValue} onChange={(e) => setStopLossValue(e.target.value)} className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm bg-white" placeholder="Value" />}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Take Profit</label>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={takeProfitEnabled} onChange={(e) => setTakeProfitEnabled(e.target.checked)} className="w-4 h-4" />
                  {takeProfitEnabled && <input type="number" min="0.1" max="100" step="0.1" value={takeProfitValue} onChange={(e) => setTakeProfitValue(e.target.value)} className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm bg-white" placeholder="Value" />}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-green-100 rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-green-700 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Entry Rules
              </span>
              <button onClick={addCondition} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded flex items-center gap-1">
                <Plus className="w-3 h-3" />
                Add Condition
              </button>
            </div>
            <div className="bg-white rounded p-3">
              <div className="space-y-2">
                {entryConditions.map((condition, idx) => (
                  <div key={condition.id}>
                    {idx > 0 && (
                      <div className="flex justify-center mb-2">
                        <select
                          value={entryLogicOps[idx - 1] || 'AND'}
                          onChange={(e) => {
                            const newOps = [...entryLogicOps];
                            newOps[idx - 1] = e.target.value;
                            setEntryLogicOps(newOps);
                          }}
                          className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-300 focus:outline-none"
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-1 bg-white p-2 rounded border border-slate-300">
                      <input
                        type="text"
                        value={condition.left}
                        onChange={(e) => updateCondition(condition.id, 'left', e.target.value)}
                        placeholder="SMA(10)"
                        className="flex-1 min-w-[100px] px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value=">">{'>'}</option>
                        <option value="<">{'<'}</option>
                        <option value="==">=</option>
                        <option value="crossesAbove">Crosses Above</option>
                        <option value="crossesBelow">Crosses Below</option>
                      </select>
                      <input
                        type="text"
                        value={condition.right}
                        onChange={(e) => updateCondition(condition.id, 'right', e.target.value)}
                        placeholder="SMA(12)"
                        className="flex-1 min-w-[100px] px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button onClick={() => removeCondition(condition.id)} className="text-slate-400 hover:text-red-600 ml-auto">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-red-100 rounded p-4 flex items-center gap-2">
            <X className="w-4 h-4 text-red-700" />
            <span className="text-sm font-medium text-red-700">Exit Rules</span>
          </div>
        </div>
      </div>

      {/* Right col - 2/3 */}
      <div className="col-span-2 bg-slate-50 p-5">
        <h2 className="font-bold text-slate-900">Results (2/3)</h2>
        <p className="text-sm text-slate-600 mt-2">This takes up 2 columns</p>
      </div>
    </div>
  );
}