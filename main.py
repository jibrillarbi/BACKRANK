import pandas as pd
from parser import parse_rule
from indicators import compute_indicators
from evaluator import eval_logic
from backtesting.test import GOOG
class Strategy: 
    def __init__(self,name,entry_rule,exit_rule,position_type,pct,stop_loss=None,take_profit=None, timeframe='1D'):
        self.name=name # Strategy name 
        self.entry_rule = entry_rule # str of entry rule, e.g. "SMA(2) > SMA(4) && Volume > VMA(3)"
        self.exit_rule = exit_rule #str of exit rule, e.g. "Close < SMA(2)"
        self.stop_loss = stop_loss #percentage based stop loss
        self.take_profit = take_profit #percentage based tp 
        self.position_type = position_type #LONG or SHORT
        self.timeframe=timeframe # timeframe
        self.pct=pct#percentage of equity used for each trade
class StrategyEvaluator():
    def __init__(self, strategy: Strategy, feed: pd.DataFrame):
        self.strategy=strategy
        self.feed = feed
        self.entry_signals,self.exit_signals=self.evaluate_entry_exit()


    def evaluate_entry_exit(self):
        entry_ast, entry_inds = parse_rule(self.strategy.entry_rule)
        exit_ast, exit_inds   = parse_rule(self.strategy.exit_rule)
        all_inds = entry_inds | exit_inds
        df = compute_indicators(self.feed, all_inds) 
        entry_signal = eval_logic(df, entry_ast).fillna(False)
        exit_signal = eval_logic(df, exit_ast).fillna(False)
        return entry_signal, exit_signal
    
class Position: 
    def __init__(self,entry_type,entry_price,entry_time,lot_size,stop_loss=None,take_profit=None):
        self.entry_type=entry_type #LONG or SHORT 
        self.entry_price=entry_price #entry lot price
        self.lot_size=lot_size
        self.exit_price=None # exit lot price
        self.entry_time=entry_time # entry candle on df
        self.exit_time=None #exit candle on df
        self.stop_loss=stop_loss #stop loss in percentage
        self.take_profit=take_profit #take profit in percentage
        self.stop_loss_price=self.stop_loss_calc() # lot price of stop loss
        self.take_profit_price=self.take_profit_calc() #lot price of take profit
        self.open=True
        self.pnl=0 #pnl, updated when closed
        self.u_pnl=0 # unrealised pnl
        self.value=self.lot_size*entry_price
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
    def update_value(self,price):
        self.value=self.lot_size*price
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
    def update_u_pnl(self,price):
        #function that updates unrealized pnl based on price at a given time 
        if self.open==False:
            raise RuntimeError(
            f"position is closed")
        if price is None: 
            raise ValueError(
            f"Exit price not defined")
        if self.entry_type=='LONG':
            self.u_pnl=self.lot_size*(price-self.entry_price)
            
        elif self.entry_type=='SHORT':
            self.u_pnl=self.lot_size*(self.entry_price-price)
        else: 
            raise ValueError(
            f"when calculating get_pnl expected LONG or SHORT, got {self.entry_type})")
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
        self.update_value(exit_price)
        self.pnl=self.get_pnl()


class Backtester:
    def __init__(self,strategy:StrategyEvaluator,symbol,feed: pd.DataFrame,capital):
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

