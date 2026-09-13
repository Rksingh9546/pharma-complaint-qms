const STYLES = {
  LOW: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  MEDIUM: "bg-amber-50 text-amber-700 ring-amber-600/20",
  HIGH: "bg-orange-50 text-orange-700 ring-orange-600/20",
  CRITICAL: "bg-red-50 text-red-700 ring-red-600/20",
};

/** Colored pill for a risk level — used on intake, list and details pages. */
export default function RiskBadge({ level, className = "" }) {
  const key = (level || "").toUpperCase();
  const style = STYLES[key] ?? "bg-slate-50 text-slate-600 ring-slate-500/20";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ring-1 ring-inset ${style} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {level ? key : "NOT ASSESSED"}
    </span>
  );
}