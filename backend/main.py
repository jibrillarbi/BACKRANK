from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backtester.main_backtester import run_backtest
from pydantic import BaseModel
from typing import List
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class Results(BaseModel):
    name: str
@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}
@app.get("/run_backtest")
def get_strategy_evaluation():
    results = run_backtest(    strategy = {
        "NAME": "My Strategy",
        "ENTRY": "SMA(2) > SMA(4) && Volume > VMA(3)",
        "EXIT": "Close < SMA(2)",
        "DIRECTION": "LONG",
        "TIMEFRAME": "1D",
        "TICKER": "AAPL",
        "SIZE": "5",
        "SL": "None",
        "TP": "None",
    })
    return {results}