import { useDispatch, useSelector } from "react-redux";
import CompletenessResult, { TONE_TEXT, completenessStats } from "../common/CompletenessResult";
import { checkComplaintCompleteness } from "../../store/slices/complaintsSlice";

/** On-demand completeness check of the SAVED record (server-evaluated). */
export default function RecordCompletenessCard({ complaint }) {
  const dispatch = useDispatch();
  const { loading, error, result } = useSelector((s) => s.complaints.completeness);

  const evaluated = (result?.checks ?? []).map((c) => ({
    label: c.label,
    present: c.status === "complete",
  }));
  const stats = result ? completenessStats(evaluated) : null;

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
          <p className="text-xs text-slate-500">Evaluated against the saved record</p>
        </div>
        {stats && (
          <span className={`text-sm font-bold tabular-nums ${TONE_TEXT[stats.tone]}`}>
            {stats.pct}%
          </span>
        )}
      </div>

      <div className="space-y-3 p-5">
        {result ? (
          <CompletenessResult checks={evaluated} />
        ) : (
          <p className="text-xs leading-5 text-slate-500">
            Run an on-demand check to see which key fields are missing from this saved record.
          </p>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
            {error}
          </div>
        )}

        <button type="button" className="btn-secondary w-full text-xs"
                onClick={() => dispatch(checkComplaintCompleteness(complaint.id))}
                disabled={loading}>
          {loading ? "Checking…" : result ? "Re-run Check" : "Run Completeness Check"}
        </button>
      </div>
    </div>
  );
}