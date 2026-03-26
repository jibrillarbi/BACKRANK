import { Routes, Route } from "react-router-dom"
import DeployStrategyPage from "./pages/DeployStrategyPage"
import StrategyPage from "./pages/StrategyPage"
function App() {
  return (
    <Routes>
      <Route path="/" element={<DeployStrategyPage />} />
      <Route path='/strategy' element={<StrategyPage />} />
      <Route path='/strategy' element={<StrategyPage />} />
    </Routes>
  )
}

export default App