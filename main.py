import pandas as pd
from parser import parse_rule
from indicators import compute_indicators
from evaluator import eval_logic


class Strategy: 
    def __init__(self,name,entry_signal,exit_signal,position_type,pct,stop_loss=1,take_profit=1,max_days=None, timeframe='1D'):
        self.name=name # Strategy name 
        self.entry_signals = entry_signal # df with true / false
        self.exit_signals = exit_signal #df with true / false
        self.stop_loss = stop_loss 
        self.take_profit = take_profit
        self.position_type = position_type #LONG or SHORT
        self.max_days=max_days # max holding days
        self.timeframe=timeframe # timeframe
        self.pct=pct#percentage of equity used for each trade

class Position: 
    def __init__(self,entry_type,entry_price,entry_time,lot_size,stop_loss=1,take_profit=1):
        self.entry_type=entry_type #LONG or SHORT 
        self.entry_price=entry_price
        self.lot_size=lot_size
        self.exit_price=None
        self.entry_time=entry_time
        self.exit_time=None
        self.stop_loss=stop_loss
        self.take_profit=take_profit
        self.stop_loss_price=self.stop_loss_calc()
        self.take_profit_price=self.take_profit_calc()
        self.open=True
        self.pnl=0
        
    def stop_loss_calc(self):
        if self.stop_loss is not None: 
            if self.entry_type=='LONG':
                return self.entry_price*(1-self.stop_loss)
            elif self.entry_type=='SHORT':
                return self.entry_price*(1+self.stop_loss)
            else: 
                raise ValueError(
            f"Error when calculating stop loss, expected LONG or SHORT, got {self.entry_type})")
        return None
    def take_profit_calc(self):
        if self.take_profit is not None: 
            if self.entry_type=='LONG':
                return self.entry_price*(1+self.take_profit)
            elif self.entry_type=='SHORT':
                return self.entry_price*(1-self.take_profit)
            else: 
                raise ValueError(
            f"Error when calculating take_profit, expected LONG or SHORT, got {self.entry_type})")
        return None
    def sl_trigered(self,price):
        if self.stop_loss_price is None:
            raise ValueError(
            f"Error when calculating sl_trigerred, stop_loss_price is None")
        if self.entry_type=='LONG':
                return price<=self.stop_loss_price # price goes under sl
        elif self.entry_type=='SHORT':
            return price>=self.stop_loss_price #price goes over sl 
        else:
            raise ValueError(
            f"Error when calculating sl_trigered, expected LONG or SHORT, got {self.entry_type})")
    def tp_trigered(self,price):
        if self.take_profit_price is None:
            raise ValueError(
            f"Error when calculating tp_trigerred, take_profit_price is None")
        if self.entry_type=='LONG':
                return price>=self.take_profit_price
        elif self.entry_type=='SHORT':
            return price<=self.take_profit_price
        else:
            raise ValueError(
            f"Error when calculating tp_trigered, expected LONG or SHORT, got {self.entry_type})")
    def get_pnl(self): 
        if self.open==True:
            raise RuntimeError(
            f"position is still open")
        if self.exit_price is None: 
            raise ValueError(
            f"Exit price not defined")
        if self.entry_type=='LONG':
            return self.lot_size*(self.exit_price-self.entry_price)
            
        elif self.entry_type=='SHORT':
            return self.lot_size*(self.entry_price-self.exit_price)
        else: 
            raise ValueError(
            f"when calculating get_pnl expected LONG or SHORT, got {self.entry_type})")
    def close(self,exit_price,exit_time):
        self.exit_price=exit_price
        self.exit_time=exit_time
        self.open=False
        self.pnl=self.get_pnl()


