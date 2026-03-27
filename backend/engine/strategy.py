import pandas as pd
from backend.rules.parser import parse_rule
from backend.rules.indicators import compute_indicators
from backend.rules.evaluator import eval_logic

class Strategy: 
    def __init__(self,name,entry_rule,exit_rule,position_type,pct,stop_loss=None,take_profit=None, timeframe='1D'):
        self.name=name # Strategy name 
        self.entry_rule = entry_rule # str of entry rule, e.g. "SMA(2) > SMA(4) && Volume > VMA(3)"
        self.exit_rule = exit_rule #str of exit rule, e.g. "Close < SMA(2)"
        self.stop_loss = stop_loss #percentage based stop loss
        self.take_profit = take_profit #percentage based tp 
        self.position_type = position_type #LONG or SHORT
        self.timeframe=timeframe # timeframe
        self.pct=pct#percentage of equity used for each trade

class StrategyEvaluator():
    def __init__(self, strategy: Strategy, feed: pd.DataFrame):
        self.strategy=strategy
        self.feed = feed
        self.entry_signals,self.exit_signals=self.evaluate_entry_exit()


    def evaluate_entry_exit(self):
        entry_ast, entry_inds = parse_rule(self.strategy.entry_rule)
        exit_ast, exit_inds   = parse_rule(self.strategy.exit_rule)
        all_inds = entry_inds | exit_inds
        df = compute_indicators(self.feed, all_inds) 
        entry_signal = eval_logic(df, entry_ast).fillna(False)
        exit_signal = eval_logic(df, exit_ast).fillna(False)
        return entry_signal, exit_signal
