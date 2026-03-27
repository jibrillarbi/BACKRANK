import pandas as pd
from parser import parse_rule
from indicators import compute_indicators
from evaluator import eval_logic
from backtesting.test import GOOG

data = {
    'Open':   [100.0, 98.0, 96.0, 94.0, 92.0, 91.5, 93.0, 96.0, 100.0, 102.0, 101.0, 100.0, 99.0, 98.0, 97.0],
    'High':   [101.0, 99.0, 97.0, 95.0, 93.0, 92.5, 95.0, 99.0, 102.0, 104.0, 102.0, 101.0, 100.0, 99.0, 98.0],
    'Low':    [99.0,  97.0, 95.0, 93.0, 91.0, 90.0, 92.0, 95.0,  99.0, 101.0, 100.0,  99.0,  98.0, 97.0, 96.0],
    'Close':  [99.0,  97.0, 95.0, 93.0, 91.0, 92.0, 94.5, 98.5, 101.0, 103.0, 100.0,  99.0,  98.0, 97.0, 96.0],
    'Volume': [10000, 10000, 10000, 10000, 10000, 12000, 15000, 25000, 20000, 18000, 15000, 12000, 10000, 10000, 10000]
}

entry_rule="SMA(2) > SMA(4) && Volume > VMA(3)"
exit_rule="Close < SMA(2)"
position_type='LONG'
entry_ast, entry_inds = parse_rule(entry_rule)
exit_ast, exit_inds   = parse_rule(exit_rule)

strat=Strategy(name='ENTRY '+entry_rule+'EXIT '+exit_rule,
               entry_rule=entry_rule,
               exit_rule=exit_rule,
               position_type=position_type,
               pct=0.02,
               take_profit=0.1,
               stop_loss=0.05
               )
strat_eval=StrategyEvaluator(strat,GOOG)
bt=Backtester(strat_eval,'TEST',GOOG,1000000)
bt.run()
s=bt.create_stats()
'''
x=[1000]*1638
x[-7:-1]=[1100,1050,1200,1150,1300]
x[-1]=1300
t=[1100,1050,1200,1150,1300]
s=Stats(t,None,'1h')
s.print_stats()
'''