class Backtester:
    def __init__(self,strategy:Strategy,symbol,feed: pd.DataFrame,capital):
        self.strategy=strategy # Strategy class object
        self.symbol=symbol # symbol AAPL etc
        self.feed=feed  #symbol+timeframe, df object AAPL_1D
        self.size=len(strategy.entry_signals) #total size of data (bars in chart)
        self.position : Position | None = None  # current open position / initialized as None 
        self.positions=[]
        self.capital=capital
        assert len(feed) == len(strategy.entry_signals) == len(strategy.exit_signals), \
        "feed, entry_signals, and exit_signals must have same length"
        self.size=len(strategy.entry_signals) #total size of data (bars in chart)
    def run(self):
        for i in range(self.size-1):
            if self.position is None: #no position open yet
                if self.strategy.entry_signals.iloc[i]: #check if we should open position
                    self.position=Position(entry_type=self.strategy.position_type,
                                           entry_price=self.feed["Open"].iloc[i+1],
                                           lot_size=(self.capital*self.strategy.pct)/self.feed["Open"].iloc[i+1],
                                           entry_time=i+1,
                                           stop_loss=self.strategy.stop_loss,
                                           take_profit=self.strategy.take_profit)
                    

            elif self.position is not None: #position is open
                ep=self.check_sl_tp(i)
                # use i bcse sl / tp are intraday events (if high/low that hits on same candle)
                if  ep is not None: #either sl or tp is hit 
                    
                    self.position.close(exit_price=ep,
                                        exit_time=i)
                    self.capital+=self.position.pnl
                    self.positions.append(self.position) # we add the position to the position list
                    self.position=None # we reset position, as we closed


                elif self.strategy.exit_signals.iloc[i]: # exit triggered
                    self.position.close(exit_price=self.feed["Open"].iloc[i+1],
                                        exit_time=i+1)
                    self.capital+=self.position.pnl
                    self.positions.append(self.position) # we add the position to the position list
                    self.position=None # we reset position, as we closed

       

        if self.position is not None: #we still have an open position 
            self.position.close(exit_price=self.feed["Close"].iloc[-1],
                                        exit_time=self.size-1)
            self.capital+=self.position.pnl
            self.positions.append(self.position) # we add the position to the position list
            self.position=None # we reset position, as we closed

    def check_sl_tp(self,i):
        #prices for each
        open_price = self.feed["Open"].iloc[i]
        high = self.feed["High"].iloc[i]
        low = self.feed["Low"].iloc[i]
        #edge case: sl and tp trigered : we use sl
        if self.position.entry_type == 'SHORT':

            #we check sl first 
            if self.position.sl_trigered(open_price): # we check if stop loss is triggered on open_price
                return open_price
            elif self.position.sl_trigered(high): # we check if stop loss is triggered on high
                return self.position.stop_loss_price 
            # we use stoplossprice because if sl wasnt hit on open_price but on high, means that price was stop_loss_price at a moment 
            elif self.position.tp_trigered(open_price): # we check if tp is triggered on open_price
                return open_price
            elif self.position.tp_trigered(low): # we check if tp is triggered on low
                return self.position.take_profit_price
            
        if self.position.entry_type == 'LONG':
            if self.position.sl_trigered(open_price): # we check if stop loss is triggered on open_price
                return open_price
            elif self.position.sl_trigered(low): # we check if stop loss is triggered on low
                return self.position.stop_loss_price
            elif self.position.tp_trigered(open_price): # we check if tp is triggered on open_price
                return open_price
            elif self.position.tp_trigered(high): # we check if tp is triggered on high
                return self.position.take_profit_price 

        return None

    def stats(self):
        total_pnl=0
        for position in self.positions:
            total_pnl+=position.pnl
        print('Final Capital: '+str(self.capital)+ ' \nTotal PNL: '+ str(total_pnl))


            
data = {
    'Open':   [100.0, 98.0, 96.0, 94.0, 92.0, 91.5, 93.0, 96.0, 100.0, 102.0, 101.0, 100.0, 99.0, 98.0, 97.0],
    'High':   [101.0, 99.0, 97.0, 95.0, 93.0, 92.5, 95.0, 99.0, 102.0, 104.0, 102.0, 101.0, 100.0, 99.0, 98.0],
    'Low':    [99.0,  97.0, 95.0, 93.0, 91.0, 90.0, 92.0, 95.0,  99.0, 101.0, 100.0,  99.0,  98.0, 97.0, 96.0],
    'Close':  [99.0,  97.0, 95.0, 93.0, 91.0, 92.0, 94.5, 98.5, 101.0, 103.0, 100.0,  99.0,  98.0, 97.0, 96.0],
    'Volume': [10000, 10000, 10000, 10000, 10000, 12000, 15000, 25000, 20000, 18000, 15000, 12000, 10000, 10000, 10000]
}
df = pd.DataFrame(data)
entry_rule="SMA(2) > SMA(4) && Volume > VMA(3)"
exit_rule="Close < SMA(2)"
position_type='LONG'
entry_ast, entry_inds = parse_rule(entry_rule)
exit_ast, exit_inds   = parse_rule(exit_rule)

print("ENTRY AST:", entry_ast)
print("EXIT AST :", exit_ast)

all_inds = entry_inds | exit_inds
df = compute_indicators(df, all_inds) 
entry_signal = eval_logic(df, entry_ast).fillna(False)


exit_signal = eval_logic(df, exit_ast).fillna(False)
print("Entry signal:") 
print(entry_signal) 
print("Exit signal:") 
print(exit_signal)
#def __init__(self,name,entry_signal,exit_signal,position_type,
# stop_loss=None,take_profit=None,max_days=None, timeframe='1D'):
strat=Strategy(name='ENTRY '+entry_rule+'EXIT '+exit_rule,
               entry_signal=entry_signal,
               exit_signal=exit_signal,
               position_type=position_type,
               pct=0.02,
               take_profit=0.01,
               stop_loss=0.01
               )
bt=Backtester(strat,'TEST',df,10000)
bt.run()
bt.stats()