import pandas as pd

def SMA(values, n):
    return pd.Series(values).rolling(n).mean()


def VMA(volume, n):
    return pd.Series(volume).rolling(n).mean()


def EMA(values, n):
    s = pd.Series(values, dtype=float).copy()
    s.iloc[:n-1] = pd.NA
    s.iloc[n-1] = s.iloc[:n].mean()

    a = 2 / (n + 1)
    for i in range(n, len(s)):
        s.iloc[i] = a * s.iloc[i] + (1 - a) * s.iloc[i - 1]

    return s


def RSI(values, n):
    delta = pd.Series(values).diff()

    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_g = gain.iloc[1:n+1].mean()
    avg_l = loss.iloc[1:n+1].mean()

    rsi = pd.Series(index=range(len(delta)), dtype=float)

    rs = float("inf") if avg_l == 0 else avg_g / avg_l
    rsi.iloc[n] = 100 - (100 / (1 + rs))

    for i in range(n + 1, len(delta)):
        avg_g = ((avg_g * (n - 1)) + gain.iloc[i]) / n
        avg_l = ((avg_l * (n - 1)) + loss.iloc[i]) / n

        if avg_l == 0:
            rsi.iloc[i] = 100
        else:
            rs = avg_g / avg_l
            rsi.iloc[i] = 100 - (100 / (1 + rs))

    rsi.iloc[:n] = pd.NA
    return rsi


def ATR(high, low, close, n):
    high = pd.Series(high)
    low = pd.Series(low)
    close = pd.Series(close)

    tr = pd.Series(index=range(len(close)), dtype=float)
    tr.iloc[0] = high.iloc[0] - low.iloc[0]

    for i in range(1, len(close)):
        tr.iloc[i] = max(
            high.iloc[i] - low.iloc[i],
            abs(high.iloc[i] - close.iloc[i - 1]),
            abs(low.iloc[i] - close.iloc[i - 1])
        )

    atr = pd.Series(index=range(len(tr)), dtype=float)
    atr.iloc[:n-1] = pd.NA
    atr.iloc[n-1] = tr.iloc[:n].mean()

    for i in range(n, len(atr)):
        atr.iloc[i] = ((atr.iloc[i - 1] * (n - 1)) + tr.iloc[i]) / n

    return atr


def compute_indicators(df, indicators):
    for ind in indicators:
        col = ind.column_name
        name = ind.name.lower()

        if col in df.columns:
            continue

        if name == "open":
            df[col] = df["open"]
        elif name == "high":
            df[col] = df["high"]
        elif name == "low":
            df[col] = df["low"]
        elif name == "close":
            df[col] = df["close"]
        elif name == "volume":
            df[col] = df["volume"]
        elif name == "sma":
            df[col] = SMA(df["close"], ind.period)
        elif name == "ema":
            df[col] = EMA(df["close"], ind.period)
        elif name == "rsi":
            df[col] = RSI(df["close"], ind.period)
        elif name == "vma":
            df[col] = VMA(df["volume"], ind.period)
        elif name == "atr":
            df[col] = ATR(df["high"], df["low"], df["close"], ind.period)
        else:
            raise ValueError(f"Unknown indicator name: {ind.name}")

    return df
