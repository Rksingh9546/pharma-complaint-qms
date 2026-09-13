import { useSelector } from "react-redux";
import CompletenessResult, { TONE_TEXT, completenessStats } from "../common/CompletenessResult";

/** A value counts as present unless null/undefined or a blank string. */
function isPresent(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  return true; // numbers (incl. 0) and booleans
}

/**
 * Live completeness checker on the intake page.
 * The backend (validation_node) defines WHICH fields matter; presence is
 * re-evaluated against the CURRENT form on every render.
 */
export default function CompletenessPanel() {
  const checks = useSelector((s) => s.ai.analysis?.completeness?.checks ?? []);
  const form = useSelector((s) => s.form);
  if (checks.length === 0) return null;

  const evaluated = checks.map(({ field, label }) => ({ label, present: isPresent(form[field]) }));
  const { pct, tone } = completenessStats(evaluated);

  return (
    <div className="card">
      <div className="card-header flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
               className="h-4 w-4" aria-hidden="true">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="2" width="6" height="4" rx="1" />
            <path d="m9 14 2 2 4-4" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900">Completeness Check</h2>
          <p className="text-xs text-slate-500">Updates live as you edit the form</p>
        </div>
        <span className={`text-sm font-bold tabular-nums ${TONE_TEXT[tone]}`}>{pct}%</span>
      </div>
      <div className="p-5">
        <CompletenessResult checks={evaluated} columns={2} />
      </div>
    </div>
  );
}