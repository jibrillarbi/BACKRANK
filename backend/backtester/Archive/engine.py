from backtesting.test import GOOG
'''
from backtesting.test import GOOG
print(GOOG.tail())

def SMA(values,n):
    return pd.Series(values).rolling(n).mean()

    bt= Backtest(GOOG,SmaCross,cash=10_000,commission=.002, finalize_trades=True)
stats=bt.run()
stats=bt.optimize(n1=range(5,30,5),
                  n2=range(10,70,5),
                  maximize='Equity Final [$]',
                  constraint=lambda param: param.n1 < param.n2)

print(stats)
print(stats._strategy)

 rsi=gain/loss
   rsi=100-(100/(1+rsi))
   
   for i in range(n,rsi.length-n):
       gain.iloc[i:n+i].mean()

{
  "entryRule": {
    "action": "BUY",
    "expression": [
      {
        "left": { "indicator": "SMA", "period": 20 },
        "operator": "crossesAbove",
        "right": { "indicator": "SMA", "period": 50 }
      },
      { "logic": "AND" },
      {
        "left": { "indicator": "RSI", "period": 14 },
        "operator": "<",
        "right": 60
      },
      { "logic": "AND" },
      {
        "left": { "indicator": "Volume" },
        "operator": ">",
        "right": { "indicator": "VMA", "period": 20 }
      }
    ]
  },

  "exitRule": {
    "action": "SELL",
    "expression": [
      {
        "left": { "indicator": "SMA", "period": 20 },
        "operator": "crossesBelow",
        "right": { "indicator": "SMA", "period": 50 }
      },
      { "logic": "OR" },
      {
        "left": { "indicator": "RSI", "period": 14 },
        "operator": ">",
        "right": 70
      }
    ]
  }
}

BUY when

SMA(20) crossesAbove SMA(50)
AND RSI(14) < 60
AND Volume > VMA(20)

SELL when

SMA(20) crossesBelow SMA(50)
OR RSI(14) > 70 

'''
import math 
import pandas as pd
from backtesting import Strategy, Backtest
from backtesting.lib import crossover
from backtesting.test import GOOG

import json
class Indicator:
    def __init__(self,name,period=None):
        #None because could be volume
        self.name=name
        self.period=period
        self.column_name=name
        if period is not None:
            self.column_name+='_'+str(period)
        #could add type close open high low but for now just use close 
    def __str__(self):
        if self.period is None:
            return f"{self.name}"
        return f"{self.name}({self.period})"
    def __eq__(self,other): 
        return (
            isinstance(other, Indicator)
            and self.name == other.name
            and self.period == other.period
        )
class Condition:
    def __init__(self, left_indicator, operator, right,right_type):
        self.left = left_indicator
        self.operator = operator
        self.right = right # parse right to know if its an indicator, int or other
        self.right_type=right_type
    
    def __str__(self):
        return f"{self.left} {self.operator} {self.right}"
    
json_string = '''{
  "entryRule": {
    "action": "BUY",
    "expression": [
      {
        "left": { "indicator": "SMA", "period": 3 },
        "operator": "crossesAbove",
        "right": { "indicator": "SMA", "period": 5 }
      },
      { "logic": "AND" },
      {
        "left": { "indicator": "RSI", "period": 2 },
        "operator": "<",
        "right": 95
      },
      { "logic": "AND" },
      {
        "left": { "indicator": "Volume" },
        "operator": ">",
        "right": { "indicator": "VMA", "period": 3 }
      }
    ]
  },
  "exitRule": {
    "action": "SELL",
    "expression": [
      {
        "left": { "indicator": "Close" },
        "operator": "<",
        "right": { "indicator": "SMA", "period": 3 }
      }
    ]
  }
}

'''
rules=json.loads(json_string)
def json_parser(json, rule_key="entryRule"):
    entry=[]
    indicators=[]
    for i in rules[rule_key]["expression"]:
        if "logic" not in i: #not logic part, can convert to Condition
            left=Indicator(i['left']['indicator'],i['left'].get('period'))
            operator=i['operator']
            right=i['right']
            right_type='constant'

            if left not in indicators:#so we have a list of unique indicators, for later calculation
                indicators.append(left)

            if isinstance(right, dict):
                right=Indicator(i['right']['indicator'],i['right'].get('period')) # could be none 
                right_type='indicator'
                if right not in indicators:
                    indicators.append(right)
            
            cond=Condition(left,operator,right,right_type)
            entry.append(cond)


        else: #logic
            entry.append(i["logic"])
    return entry, indicators


def compute_indicators(df, indicators):
    for ind in indicators:
        col = ind.column_name

        if col in df.columns:
            continue

        if ind.name == "SMA":
            df[col] = SMA(df["Close"], ind.period)

        elif ind.name == "EMA":
            df[col] = EMA(df["Close"], ind.period)

        elif ind.name == "RSI":
            df[col] = RSI(df["Close"], ind.period)

        elif ind.name == "VMA":
            df[col] = VMA(df["Volume"], ind.period)

        elif ind.name == "ATR":
            df[col] = ATR(df["High"], df["Low"], df["Close"], ind.period)

        else:
            raise ValueError(f"Unknown indicator name: {ind.name}")

    return df

def condition_to_bool(df, cond):
    left = df[cond.left.column_name]

    if cond.right_type == "indicator":
        right = df[cond.right.column_name]
    else:
        right = cond.right

    op = cond.operator


    if op == ">":
        return left > right #returns a series of False or true
    if op == "<":
        return left < right
    if op == ">=":
        return left >= right
    if op == "<=":
        return left <= right
    if op == "==":
        return left == right
    if op == "!=":
        return left != right

    if op == "crossesAbove":
        return (left.shift(1) <= right.shift(1)) & (left > right)

    if op == "crossesBelow":
        return (left.shift(1) >= right.shift(1)) & (left < right)

