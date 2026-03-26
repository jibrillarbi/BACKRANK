import { createContext, useContext, useState } from 'react';

interface StrategyContextType {
  strategyName: string;
  entryRule: string;
  exitRule: string;
  setRules: (name: string, entry: string, exit: string) => void;
}

const StrategyContext = createContext<StrategyContextType | undefined>(undefined);

export const StrategyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [strategyName, setStrategyName] = useState<string>('My Strategy');
  const [entryRule, setEntryRule] = useState<string>('');
  const [exitRule, setExitRule] = useState<string>('');

  const setRules = (name: string, entry: string, exit: string) => {
    setStrategyName(name);
    setEntryRule(entry);
    setExitRule(exit);
  };

  return (
    <StrategyContext.Provider value={{ strategyName, entryRule, exitRule, setRules }}>
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
