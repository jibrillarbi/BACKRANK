import pandas as pd
from .position import Position
from .stats import Stats

class Backtester:
    def __init__(self,strategy,symbol,feed: pd.DataFrame,capital):
        self.strategy=strategy # StrategyEvaluator class object
        self.symbol=symbol # symbol AAPL etc
        self.feed=feed  #symbol+timeframe, df object AAPL_1D
        self.position : Position | None = None  # current open position / initialized as None 
        self.positions=[]
        self.capital=capital
        self.equity=capital
        
        assert len(feed) == len(strategy.entry_signals) == len(strategy.exit_signals), \
        "feed, entry_signals, and exit_signals must have same length"
        self.size=len(strategy.entry_signals) #total size of data (bars in chart)
        self.equity_evolution=[None]*(self.size)
    def run(self):
        for i in range(self.size-1):
            if self.position is None: #no position open yet
                self.equity=self.capital
                self.equity_evolution[i]=self.equity #no position open
                if self.strategy.entry_signals.iloc[i]: #check if we should open position
                    self.position=Position(entry_type=self.strategy.strategy.position_type,
                                           entry_price=self.feed["Open"].iloc[i+1],
                                           lot_size=(self.capital*self.strategy.strategy.pct)/self.feed["Open"].iloc[i+1],
                                           entry_time=i+1,
                                           stop_loss=self.strategy.strategy.stop_loss,
                                           take_profit=self.strategy.strategy.take_profit)

            elif self.position is not None: #position is open


                self.position.update_value(self.feed["Close"].iloc[i])
                self.position.update_u_pnl(self.feed["Close"].iloc[i])
                self.equity=self.capital+self.position.u_pnl
                #we update equity with the capital plus unrealised pnl on the open position
                


                #first, we check if sl or tp is hit
                ep=self.check_sl_tp(i)
                # use i bcse sl / tp are intraday events (if high/low that hits on same candle)
                if  ep is not None: #either sl or tp is hit 
                    
                    self.position.close(exit_price=ep,
                                        exit_time=i)
                    self.capital+=self.position.pnl
                    self.equity=self.capital
                    self.positions.append(self.position) # we add the position to the position list
                    self.position=None # we reset position, as we closed

                #we check if exit is trigerred
                elif self.strategy.exit_signals.iloc[i]: # exit triggered
                    self.position.close(exit_price=self.feed["Open"].iloc[i+1],
                                        exit_time=i+1)
                    self.capital+=self.position.pnl
                    self.positions.append(self.position) # we add the position to the position list
                    self.position=None # we reset position, as we closed
                    
                self.equity_evolution[i]=self.equity
       

        if self.position is not None: #we still have an open position 
            self.position.close(exit_price=self.feed["Close"].iloc[-1],
                                        exit_time=self.size-1)
            self.capital+=self.position.pnl
            self.positions.append(self.position) # we add the position to the position list
            self.position=None # we reset position, as we closed
        
        self.equity=self.capital
        self.equity_evolution[-1]=self.equity
    def check_sl_tp(self,i):
        #prices for each
        open_price = self.feed["Open"].iloc[i]
        high = self.feed["High"].iloc[i]
        low = self.feed["Low"].iloc[i]
        #edge case: sl and tp trigered : we use sl
        if self.position.entry_type == 'SHORT':

            #we check sl first
            if self.position.stop_loss_price is not None:
                if self.position.sl_trigered(open_price): # we check if stop loss is triggered on open_price
                    return open_price
                elif self.position.sl_trigered(high): # we check if stop loss is triggered on high
                    return self.position.stop_loss_price 
            # we use stoplossprice because if sl wasnt hit on open_price but on high, means that price was stop_loss_price at a moment 
            if self.position.take_profit_price is not None:
                if self.position.tp_trigered(open_price): # we check if tp is triggered on open_price
                    return open_price
                elif self.position.tp_trigered(low): # we check if tp is triggered on low
                    return self.position.take_profit_price
                
        if self.position.entry_type == 'LONG':
            if self.position.stop_loss_price is not None:
                if self.position.sl_trigered(open_price): # we check if stop loss is triggered on open_price
                    return open_price
                elif self.position.sl_trigered(low): # we check if stop loss is triggered on low
                    return self.position.stop_loss_price
            if self.position.take_profit_price is not None:
                if self.position.tp_trigered(open_price): # we check if tp is triggered on open_price
                    return open_price
                elif self.position.tp_trigered(high): # we check if tp is triggered on high
                    return self.position.take_profit_price 

        return None
    def create_stats(self):
        s=Stats(self.equity_evolution,self.positions,self.strategy.strategy.timeframe)
        s.print_stats()
        return s
