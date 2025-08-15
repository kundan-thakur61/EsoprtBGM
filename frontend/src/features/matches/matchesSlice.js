import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosClient from '../../api/axiosClient'

export const fetchMatches = createAsyncThunk(
  'matches/fetchMatches',
  async ({ page = 1, limit = 10, status, tournamentId } = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
      ...(tournamentId && { tournamentId }),
    })
    
    const response = await axiosClient.get(`/matches?${params}`)
    return response.data
  }
)

export const fetchMatchById = createAsyncThunk(
  'matches/fetchMatchById',
  async (id) => {
    const response = await axiosClient.get(`/matches/${id}`)
    return response.data.match
  }
)

export const updateMatchScore = createAsyncThunk(
  'matches/updateMatchScore',
  async ({ matchId, score }) => {
    const response = await axiosClient.patch(`/matches/${matchId}/score`, { score })
    return response.data.match
  }
)

const initialState = {
  matches: [],
  currentMatch: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
}

const matchesSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateMatch: (state, action) => {
      const index = state.matches.findIndex(m => m._id === action.payload._id)
      if (index !== -1) {
        state.matches[index] = action.payload
      }
      if (state.currentMatch?._id === action.payload._id) {
        state.currentMatch = action.payload
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch matches
      .addCase(fetchMatches.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.isLoading = false
        state.matches = action.payload.matches
        state.pagination = action.payload.pagination
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message
      })
      // Fetch match by ID
      .addCase(fetchMatchById.fulfilled, (state, action) => {
        state.currentMatch = action.payload
      })
      // Update match score
      .addCase(updateMatchScore.fulfilled, (state, action) => {
        const index = state.matches.findIndex(m => m._id === action.payload._id)
        if (index !== -1) {
          state.matches[index] = action.payload
        }
        if (state.currentMatch?._id === action.payload._id) {
          state.currentMatch = action.payload
        }
      })
  },
})

export const { clearError, updateMatch } = matchesSlice.actions
export default matchesSlice.reducer
