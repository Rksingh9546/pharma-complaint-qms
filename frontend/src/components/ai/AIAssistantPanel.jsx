import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetAssistant, runIntake, stageLabelFor } from "../../store/slices/aiSlice";
import { addToast } from "../../store/slices/uiSlice";
import Spinner from "../common/Spinner";

export default function AIAssistantPanel() {
  const dispatch = useDispatch();
  const { status, progress, error, filename } = useSelector((s) => s.ai);
  const [text, setText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const working = status === "working";
  const complete = status === "complete";
  const failed = status === "error";

  const analyzeFile = (file) => {
    if (!file || working) return;
    dispatch(runIntake({ file }));
  };

  const analyzeText = () => {
    if (working) return;
    const trimmed = text.trim();
    if (trimmed.length < 10) {
      dispatch(addToast({ type: "error",
        message: "Paste at least a few lines of complaint text to analyze." }));
      return;
    }
    dispatch(runIntake({ text: trimmed }));
  };

  return (
    <div className="card">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="card-header flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
               className="h-4 w-4" aria-hidden="true">
            <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900">AI Complaint Intake Assistant</h2>
          <p className="text-xs text-slate-500">Extract, validate & risk-assess complaints</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-indigo-700 ring-1 ring-inset ring-indigo-200">
          BETA
        </span>
      </div>

      {/* ── Input area (disabled while working) ─────────────────── */}
      <div className={`space-y-4 p-5 ${working ? "pointer-events-none opacity-60" : ""}`}>
        <div
          role="button" tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); }
          }}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setDragActive(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (!working) analyzeFile(e.dataTransfer.files?.[0]);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2
                      border-dashed px-6 py-8 text-center transition
                      ${dragActive
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50"}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
               className="mb-3 h-9 w-9 text-indigo-500" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M12 18v-6" />
            <path d="m9 15 3-3 3 3" />
          </svg>
          <p className="text-sm font-semibold text-slate-700">
            Drag &amp; drop your complaint document here
          </p>
          <p className="mt-1 text-xs text-slate-500">
            or <span className="font-semibold text-indigo-600 underline">browse files</span> to select from your computer
          </p>
          <p className="mt-3 text-[11px] text-slate-400">
            Supported formats: PDF, DOCX, TXT, EML · Max 10 MB
          </p>
        </div>
        <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt,.eml" className="hidden"
               onChange={(e) => { analyzeFile(e.target.files?.[0]); e.target.value = ""; }} />

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            or paste complaint text / email
          </span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <textarea className="textarea" rows={5} value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste the complaint text or email here — include customer, product, batch, quantity and issue details..." />

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            The AI fills the form on the left — always review before saving.
          </p>
          <button type="button" className="btn-primary shrink-0 text-xs"
                  onClick={analyzeText} disabled={working}>
            {working ? <><Spinner /> Analyzing…</> : "Analyze Text"}
          </button>
        </div>
      </div>

      {/* ── Progress / status ───────────────────────────────────── */}
      {(working || complete || failed) && (
        <div className="space-y-3 border-t border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Extraction Progress
            </span>
            <span className={`text-sm font-bold tabular-nums
              ${failed ? "text-red-600" : complete ? "text-green-700" : "text-indigo-700"}`}>
              {progress}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500
                ${failed ? "bg-red-500" : complete ? "bg-green-600" : "bg-indigo-600"}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="flex items-center gap-2 text-xs font-medium text-slate-600">
            {working && <Spinner className="h-3.5 w-3.5 text-indigo-600" />}
            {failed ? <span className="font-semibold text-red-700">Analysis failed</span>
                    : stageLabelFor(progress)}
          </p>

          {failed && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700">
              {error || "Something went wrong while analyzing the complaint. Please try again."}
            </div>
          )}

          {complete && (
            <div className="space-y-2.5">
              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-xs leading-5 text-green-800">
                <span className="font-semibold">Analysis complete.</span>{" "}
                {filename ? `“${filename}” was processed` : "The pasted text was processed"} —
                extracted fields now populate the form. Review and edit before saving.
              </div>
              <button type="button" className="btn-secondary w-full text-xs"
                      onClick={() => dispatch(resetAssistant())}>
                Start new analysis
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}