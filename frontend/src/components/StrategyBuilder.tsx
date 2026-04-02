import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Condition } from '../types/strategy';
import { COMPARISONS } from '../utils/strategyHelpers';
import { DataSelector } from './DataSelector';

interface StrategyBuilderProps {
  title: string;
  conditions: Condition[];
  setConditions: (conds: Condition[]) => void;
}

export const StrategyBuilder: React.FC<StrategyBuilderProps> = ({ title, conditions, setConditions }) => {
  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        id: Date.now(),
        logicalOp: conditions.length === 0 ? null : '&&',
        left: { type: 'field', source: 'Close' },
        comp: '>',
        right: { type: 'indicator', source: 'SMA', period: 14 }
      }
    ]);
  };

  const removeCondition = (id: number) => {
    const newConds = conditions.filter(c => c.id !== id);
    if (newConds.length > 0) newConds[0].logicalOp = null; // first item has no logic op
    setConditions(newConds);
  };

  const updateCondition = (id: number, field: keyof Condition, value: any) => {
    setConditions(conditions.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  return (
    <div className="mb-8 bg-base-200 border border-base-300 rounded-xl overflow-hidden shadow-xl">
      <div className="bg-base-300/50 px-5 py-3 border-b border-base-300 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          {title}
        </h2>
      </div>
      
      <div className="p-5 flex flex-col gap-4">
        {conditions.length === 0 && (
          <div className="text-center py-8 text-base-content/60 text-sm">
            No rules configured yet. Click add to start building.
          </div>
        )}

        {conditions.map((cond, index) => (
          <div key={cond.id} className="flex flex-col md:flex-row items-start md:items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Logical Operator (AND/OR) */}
            <div className="w-20 shrink-0 flex justify-end">
              {index > 0 && (
                <select
                  className="bg-orange-500/10 text-orange-400 font-bold text-sm border border-orange-500/20 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
                  value={cond.logicalOp || '&&'}
                  onChange={(e) => updateCondition(cond.id, 'logicalOp', e.target.value)}
                >
                  <option value="&&">AND</option>
                  <option value="||">OR</option>
                </select>
              )}
            </div>

            <div className="flex-1 flex flex-col lg:flex-row items-center gap-3 bg-base-300/30 p-2 rounded-xl border border-base-300/50">
              {/* Left Side */}
              <DataSelector 
                value={cond.left} 
                onChange={(val) => updateCondition(cond.id, 'left', val)} 
              />

              {/* Comparison Operator */}
              <div className="shrink-0">
                <select
                  className="bg-blue-600/10 text-blue-400 font-medium text-sm border border-blue-600/30 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none w-40 text-center"
                  value={cond.comp}
                  onChange={(e) => updateCondition(cond.id, 'comp', e.target.value)}
                >
                  {COMPARISONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Right Side */}
              <DataSelector 
                value={cond.right} 
                onChange={(val) => updateCondition(cond.id, 'right', val)} 
              />
            </div>

            {/* Remove Button */}
            <button
              onClick={() => removeCondition(cond.id)}
              className="p-3 text-base-content/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
              title="Remove Rule"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        <div className="pl-24 mt-2">
          <button
            onClick={addCondition}
            className="flex items-center gap-2 text-sm font-medium text-base-content bg-base-300 hover:bg-base-300 hover:text-white px-4 py-2 rounded-lg border border-base-300 transition-colors"
          >
            <Plus size={16} /> Add Condition
          </button>
        </div>
      </div>
    </div>
  );
};
