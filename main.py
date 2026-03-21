import pandas as pd
from parser import parse_rule
from indicators import compute_indicators
from evaluator import eval_logic


class Strategy: 
    def __init__(self,name,entry_signal,exit_signal,position_type,stop_loss=None,take_profit=None,max_days=None, timeframe='1D'):
        self.name=name # Strategy name 
        self.entry_signals = entry_signal # df with true / false
        self.exit_signals = exit_signal #df with true / false
        self.stop_loss = stop_loss 
        self.take_profit = take_profit
        self.position_type = position_type #LONG or SHORT
        self.max_days=max_days # max holding days
        self.timeframe=timeframe # timeframe
        #self.size_pct = size_pct # percentage of equity used for each trade

class Position(): 
    def __init__(self,entry_type,entry_price,entry_time,position,stop_loss=None,take_profit=None):
        self.entry_type=entry_type
        self.entry_price=entry_price
        self.position=position
        self.exit_price=None
        self.entry_time=entry_time
        self.exit_time=None
        self.stop_loss=stop_loss
        self.take_profit=take_profit
        self.stop_loss_price=self.stop_loss_calc()
        self.take_profit_price=self.take_profit_calc()
        self.open=True
        
    def stop_loss_calc(self):
        if self.stop_loss is not None: 
            if self.entry_type=='LONG':
                return self.entry_price*(1-self.stop_loss)
            elif self.entry_type=='SHORT':
                return self.entry_price*(1+self.stop_loss)
            else: 
                raise SyntaxError(
            f"Error when calculating stop loss, expected LONG or SHORT, got {self.entry_type})")
        return None
    def take_profit_calc(self):
        if self.take_profit is not None: 
            if self.entry_type=='LONG':
                return self.entry_price*(1+self.take_profit)
            elif self.entry_type=='SHORT':
                return self.entry_price*(1-self.take_profit)
            else: 
                raise SyntaxError(
            f"Error when calculating take_profit, expected LONG or SHORT, got {self.entry_type})")
        return None
    def sl_trigered(self,price):
        if self.stop_loss_price is None:
            raise SyntaxError(
            f"Error when calculating sl_trigerred, stop_loss_price is None")
        if self.entry_type=='LONG':
                return price<=self.stop_loss_price # price goes under sl
        elif self.entry_type=='SHORT':
            return price>=self.stop_loss_price #price goes over sl 
        else:
            raise SyntaxError(
            f"Error when calculating sl_trigered, expected LONG or SHORT, got {self.entry_type})")
    def tp_trigered(self,price):
        if self.take_profit_price is None:
            raise SyntaxError(
            f"Error when calculating tp_trigerred, take_profit_price is None")
        if self.entry_type=='LONG':
                return price>=self.take_profit_price
        elif self.entry_type=='SHORT':
            return price<=self.take_profit_price
        else:
            raise SyntaxError(
            f"Error when calculating tp_trigered, expected LONG or SHORT, got {self.entry_type})")



class Backtester:
    def __init__(self,strategy:Strategy,symbol,feed: pd.DataFrame,capital):
        self.strategy=strategy # Strategy class object
        self.symbol=symbol # symbol AAPL etc
        self.feed=feed  #symbol+timeframe, df object AAPL_1D
        self.size=len(strategy.entry_signals) #total size of data (bars in chart)
        self.position : Position | None = None  # current open position / initialized as None 
        self.positions=[]
        self.capital=capital
    def run(self):
        for i in range(self.size-1):
            if self.position is None: #no position open yet
                if self.strategy.entry_signals.iloc[i]: #check if we should open position
                    self.position=Position(entry_type=self.strategy.position_type,
                                           entry_price=self.feed["Open"].iloc[i+1],
                                           
                                           entry_time=i+1,
                                           stop_loss=self.strategy.stop_loss,
                                           take_profit=self.strategy.take_profit)
                    

            if self.position is not None: #position is open
                if self.strategy.exit_signals.iloc[i]: # exit triggered
                    self.position.exit_price=self.feed["Open"].iloc[i+1] # exit price
                    self.position.exit_time=i+1 # exit time
                    self.positions.append(self.position) # we add the position to the position list
                    self.position=None # we reset position, as we closed
                    
            
data = {
    'Open':   [100.0, 98.0, 96.0, 94.0, 92.0, 91.5, 93.0, 96.0, 100.0, 102.0, 101.0, 100.0, 99.0, 98.0, 97.0],
    'High':   [101.0, 99.0, 97.0, 95.0, 93.0, 92.5, 95.0, 99.0, 102.0, 104.0, 102.0, 101.0, 100.0, 99.0, 98.0],
    'Low':    [99.0,  97.0, 95.0, 93.0, 91.0, 90.0, 92.0, 95.0,  99.0, 101.0, 100.0,  99.0,  98.0, 97.0, 96.0],
    'Close':  [99.0,  97.0, 95.0, 93.0, 91.0, 92.0, 94.5, 98.5, 101.0, 103.0, 100.0,  99.0,  98.0, 97.0, 96.0],
    'Volume': [10000, 10000, 10000, 10000, 10000, 12000, 15000, 25000, 20000, 18000, 15000, 12000, 10000, 10000, 10000]
}
df = pd.DataFrame(data)
entry_rule="SMA(3)+3 crossesAbove SMA(5) && RSI(2) < 95 && Volume > VMA(3)"
exit_rule="Close < SMA(3)"
position_type='BUY'
entry_ast, entry_inds = parse_rule(entry_rule)
exit_ast, exit_inds   = parse_rule(exit_rule)

print("ENTRY AST:", entry_ast)
print("EXIT AST :", exit_ast)

all_inds = entry_inds | exit_inds
df = compute_indicators(df, all_inds) 
entry_signal = eval_logic(df, entry_ast) 
exit_signal = eval_logic(df, exit_ast) 
print("Entry signal:") 
print(entry_signal) 
print("Exit signal:") 
print(exit_signal)
#def __init__(self,name,entry_signal,exit_signal,position_type,
# stop_loss=None,take_profit=None,max_days=None, timeframe='1D'):
strat=Strategy(name='ENTRY '+entry_rule+'EXIT '+exit_rule,
               entry_signal=entry_signal,
               exit_signal=exit_signal,
               position_type=position_type
               )
bt=Backtester(strat,'TEST',data,10000)
bt.run()