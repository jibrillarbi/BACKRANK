import pandas as pd
from backtesting.test import GOOG
from backtester.strategy import Strategy, StrategyEvaluator
from backtester.backtester import Backtester
from backtester.strategy import Strategy
from backtester.indicators import ind

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
    return bt.create_stats()

if __name__ == "__main__":
    strategy = {
        "NAME": "My Strategy",
        "ENTRY": "SMA(2) > SMA(4) && Volume > VMA(3)",
        "EXIT": "Close < SMA(2)",
        "DIRECTION": "LONG",
        "TIMEFRAME": "1D",
        "TICKER": "AAPL",
        "SIZE": "5",
        "SL": "None",
        "TP": "None",
    }

    run_backtest(strategy)