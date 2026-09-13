import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AIAssistantPanel from "../components/ai/AIAssistantPanel";
import Spinner from "../components/common/Spinner";
import Section1Origin from "../components/complaint/Section1Origin";
import Section2Product from "../components/complaint/Section2Product";
import Section3Details from "../components/complaint/Section3Details";
import Section4Assessment from "../components/complaint/Section4Assessment";
import { resetForm } from "../store/slices/formSlice";
import { resetAssistant } from "../store/slices/aiSlice";
import { clearSaved, saveComplaint } from "../store/slices/complaintsSlice";
import { addToast } from "../store/slices/uiSlice";

export default function ComplaintIntakePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const saving = useSelector((s) => s.complaints.saving);
  const saveError = useSelector((s) => s.complaints.saveError);
  const savedComplaint = useSelector((s) => s.complaints.savedComplaint);
  const aiWorking = useSelector((s) => s.ai.status === "working");

  // Fine-grained subscriptions — the page does NOT re-render on every keystroke.
  const customerName = useSelector((s) => s.form.customer_name);
  const productName = useSelector((s) => s.form.product_name);
  const hasContent = useSelector((s) =>
    Boolean(s.form.customer_name || s.form.product_name || s.form.description));

  // Save success -> toast, clean up, show the saved record.
  useEffect(() => {
    if (savedComplaint) {
      dispatch(addToast({
        type: "success",
        message: `Complaint ${savedComplaint.complaint_number} saved successfully.`,
      }));
      dispatch(resetForm());
      dispatch(resetAssistant());
      dispatch(clearSaved());
      navigate(`/complaints/${savedComplaint.id}`); // details page lands in Step 9
    }
  }, [savedComplaint, dispatch, navigate]);

  // Save failure -> toast.
  useEffect(() => {
    if (saveError) {
      dispatch(addToast({ type: "error", message: saveError }));
      dispatch(clearSaved());
    }
  }, [saveError, dispatch]);

  const handleSave = () => {
    const missing = [];
    if (!customerName?.trim()) missing.push("Customer Name");
    if (!productName?.trim()) missing.push("Product Name");
    if (missing.length) {
      dispatch(addToast({
        type: "error",
        message: `Please fill the required fields: ${missing.join(", ")}.`,
      }));
      return;
    }
    dispatch(saveComplaint());
  };

  const handleReset = () => {
    if (hasContent && !window.confirm("Clear the form? All unsaved information will be lost.")) {
      return;
    }
    dispatch(resetForm());
    dispatch(resetAssistant());
    dispatch(addToast({ type: "info", message: "Form cleared." }));
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <p className="text-xs font-medium text-slate-400">Complaint Management</p>
        <h1 className="mt-0.5 text-xl font-bold text-slate-900">New Customer Complaint</h1>
        <p className="mt-1 text-sm text-slate-500">
          Log a quality complaint for API / FDF products. Use the AI Intake Assistant to
          auto-fill this form from a document or pasted text.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px]">
        {/* ── LEFT: the form ─────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <h2 className="text-sm font-bold text-slate-900">Log Customer Complaint</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Fields marked <span className="text-red-500">*</span> are required. AI-extracted
              values can be reviewed and edited before saving.
            </p>
          </div>

          <div className="divide-y divide-slate-200">
            <Section1Origin />
            <Section2Product />
            <Section3Details />
            <Section4Assessment />
          </div>

          <div className="flex flex-col-reverse items-stretch gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="hidden text-xs text-slate-400 sm:block">
              Complaints are numbered automatically on save (e.g. CC-2025-0001).
            </p>
            <div className="flex gap-3 sm:justify-end">
              <button type="button" className="btn-secondary flex-1 sm:flex-none"
                      onClick={handleReset} disabled={saving}>
                Reset Form
              </button>
              <button type="button" className="btn-primary flex-1 sm:flex-none"
                      onClick={handleSave} disabled={saving || aiWorking}>
                {saving ? <><Spinner /> Saving…</> : "Save Complaint"}
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: AI assistant (+ risk/completeness/duplicate panels in Step 7) ── */}
        <div className="space-y-5 order-first lg:order-none">
          <AIAssistantPanel />
        </div>
      </div>
    </div>
  );
}