class Stats:
    def __init__(self, equity_evolution,positions,timeframe):
        self.equity_evolution=equity_evolution
        self.positions=positions
        self.initial_capital=self.equity_evolution[0]
        self.timeframe=timeframe
        self.pct_change=self.get_pct()
        self.ann_periods=self.get_periods()
    def print_stats(self):
        print('PNL : ',self.get_pnl())
        print('Avg Returns : ',self.get_avg_return())
        print('Time in Market (in Years)', self.time_in_years())
        print('CAGR : ',self.CAGR())
        print('Max Drawdown', self.max_drawdown())
        print('Avg Drawdown : ', self.avg_drawdown())
        print('Calmar : ',self.calmar())
        print('Volatility : ', self.volatility())
        print('Sharpe Ratio: ', self.sharpe())
        print('Annual Sharpe: ',self.ann_sharpe())
        print('Downside deviation: ',self.get_downside_dev())
        print('Sortino :',self.sortino())
        print('Annual Sortino: ',self.ann_sortino())
        print('Number of Trades: ', self.n_trades())
        print('Win Rate : ', self.win_rate())
        print('Avg Win: ', self.avg_win())
        print('Avg Loss: ', self.avg_loss())
        print('Profit Factor: ', self.profit_factor())
        print('Expectancy: ', self.expectancy())
        print('Avg Trade Duration: ', self.avg_trade_duration())
        print('Exposure: ', self.exposure())
    def time_in_years(self):
        return len(self.pct_change) /self.ann_periods
    def get_pnl(self):
        return self.equity_evolution[-1]-self.equity_evolution[0]
    def CAGR(self):
        x=self.equity_evolution[-1]/ self.initial_capital
        return x**(1/self.time_in_years()) - 1

    def calmar(self):
        m_dd=self.max_drawdown()
        if m_dd==0:
            return 10
        return self.CAGR()/m_dd
    def drawdown(self):
        peak=self.equity_evolution[0]
        drawdown=[0]*len(self.equity_evolution)
        for i in range(len(self.equity_evolution)):
            if self.equity_evolution[i]>peak:
                peak=self.equity_evolution[i]
            d=(self.equity_evolution[i]-peak)/peak
            drawdown[i]=min(0,d)
        return drawdown
    def max_drawdown(self):
        return min(self.drawdown())*-1
    def avg_drawdown(self):
        dd=self.drawdown()
        dd=[i for i in dd if i<0]
        if len(dd) == 0:
            return 0
        return abs(sum(dd)/len(dd))
    def get_pct(self):
        pct = []
        for i in range(1, len(self.equity_evolution)):
            x = self.equity_evolution[i]
            y = self.equity_evolution[i-1]
            pct.append((x - y) / y)
        return pct
    def get_avg_return(self):
        return sum(self.pct_change)/len(self.pct_change)
    def get_downside_dev(self,rf=0.03):
        n=self.ann_periods
        rf_p=rf/n

        ddev=[i-rf_p for i in self.pct_change]
        ddev=[min(i,0) for i in ddev]
        ddev=[i**2 for i in ddev]
        return (sum(ddev)/len(ddev)) ** (1/2)
    def volatility(self):
        mean=self.get_avg_return()
        dev=[(i-mean)**2 for i in self.pct_change]
        return (sum(dev)/(len(dev)-1))**(1/2)
    def sharpe(self,rf=0.03):
        r=self.get_avg_return()
        vol=self.volatility()
        if vol==0: 
            return 99
        sh=(
            r
            -(rf/self.get_periods())) / vol
        return sh
    def ann_sharpe(self,rf=0.03):
        return self.sharpe(rf)*((self.get_periods())**(1/2))
    def sortino(self,rf=0.03):
        r=self.get_avg_return()
        n=self.ann_periods
        rf_p=rf/n
        dd=self.get_downside_dev()
        if dd==0:
            return 99
        return (r-rf_p)/self.get_downside_dev()
    def ann_sortino(self,rf=0.03):
        return self.sortino() * (self.ann_periods**(1/2))
    def get_periods(self):
        periods_map = {
            '1m': 252 * 390,
            '5m': 252 * 78,
            '15m': 252 * 26,
            '30m': 252 * 13,
            '1h': 252 * 6.5,
            '4h': 252 * 1.625,
            '1D': 252,
            '1W': 52,
            '1M': 12
        }
        return periods_map[self.timeframe]
    
    def n_trades(self):
        return len(self.positions)
    
    def get_wins(self):
        return [i for i in self.positions if i.pnl>0]
    
    def get_losses(self):
        return [i for i in self.positions if i.pnl<0]
    
    def win_rate(self):
        if len(self.positions)==0:
            return 0
        return (len(self.get_wins())/len(self.positions))*100
    
    def avg_win(self):
        wins=self.get_wins()
        if len(wins)==0:
            return 0
        return sum([i.pnl for i in wins])/len(wins)
    
    def avg_loss(self):
        losses=self.get_losses()
        if len(losses)==0:
            return 0
        return sum([i.pnl for i in losses])/len(losses)
    
    def profit_factor(self):
        total_wins=sum([i.pnl for i in self.get_wins()])
        total_losses=abs(sum([i.pnl for i in self.get_losses()]))
        if total_losses==0:
            return 999
        return total_wins/total_losses
    
    def expectancy(self):
        if len(self.positions)==0:
            return 0
        return sum([i.pnl for i in self.positions])/len(self.positions)
    
    def avg_trade_duration(self):
        if len(self.positions)==0:
            return 0
        total_duration=0
        for pos in self.positions:
            total_duration+=(pos.exit_time - pos.entry_time)
        return total_duration/len(self.positions)
    
    def exposure(self):
        if len(self.positions)==0:
            return 0
        total_bars_in_market=0
        for pos in self.positions:
            total_bars_in_market+=(pos.exit_time - pos.entry_time)
        return (total_bars_in_market/len(self.equity_evolution))*100


data = {
    'Open':   [100.0, 98.0, 96.0, 94.0, 92.0, 91.5, 93.0, 96.0, 100.0, 102.0, 101.0, 100.0, 99.0, 98.0, 97.0],
    'High':   [101.0, 99.0, 97.0, 95.0, 93.0, 92.5, 95.0, 99.0, 102.0, 104.0, 102.0, 101.0, 100.0, 99.0, 98.0],
    'Low':    [99.0,  97.0, 95.0, 93.0, 91.0, 90.0, 92.0, 95.0,  99.0, 101.0, 100.0,  99.0,  98.0, 97.0, 96.0],
    'Close':  [99.0,  97.0, 95.0, 93.0, 91.0, 92.0, 94.5, 98.5, 101.0, 103.0, 100.0,  99.0,  98.0, 97.0, 96.0],
    'Volume': [10000, 10000, 10000, 10000, 10000, 12000, 15000, 25000, 20000, 18000, 15000, 12000, 10000, 10000, 10000]
}

entry_rule="SMA(2) > SMA(4) && Volume > VMA(3)"
exit_rule="Close < SMA(2)"
position_type='LONG'
entry_ast, entry_inds = parse_rule(entry_rule)
exit_ast, exit_inds   = parse_rule(exit_rule)

strat=Strategy(name='ENTRY '+entry_rule+'EXIT '+exit_rule,
               entry_rule=entry_rule,
               exit_rule=exit_rule,
               position_type=position_type,
               pct=0.02,
               take_profit=0.1,
               stop_loss=0.05
               )
strat_eval=StrategyEvaluator(strat,GOOG)
bt=Backtester(strat_eval,'TEST',GOOG,1000000)
bt.run()
s=bt.create_stats()
'''
x=[1000]*1638
x[-7:-1]=[1100,1050,1200,1150,1300]
x[-1]=1300
t=[1100,1050,1200,1150,1300]
s=Stats(t,None,'1h')
s.print_stats()
'''