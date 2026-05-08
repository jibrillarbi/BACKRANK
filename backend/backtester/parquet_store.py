import os
from pathlib import Path
from typing import List, Optional

import pandas as pd


DEFAULT_DATA_DIR = Path(__file__).resolve().parents[1] / "data" / "parquet"


class ParquetDataStore:
    """
    Columnar OHLCV storage backed by Parquet files.

    Returns Pandas DataFrames in the format the backtester expects.
    """

    REQUIRED_COLUMNS = ["open", "high", "low", "close", "volume"]

    def __init__(self, data_dir: Optional[str] = None):
        self.data_dir = str(Path(data_dir).expanduser()) if data_dir else str(DEFAULT_DATA_DIR)
        os.makedirs(self.data_dir, exist_ok=True)

    def store_market_data(self, ticker: str, timeframe: str, df: pd.DataFrame) -> bool:
        try:
            normalized = self._normalize_frame(df)
            if normalized.empty:
                print(f"No rows to store for {ticker} {timeframe}")
                return False

            store_path = os.path.join(self.data_dir, ticker.upper(), timeframe.lower())
            os.makedirs(store_path, exist_ok=True)

            parquet_file = os.path.join(store_path, f"{ticker.upper()}_{timeframe.lower()}.parquet")
            normalized.to_parquet(parquet_file, compression="zstd")

            print(f"Stored {len(normalized)} rows for {ticker} {timeframe} at {parquet_file}")
            return True
        except Exception as e:
            print(f"Error storing {ticker} {timeframe} data: {str(e)}")
            return False

    def retrieve_market_data(
        self,
        ticker: str,
        timeframe: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Optional[pd.DataFrame]:
        try:
            parquet_file = os.path.join(
                self.data_dir,
                ticker.upper(),
                timeframe.lower(),
                f"{ticker.upper()}_{timeframe.lower()}.parquet",
            )

            if not os.path.exists(parquet_file):
                print(f"No data found for {ticker} {timeframe}")
                return None

            df = pd.read_parquet(parquet_file)
            df = self._normalize_frame(df)

            if start_date:
                df = df[df.index >= start_date]
            if end_date:
                df = df[df.index <= end_date]

            if df.empty:
                print(f"No data found for {ticker} {timeframe} in requested range")
                return None

            print(f"Retrieved {len(df)} rows for {ticker} {timeframe}")
            return df
        except Exception as e:
            print(f"Error retrieving {ticker} {timeframe} data: {str(e)}")
            return None

    def get_available_tickers(self) -> List[str]:
        try:
            return sorted(
                item for item in os.listdir(self.data_dir)
                if os.path.isdir(os.path.join(self.data_dir, item))
            )
        except Exception:
            return []

    def get_available_timeframes(self, ticker: str) -> List[str]:
        try:
            ticker_dir = os.path.join(self.data_dir, ticker.upper())
            return sorted(
                item for item in os.listdir(ticker_dir)
                if os.path.isdir(os.path.join(ticker_dir, item))
            )
        except Exception:
            return []

    def delete_data(self, ticker: str, timeframe: str) -> bool:
        try:
            parquet_file = os.path.join(
                self.data_dir,
                ticker.upper(),
                timeframe.lower(),
                f"{ticker.upper()}_{timeframe.lower()}.parquet",
            )
            if os.path.exists(parquet_file):
                os.remove(parquet_file)
                print(f"Deleted data for {ticker} {timeframe}")
                return True
            return False
        except Exception as e:
            print(f"Error deleting {ticker} {timeframe} data: {str(e)}")
            return False

    def _normalize_frame(self, df: pd.DataFrame) -> pd.DataFrame:
        if df is None or df.empty:
            return pd.DataFrame(columns=self.REQUIRED_COLUMNS)

        normalized = df.copy()
        normalized.columns = [str(col).lower() for col in normalized.columns]

        missing = [col for col in self.REQUIRED_COLUMNS if col not in normalized.columns]
        if missing:
            raise ValueError(f"Missing OHLCV columns: {', '.join(missing)}")

        normalized = normalized[self.REQUIRED_COLUMNS].dropna()
        for col in self.REQUIRED_COLUMNS:
            normalized[col] = normalized[col].astype(float)

        return normalized
