import { Routes, Route } from "react-router-dom"
import CalcPage from "./pages/DeployStrategyPage"
import StrategyPage from "./pages/StrategyPage"
function App() {
  return (
    <Routes>
      <Route path="/" element={<CalcPage />} />
      <Route path='/strategy' element={<StrategyPage />} />
    </Routes>
  )
}

export default App