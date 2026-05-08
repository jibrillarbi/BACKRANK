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
        self.exit_reason=None
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
        
    def close(self,exit_price,exit_time,exit_reason=None):
        self.exit_price=exit_price
        self.exit_time=exit_time
        self.exit_reason=exit_reason
        self.open=False
        self.update_value(exit_price)
        self.pnl=self.get_pnl()
    
    def __str__(self):
        return (
            f"Position({self.entry_type}) | "
            f"Open: {self.entry_time} @ {self.entry_price:.2f} | "
            f"Exit: {self.exit_time} @ {self.exit_price:.2f} | "
            f"PNL: {self.pnl:.2f}"
        )
