const DISCLAIMER =
  "AI-assisted recommendation. Final quality decisions must be made by authorized Quality personnel.";

function SectionTitle({ children }) {
  return (
    <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{children}</h4>
  );
}

/**
 * The AI recommendation stored at intake (JSONB): recommended actions,
 * CAPA assessment and the complaint summary. Advisory by design.
 */
export default function RecordRecommendationCard({ complaint }) {
  const rec = complaint.ai_recommendation;
  const actions = Array.isArray(rec?.actions) ? rec.actions : [];
  const capa = rec?.capa ?? null;
  const summary = complaint.ai_summary;

  if (!actions.length && !capa && !summary) {
    return (
      <div className="card">
        <div className="card-header flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                 className="h-4 w-4" aria-hidden="true">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-slate-900">AI Recommendation</h2>
            <p className="text-xs text-slate-500">Actions, CAPA &amp; summary from intake</p>
          </div>
        </div>
        <div className="p-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5
                          text-xs leading-5 text-slate-500">
            No AI recommendation stored for this complaint — it was likely logged without
            the AI Intake Assistant.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
               className="h-4 w-4" aria-hidden="true">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900">AI Recommendation</h2>
          <p className="text-xs text-slate-500">Stored at intake — advisory only</p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {actions.length > 0 && (
          <div>
            <SectionTitle>Recommended Next Actions</SectionTitle>
            <ol className="mt-2 space-y-1.5">
              {actions.map((action, i) => (
                <li key={i} className="flex gap-2.5 text-xs leading-5 text-slate-700">
                  <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center
                                   rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                    {i + 1}
                  </span>
                  {action}
                </li>
              ))}
            </ol>
          </div>
        )}

        {capa && (
          <div className="space-y-2.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
            <div className="flex items-center justify-between">
              <SectionTitle>CAPA Assessment</SectionTitle>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${
                capa.may_be_required
                  ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                  : "bg-emerald-50 text-emerald-700 ring-emerald-600/20"}`}>
                {capa.may_be_required ? "May be required" : "Not indicated"}
              </span>
            </div>
            {[
              ["Likely root cause", capa.root_cause_hypothesis],
              ["Corrective action", capa.corrective_action],
              ["Preventive action", capa.preventive_action],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[11px] font-semibold text-slate-500">{label}</p>
                <p className="text-xs leading-5 text-slate-800">{value || "—"}</p>
              </div>
            ))}
          </div>
        )}

        {summary && (
          <div>
            <SectionTitle>AI Complaint Summary</SectionTitle>
            <p className="mt-2 text-xs leading-5 text-slate-600">{summary}</p>
          </div>
        )}

        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
               className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
          </svg>
          <p className="text-[11px] font-medium leading-4 text-amber-800">{DISCLAIMER}</p>
        </div>
      </div>
    </div>
  );
}