/* src/features/teams/teamsSlice.js */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/api/axiosClient';

/* Async thunks */
export const fetchTeams = createAsyncThunk(
  'teams/fetchTeams',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/teams');
      return data.teams;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load teams');
    }
  }
);

export const fetchTeamById = createAsyncThunk(
  'teams/fetchTeamById',
  async (teamId, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get(`/teams/${teamId}`);
      return data.team;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load team');
    }
  }
);

export const createTeam = createAsyncThunk(
  'teams/createTeam',
  async (teamData, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post('/teams', teamData);
      return data.team;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create team');
    }
  }
);

export const joinTeam = createAsyncThunk(
  'teams/joinTeam',
  async (teamId, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post(`/teams/${teamId}/join`);
      return data.team;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to join team');
    }
  }
);

/* Initial state */
const initialState = {
  list: [],
  currentTeam: null,
  isLoading: false,
  error: null,
};

/* Slice */
const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setCurrentTeam(state, { payload }) {
      state.currentTeam = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch teams
      .addCase(fetchTeams.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTeams.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.list = payload;
      })
      .addCase(fetchTeams.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      // Fetch team by ID
      .addCase(fetchTeamById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTeamById.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.currentTeam = payload;
      })
      .addCase(fetchTeamById.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      // Create team
      .addCase(createTeam.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTeam.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.list.push(payload);
      })
      .addCase(createTeam.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      // Join team
      .addCase(joinTeam.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(joinTeam.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        const index = state.list.findIndex(team => team._id === payload._id);
        if (index !== -1) {
          state.list[index] = payload;
        }
      })
      .addCase(joinTeam.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      });
  },
});

/* Selectors */
export const selectTeams = (state) => state.teams.list;
export const selectTeam = (state) => state.teams.currentTeam;
export const selectTeamsLoading = (state) => state.teams.isLoading;
export const selectTeamsError = (state) => state.teams.error;

/* Named exports */
export const { clearError, setCurrentTeam } = teamsSlice.actions;

/* Default export reducer */
export default teamsSlice.reducer;
