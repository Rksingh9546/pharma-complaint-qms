import { createSlice } from "@reduxjs/toolkit";

/**
 * The editable complaint form.
 * Keys deliberately mirror the AI extraction keys — applyAnalysis() is a
 * loop, not 20 assignments. The single API-contract mismatch
 * (complaint_source vs the API's `source`) is isolated in toSavePayload().
 */
const initialState = {
  // Section 1 — Origin & customer details
  complaint_source: "",
  customer_name: "",
  customer_email: "",
  country: "",
  complaint_received_date: "",
  // Section 2 — Product & batch identification
  product_name: "",
  product_type: "",
  strength: "",
  batch_number: "",
  manufacturing_date: "",
  expiry_date: "",
  quantity_affected: "",
  unit: "",
  // Section 3 — Complaint details
  complaint_type: "",
  complaint_date: "",
  description: "",
  attachment: null, // UI-only for this scope ({name, size}) — files aren't persisted
  // Section 4 — Initial assessment
  severity: "",
  priority: "",
  investigation_required: false,
  adverse_event: false,
  // AI-derived (filled by applyAnalysis, saved with the complaint)
  risk_score: null,
  risk_level: "",
  ai_summary: "",
  ai_recommendation: null, // {actions: [...], capa: {...}}
  risk_factors: null,
  status: "Open",
};

const formSlice = createSlice({
  name: "form",
  initialState,
  reducers: {
    setField(state, action) {
      const { field, value } = action.payload;
      state[field] = value;
    },
    applyAnalysis(state, action) {
      const { extraction = {}, risk = {}, recommendations = {} } = action.payload;
      Object.entries(extraction).forEach(([key, value]) => {
        // Fill only what the AI found — never blank what the user typed.
        if (value === null || value === undefined) return;
        if (!(key in initialState) || key === "attachment") return;
        state[key] = value;
      });
      state.risk_score = risk.risk_score ?? null;
      state.risk_level = risk.risk_level ?? "";
      state.ai_summary = recommendations.summary ?? "";
      state.ai_recommendation = recommendations.recommended_actions
        ? { actions: recommendations.recommended_actions, capa: recommendations.capa ?? null }
        : null;
      state.risk_factors = risk.risk_factors ?? null;
    },
    resetForm: () => initialState,
  },
});

export const { setField, applyAnalysis, resetForm } = formSlice.actions;
export default formSlice.reducer;

/** Pure transform: form state -> POST /api/complaints payload. */
export function toSavePayload(form) {
  const isoOrNull = (v) => (v && String(v).trim() ? v : null);
  const intOrNull = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  };
  return {
    source: form.complaint_source || null,
    customer_name: form.customer_name,
    customer_email: form.customer_email || null,
    country: form.country || null,
    complaint_received_date: isoOrNull(form.complaint_received_date),
    product_name: form.product_name,
    product_type: form.product_type || null,
    strength: form.strength || null,
    batch_number: form.batch_number || null,
    manufacturing_date: isoOrNull(form.manufacturing_date),
    expiry_date: isoOrNull(form.expiry_date),
    quantity_affected: intOrNull(form.quantity_affected),
    unit: form.unit || null,
    complaint_type: form.complaint_type || null,
    complaint_date: isoOrNull(form.complaint_date),
    description: form.description || null,
    severity: form.severity || null,
    priority: form.priority || null,
    investigation_required: !!form.investigation_required,
    adverse_event: !!form.adverse_event,
    risk_score: form.risk_score,
    risk_level: form.risk_level || null,
    ai_summary: form.ai_summary || null,
    ai_recommendation: form.ai_recommendation,
    risk_factors: form.risk_factors,
    status: form.status || "Open",
  };
}
/** Form state -> duplicate-check API payload (the 4 comparable fields). */
export function toDuplicateDraft(form) {
  const clean = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
  return {
    customer_name: clean(form.customer_name),
    product_name: clean(form.product_name),
    batch_number: clean(form.batch_number),
    description: clean(form.description),
  };
}