import { Routes, Route } from "react-router-dom"
import { StrategyProvider } from "./contexts/StrategyContext"
import DeployStrategyPage from "./pages/DeployStrategyPage"
import StrategyPage from "./pages/StrategyPage"
import BacktestResultsPage from "./pages/BacktestResultsPage"
import Test from "./pages/Test"
function App() {
  return (
    <Routes>
      <Route path="/" element={
        <StrategyProvider>
          <DeployStrategyPage />
        </StrategyProvider>
      } />
      <Route path="/strategy" element={
        <StrategyProvider>
          <StrategyPage />
        </StrategyProvider>
      } />
      <Route path="/backtest-results" element={
        <BacktestResultsPage />
      } />
      <Route path="/test" element={
        <Test /> 
      }/> 

    </Routes>
  )
}

export default App