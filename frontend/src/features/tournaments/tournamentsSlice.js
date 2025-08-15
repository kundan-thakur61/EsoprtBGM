/* src/features/tournaments/tournamentsSlice.js */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/api/axiosClient';

/* Async thunks */
export const fetchTournaments = createAsyncThunk(
  'tournaments/fetchTournaments',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/tournaments');
      return data.tournaments;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load tournaments');
    }
  }
);

export const fetchTournamentById = createAsyncThunk(
  'tournaments/fetchTournamentById',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get(`/tournaments/${id}`);
      return data.tournament;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load tournament');
    }
  }
);

export const createTournament = createAsyncThunk(
  'tournaments/createTournament',
  async (tournamentData, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post('/tournaments', tournamentData);
      return data.tournament;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create tournament');
    }
  }
);

export const updateTournament = createAsyncThunk(
  'tournaments/updateTournament',
  async ({ id, data: tournamentData }, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.put(`/tournaments/${id}`, tournamentData);
      return data.tournament;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update tournament');
    }
  }
);

export const deleteTournament = createAsyncThunk(
  'tournaments/deleteTournament',
  async (id, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`/tournaments/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete tournament');
    }
  }
);

/* Initial state */
const initialState = {
  list: [],
  current: null,
  isLoading: false,
  error: null,
};

/* Slice */
const tournamentsSlice = createSlice({
  name: 'tournaments',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* fetchTournaments */
      .addCase(fetchTournaments.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchTournaments.fulfilled, (s, { payload }) => {
        s.isLoading = false; s.list = payload;
      })
      .addCase(fetchTournaments.rejected, (s, { payload }) => {
        s.isLoading = false; s.error = payload;
      })

      /* fetchTournamentById */
      .addCase(fetchTournamentById.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchTournamentById.fulfilled, (s, { payload }) => {
        s.isLoading = false; s.current = payload;
      })
      .addCase(fetchTournamentById.rejected, (s, { payload }) => {
        s.isLoading = false; s.error = payload;
      })

      /* createTournament */
      .addCase(createTournament.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(createTournament.fulfilled, (s, { payload }) => {
        s.isLoading = false; s.list.push(payload);
      })
      .addCase(createTournament.rejected, (s, { payload }) => {
        s.isLoading = false; s.error = payload;
      })

      /* updateTournament */
      .addCase(updateTournament.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(updateTournament.fulfilled, (s, { payload }) => {
        s.isLoading = false;
        const idx = s.list.findIndex((t) => t._id === payload._id);
        if (idx !== -1) s.list[idx] = payload;
      })
      .addCase(updateTournament.rejected, (s, { payload }) => {
        s.isLoading = false; s.error = payload;
      })

      /* deleteTournament */
      .addCase(deleteTournament.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(deleteTournament.fulfilled, (s, { payload: id }) => {
        s.isLoading = false; s.list = s.list.filter((t) => t._id !== id);
      })
      .addCase(deleteTournament.rejected, (s, { payload }) => {
        s.isLoading = false; s.error = payload;
      });
  },
});

/* Selectors */
export const selectTournaments = (state) => state.tournaments.list;
export const selectTournament = (state) => state.tournaments.current;
export const selectTournamentsLoading = (state) => state.tournaments.isLoading;
export const selectTournamentsError = (state) => state.tournaments.error;

/* Exports */
export const { clearError } = tournamentsSlice.actions;
export default tournamentsSlice.reducer;
