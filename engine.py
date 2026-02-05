
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

'''
import math 
import pandas as pd
from backtesting import Strategy, Backtest
from backtesting.lib import crossover
from backtesting.test import GOOG
def SMA(values,n):
    return pd.Series(values).rolling(n).mean()


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
        avg_g_n=(avg_g*13+gain[i]) /14 #wilders smothing 
        avg_l_n=(avg_l*13+loss[i])/14
        if avg_l==0:
            rsi[i]=100
        else:
            rs=avg_g_n/avg_l_n
            rsi[i]=100-(100/(1+rs))
        avg_g=avg_g_n
        avg_l=avg_l_n

    rsi.iloc[:n]=pd.NA
    print(rsi)
    print(avg_g,avg_l)


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

        #main comparison to be presented when serialising json, user chosen 
        if crossover(self.sma1, self.sma2): # if sma1 passes over sma2 close the short position and open a long position
            self.position.close()
            self.buy()

        # Else, if sma1 crosses below sma2, close any existing
        # long trades, and sell the asset
        elif crossover(self.sma2, self.sma1):
            self.position.close()
            self.sell()

s = pd.Series(
    [44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.28, 46.00, 46.03, 46.41, 46.22, 45.64, 46.21, 46.25, 45.71, 46.45, 45.78, 45.35, 44.03, 44.18, 44.22, 44.57, 43.42, 42.66, 43.13])

RSI(s,14)