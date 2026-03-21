import pandas as pd
from parser import parse_rule
from indicators import compute_indicators
from evaluator import eval_logic

data = {
    'Open':   [100.0, 98.0, 96.0, 94.0, 92.0, 91.5, 93.0, 96.0, 100.0, 102.0, 101.0, 100.0, 99.0, 98.0, 97.0],
    'High':   [101.0, 99.0, 97.0, 95.0, 93.0, 92.5, 95.0, 99.0, 102.0, 104.0, 102.0, 101.0, 100.0, 99.0, 98.0],
    'Low':    [99.0,  97.0, 95.0, 93.0, 91.0, 90.0, 92.0, 95.0,  99.0, 101.0, 100.0,  99.0,  98.0, 97.0, 96.0],
    'Close':  [99.0,  97.0, 95.0, 93.0, 91.0, 92.0, 94.5, 98.5, 101.0, 103.0, 100.0,  99.0,  98.0, 97.0, 96.0],
    'Volume': [10000, 10000, 10000, 10000, 10000, 12000, 15000, 25000, 20000, 18000, 15000, 12000, 10000, 10000, 10000]
}
df = pd.DataFrame(data)

entry_ast, entry_inds = parse_rule("SMA(3)+3 crossesAbove SMA(5) && RSI(2) < 95 && Volume > VMA(3)")
exit_ast, exit_inds   = parse_rule("Close < SMA(3)")

print("ENTRY AST:", entry_ast)
print("EXIT AST :", exit_ast)

all_inds = entry_inds | exit_inds
df = compute_indicators(df, all_inds) 
entry_signal = eval_logic(df, entry_ast) 
exit_signal = eval_logic(df, exit_ast) 
print("Entry signal:") 
print(entry_signal) 
print("Exit signal:") 
print(exit_signal)
