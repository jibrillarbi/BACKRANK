from backtester.strategy import Strategy,StrategyEvaluator
from backtester.position import Position
import pandas as pd
import math
import numpy as np

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
                                           entry_price=self.feed["open"].iloc[i+1],
                                           lot_size=(self.capital*self.strategy.strategy.pct)/self.feed["open"].iloc[i+1],
                                           entry_time=i+1,
                                           stop_loss=self.strategy.strategy.stop_loss,
                                           take_profit=self.strategy.strategy.take_profit)

            elif self.position is not None: #position is open


                self.position.update_value(self.feed["close"].iloc[i])
                self.position.update_u_pnl(self.feed["close"].iloc[i])
                self.equity=self.capital+self.position.u_pnl
                #we update equity with the capital plus unrealised pnl on the open position
                


                #first, we check if sl or tp is hit
                exit_hit=self.check_sl_tp(i)
                # use i bcse sl / tp are intraday events (if high/low that hits on same candle)
                if  exit_hit is not None: #either sl or tp is hit 
                    ep, exit_reason = exit_hit
                    
                    self.position.close(exit_price=ep,
                                        exit_time=i,
                                        exit_reason=exit_reason)
                    self.capital+=self.position.pnl
                    self.equity=self.capital
                    self.positions.append(self.position) # we add the position to the position list
                    self.position=None # we reset position, as we closed

                #we check if exit is trigerred
                elif self.strategy.exit_signals.iloc[i]: # exit triggered
                    self.position.close(exit_price=self.feed["open"].iloc[i+1],
                                        exit_time=i+1,
                                        exit_reason="Exit Signal")
                    self.capital+=self.position.pnl
                    self.positions.append(self.position) # we add the position to the position list
                    self.position=None # we reset position, as we closed
                    
                self.equity_evolution[i]=self.equity
       

        if self.position is not None: #we still have an open position 
            self.position.close(exit_price=self.feed["close"].iloc[-1],
                                        exit_time=self.size-1,
                                        exit_reason="End of Backtest")
            self.capital+=self.position.pnl
            self.positions.append(self.position) # we add the position to the position list
            self.position=None # we reset position, as we closed
        
        self.equity=self.capital
        self.equity_evolution[-1]=self.equity
    def check_sl_tp(self,i):
        #prices for each
        open_price = self.feed["open"].iloc[i]
        high = self.feed["high"].iloc[i]
        low = self.feed["low"].iloc[i]
        #edge case: sl and tp trigered : we use sl
        if self.position.entry_type == 'SHORT':

            #we check sl first
            if self.position.stop_loss_price is not None:
                if self.position.sl_trigered(open_price): # we check if stop loss is triggered on open_price
                    return open_price, "Stop Loss"
                elif self.position.sl_trigered(high): # we check if stop loss is triggered on high
                    return self.position.stop_loss_price, "Stop Loss"
            # we use stoplossprice because if sl wasnt hit on open_price but on high, means that price was stop_loss_price at a moment 
            if self.position.take_profit_price is not None:
                if self.position.tp_trigered(open_price): # we check if tp is triggered on open_price
                    return open_price, "Take Profit"
                elif self.position.tp_trigered(low): # we check if tp is triggered on low
                    return self.position.take_profit_price, "Take Profit"
                
        if self.position.entry_type == 'LONG':
            if self.position.stop_loss_price is not None:
                if self.position.sl_trigered(open_price): # we check if stop loss is triggered on open_price
                    return open_price, "Stop Loss"
                elif self.position.sl_trigered(low): # we check if stop loss is triggered on low
                    return self.position.stop_loss_price, "Stop Loss"
            if self.position.take_profit_price is not None:
                if self.position.tp_trigered(open_price): # we check if tp is triggered on open_price
                    return open_price, "Take Profit"
                elif self.position.tp_trigered(high): # we check if tp is triggered on high
                    return self.position.take_profit_price, "Take Profit"

        return None
    def create_stats(self):
        dates = self.feed.index.tolist()
        s=Stats(self.equity_evolution,self.positions,self.strategy.strategy.timeframe,dates,self.feed)
        s.print_stats()
        return s.get_stats_dict()
        
    
