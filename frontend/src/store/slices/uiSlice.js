import { createSlice } from "@reduxjs/toolkit";

let nextToastId = 1;

const uiSlice = createSlice({
  name: "ui",
  initialState: { toasts: [] },
  reducers: {
    addToast: {
      reducer(state, action) {
        state.toasts.push(action.payload);
      },
      // prepare() generates the id — payloads stay serializable & testable
      prepare({ type = "info", message }) {
        return { payload: { id: nextToastId++, type, message } };
      },
    },
    removeToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { addToast, removeToast } = uiSlice.actions;
export default uiSlice.reducer;