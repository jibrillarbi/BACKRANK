import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Code, Save, ChevronRight, AlertCircle, X } from 'lucide-react';
import type { Condition } from '../types/strategy';
import type { Strategy } from '../api/index';
import { generateRuleString } from '../utils/strategyHelpers';
import { StrategyBuilder } from '../components/StrategyBuilder';
import { useStrategy } from '../contexts/StrategyContext';
import { useGetStrategies } from '../api/useAuth';

export default function StrategyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { strategyName: contextName, setRules, entryConditions: contextEntryConditions, exitConditions: contextExitConditions, setConditions } = useStrategy();
  const { data: savedStrategies, isLoading: strategiesLoading } = useGetStrategies();
  const routeStrategy = (location.state as { strategy?: Strategy } | null)?.strategy;
  
  const [strategyName, setStrategyName] = useState<string>(routeStrategy?.name || contextName || '');
  const [showSaved, setShowSaved] = useState(false);
  const [loadedStrategy] = useState<Strategy | null>(routeStrategy || null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [entryConditions, setEntryConditions] = useState<Condition[]>(contextEntryConditions);
  const [exitConditions, setExitConditions] = useState<Condition[]>(contextExitConditions);

  const handleLoadStrategy = (strategy: Strategy) => {
    setRules(strategy.name, strategy.entry_rule, strategy.exit_rule);
    navigate('/strategy');
  };

  const validateStrategy = (): boolean => {
    const errors: string[] = [];

    if (!strategyName.trim()) {
      errors.push('Strategy name cannot be empty');
    }

    if (strategyName.length > 50) {
      errors.push('Strategy name must be 50 characters or less');
    }

    if (!loadedStrategy && savedStrategies?.some(s => s.strategy.name === strategyName)) {
      errors.push(`Strategy "${strategyName}" already exists`);
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSaveStrategy = () => {
    if (!validateStrategy()) return;

    const finalEntryRule = loadedStrategy ? loadedStrategy.entry_rule : entryString;
    const finalExitRule = loadedStrategy ? loadedStrategy.exit_rule : exitString;
    setRules(strategyName, finalEntryRule, finalExitRule);
    setConditions(entryConditions, exitConditions);
    navigate('/strategy');
  };

  const entryString = generateRuleString(entryConditions);
  const exitString = generateRuleString(exitConditions);

  return (
    <div className="min-h-screen bg-base-100 text-base-content p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-10">
          <h1 className="text-3xl font-bold bg-linear-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent inline-block mb-2">
            Algo-Strategy Builder
          </h1>
          <p className="text-base-content/70 mb-4">Build trading algorithms without writing any code.</p>
        </header>

        {/* Saved Strategies Section */}
        {savedStrategies && savedStrategies.length > 0 && (
          <div className="mb-10 bg-base-200/30 border border-base-300 rounded-lg p-6">
            <div
              onClick={() => setShowSaved(!showSaved)}
              className="flex items-center justify-between cursor-pointer mb-4"
            >
              <h2 className="text-xl font-semibold text-white">My Saved Strategies ({savedStrategies.length})</h2>
              <ChevronRight size={20} className={`transition-transform ${showSaved ? 'rotate-90' : ''}`} />
            </div>
            
            {showSaved && (
              <div className="space-y-2">
                {strategiesLoading ? (
                  <p className="text-base-content/70">Loading strategies...</p>
                ) : (
                  savedStrategies.map((item) => (
                    <div
                      key={item.strategy.name}
                      className="flex items-center justify-between p-4 bg-base-300/50 border border-base-300 rounded-lg hover:bg-base-300 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-white">{item.strategy.name}</p>
                        <p className="text-sm text-base-content/70 truncate">Entry: {item.strategy.entry_rule}</p>
                        <p className="text-sm text-base-content/70 truncate">Exit: {item.strategy.exit_rule}</p>
                      </div>
                      <button
                        onClick={() => handleLoadStrategy(item.strategy)}
                        className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                      >
                        Use This
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Strategy Builder */}
        <div className="bg-base-300/30 border border-base-300 rounded-lg p-4 mb-6">
            <label className="text-sm font-medium text-base-content block mb-2">Strategy Name</label>
            <input
              type="text"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              placeholder="Enter strategy name..."
              className="w-full bg-base-200 border border-base-300 text-base-content rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        
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
        <div className="mt-12 bg-black border border-base-300 rounded-xl overflow-hidden">
          <div className="bg-base-200 px-5 py-3 border-b border-base-300 flex items-center gap-2">
            <Code size={18} className="text-emerald-400" />
            <h3 className="font-mono text-sm font-semibold text-base-content">
              {loadedStrategy ? 'Loaded Strategy Rules' : 'Generated Python Payload'}
            </h3>
          </div>
          <div className="p-5 font-mono text-sm overflow-x-auto text-emerald-300 leading-relaxed">
            {loadedStrategy ? (
              <>
                <span className="text-base-content/60">entry_rule = </span>"{loadedStrategy.entry_rule}"
                <br />
                <span className="text-base-content/60">exit_rule  = </span>"{loadedStrategy.exit_rule}"
              </>
            ) : (
              <>
                <span className="text-base-content/60">entry_rule = </span>"{entryString || 'None'}"
                <br />
                <span className="text-base-content/60">exit_rule  = </span>"{exitString || 'None'}"
              </>
            )}
          </div>
        </div>

        {/* Validation Error Modal */}
        {validationErrors.length > 0 && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-base-100 border border-base-300 rounded-lg shadow-2xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b border-base-300 bg-red-900/20">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-red-500" size={24} />
                  <h2 className="text-lg font-semibold text-white">Validation Error</h2>
                </div>
                <button
                  onClick={() => setValidationErrors([])}
                  className="text-base-content/60 hover:text-base-content transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <ul className="space-y-3">
                  {validationErrors.map((error, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-base-content/80">
                      <span className="text-red-400 mt-1">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="p-6 border-t border-base-300 flex justify-end">
                <button
                  onClick={() => setValidationErrors([])}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save & Return Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSaveStrategy}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-900/20"
          >
            <Save size={18} /> Save & Return to Deployment
          </button>
        </div>

      </div>
    </div>
  );
}