class Stats:
    def __init__(self, equity_evolution,positions,timeframe,dates=None,feed=None):
        self.equity_evolution=equity_evolution
        self.positions=positions
        self.initial_capital=self.equity_evolution[0]
        self.timeframe=timeframe
        self.dates=dates
        self.feed=feed
        self.pct_change=self.get_pct()
        self.ann_periods=self.get_periods()
    def get_stats_dict(self):
        if self.n_trades() == 0:
            return self.get_empty_stats_dict()

        stats = {
            'pnl': self.get_pnl(),
            'avg_returns': self.get_avg_return(),
            'time_in_years': self.time_in_years(),
            'total_time_in_market_bars': self.total_time_in_market(),
            'total_time_in_market_years': self.total_time_in_market_years(),
            'cagr': self.CAGR(),
            'max_drawdown': self.max_drawdown(),
            'avg_drawdown': self.avg_drawdown(),
            'calmar': self.calmar(),
            'volatility': self.volatility(),
            'sharpe_ratio': self.sharpe(),
            'annual_sharpe': self.ann_sharpe(),
            'downside_deviation': self.get_downside_dev(),
            'sortino': self.sortino(),
            'annual_sortino': self.ann_sortino(),
            'number_of_trades': self.n_trades(),
            'win_rate': self.win_rate(),
            'avg_win': self.avg_win(),
            'avg_loss': self.avg_loss(),
            'profit_factor': self.profit_factor(),
            'expectancy': self.expectancy(),
            'avg_trade_duration': self.avg_trade_duration(),
            'exposure': self.exposure(),
            'deployment_score': self.calculate_deployment_score(),
            'dates': [str(d) for d in self.dates] if self.dates is not None else None,
            'equity_evolution': self.equity_evolution,
            'positions': [self.format_position(pos) for pos in self.positions],
            'position_data': [self.serialize_position(pos, idx) for idx, pos in enumerate(self.positions)],
            'candles': self.serialize_candles()
        }
        return {key: self.clean_metric(value) for key, value in stats.items()}

    def get_empty_stats_dict(self):
        return {
            'pnl': 0,
            'avg_returns': 0,
            'time_in_years': self.safe_time_in_years(),
            'total_time_in_market_bars': 0,
            'total_time_in_market_years': 0,
            'cagr': 0,
            'max_drawdown': 0,
            'avg_drawdown': 0,
            'calmar': 0,
            'volatility': 0,
            'sharpe_ratio': 0,
            'annual_sharpe': 0,
            'downside_deviation': 0,
            'sortino': 0,
            'annual_sortino': 0,
            'number_of_trades': 0,
            'win_rate': 0,
            'avg_win': 0,
            'avg_loss': 0,
            'profit_factor': 0,
            'expectancy': 0,
            'avg_trade_duration': 0,
            'exposure': 0,
            'deployment_score': 0,
            'dates': [str(d) for d in self.dates] if self.dates is not None else None,
            'equity_evolution': [self.clean_metric(value) for value in self.equity_evolution],
            'positions': [],
            'position_data': [],
            'candles': self.serialize_candles()
        }

    def clean_metric(self, value):
        if isinstance(value, np.generic):
            return self.clean_metric(value.item())
        if isinstance(value, float) and not math.isfinite(value):
            return 0
        if isinstance(value, list):
            return [self.clean_metric(item) for item in value]
        if isinstance(value, dict):
            return {key: self.clean_metric(item) for key, item in value.items()}
        return value

    def safe_time_in_years(self):
        if self.ann_periods == 0:
            return 0
        return len(self.pct_change) / self.ann_periods

    def serialize_candles(self):
        if self.feed is None:
            return []

        candles = []
        for idx, (date, row) in enumerate(self.feed.iterrows()):
            candles.append({
                'index': idx,
                'time': str(date),
                'open': float(row['open']),
                'high': float(row['high']),
                'low': float(row['low']),
                'close': float(row['close']),
                'volume': float(row['volume']) if 'volume' in row and pd.notna(row['volume']) else None
            })
        return candles

    def serialize_position(self, pos, idx):
        entry_date = None
        exit_date = None

        if self.dates and isinstance(self.dates, list) and len(self.dates) > 0:
            if 0 <= pos.entry_time < len(self.dates):
                entry_date = str(self.dates[pos.entry_time])
            if 0 <= pos.exit_time < len(self.dates):
                exit_date = str(self.dates[pos.exit_time])

        invested = pos.entry_price * pos.lot_size
        return_pct = (pos.pnl / invested) * 100 if invested else 0

        return {
            'id': idx + 1,
            'side': pos.entry_type,
            'entry_index': pos.entry_time,
            'exit_index': pos.exit_time,
            'entry_time': entry_date,
            'exit_time': exit_date,
            'entry_price': float(pos.entry_price),
            'exit_price': float(pos.exit_price),
            'lot_size': float(pos.lot_size),
            'pnl': float(pos.pnl),
            'return_pct': float(return_pct),
            'duration_bars': pos.exit_time - pos.entry_time,
            'exit_reason': pos.exit_reason
        }
    
    def format_position(self, pos):
        entry_date = 'N/A'
        exit_date = 'N/A'
        
        if self.dates and isinstance(self.dates, list) and len(self.dates) > 0:
            if 0 <= pos.entry_time < len(self.dates):
                entry_date = str(self.dates[pos.entry_time])
            if 0 <= pos.exit_time < len(self.dates):
                exit_date = str(self.dates[pos.exit_time])
        
        return (
            f"Position({pos.entry_type}) | "
            f"Open: {entry_date} @ {pos.entry_price:.2f} | "
            f"Exit: {exit_date} @ {pos.exit_price:.2f} | "
            f"PNL: {pos.pnl:.2f}"
        )
    
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
    
    def total_time_in_market(self):
        if len(self.positions) == 0:
            return 0
        total_bars = 0
        for pos in self.positions:
            total_bars += (pos.exit_time - pos.entry_time)
        return total_bars
    
    def total_time_in_market_years(self):
       
        total_bars = self.total_time_in_market()
        return total_bars / self.ann_periods
    
    def time_in_market_per_position(self):
       
        positions_data = []
        for idx, pos in enumerate(self.positions):
            duration = pos.exit_time - pos.entry_time
            positions_data.append({
                'position': idx + 1,
                'entry_time': pos.entry_time,
                'exit_time': pos.exit_time,
                'duration_bars': duration,
                'pnl': pos.pnl
            })
        return positions_data
    
    def calculate_deployment_score(self):
        total_trades = self.n_trades()
        if total_trades == 0:
            return 0

        sharpe = max(0, self.sharpe())
        cagr = max(0, self.CAGR() * 100)
        max_dd = self.max_drawdown() * 100
        profit_factor = max(0, self.profit_factor())
        expectancy = max(0, self.expectancy())

        score = 0
        score += min(sharpe / 2, 1) * 30
        score += min(cagr / 30, 1) * 25
        score += min(profit_factor / 2, 1) * 20
        score += max(0, 1 - max_dd / 40) * 20
        score += min(total_trades / 50, 1) * 5

        return round(max(0, min(score, 100)), 2)

