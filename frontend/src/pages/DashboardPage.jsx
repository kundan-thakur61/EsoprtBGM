// src/pages/DashboardPage.jsx

import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ToastContainer } from 'react-toastify'
import {
  fetchTournaments,
  selectTournaments,
  selectTournamentsLoading,
  selectTournamentsError
} from '../features/tournaments/tournamentsSlice'
import {
  fetchMatches,
  selectMatches,
  selectMatchesLoading,
  selectMatchesError
} from '../features/matches/matchesSlice'
import {
  fetchTeams,
  selectTeams,
  selectTeamsLoading,
  selectTeamsError
} from '../features/teams/teamsSlice'
import {
  fetchPayments,
  selectPayments,
  selectPaymentsLoading,
  selectPaymentsError
} from '../features/payments/paymentsSlice'
import {
  fetchNotifications,
  selectNotifications
} from '../features/notifications/notificationsSlice'
import {
  fetchStats,
  selectStats
} from '../features/stats/statsSlice'
import {
  fetchAdminData,
  selectAdminData
} from '../features/admin/adminSlice'


export default function DashboardPage() {
  const dispatch = useDispatch()

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchTournaments())
    dispatch(fetchMatches())
    dispatch(fetchTeams())
    dispatch(fetchPayments())
    dispatch(fetchNotifications())
    dispatch(fetchStats())
    dispatch(fetchAdminData())
  }, [dispatch])

  // Selectors with safe defaults
  const tournaments     = useSelector(selectTournaments) ?? []
  const matches         = useSelector(selectMatches)     ?? []
  const teams           = useSelector(selectTeams)       ?? []
  const payments        = useSelector(selectPayments)    ?? []
  const notifications   = useSelector(selectNotifications) ?? []
  const stats           = useSelector(selectStats)       ?? {}
  const adminData       = useSelector(selectAdminData)   ?? {}

  const isLoadingTourn  = useSelector(selectTournamentsLoading)
  const isLoadingMatch  = useSelector(selectMatchesLoading)
  const isLoadingTeams  = useSelector(selectTeamsLoading)
  const isLoadingPay    = useSelector(selectPaymentsLoading)

  const errorTourn      = useSelector(selectTournamentsError)
  const errorMatch      = useSelector(selectMatchesError)
  const errorTeams      = useSelector(selectTeamsError)
  const errorPay        = useSelector(selectPaymentsError)

  return (
    <div className="dashboard-container min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard Overview</h1>

      {/* Loading & error states */}
      {(isLoadingTourn || isLoadingMatch || isLoadingTeams || isLoadingPay) && (
        <p className="text-blue-600">Loading data...</p>
      )}
      {(errorTourn || errorMatch || errorTeams || errorPay) && (
        <p className="text-red-600">
          {errorTourn || errorMatch || errorTeams || errorPay}
        </p>
      )}

      {/* Statistics */}
      <div className="stats-grid grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card p-4 bg-white rounded shadow">
          <h2 className="font-semibold">Tournaments</h2>
          <p className="text-xl">{tournaments.length}</p>
        </div>
        <div className="stat-card p-4 bg-white rounded shadow">
          <h2 className="font-semibold">Matches</h2>
          <p className="text-xl">{matches.length}</p>
        </div>
        <div className="stat-card p-4 bg-white rounded shadow">
          <h2 className="font-semibold">Teams</h2>
          <p className="text-xl">{teams.length}</p>
        </div>
      </div>

      {/* More stats */}
      <div className="stats-grid grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="stat-card p-4 bg-white rounded shadow">
          <h2 className="font-semibold">Payments</h2>
          <p className="text-xl">{payments.length}</p>
        </div>
        <div className="stat-card p-4 bg-white rounded shadow">
          <h2 className="font-semibold">Notifications</h2>
          <p className="text-xl">{notifications.length}</p>
        </div>
        <div className="stat-card p-4 bg-white rounded shadow">
          <h2 className="font-semibold">Logged-in Admins</h2>
          <p className="text-xl">{adminData.activeUsers ?? 0}</p>
        </div>
      </div>

      {/* Example usage of stats object */}
      {stats.totalRevenue != null && (
        <div className="revenue-card mt-6 p-4 bg-white rounded shadow">
          <h2 className="font-semibold">Total Revenue</h2>
          <p className="text-xl">${stats.totalRevenue.toLocaleString()}</p>
        </div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        className="z-50"
      />
    </div>
  )
}
