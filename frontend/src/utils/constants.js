// src/constants.js

// API endpoints
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },
  USERS: {
    ROOT: '/users',
    BY_ID: (id) => `/users/${id}`,
  },
  TEAMS: {
    ROOT: '/teams',
    BY_ID: (id) => `/teams/${id}`,
    JOIN: (id) => `/teams/${id}/join`,
  },
  TOURNAMENTS: {
    ROOT: '/tournaments',
    BY_ID: (id) => `/tournaments/${id}`,
  },
  MATCHES: {
    ROOT: '/matches',
    BY_ID: (id) => `/matches/${id}`,
  },
  STATS: {
    OVERALL: '/stats/overall',
    LEADERBOARD: '/stats/leaderboard',
    USER: (userId) => `/stats/user/${userId}`,
  },
  WALLET: {
    TRANSACTIONS: '/wallet/transactions',
  },
  NOTIFICATIONS: {
    ROOT: '/notifications',
    MARK_READ: (id) => `/notifications/${id}/read`,
    CLEAR_ALL: '/notifications',
  },
};

// Application routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  TEAMS: '/teams',
  TEAM_DETAIL: (id) => `/teams/${id}`,
  TOURNAMENTS: '/tournaments',
  TOURNAMENT_DETAIL: (id) => `/tournaments/${id}`,
  MATCHES: '/matches',
  STATS: '/stats',
  LEADERBOARD: '/leaderboard',
  WALLET: '/wallet',
  NOTIFICATIONS: '/notifications',
  ADMIN: {
    USERS: '/admin/users',
    TOURNAMENTS: '/admin/tournaments',
  },
  NOT_FOUND: '*',
};

// Status and constants
export const STATUSES = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
};

export const DATE_FORMATS = {
  ISO: 'yyyy-MM-dd',
  DISPLAY: 'PPpp',
};

// UI configuration
export const PAGE_SIZES = [10, 20, 50, 100];

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

// Socket events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  NEW_NOTIFICATION: 'notification:new',
  TOURNAMENT_UPDATED: 'tournament:updated',
  MATCH_UPDATED: 'match:updated',
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
};
