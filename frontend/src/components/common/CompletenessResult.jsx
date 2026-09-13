const BAR = { ok: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-red-500" };

/** Shared tone color for the % shown in card headers. */
export const TONE_TEXT = { ok: "text-emerald-700", warn: "text-amber-700", bad: "text-red-700" };

/** Stats over a [{label, present}] checklist. */
export function completenessStats(checks) {
  const complete = checks.filter((c) => c.present).length;
  const pct = checks.length ? Math.round((100 * complete) / checks.length) : 0;
  return { complete, total: checks.length, pct, tone: pct >= 85 ? "ok" : pct >= 50 ? "warn" : "bad" };
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
         className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true">
      <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
  );
}

/**
 * Shared completeness renderer: bar + count + checklist.
 *
 * Callers decide HOW presence is determined — the intake panel evaluates
 * the live form state; the details page displays the server-evaluated
 * saved record. The rendering stays identical in both places.
 */
export default function CompletenessResult({ checks, columns = 1 }) {
  const { complete, total, pct, tone } = completenessStats(checks);
  const missing = checks.filter((c) => !c.present);

  return (
    <div className="space-y-3">
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full transition-all duration-500 ${BAR[tone]}`}
             style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-500">
        <span className="font-semibold text-slate-700">{complete} of {total}</span> key fields captured
        {missing.length > 0 && (
          <> — <span className="font-medium text-amber-700">{missing.length} missing</span></>
        )}
      </p>
      <ul className={`grid grid-cols-1 gap-x-4 gap-y-1.5 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
        {checks.map(({ label, present }) => (
          <li key={label}
              className={`flex items-center gap-2 text-xs ${present ? "text-slate-600" : "font-medium text-amber-700"}`}>
            {present ? <CheckIcon /> : <WarnIcon />}
            {label}{!present && " — missing"}
          </li>
        ))}
      </ul>
    </div>
  );
}