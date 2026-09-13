import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { checkDuplicates } from "../../store/slices/aiSlice";
import Spinner from "../common/Spinner";

function similarityChipClass(sim) {
  if (sim >= 80) return "bg-red-100 text-red-700";
  if (sim >= 60) return "bg-orange-100 text-orange-700";
  return "bg-amber-100 text-amber-700";
}

export default function DuplicatePanel() {
  const dispatch = useDispatch();
  const { duplicates, duplicateLoading, duplicateError } = useSelector((s) => s.ai);
  const hasDraftData = useSelector((s) =>
    Boolean(s.form.customer_name || s.form.product_name ||
             s.form.batch_number || s.form.description));

  const analysis = useSelector((s) => s.ai.analysis);
  if (!analysis) return null; // appears only after an AI analysis

  const matches = duplicates?.matches ?? [];
  const max = duplicates?.max_similarity ?? 0;

  return (
    <div className="card">
      <div className="card-header flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
               className="h-4 w-4" aria-hidden="true">
            <rect x="9" y="9" width="12" height="12" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900">Duplicate Detection</h2>
          <p className="text-xs text-slate-500">Compares this draft against saved complaints</p>
        </div>
      </div>

      <div className="space-y-3 p-5">
        {/* Verdict */}
        {duplicateLoading && (
          <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Spinner className="h-3.5 w-3.5 text-indigo-600" /> Checking saved complaints…
          </p>
        )}

        {!duplicateLoading && duplicateError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
            {duplicateError}
          </div>
        )}

        {!duplicateLoading && !duplicateError && duplicates && matches.length === 0 && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
            <span className="font-semibold">No matching complaints found.</span>{" "}
            This appears to be a new issue.
          </div>
        )}

        {!duplicateLoading && !duplicateError && duplicates && matches.length > 0 && (
          <>
            <div className={`rounded-lg border px-3 py-2.5 text-xs leading-5
              ${max >= 80
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              <span className="font-bold">
                {max >= 80 ? "Potential duplicate detected" : "Similar complaints found"}
              </span>{" "}
              — highest similarity <span className="font-bold">{max}%</span>. Review the
              {matches.length === 1 ? " record" : ` ${matches.length} records`} below before saving.
            </div>

            <ul className="space-y-2">
              {matches.map((m) => (
                <li key={m.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Link to={`/complaints/${m.id}`}
                          className="text-xs font-bold text-indigo-600 hover:underline">
                      {m.complaint_number}
                    </Link>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${similarityChipClass(m.similarity)}`}>
                      {m.similarity}% match
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-700">
                    {m.product_name ?? "—"}
                    {m.batch_number && <> · Batch <span className="font-medium">{m.batch_number}</span></>}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {m.customer_name ?? "Unknown customer"} · {m.severity ?? "—"} · {m.status}
                    {m.created_at && <> · {new Date(m.created_at).toLocaleDateString()}</>}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Manual trigger */}
        <button type="button" className="btn-secondary w-full text-xs"
                onClick={() => dispatch(checkDuplicates())}
                disabled={duplicateLoading || !hasDraftData}>
          {duplicateLoading
            ? "Checking…"
            : duplicates
              ? "Re-check for duplicates"
              : "Check for duplicates"}
        </button>
        {!hasDraftData && (
          <p className="text-center text-[11px] text-slate-400">
            Add customer, product, batch or description data first.
          </p>
        )}
      </div>
    </div>
  );
}