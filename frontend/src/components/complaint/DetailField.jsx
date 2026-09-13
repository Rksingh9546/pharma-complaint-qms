/** Shared label class so custom blocks (badges, chips) match DetailField labels. */
export const DETAIL_LABEL = "text-[11px] font-semibold uppercase tracking-wide text-slate-400";

/**
 * Read-only label/value display. Missing data renders as a subtle em-dash
 * rather than an empty gap — "visibly absent", not "invisible".
 */
export default function DetailField({ label, value, full = false, mono = false }) {
  const missing = value === null || value === undefined || value === "";
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <p className={DETAIL_LABEL}>{label}</p>
      {missing ? (
        <p className="mt-1 text-sm text-slate-400">—</p>
      ) : (
        <p className={`mt-1 break-words text-sm font-medium text-slate-800 ${mono ? "font-mono" : ""}`}>
          {value}
        </p>
      )}
    </div>
  );
}