import pandas as pd
from backtester.strategy import Strategy, StrategyEvaluator
from backtester.backtester import Backtester
from backtester.data_manager import DataManager
from backtesting.test import GOOG

data_manager = DataManager()
REQUIRED_COLUMNS = ["open", "high", "low", "close", "volume"]

def parse_optional_percent(value):
    if value is None or str(value).strip().lower() == "none":
        return None
    return float(value) / 100

def parse_percent(value):
    return float(value) / 100

def load_strategy_from_json(data: dict) -> tuple[Strategy, str]:
    timeframe = data["TIMEFRAME"].lower()
    if timeframe == "1d":
        timeframe = "1D"
    elif timeframe == "1w":
        timeframe = "1W"
    elif timeframe == "1m":
        timeframe = "1M"
    
    return Strategy(
        name=data["NAME"],
        entry_rule=data["ENTRY"],
        exit_rule=data["EXIT"],
        position_type=data["DIRECTION"],
        pct=parse_percent(data["SIZE"]),
        stop_loss=parse_optional_percent(data["SL"]),
        take_profit=parse_optional_percent(data["TP"]),
        timeframe=timeframe,
    ), data["TICKER"]

def run_backtest(strategy_data: dict):
    """
    Run a strategy against cached market data and return  stats.
    """
    strat, ticker = load_strategy_from_json(strategy_data)
    timeframe = strategy_data.get("TIMEFRAME", "1d").lower()
    
    feed = data_manager.get_data_for_backtest(ticker, timeframe)
    
    if feed is None:
        print(f"Warning: Real data not available for {ticker}. Using mock data.")
        feed = GOOG.copy()

    feed.columns = [str(col).lower() for col in feed.columns]
    missing_columns = [col for col in REQUIRED_COLUMNS if col not in feed.columns]
    if missing_columns:
        raise ValueError(f"Market data is missing required columns: {', '.join(missing_columns)}")
    if feed.empty:
        raise ValueError("Market data is empty")
    if feed[REQUIRED_COLUMNS].isnull().any().any():
        feed = feed.dropna(subset=REQUIRED_COLUMNS)
    if len(feed) < 2:
        raise ValueError("Market data must contain at least two candles")
    
    print(f"Running backtest for {ticker} {timeframe} with {len(feed)} bars")
    
    strat_eval = StrategyEvaluator(strat, feed)
    bt = Backtester(strat_eval, ticker, feed, 1000000)
    bt.run()
    
    return bt.create_stats()
