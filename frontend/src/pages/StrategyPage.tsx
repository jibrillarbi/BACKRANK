import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code, Save } from 'lucide-react';
import type { Condition } from '../types/strategy';
import { generateRuleString } from '../utils/strategyHelpers';
import { StrategyBuilder } from '../components/StrategyBuilder';
import { useStrategy } from '../contexts/StrategyContext';

export default function StrategyPage() {
  const navigate = useNavigate();
  const { strategyName: contextName, setRules } = useStrategy();
  const [strategyName, setStrategyName] = useState<string>(contextName || 'My Strategy');
  const [entryConditions, setEntryConditions] = useState<Condition[]>([
    {
      id: 1, logicalOp: null,
      left: { type: 'indicator', source: 'SMA', period: 3, mathOp: '+', mathVal: 3 },
      comp: 'crossesAbove',
      right: { type: 'indicator', source: 'SMA', period: 5 }
    },
    {
      id: 2, logicalOp: '&&',
      left: { type: 'indicator', source: 'RSI', period: 2 },
      comp: '<',
      right: { type: 'number', source: 'Number', value: 95 }
    },
    {
      id: 3, logicalOp: '&&',
      left: { type: 'field', source: 'Volume' },
      comp: '>',
      right: { type: 'indicator', source: 'VMA', period: 3 }
    }
  ]);

  const [exitConditions, setExitConditions] = useState<Condition[]>([
    {
      id: 1, logicalOp: null,
      left: { type: 'field', source: 'Close' },
      comp: '<',
      right: { type: 'indicator', source: 'SMA', period: 3 }
    }
  ]);

  const entryString = generateRuleString(entryConditions);
  const exitString = generateRuleString(exitConditions);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-10">
          <h1 className="text-3xl font-bold bg-linear-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent inline-block mb-2">
            Algo-Strategy Builder
          </h1>
          <p className="text-gray-400 mb-4">Build trading algorithms without writing any code.</p>
          
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 mb-6">
            <label className="text-sm font-medium text-gray-300 block mb-2">Strategy Name</label>
            <input
              type="text"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              placeholder="Enter strategy name..."
              className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </header>

        <StrategyBuilder 
          title="🟢 Entry Rules (Buy)" 
          conditions={entryConditions} 
          setConditions={setEntryConditions} 
        />
        
        <StrategyBuilder 
          title="🔴 Exit Rules (Sell)" 
          conditions={exitConditions} 
          setConditions={setExitConditions} 
        />

        {/* Developer Output Section */}
        <div className="mt-12 bg-black border border-gray-800 rounded-xl overflow-hidden">
          <div className="bg-gray-900 px-5 py-3 border-b border-gray-800 flex items-center gap-2">
            <Code size={18} className="text-emerald-400" />
            <h3 className="font-mono text-sm font-semibold text-gray-300">Generated Python Payload</h3>
          </div>
          <div className="p-5 font-mono text-sm overflow-x-auto text-emerald-300 leading-relaxed">
            <span className="text-gray-500">entry_rule = </span>"{entryString || 'None'}"
            <br />
            <span className="text-gray-500">exit_rule  = </span>"{exitString || 'None'}"
          </div>
        </div>

        {/* Save & Return Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => {
              setRules(strategyName, entryString, exitString);
              navigate('/');
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-900/20"
          >
            <Save size={18} /> Save & Return to Deployment
          </button>
        </div>

      </div>
    </div>
  );
}
