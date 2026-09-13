import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import * as api from "../../services/api";
import { getApiErrorMessage } from "../../services/api";
import { toSavePayload } from "./formSlice";

const initialState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    search: "",
    severity: "",
    priority: "",
    status: "",
    product_type: "",
  },
  current: null,
  currentLoading: false,
  currentError: null,
  saving: false,
  saveError: null,
  savedComplaint: null, // Last save result (drives redirect + toast)
  risk: { loading: false, error: null, result: null },
  completeness: { loading: false, error: null, result: null },
};

export const fetchComplaints = createAsyncThunk(
  "complaints/fetchAll",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { filters } = getState().complaints;

      // Empty-string filters are omitted — backend may reject invalid literals.
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value)
      );

      return await api.fetchComplaints(params);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const fetchComplaintById = createAsyncThunk(
  "complaints/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      return await api.fetchComplaintById(id);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const saveComplaint = createAsyncThunk(
  "complaints/save",
  async (_, { getState, rejectWithValue }) => {
    try {
      return await api.saveComplaint(toSavePayload(getState().form));
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const recalculateRisk = createAsyncThunk(
  "complaints/recalculateRisk",
  async (id, { rejectWithValue }) => {
    try {
      return { id: Number(id), ...(await api.recalculateRisk(id)) };
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const checkComplaintCompleteness = createAsyncThunk(
  "complaints/checkCompleteness",
  async (id, { rejectWithValue }) => {
    try {
      return await api.checkCompleteness(id);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

const complaintsSlice = createSlice({
  name: "complaints",
  initialState,

  reducers: {
    setFilter(state, action) {
      const { key, value } = action.payload;
      state.filters[key] = value;
    },

    clearFilters(state) {
      state.filters = initialState.filters;
    },

    clearSaved(state) {
      state.savedComplaint = null;
      state.saveError = null;
    },

    clearCurrent(state) {
      state.current = null;
      state.currentError = null;
      state.risk = initialState.risk;
      state.completeness = initialState.completeness;
    },
  },

  extraReducers: (builder) => {
    builder
      // List
      .addCase(fetchComplaints.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchComplaints.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload;
      })
      .addCase(fetchComplaints.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload ?? "Failed to load complaints.";
      })

      // Details
      .addCase(fetchComplaintById.pending, (s) => {
        s.currentLoading = true;
        s.currentError = null;
        s.current = null;
        s.risk = initialState.risk;
        s.completeness = initialState.completeness;
      })
      .addCase(fetchComplaintById.fulfilled, (s, a) => {
        s.currentLoading = false;
        s.current = a.payload;
      })
      .addCase(fetchComplaintById.rejected, (s, a) => {
        s.currentLoading = false;
        s.currentError = a.payload ?? "Failed to load complaint.";
      })

      // Save
      .addCase(saveComplaint.pending, (s) => {
        s.saving = true;
        s.saveError = null;
        s.savedComplaint = null;
      })
      .addCase(saveComplaint.fulfilled, (s, a) => {
        s.saving = false;
        s.savedComplaint = a.payload;
      })
      .addCase(saveComplaint.rejected, (s, a) => {
        s.saving = false;
        s.saveError = a.payload ?? "Failed to save the complaint.";
      })

      // Risk recalculation (details page)
      .addCase(recalculateRisk.pending, (s) => {
        s.risk = { loading: true, error: null, result: null };
      })
      .addCase(recalculateRisk.fulfilled, (s, a) => {
        s.risk = { loading: false, error: null, result: a.payload };

        if (s.current && s.current.id === a.payload.id) {
          s.current.risk_score = a.payload.risk_score;
          s.current.risk_level = a.payload.risk_level;
          s.current.risk_factors = a.payload.risk_factors;
          s.current.updated_at = new Date().toISOString();
        }
      })
      .addCase(recalculateRisk.rejected, (s, a) => {
        s.risk = {
          loading: false,
          error: a.payload ?? "Risk recalculation failed.",
          result: null,
        };
      })

      // Completeness check (details page)
      .addCase(checkComplaintCompleteness.pending, (s) => {
        s.completeness = { loading: true, error: null, result: null };
      })
      .addCase(checkComplaintCompleteness.fulfilled, (s, a) => {
        s.completeness = { loading: false, error: null, result: a.payload };
      })
      .addCase(checkComplaintCompleteness.rejected, (s, a) => {
        s.completeness = {
          loading: false,
          error: a.payload ?? "Completeness check failed.",
          result: null,
        };
      });
  },
});

export const {
  setFilter,
  clearFilters,
  clearSaved,
  clearCurrent,
} = complaintsSlice.actions;

export default complaintsSlice.reducer;