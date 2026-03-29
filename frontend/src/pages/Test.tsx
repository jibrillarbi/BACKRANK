import React, { useState } from 'react'
import { api, type Strategy } from "../api"

const Test = () => {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRun = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const strategy: Strategy = {
        NAME: "My Strategy",
        ENTRY: "SMA(2) > SMA(4) && Volume > VMA(3)",
        EXIT: "Close < SMA(2)",
        DIRECTION: "LONG",
        TIMEFRAME: "1D",
        TICKER: "AAPL",
        SIZE: "5",
        SL: "None",
        TP: "None",
      }
      
      const data = await api.runBacktest(strategy)
      setResults(data)
      console.log(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run backtest")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={handleRun} disabled={loading}>
        {loading ? "Running..." : "Run Backtest"}
      </button>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {results && <pre>{JSON.stringify(results, null, 2)}</pre>}
    </div>
  )
}

export default Test