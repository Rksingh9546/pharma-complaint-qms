import { configureStore } from "@reduxjs/toolkit";
import ai from "./slices/aiSlice.js";
import complaints from "./slices/complaintsSlice.js";
import form from "./slices/formSlice.js";
import ui from "./slices/uiSlice.js";

export const store = configureStore({
  reducer: { form, ai, complaints, ui },
});