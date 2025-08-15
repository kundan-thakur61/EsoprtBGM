/* src/features/users/usersSlice.js */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/api/axiosClient';

/* Async thunks */
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/users');
      return data.users;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load users');
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post('/users', userData);
      return data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create user');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, data: userData }, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.put(`/users/${id}`, userData);
      return data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update user');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`/users/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete user');
    }
  }
);

/* Initial state */
const initialState = {
  list: [],
  isLoading: false,
  error: null,
};

/* Slice */
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUsers
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.list = payload;
      })
      .addCase(fetchUsers.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      // createUser
      .addCase(createUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.list.push(payload);
      })
      .addCase(createUser.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      // updateUser
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        const idx = state.list.findIndex((u) => u._id === payload._id);
        if (idx !== -1) state.list[idx] = payload;
      })
      .addCase(updateUser.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      // deleteUser
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, { payload: id }) => {
        state.isLoading = false;
        state.list = state.list.filter((u) => u._id !== id);
      })
      .addCase(deleteUser.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      });
  },
});

/* Selectors */
export const selectUsers = (state) => state.users.list;
export const selectUsersLoading = (state) => state.users.isLoading;
export const selectUsersError = (state) => state.users.error;

/* Exports */
export const { clearError } = usersSlice.actions;
export default usersSlice.reducer;
