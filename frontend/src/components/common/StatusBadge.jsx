const STYLES = {
  Open: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  "Under Investigation": "bg-amber-50 text-amber-700 ring-amber-600/20",
  Closed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

export default function StatusBadge({ status }) {
  if (!status) return <span className="text-xs text-slate-400">—</span>;
  const style = STYLES[status] ?? STYLES.Open;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full
                      px-2.5 py-1 text-[11px] font-bold tracking-wide ring-1 ring-inset ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}