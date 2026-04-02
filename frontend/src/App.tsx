import { Routes, Route } from "react-router-dom"
import { StrategyProvider } from "./contexts/StrategyContext"
import DeployStrategyPage from "./pages/DeployStrategyPage"
import StrategyPage from "./pages/StrategyPage"
import BacktestResultsPage from "./pages/BacktestResultsPage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import Test from "./pages/Test"
import LogoutPage from "./pages/LogoutPage"
function App() {
  return (
    <Routes>
      <Route path="/login" element={
        <LoginPage />
      } />
      <Route path="/logout" element={
        <LogoutPage />
      } />
      <Route path="/register" element={
        <RegisterPage />
      } />
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