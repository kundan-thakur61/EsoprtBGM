import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import tournamentsReducer from '../features/tournaments/tournamentsSlice'
import matchesReducer from '../features/matches/matchesSlice'
import teamsReducer from '../features/teams/teamsSlice'
import paymentsReducer from '../features/payments/paymentsSlice'
import notificationsReducer from '../features/notifications/notificationsSlice'
import statsReducer from '../features/stats/statsSlice'
import adminReducer from '../features/admin/adminSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tournaments: tournamentsReducer,
    matches: matchesReducer,
    teams: teamsReducer,
    payments: paymentsReducer,
    notifications: notificationsReducer,
    stats: statsReducer,
    admin: adminReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

// Types for global use
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
