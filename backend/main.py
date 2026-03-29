from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backtester.main_backtester import run_backtest
from pydantic import BaseModel
from typing import List
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class StrategyIn(BaseModel):
    NAME: str
    ENTRY: str
    EXIT: str
    DIRECTION: str
    TIMEFRAME: str
    TICKER: str
    SIZE: str
    SL: str
    TP: str
@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}

@app.post("/run_back")
def get_strategy_evaluation(strategy: StrategyIn):
    results = run_backtest(strategy.model_dump())
    return results