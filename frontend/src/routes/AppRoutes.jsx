import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

// Layout Components
import MainLayout from '../components/layout/MainLayout'
import AuthLayout from '../components/layout/AuthLayout'

// Auth Pages
import LoginForm from '../features/auth/LoginForm'
import RegisterForm from '../features/auth/RegisterForm'

// Main Pages
import HomePage from '../pages/HomePage'
import DashboardPage from '../pages/DashboardPage'
import ProfilePage from '../pages/ProfilePage'
import NotFoundPage from '../pages/NotFoundPage'

// Tournament Pages
import TournamentList from '../features/tournaments/TournamentList'
import TournamentDetail from '../features/tournaments/TournamentDetail'
import CreateTournament from '../features/tournaments/CreateTournament'

// Match Pages
import MatchList from '../features/matches/MatchList'
import MatchDetail from '../features/matches/MatchDetail'

// Team Pages
import TeamList from '../features/teams/TeamList'
import TeamDetail from '../features/teams/TeamDetail'
import CreateTeam from '../features/teams/CreateTeam'

// Stats Pages
import StatsPage from '../features/stats/StatsPage'
import LeaderboardPage from '../features/stats/LeaderboardPage'

// Payment Pages
import WalletPage from '../features/payments/WalletPage'
import PaymentPage from '../features/payments/PaymentPage'

// Admin Pages
import AdminDashboard from '../features/admin/AdminDashboard'
import UserManagement from '../features/admin/UserManagement'
import TournamentManagement from '../features/admin/TournamentManagement'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth)
  return isAuthenticated ? children : <Navigate to="/login" />
}

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  
  if (!isAuthenticated) return <Navigate to="/login" />
  if (!isAdmin) return <Navigate to="/dashboard" />
  
  return children
}

const AppRoutes = () => {
  const { isAuthenticated } = useSelector((state) => state.auth)

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="tournaments" element={<TournamentList />} />
        <Route path="tournaments/:id" element={<TournamentDetail />} />
        <Route path="matches" element={<MatchList />} />
        <Route path="matches/:id" element={<MatchDetail />} />
        <Route path="teams" element={<TeamList />} />
        <Route path="teams/:id" element={<TeamDetail />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
      </Route>

      {/* Auth Routes */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/dashboard" /> : <AuthLayout><LoginForm /></AuthLayout>
      } />
      <Route path="/register" element={
        isAuthenticated ? <Navigate to="/dashboard" /> : <AuthLayout><RegisterForm /></AuthLayout>
      } />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="tournaments/create" element={<CreateTournament />} />
        <Route path="teams/create" element={<CreateTeam />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="payment" element={<PaymentPage />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminRoute><MainLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="tournaments" element={<TournamentManagement />} />
      </Route>

      {/* 404 Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes
