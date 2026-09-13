import { useDispatch, useSelector } from "react-redux";
import RiskBadge from "../common/RiskBadge";
import ScoreGauge from "../common/ScoreGauge";
import Spinner from "../common/Spinner";
import { recalculateRisk } from "../../store/slices/complaintsSlice";

/**
 * Stored risk assessment + on-demand recalculation.
 *
 * Governance model (matches the backend, Step 4):
 * - The record persists the assessment OUTCOME: score, level, factors.
 * - A recalculation is an EVENT: its confidence + explanation are shown
 *   once, in the "Latest Reassessment" box, and deliberately not persisted.
 * - Suggested severity/priority are advisory — the stored Section-4
 *   values remain authoritative.
 */
export default function RecordRiskCard({ complaint }) {
  const dispatch = useDispatch();
  const { loading, error, result } = useSelector((s) => s.complaints.risk);

  const { risk_score: score, risk_level: level, risk_factors: factors } = complaint;
  const assessed = score != null || Boolean(level);

  return (
    <div className="card">
      <div className="card-header flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
               className="h-4 w-4" aria-hidden="true">
            <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
            <path d="M12 9v4" /><path d="M12 16h.01" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900">Risk Assessment</h2>
          <p className="text-xs text-slate-500">Stored with the record · recalculable</p>
        </div>
        <RiskBadge level={level} />
      </div>

      <div className="space-y-4 p-5">
        {assessed ? (
          <>
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Risk Score
                </span>
                <span className="text-lg font-bold leading-none text-slate-900">
                  {score ?? "—"}<span className="text-xs font-medium text-slate-400"> /100</span>
                </span>
              </div>
              <ScoreGauge score={score ?? 0} level={level} />
            </div>

            {factors?.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Key Risk Factors
                </h4>
                <ul className="mt-2 space-y-1.5">
                  {factors.map((factor, i) => (
                    <li key={i} className="flex gap-2 text-xs leading-5 text-slate-700">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400"
                            aria-hidden="true" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5
                          text-xs leading-5 text-slate-500">
            No risk assessment is stored for this complaint — it was likely logged without
            the AI Intake Assistant. Run a recalculation to generate one.
          </div>
        )}

        {result && (
          <div className="space-y-2.5 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wide text-indigo-700">
              Latest Reassessment
            </h4>
            <p className="text-xs text-slate-600">
              Confidence <span className="font-bold text-slate-800">{result.confidence}%</span>
            </p>
            {result.explanation && (
              <p className="text-xs leading-5 text-slate-600">{result.explanation}</p>
            )}
            <p className="text-[11px] leading-4 text-slate-500">
              Suggested severity “{result.severity}” and priority “{result.priority}” are
              advisory — the stored assessment on this record remains authoritative.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700">
            {error}
          </div>
        )}

        <button type="button" className="btn-primary w-full text-xs"
                onClick={() => dispatch(recalculateRisk(complaint.id))}
                disabled={loading}>
          {loading
            ? <><Spinner /> Recalculating…</>
            : result ? "Recalculate Again" : "Recalculate Risk"}
        </button>
        <p className="text-center text-[11px] text-slate-400">
          Re-runs the AI risk node and persists score, level &amp; factors to this record.
        </p>
      </div>
    </div>
  );
}