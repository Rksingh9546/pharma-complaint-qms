const STYLES = {
  Minor: "bg-slate-100 text-slate-600 ring-slate-500/20",
  Major: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Critical: "bg-red-50 text-red-700 ring-red-600/20",
};

export default function SeverityBadge({ severity }) {
  if (!severity) return <span className="text-xs text-slate-400">—</span>;
  const style = STYLES[severity] ?? STYLES.Minor;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px]
                      font-bold tracking-wide ring-1 ring-inset ${style}`}>
      {severity}
    </span>
  );
}