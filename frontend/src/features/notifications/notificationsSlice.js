/* src/features/notifications/notificationsSlice.js */
import { createSlice } from '@reduxjs/toolkit';

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    list: [],        // each item → { id, message, type, read }
    isLoading: false,
    error: null,
  },
  reducers: {
    addNotification(state, action) {
      state.list.unshift(action.payload);      // { id, message, … }
    },
    markRead(state, action) {
      const id = action.payload;
      const note = state.list.find(n => n.id === id);
      if (note) note.read = true;
    },
    markAllRead(state) {
      state.list = state.list.map(n => ({ ...n, read: true }));
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  addNotification,
  markRead,
  markAllRead,
  clearError,
} = notificationsSlice.actions;

/* 👉  default export expected by store.ts */
export default notificationsSlice.reducer;