def eval_expression(df, exp):

    result = condition_to_bool(df, exp[0]) #we use the series, computed from the first expression 

    for i in range(1, len(exp), 2): #two because the list is cond,logic,cond 
        logic = exp[i]
        cond  = exp[i+1]

        next_bool = condition_to_bool(df, cond)

        if logic == "AND":
            result = result & next_bool
        elif logic == "OR":
            result = result | next_bool

    return result
def RSI(values,n):
    delta=pd.Series(values).diff()

    gain=delta.clip(lower=0) #gain
    loss=delta.clip(upper=0) #loss
    loss=loss*-1
    avg_g=gain.iloc[:n+1].mean() #average gain
    avg_l=loss.iloc[:n+1].mean() #average loss

    rsi=pd.Series(index=range(len(delta)), dtype=float)
    rs=100
    if avg_l!=0:
        rs=avg_g/avg_l
        
    rsi[n]=100-(100/(1+rs))
    for i in range(n+1,len(delta)):
        avg_g_n=(avg_g*(n-1)+gain[i]) /n#wilders smothing 
        avg_l_n=(avg_l*(n-1)+loss[i])/n
        if avg_l==0:
            rsi[i]=100
        else:
            rs=avg_g_n/avg_l_n
            rsi[i]=100-(100/(1+rs))
        avg_g=avg_g_n
        avg_l=avg_l_n

    rsi.iloc[:n]=pd.NA
    return rsi


def ATR(High,Low,Close,n):
    
    tr=pd.Series(index=range(len(Close)))
    tr[0]=High[0]-Low[0]
    for i in range(1,len(Close)):#True range
        tr[i]=max(High[i]-Low[i], abs(High[i]-Close[i-1])  ,abs(Low[i]-Close[i-1])) 
    atr=pd.Series(index=range(len(tr)))
    atr.iloc[n-1]=tr.iloc[:n].mean()
    for i in range(n,len(atr)):
        atr.iloc[i]=(  (atr.iloc[i-1]) * (n-1)   +  tr.iloc[i]  )/n
    return atr

def SMA(values,n):
    return pd.Series(values).rolling(n).mean()

def VMA(volume,n):
    return pd.Series(volume.rolling(n).mean())

def EMA(values,n):
    s=pd.Series(values,dtype=float)
    s.iloc[n-1]=s.iloc[:n].mean() # First EMA calculation n-1 because prices are indexed 
    a=2/(n+1)
    for i in range(n, len(s)):
        s.iloc[i]=a*s.iloc[i]+(1-a)*s.iloc[i-1]
    return s

class SmaCross(Strategy):
    # Define the two MA lags as *class variables*
    # for later optimization
    n1 = 10 # first SMA -> more agressive, short term, 10 candles
    n2 = 20 # second SMA ->less aggressive, long term, 20 candles
    
    def init(self):
        # Precompute the two moving averages
        self.sma1 = self.I(SMA, self.data.Close, self.n1) # uses earlier method 
        self.sma2 = self.I(SMA, self.data.Close, self.n2) # uses SMA earlier method
    def next(self):
        # If sma1 crosses above sma2, close any existing
        # short trades, and buy the asset

        if crossover(self.sma1, self.sma2): # if sma1 passes over sma2 close the short position and open a long position
            self.position.close()
            self.buy()

        # Else, if sma1 crosses below sma2, close any existing
        # long trades, and sell the asset
        elif crossover(self.sma2, self.sma1):
            self.position.close()
            self.sell()


data = {
    'Open':   [100.0, 98.0, 96.0, 94.0, 92.0, 91.5, 93.0, 96.0, 100.0, 102.0, 101.0, 100.0, 99.0, 98.0, 97.0],
    'High':   [101.0, 99.0, 97.0, 95.0, 93.0, 92.5, 95.0, 99.0, 102.0, 104.0, 102.0, 101.0, 100.0, 99.0, 98.0],
    'Low':    [99.0,  97.0, 95.0, 93.0, 91.0, 90.0, 92.0, 95.0,  99.0, 101.0, 100.0,  99.0,  98.0, 97.0, 96.0],
    'Close':  [99.0,  97.0, 95.0, 93.0, 91.0, 92.0, 94.5, 98.5, 101.0, 103.0, 100.0,  99.0,  98.0, 97.0, 96.0],
    'Volume': [10000, 10000, 10000, 10000, 10000, 12000, 15000, 25000, 20000, 18000, 15000, 12000, 10000, 10000, 10000]
}
df = pd.DataFrame(data)
entry,entry_inds = json_parser(rules, "entryRule")
exit, exit_inds  = json_parser(rules, "exitRule")

df_entry = compute_indicators(df, entry_inds)
df_exit = compute_indicators(df, exit_inds)

entry_signal = eval_expression(df_entry, entry) 
exit_signal  = eval_expression(df_exit, exit)
print(entry_signal)
print(exit_signal)
print (GOOG.head())
print(GOOG.tail())
'''
entry and exit could be combined
true from entry we switch to exit 


bt= Backtest(GOOG,SmaCross,cash=10_000,commission=.002, finalize_trades=True)
stats=bt.run()
print(stats)

entry = json_parser(rules)[0]
indicators = json_parser(rules)[1]
df_n=compute_indicators(df,indicators)
for col in df_n.columns:
    print("Column:", col)
    print(df[col])
    print()
print(df_n) 
'''