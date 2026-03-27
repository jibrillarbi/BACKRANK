from strategy import Strategy,StrategyEvaluator
from position import Position
import pandas as pd

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
