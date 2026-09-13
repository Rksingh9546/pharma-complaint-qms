import { applyAnalysis, toDuplicateDraft } from "./formSlice";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as api from "../../services/api";
import { getApiErrorMessage } from "../../services/api";


// Mirrors backend/app/config.py — first line of defense before upload.
const MAX_FILE_MB = 10;
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".eml"];

/** Progress checkpoints shown in the assistant panel. */
export const STAGES = [
  { at: 10, label: "Reading document" },
  { at: 30, label: "Extracting complaint information" },
  { at: 50, label: "Identifying product and batch" },
  { at: 70, label: "Assessing risk" },
  { at: 90, label: "Validating information" },
  { at: 100, label: "Complaint analysis complete" },
];

export function stageLabelFor(progress) {
  let label = STAGES[0].label;
  for (const stage of STAGES) if (progress >= stage.at) label = stage.label;
  return label;
}

function validateFile(file) {
  const name = file?.name ?? "";
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")).toLowerCase() : "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Unsupported file type. Supported formats: ${ALLOWED_EXTENSIONS.join(", ")}.`;
  }
  if (file.size === 0) return "The selected file is empty.";
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return `File is too large. Maximum size is ${MAX_FILE_MB} MB.`;
  }
  return null;
}

/**
 * The full intake flow: (optional upload) -> /extract -> /analyze -> auto-fill form.
 *
 * NOTE on file order: this thunk is defined BEFORE the slice because the
 * slice's extraReducers must reference it at creation time. The setProgress/
 * tickProgress dispatches below only run when the thunk executes (after the
 * module is fully loaded), so the forward reference is safe.
 */
export const runIntake = createAsyncThunk(
  "ai/runIntake",
  async ({ file, text }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setProgress(10)); // Reading document / preparing pasted text

      let sourceText = (text ?? "").trim();
      let filename = "";
      if (file) {
        const problem = validateFile(file);
        if (problem) return rejectWithValue(problem);
        filename = file.name;
        const extracted = await api.extractDocument(file);
        sourceText = extracted.text;
      }
      if (!sourceText || sourceText.length < 10) {
        return rejectWithValue("Complaint text is empty or too short to analyze.");
      }

      dispatch(setProgress(30)); // Extracting complaint information

      // /analyze runs the whole LangGraph workflow in one request (3 LLM
      // calls). 10 / 30 / 100 are real checkpoints; between them we advance
      // smoothly toward 90% so the bar tracks the stage labels above.
      const timer = setInterval(() => dispatch(tickProgress(90)), 350);
      let analysis;
      try {
        analysis = await api.analyzeComplaint(sourceText);
      } finally {
        clearInterval(timer);
      }

      dispatch(setProgress(100));
      dispatch(applyAnalysis(analysis)); // auto-fill the complaint form

      return { mode: file ? "file" : "text", filename, sourceText, analysis };
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

/** Duplicate check for the current form draft (advisory panel on the intake page). */
export const checkDuplicates = createAsyncThunk(
  "ai/checkDuplicates",
  async (_, { getState, rejectWithValue }) => {
    try {
      return await api.checkDuplicate(toDuplicateDraft(getState().form));
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

const initialState = {
  status: "idle", // idle | working | complete | error
  mode: null, // 'file' | 'text'
  filename: "",
  sourceText: "",
  progress: 0,
  analysis: null, // {extraction, completeness, risk, recommendations, disclaimer}
  error: null,
  dduplicates: null,
  duplicateLoading: false,
  duplicateError: null,
};

const aiSlice = createSlice({
  name: "ai",
  initialState,
  reducers: {
    setProgress(state, action) {
      state.progress = action.payload;
    },
    tickProgress(state, action) {
      const cap = action.payload;
      if (state.progress < cap) state.progress = Math.min(state.progress + 2, cap);
    },
    resetAssistant: () => initialState,
    clearDuplicates(state) {
      state.duplicates = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkDuplicates.pending, (state) => {
  state.duplicateLoading = true;
  state.duplicateError = null;
})
.addCase(checkDuplicates.fulfilled, (state, action) => {
  state.duplicateLoading = false;
  state.duplicates = action.payload;
})
.addCase(checkDuplicates.rejected, (state, action) => {
  state.duplicateLoading = false;
  state.duplicateError = action.payload ?? "Duplicate check failed.";
});
  },
});

const { setProgress, tickProgress } = aiSlice.actions;
export const { resetAssistant, clearDuplicates } = aiSlice.actions;
export default aiSlice.reducer;