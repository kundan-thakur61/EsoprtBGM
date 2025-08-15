/* src/features/stats/statsSlice.js */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/api/axiosClient';

/* Async thunks */
export const fetchLeaderboard = createAsyncThunk(
  'stats/fetchLeaderboard',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/stats/leaderboard');
      return data.leaderboard;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load leaderboard');
    }
  }
);

export const fetchOverallStats = createAsyncThunk(
  'stats/fetchOverallStats',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/stats/overall');
      return data.stats;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load overall stats');
    }
  }
);

export const fetchUserStats = createAsyncThunk(
  'stats/fetchUserStats',
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get(`/stats/user/${userId}`);
      return data.stats;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load user stats');
    }
  }
);

/* Initial state */
const initialState = {
  leaderboard: [],
  overall: null,
  userStats: null,
  isLoading: false,
  error: null,
};

/* Slice */
const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Leaderboard
      .addCase(fetchLeaderboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.leaderboard = payload;
      })
      .addCase(fetchLeaderboard.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      // Overall stats
      .addCase(fetchOverallStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOverallStats.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.overall = payload;
      })
      .addCase(fetchOverallStats.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      // User stats
      .addCase(fetchUserStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserStats.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.userStats = payload;
      })
      .addCase(fetchUserStats.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      });
  },
});

/* Named exports */
export const { clearError } = statsSlice.actions;

/* Default export reducer */
export default statsSlice.reducer;
