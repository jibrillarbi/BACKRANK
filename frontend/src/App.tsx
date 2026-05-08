import { Routes, Route } from "react-router-dom"
import { StrategyProvider } from "./contexts/StrategyContext"
import Navbar from "./components/Navbar"
import ProtectedRoute from "./components/ProtectedRoute"
import LandingPage from "./pages/LandingPage"
import DashboardPage from "./pages/DashboardPage"
import MyStrategiesPage from "./pages/MyStrategiesPage"
import DeployStrategyPage from "./pages/DeployStrategyPage"
import DeploymentsPage from "./pages/DeploymentsPage"
import CreatePostPage from "./pages/CreatePostPage"
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
import PostPage from "./pages/PostPage"
import StrategyPostsPage from "./pages/StrategyPostsPage"
function App() {
  return (
    <div className="text-base-content">
      <Navbar />
      <div className="pt-16">
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
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/strategies" element={
          <ProtectedRoute>
            <MyStrategiesPage />
          </ProtectedRoute>
        } />
        <Route path="/deployments/:strategyId" element={
          <ProtectedRoute>
            <DeploymentsPage />
          </ProtectedRoute>
        } />
        <Route path="/strategies/:strategyId/posts" element={
          <ProtectedRoute>
            <StrategyPostsPage />
          </ProtectedRoute>
        } />
        <Route path="/create-post" element={
          <ProtectedRoute>
            <CreatePostPage />
          </ProtectedRoute>
        } />
        <Route path="/strategy/edit" element={
          <ProtectedRoute>
            <div className="mt-16">
              <StrategyProvider>
                <StrategyPage />
              </StrategyProvider>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/strategy" element={
          <ProtectedRoute>
            <div className="mt-16">
              <StrategyProvider>
                <DeployStrategyPage />
              </StrategyProvider>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/profile/:username" element={
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/backtest-results" element={
          <ProtectedRoute>
            <div className="mt-16">
              <StrategyProvider>
                <BacktestResultsPage />
              </StrategyProvider>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/explore" element={
          <ProtectedRoute>
            <ExplorePage />
          </ProtectedRoute>
        } />
        <Route path="/leaderboard" element={
          <ProtectedRoute>
            <LeaderboardPage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/post/:postId" element={
          <ProtectedRoute>
            <PostPage />
          </ProtectedRoute>
        } />
        <Route path="/test" element={
          <ProtectedRoute>
            <Test /> 
          </ProtectedRoute>
        }/>
      </Routes>
      </div>
    </div>
  )
}

export default App
