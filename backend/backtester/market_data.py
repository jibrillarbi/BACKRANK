import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import os

class MarketDataFetcher:
    """Fetches market data from Yahoo Finance and stores in Parquet file"""
    
    TICKERS = ["AAPL", "MSFT", "NVDA", "TSLA", "SPY"]
    # Available timeframes with Yahoo Finance limits
    TIMEFRAMES = {
        "1d": "1d",      # Full history available
        "1h": "1h",      # 60 days available
        "15m": "15m",    # 7 days available
        "5m": "5m",      # 7 days available
        "1m": "1m",      # 8 days available
    }
    
    def __init__(self):
        self.data_cache: Dict[str, pd.DataFrame] = {}
    
    def fetch_data(self, ticker: str, timeframe: str, period: str = "1y") -> Optional[pd.DataFrame]:
        """
        Fetch OHLCV data from Yahoo Finance
        
        Args:
            ticker: Stock ticker (e.g., 'AAPL')
            timeframe: Timeframe (1m, 5m, 15m, 1h, 1d)
            period: Data period (1d, 1mo, 1y, etc.)
        
        Returns:
            DataFrame with OHLCV data or None if fetch fails
        """
        cache_key = f"{ticker}_{timeframe}_{period}"
        
        if cache_key in self.data_cache:
            return self.data_cache[cache_key]
        
        try:
            data = yf.download(
                ticker,
                interval=self.TIMEFRAMES.get(timeframe, "1d"),
                period=period,
                progress=False
            )
            
            if data.empty:
                print(f"No data found for {ticker}")
                return None
            
            if isinstance(data.columns, pd.MultiIndex):
                data.columns = data.columns.get_level_values(0)
            
            # Standardize column names
            data.columns = [col.lower() for col in data.columns]
            
            # Ensure required columns exist
            required_cols = ['open', 'high', 'low', 'close', 'volume']
            if not all(col in data.columns for col in required_cols):
                print(f"Missing required columns in {ticker} data. Available: {list(data.columns)}")
                return None

            # Cache the data
            self.data_cache[cache_key] = data
            
            print(f"Fetched {len(data)} bars for {ticker} {timeframe}")
            return data
            
        except Exception as e:
            print(f"Error fetching {ticker} data: {str(e)}")
            return None
    
    def fetch_all_data(self, period: str = "1y") -> Dict[str, Dict[str, pd.DataFrame]]:
        """
        Fetch data for all tickers and timeframes
        Uses suitable historical periods for backtesting
        Respects Yahoo Finance API limits per timeframe
        
        Returns:
            Nested dict: {ticker: {timeframe: DataFrame}}
        """
        all_data = {}
        
        # Map timeframes to suitable periods for backtesting
        # Yahoo Finance limitations:
        # - Daily: Full history available (10y = ~2514 bars)
        # - Hourly: 60 days (~1,746 hourly bars)
        # - 15m: 60 days (~1,556 bars)
        # - 5m: 60 days (~4,666 bars)
        # - 1m: 8 days (~3,048 bars - API max for 1m)
        timeframe_periods = {
            "1d": "10y",     # 10 years of daily data (~2514 bars)
            "1h": "60d",     # 60 days of hourly data
            "15m": "60d",    # 60 days of 15m data (~1,556 bars)
            "5m": "60d",     # 60 days of 5m data (~4,666 bars)
            "1m": "8d",      # 8 days of 1m data (~3,048 bars - Yahoo max)
        }
        
        for ticker in self.TICKERS:
            all_data[ticker] = {}
            for timeframe in self.TIMEFRAMES.keys():
                fetch_period = timeframe_periods.get(timeframe, "1y")
                data = self.fetch_data(ticker, timeframe, fetch_period)
                if data is not None:
                    all_data[ticker][timeframe] = data
        
        return all_data
    
    def get_cached_data(self, ticker: str, timeframe: str) -> Optional[pd.DataFrame]:
        cache_key = f"{ticker}_{timeframe}_1y"
        return self.data_cache.get(cache_key)
