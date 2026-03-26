import { Routes, Route } from "react-router-dom"
import { StrategyProvider } from "./contexts/StrategyContext"
import DeployStrategyPage from "./pages/DeployStrategyPage"
import StrategyPage from "./pages/StrategyPage"

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
    </Routes>
  )
}

export default App