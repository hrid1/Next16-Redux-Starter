import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, User } from "./authTypes";

const initialState: AuthState = {
  user: null,
  isHydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
    },
    setHydrated(state, action: PayloadAction<boolean>) {
      state.isHydrated = action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.isHydrated = false;
    },
  },
});

export const { setUser, setHydrated, clearAuth } = authSlice.actions;

// Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsHydrated = (state: { auth: AuthState }) => state.auth.isHydrated;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.user !== null;

export default authSlice.reducer;