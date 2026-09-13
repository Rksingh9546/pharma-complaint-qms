const GAUGE_COLORS = {
  LOW: "bg-emerald-500", MEDIUM: "bg-amber-500",
  HIGH: "bg-orange-500", CRITICAL: "bg-red-600",
};

/** 0-100 bar with tick marks at the risk band boundaries (40 / 65 / 85). */
export default function ScoreGauge({ score, level, className = "" }) {
  const color = GAUGE_COLORS[level] ?? "bg-slate-400";
  return (
    <div className={`relative h-2.5 overflow-hidden rounded-full bg-slate-200 ${className}`}>
      <div className={`h-full rounded-full transition-all duration-700 ${color}`}
           style={{ width: `${score}%` }} />
      {[40, 65, 85].map((p) => (
        <span key={p} className="absolute inset-y-0 w-px bg-white/80"
              style={{ left: `${p}%` }} aria-hidden="true" />
      ))}
    </div>
  );
}