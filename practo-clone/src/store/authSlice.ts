import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Account } from "@/lib/types";

interface AuthState {
  account: Account | null;
  loading: boolean;
}

const initialState: AuthState = {
  account: null,
  loading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAccount(state, action: PayloadAction<Account | null>) {
      state.account = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setAccount, setLoading } = authSlice.actions;
export default authSlice.reducer;