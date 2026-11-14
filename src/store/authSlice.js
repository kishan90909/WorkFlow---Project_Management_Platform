import { createSlice } from "@reduxjs/toolkit";

const storedUser = localStorage.getItem("workflow_user");
const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: localStorage.getItem("workflow_token"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem(
        "workflow_user",
        JSON.stringify(action.payload.user),
      );
      localStorage.setItem("workflow_token", action.payload.token);
    },
    clearCredentials(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem("workflow_user");
      localStorage.removeItem("workflow_token");
    },
    updateProfile(state, action) {
      state.user = action.payload;
      localStorage.setItem("workflow_user", JSON.stringify(action.payload));
    },
  },
});
export const { setCredentials, clearCredentials, updateProfile } =
  authSlice.actions;
export default authSlice.reducer;
