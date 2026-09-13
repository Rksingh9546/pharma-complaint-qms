import { useSelector } from "react-redux";
import RiskBadge from "../common/RiskBadge";
import ScoreGauge from "../common/ScoreGauge";



function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-2.5 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-slate-900">{value ?? "—"}</p>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{children}</h4>
  );
}

export default function RiskAssessmentPanel() {
  const analysis = useSelector((s) => s.ai.analysis);
  if (!analysis) return null;

  const { risk, recommendations } = analysis;
  const actions = recommendations?.recommended_actions ?? [];
  const capa = recommendations?.capa;
  const summary = recommendations?.summary;

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
               className="h-4 w-4" aria-hidden="true">
            <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
            <path d="M12 9v4" /><path d="M12 16h.01" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900">AI Risk Assessment</h2>
          <p className="text-xs text-slate-500">Snapshot of the assessment at analysis time</p>
        </div>
        <RiskBadge level={risk?.risk_level} />
      </div>

      <div className="space-y-4 p-5">
        {/* Score + gauge */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Risk Score
            </span>
            <span className="text-lg font-bold leading-none text-slate-900">
              {risk?.risk_score ?? "—"}
              <span className="text-xs font-medium text-slate-400"> /100</span>
            </span>
          </div>
          <ScoreGauge score={risk?.risk_score ?? 0} level={risk?.risk_level} />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Confidence" value={risk?.confidence != null ? `${risk.confidence}%` : "—"} />
          <Stat label="Severity" value={risk?.severity} />
          <Stat label="Priority" value={risk?.priority} />
        </div>

        {/* Risk factors */}
        {risk?.risk_factors?.length > 0 && (
          <div>
            <SectionTitle>Key Risk Factors</SectionTitle>
            <ul className="mt-2 space-y-1.5">
              {risk.risk_factors.map((factor, i) => (
                <li key={i} className="flex gap-2 text-xs leading-5 text-slate-700">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400"
                        aria-hidden="true" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Explanation */}
        {risk?.explanation && (
          <div>
            <SectionTitle>AI Explanation</SectionTitle>
            <p className="mt-2 rounded-lg border border-slate-100 bg-slate-50 p-3
                          text-xs leading-5 text-slate-600">
              {risk.explanation}
            </p>
          </div>
        )}

        {/* Recommended actions */}
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

        {/* CAPA assessment */}
        {capa && (
          <div className="space-y-2.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
            <div className="flex items-center justify-between">
              <SectionTitle>CAPA Assessment</SectionTitle>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset
                ${capa.may_be_required
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

        {/* AI summary */}
        {summary && (
          <div>
            <SectionTitle>AI Complaint Summary</SectionTitle>
            <p className="mt-2 text-xs leading-5 text-slate-600">{summary}</p>
          </div>
        )}

        {/* Mandatory disclaimer */}
        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
               className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
          </svg>
          <p className="text-[11px] font-medium leading-4 text-amber-800">
            {analysis.disclaimer ??
              "AI-assisted recommendation. Final quality decisions must be made by authorized Quality personnel."}
          </p>
        </div>
      </div>
    </div>
  );
}