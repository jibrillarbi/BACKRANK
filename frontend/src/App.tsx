import { Routes, Route } from "react-router-dom"
import { StrategyProvider } from "./contexts/StrategyContext"
import Navbar from "./components/Navbar"
import LandingPage from "./pages/LandingPage"
import DashboardPage from "./pages/DashboardPage"
import MyStrategiesPage from "./pages/MyStrategiesPage"
import DeployStrategyPage from "./pages/DeployStrategyPage"
import StrategyPage from "./pages/StrategyPage"
import BacktestResultsPage from "./pages/BacktestResultsPage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import Test from "./pages/Test"
import LogoutPage from "./pages/LogoutPage"
import UserProfilePage from "./pages/UserProfilePage"
import ExplorePage from "./pages/ExplorePage"
import LeaderboardPage from "./pages/LeaderboardPage"
import SettingsPage from "./pages/SettingsPage"
import NotificationsPage from "./pages/NotificationsPage"
function App() {
  return (
    <div className="text-base-content">
      <Navbar />
      <Routes>
        <Route path="/landing" element={
          <LandingPage />
        } />
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
          <DashboardPage />
        } />
        <Route path="/strategies" element={
          <MyStrategiesPage />
        } />
        <Route path="/strategy/edit" element={
          <div className="mt-16">
            <StrategyProvider>
              <StrategyPage />
            </StrategyProvider>
          </div>
        } />
        <Route path="/strategy" element={
          <div className="mt-16">
            <StrategyProvider>
              <DeployStrategyPage />
            </StrategyProvider>
          </div>
        } />
        <Route path="/profile/:username" element={
          <UserProfilePage />
        } />
        <Route path="/backtest-results" element={
          <div className="mt-16">
            <StrategyProvider>
              <BacktestResultsPage />
            </StrategyProvider>
          </div>
        } />
        <Route path="/explore" element={
          <ExplorePage />
        } />
        <Route path="/leaderboard" element={
          <LeaderboardPage />
        } />
        <Route path="/settings" element={
          <SettingsPage />
        } />
        <Route path="/notifications" element={
          <NotificationsPage />
        } />
        <Route path="/test" element={
          <Test /> 
        }/>
      </Routes>
    </div>
  )
}

export default App