import pandas as pd
from typing import Optional, Dict
from backtester.market_data import MarketDataFetcher
from backtester.parquet_store import ParquetDataStore

class DataManager:
    """
    Gateway between the backtester and market data.

    The normal path is Parquet first, Yahoo Finance second. That keeps repeated
    backtests fast while still letting the app fill a missing cache entry.
    """
    
    def __init__(self):
        self.fetcher = MarketDataFetcher()
        self.store = ParquetDataStore()
        self.tickers = MarketDataFetcher.TICKERS
        self.timeframes = MarketDataFetcher.TIMEFRAMES.keys()
    
    def initialize_all_data(self, period: str = "1y") -> Dict[str, bool]:
        """
        Fetch and store all market data for all tickers and timeframes
        Uses MarketDataFetcher.fetch_all_data() which handles
        appropriate period mapping per timeframe (respects Yahoo API limits)
        
        Returns:
            Dict showing success/failure for each ticker
        """
        results = {}
        
        all_data = self.fetcher.fetch_all_data(period)
        
        for ticker in self.tickers:
            results[ticker] = True
            if ticker in all_data:
                for timeframe, data in all_data[ticker].items():
                    if data is not None:
                        stored = self.store.store_market_data(ticker, timeframe, data)
                        results[ticker] = results[ticker] and stored
                    else:
                        results[ticker] = False
            else:
                results[ticker] = False
        
        return results
    
    def get_data_for_backtest(
        self, 
        ticker: str, 
        timeframe: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Optional[pd.DataFrame]:
        """
        Get market data for backtesting
        Serves data to backtester in standardized format
        
        Args:
            ticker: Stock ticker
            timeframe: Timeframe (1m, 5m, 15m, 1h, 1d)
            start_date: Optional start date filter
            end_date: Optional end date filter
        
        Returns:
            DataFrame with columns: open, high, low, close, volume
        """
        data = self.store.retrieve_market_data(
            ticker, 
            timeframe, 
            start_date, 
            end_date
        )
        
        if data is None:
            data = self.fetcher.fetch_data(ticker, timeframe, "1y")
            if data is not None:
                self.store.store_market_data(ticker, timeframe, data)
        
        return data
    
    def refresh_data(self, ticker: str, timeframe: str) -> bool:
        """Refresh data for a specific ticker/timeframe"""
        print(f"Refreshing {ticker} {timeframe}...")
        data = self.fetcher.fetch_data(ticker, timeframe, "1y")
        if data is not None:
            return self.store.store_market_data(ticker, timeframe, data)
        return False
    
    def refresh_all_data(self) -> Dict[str, bool]:
        """Refresh all market data"""
        results = {}
        
        for ticker in self.tickers:
            results[ticker] = True
            for timeframe in self.timeframes:
                success = self.refresh_data(ticker, timeframe)
                results[ticker] = results[ticker] and success
        
        return results
    
    def get_storage_stats(self) -> Dict:
        """Get statistics about stored data"""
        stats = {
            "available_tickers": self.store.get_available_tickers(),
            "ticker_details": {}
        }
        
        for ticker in stats["available_tickers"]:
            timeframes = self.store.get_available_timeframes(ticker)
            stats["ticker_details"][ticker] = {
                "timeframes": timeframes,
                "count": len(timeframes)
            }
        
        return stats
