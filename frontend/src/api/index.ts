import client from "./client"

export interface Strategy {
  NAME: string
  ENTRY: string
  EXIT: string
  DIRECTION: string
  TIMEFRAME: string
  TICKER: string
  SIZE: string
  SL: string
  TP: string
}

export const api = {
  getRoot: () => client.get("/").then(res => res.data),
  runBacktest: (strategy: Strategy) => 
    client.post("/run_back", strategy).then(res => res.data),
}