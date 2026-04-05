import { createContext, useContext, useState } from 'react';
import type { Condition } from '../types/strategy';

interface StrategyContextType {
  strategyName: string;
  entryRule: string;
  exitRule: string;
  entryConditions: Condition[];
  exitConditions: Condition[];
  setRules: (name: string, entry: string, exit: string) => void;
  setConditions: (entry: Condition[], exit: Condition[]) => void;
}

const StrategyContext = createContext<StrategyContextType | undefined>(undefined);

const defaultEntryConditions: Condition[] = [
  {
    id: 1, logicalOp: null,
    left: { type: 'indicator', source: 'SMA', period: 2 },
    comp: '>',
    right: { type: 'indicator', source: 'SMA', period: 4 }
  },
  {
    id: 2, logicalOp: '&&',
    left: { type: 'field', source: 'Volume' },
    comp: '>',
    right: { type: 'indicator', source: 'VMA', period: 3 }
  }
];

const defaultExitConditions: Condition[] = [
  {
    id: 1, logicalOp: null,
    left: { type: 'field', source: 'Close' },
    comp: '<',
    right: { type: 'indicator', source: 'SMA', period: 2 }
  }
];

export const StrategyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [strategyName, setStrategyName] = useState<string>('Select Strategy');
  const [entryRule, setEntryRule] = useState<string>('');
  const [exitRule, setExitRule] = useState<string>('');
  const [entryConditions, setEntryConditionsState] = useState<Condition[]>(defaultEntryConditions);
  const [exitConditions, setExitConditionsState] = useState<Condition[]>(defaultExitConditions);

  const setRules = (name: string, entry: string, exit: string) => {
    setStrategyName(name);
    setEntryRule(entry);
    setExitRule(exit);
  };

  const setConditions = (entry: Condition[], exit: Condition[]) => {
    setEntryConditionsState(entry);
    setExitConditionsState(exit);
  };

  return (
    <StrategyContext.Provider value={{ 
      strategyName, 
      entryRule, 
      exitRule, 
      entryConditions, 
      exitConditions, 
      setRules, 
      setConditions 
    }}>
      {children}
    </StrategyContext.Provider>
  );
};

export const useStrategy = () => {
  const context = useContext(StrategyContext);
  if (!context) {
    throw new Error('useStrategy must be used within StrategyProvider');
  }
  return context;
};
