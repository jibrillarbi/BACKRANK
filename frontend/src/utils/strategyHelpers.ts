import type { Entity, Condition } from '../types/strategy';

// --- Configuration matching the Python Backend ---
export const FIELDS = ['Open', 'High', 'Low', 'Close', 'Volume'];
export const INDICATORS = ['SMA', 'EMA', 'RSI', 'VMA', 'ATR'];
export const COMPARISONS = [
  { value: '>', label: 'Greater Than (>)' },
  { value: '<', label: 'Less Than (<)' },
  { value: '>=', label: 'Greater or Equal (>=)' },
  { value: '<=', label: 'Less or Equal (<=)' },
  { value: '=', label: 'Equals (=)' },
  { value: '!=', label: 'Not Equals (!=)' },
  { value: 'crossesAbove', label: 'Crosses Above' },
  { value: 'crossesBelow', label: 'Crosses Below' }
];
export const MATH_OPS = ['+', '-', '*', '/'];

// --- Helper to parse visual state into the Python String ---
export const generateEntityString = (ent: Entity): string => {
  let str = '';
  if (ent.type === 'number') {
    str = (ent.value || 0).toString();
  } else if (ent.type === 'indicator') {
    str = `${ent.source}(${ent.period || 14})`;
  } else {
    str = ent.source;
  }

  if (ent.mathOp && ent.mathVal !== '') {
    str += ` ${ent.mathOp} ${ent.mathVal}`;
  }
  return str;
};

export const generateRuleString = (conditions: Condition[]): string => {
  if (conditions.length === 0) return '';
  return conditions.map((c, i) => {
    const logicStr = i === 0 ? '' : ` ${c.logicalOp} `;
    const condStr = `${generateEntityString(c.left)} ${c.comp} ${generateEntityString(c.right)}`;
    return logicStr + condStr;
  }).join('');
};
