/* src/features/auth/authSlice.js */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/api/axiosClient';
import socketService from '@/services/socketService';

/* Async thunks */
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post('/auth/login', { email, password });
      const { token, user } = data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      socketService.connect(token);
      return { token, user };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post('/auth/register', formData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await axiosClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      socketService.disconnect();
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/auth/profile');
      return data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load user');
    }
  }
);

/* Initial state */
const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
};

/* Slice */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    initializeAuth(state) {
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');
      if (token && userJson) {
        state.token = token;
        state.user = JSON.parse(userJson);
        state.isAuthenticated = true;
        socketService.connect(token);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.user = payload.user;
        state.token = payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
        state.isAuthenticated = false;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerUser.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        Object.assign(state, initialState, {
          user: null,
          token: null,
          isAuthenticated: false,
        });
      })
      // Get current user
      .addCase(getCurrentUser.fulfilled, (state, { payload }) => {
        state.user = payload;
      });
  },
});

/* Selectors */
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;

/* Exports */
export const { clearError, initializeAuth } = authSlice.actions;
export default authSlice.reducer;
