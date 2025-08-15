import { createSlice } from '@reduxjs/toolkit';

const paymentsSlice = createSlice({
  name: 'payments',
  initialState: {
    wallet: { balance: 0, transactions: [] },
    isLoading: false,
    error: null,
  },
  reducers: {
    setWallet(state, action) {
      state.wallet = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const { setWallet, clearError } = paymentsSlice.actions;
export default paymentsSlice.reducer;     // ← default export
