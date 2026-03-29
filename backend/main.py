from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backtester.main_backtester import run_backtest

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}
@app.get("/run_backtest")
def get_strategy_evaluation():
    results = run_backtest()
    return {"evaluation": "Strategy evaluation results"}