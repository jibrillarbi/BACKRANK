import pandas as pd
from backtesting.test import GOOG
from backtester.strategy import Strategy, StrategyEvaluator
from backtester.backtester import Backtester

def load_strategy_from_json(data: dict) -> tuple[Strategy, str]:
    return Strategy(
        name=data["NAME"],
        entry_rule=data["ENTRY"],
        exit_rule=data["EXIT"],
        position_type=data["DIRECTION"],
        pct=float(data["SIZE"]),
        stop_loss=None if data["SL"] == "None" else float(data["SL"]),
        take_profit=None if data["TP"] == "None" else float(data["TP"]),
        timeframe=data["TIMEFRAME"],
    ), data["TICKER"]

def run_backtest(strategy_data: dict):
    strat, ticker = load_strategy_from_json(strategy_data)
    feed = GOOG.copy()
    strat_eval = StrategyEvaluator(strat, feed)
    bt = Backtester(strat_eval, ticker, feed, 1000000)
    bt.run()
    s=bt.create_stats()
    return bt.create_stats()
