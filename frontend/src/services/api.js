import axios from "axios";

/**
 * Base instance. Requests are same-origin ("/api") — the Vite dev proxy
 * (vite.config.js) forwards them to FastAPI in development. No backend
 * URL is ever hardcoded in application code.
 *
 * Timeout is generous: /analyze runs the full LangGraph workflow (3 LLM calls).
 */
const api = axios.create({ baseURL: "/api", timeout: 120_000 });

/** Normalize any axios/network error into a user-readable message. */
export function getApiErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  if (detail) {
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg).join("; ") || "Request validation failed.";
    }
    return String(detail);
  }
  if (!error?.response) {
    return "Cannot reach the server. Is the backend running on port 8000?";
  }
  return error?.message || "Unexpected error.";
}

// ── Complaint API ────────────────────────────────────────────────────

export const extractDocument = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api
    .post("/complaints/extract", form, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);
};

export const analyzeComplaint = (text) =>
  api.post("/complaints/analyze", { text }).then((r) => r.data);

export const saveComplaint = (payload) =>
  api.post("/complaints", payload).then((r) => r.data);

export const fetchComplaints = (params) =>
  api.get("/complaints", { params }).then((r) => r.data);

export const fetchComplaintById = (id) =>
  api.get(`/complaints/${id}`).then((r) => r.data);

export const recalculateRisk = (id) =>
  api.post(`/complaints/${id}/risk`).then((r) => r.data);

export const checkCompleteness = (id) =>
  api.post(`/complaints/${id}/completeness`).then((r) => r.data);

export const checkDuplicate = (draft) =>
  api.post("/complaints/check-duplicate", draft).then((r) => r.data);