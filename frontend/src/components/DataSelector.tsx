import React from 'react';
import { Activity, Database, Hash, Calculator } from 'lucide-react';
import type { Entity } from '../types/strategy';
import { FIELDS, INDICATORS, MATH_OPS } from '../utils/strategyHelpers';

interface DataSelectorProps {
  value: Entity;
  onChange: (val: Entity) => void;
}

export const DataSelector: React.FC<DataSelectorProps> = ({ value, onChange }) => {
  const isIndicator = value.type === 'indicator';
  const isNumber = value.type === 'number';

  return (
    <div className="flex flex-col gap-2 p-3 bg-base-300 rounded-lg border border-base-300 shadow-sm w-full md:w-72">
      <div className="flex items-center gap-2">
        {isIndicator ? <Activity size={16} className="text-blue-400" /> : 
         isNumber ? <Hash size={16} className="text-green-400" /> : 
         <Database size={16} className="text-purple-400" />}

         
        <select
          className="bg-base-200 text-sm text-base-content border border-base-300 rounded p-1.5 flex-1 focus:ring-2 focus:ring-blue-500 outline-none"
          value={isNumber ? 'Number' : value.source}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'Number') {
              onChange({ ...value, type: 'number', source: 'Number', value: 100 });
            } else if (INDICATORS.includes(val)) {
              onChange({ ...value, type: 'indicator', source: val, period: 14 });
            } else {
              onChange({ ...value, type: 'field', source: val });
            }
          }}
        >
          <optgroup label="Price/Volume Fields">
            {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
          </optgroup>
          <optgroup label="Indicators">
            {INDICATORS.map(i => <option key={i} value={i}>{i} Indicator</option>)}
          </optgroup>
          <optgroup label="Custom Value">
            <option value="Number">Custom Number</option>
          </optgroup>
        </select>
      </div>

      {isIndicator && (
        <div className="flex items-center gap-2 pl-6">
          <span className="text-xs text-base-content/70 w-12">Period:</span>
          <input
            type="number"
            min="1"
            className="bg-base-200 text-sm text-base-content border border-base-300 rounded p-1 w-20 focus:ring-2 focus:ring-blue-500 outline-none"
            value={value.period || 14}
            onChange={(e) => onChange({ ...value, period: parseInt(e.target.value) || 1 })}
          />
        </div>
      )}

      {isNumber && (
        <div className="flex items-center gap-2 pl-6">
          <span className="text-xs text-base-content/70 w-12">Value:</span>
          <input
            type="number"
            className="bg-base-200 text-sm text-base-content border border-base-300 rounded p-1 w-24 focus:ring-2 focus:ring-blue-500 outline-none"
            value={value.value || 0}
            onChange={(e) => onChange({ ...value, value: parseFloat(e.target.value) || 0 })}
          />
        </div>
      )}

      {/* Math Modifier Section */}
      <div className="pl-6 pt-2 border-t border-base-300 mt-1 flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-base-content/70 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-base-300/50 bg-base-200 text-blue-500 focus:ring-blue-500"
            checked={!!value.mathOp}
            onChange={(e) => {
              if (e.target.checked) onChange({ ...value, mathOp: '+', mathVal: 0 });
              else onChange({ ...value, mathOp: null, mathVal: '' });
            }}
          />
          <Calculator size={12} /> Math
        </label>

        {value.mathOp && (
          <div className="flex items-center gap-1">
            <select
              className="bg-base-200 text-xs text-base-content border border-base-300 rounded p-1 outline-none"
              value={value.mathOp}
              onChange={(e) => onChange({ ...value, mathOp: e.target.value })}
            >
              {MATH_OPS.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
            <input
              type="number"
              className="bg-base-200 text-xs text-base-content border border-base-300 rounded p-1 w-16 outline-none"
              value={value.mathVal || 0}
              onChange={(e) => onChange({ ...value, mathVal: parseFloat(e.target.value) || 0 })}
            />
          </div>
        )}
      </div>
    </div>
  );
};
