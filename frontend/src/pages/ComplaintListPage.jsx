import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import useDebounce from "../hooks/useDebounce";
import RiskBadge from "../components/common/RiskBadge";
import SeverityBadge from "../components/common/SeverityBadge";
import Spinner from "../components/common/Spinner";
import StatusBadge from "../components/common/StatusBadge";
import { clearFilters, fetchComplaints, setFilter } from "../store/slices/complaintsSlice";
import { formatDate } from "../utils/format";

const SEVERITIES = ["Minor", "Major", "Critical"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const STATUSES = ["Open", "Under Investigation", "Closed"];
const PRODUCT_TYPES = ["API", "FDF"];

const FILTERS = [
  { key: "severity", label: "Severity", options: SEVERITIES },
  { key: "priority", label: "Priority", options: PRIORITIES },
  { key: "status", label: "Status", options: STATUSES },
  { key: "product_type", label: "Type", options: PRODUCT_TYPES },
];

const PRIORITY_TEXT = {
  Low: "text-slate-500", Medium: "text-blue-600",
  High: "text-orange-600", Urgent: "text-red-600",
};

// thead + skeleton cells share these — the two can never drift apart
const HEADERS = ["Complaint", "Customer", "Product", "Batch", "Severity",
                 "Priority", "Risk", "Status", "Date"];
const TH_CLASSES = [
  "px-4 py-3 text-left font-semibold",
  "px-4 py-3 text-left font-semibold",
  "px-4 py-3 text-left font-semibold hidden sm:table-cell",
  "px-4 py-3 text-left font-semibold hidden md:table-cell",
  "px-4 py-3 text-left font-semibold",
  "px-4 py-3 text-left font-semibold hidden lg:table-cell",
  "px-4 py-3 text-left font-semibold",
  "px-4 py-3 text-left font-semibold hidden sm:table-cell",
  "px-4 py-3 text-left font-semibold hidden md:table-cell",
];
const SKELETON_WIDTHS = ["w-20", "w-28", "w-36", "w-24", "w-16",
                          "w-14", "w-20", "w-24", "w-20"];



export default function ComplaintListPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading, error, filters } = useSelector((s) => s.complaints);

  // Local input for instant feedback; the debounced value is committed to Redux.
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      dispatch(setFilter({ key: "search", value: debouncedSearch }));
    }
  }, [debouncedSearch, filters.search, dispatch]);

  // Single fetch trigger: mount + any committed filter change.
  useEffect(() => {
    dispatch(fetchComplaints());
  }, [filters, dispatch]);

  const filtersActive = Boolean(
    filters.search || filters.severity || filters.priority || filters.status || filters.product_type
  );

  const handleClear = () => {
    setSearchInput("");
    dispatch(clearFilters());
  };

  return (
    <div className="space-y-5">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">Complaint Management</p>
          <h1 className="mt-0.5 text-xl font-bold text-slate-900">Customer Complaints</h1>
          <p className="mt-1 text-sm text-slate-500">
            {error ? "Could not load complaints."
                   : `${items.length} complaint${items.length === 1 ? "" : "s"}${filtersActive ? " matching your filters" : " registered"}`}
          </p>
        </div>
        <Link to="/complaints/new" className="btn-primary self-start sm:self-auto">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               className="h-4 w-4" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Complaint
        </Link>
      </div>

      {/* ── Search + filters ─────────────────────────────────────── */}
      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="relative min-w-0 flex-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                 aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search" className="input pl-9" value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by complaint number, customer, product, batch or description…"
              aria-label="Search complaints"
            />
            {loading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <Spinner className="h-4 w-4 text-indigo-600" />
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FILTERS.map(({ key, label, options }) => (
              <div key={key} className="min-w-0">
                <label htmlFor={`filter-${key}`} className="form-label">{label}</label>
                <select id={`filter-${key}`} className="select" value={filters[key]}
                        onChange={(e) => dispatch(setFilter({ key, value: e.target.value }))}>
                  <option value="">All</option>
                  {options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {filtersActive && (
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500">
              Search &amp; filters are applied server-side.
            </p>
            <button type="button" onClick={handleClear} className="btn-secondary text-xs">
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ── Table / states ───────────────────────────────────────── */}
      {error ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                 className="h-5 w-5" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Failed to load complaints</p>
            <p className="mt-1 text-xs text-slate-500">{error}</p>
          </div>
          <button type="button" className="btn-secondary text-xs"
                  onClick={() => dispatch(fetchComplaints())}>
            Retry
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                  {HEADERS.map((header, i) => (
                    <th key={header} scope="col" className={TH_CLASSES[i]}>{header}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  // ── skeleton rows ──
                  [...Array(6)].map((_, row) => (
                    <tr key={`skeleton-${row}`} className="animate-pulse border-t border-slate-100">
                      {SKELETON_WIDTHS.map((width, col) => (
                        <td key={col} className={TH_CLASSES[col].replace("font-semibold", "")}>
                          <div className={`h-3.5 rounded bg-slate-200 ${width}`} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  // ── empty state ──
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      {filtersActive ? (
                        <>
                          <p className="text-sm font-semibold text-slate-700">
                            No complaints match your search or filters
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Try a different search term or clear the filters.
                          </p>
                          <button type="button" onClick={handleClear}
                                  className="btn-secondary mt-4 text-xs">
                            Clear filters
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-slate-700">No complaints yet</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Complaints you save from the intake page will appear here.
                          </p>
                          <Link to="/complaints/new" className="btn-primary mt-4 text-xs">
                            Log your first complaint
                          </Link>
                        </>
                      )}
                    </td>
                  </tr>
                ) : (
                  // ── data rows ──
                  items.map((c) => (
                    <tr key={c.id}
                        onClick={() => navigate(`/complaints/${c.id}`)}
                        className="cursor-pointer border-t border-slate-100 transition hover:bg-indigo-50/40">
                      <td className="px-4 py-3">
                        <Link to={`/complaints/${c.id}`} onClick={(e) => e.stopPropagation()}
                              className="text-sm font-bold text-indigo-600 hover:underline">
                          {c.complaint_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[180px] truncate text-sm font-medium text-slate-800"
                           title={c.customer_name}>
                          {c.customer_name}
                        </p>
                        {c.country && <p className="text-[11px] text-slate-400">{c.country}</p>}
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <p className="max-w-[220px] truncate text-sm text-slate-700"
                           title={c.product_name}>
                          {c.product_name}
                        </p>
                        {c.product_type && (
                          <p className="text-[10px] font-bold tracking-wide text-slate-400">
                            {c.product_type}
                          </p>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <span className="font-mono text-xs text-slate-600">{c.batch_number || "—"}</span>
                      </td>
                      <td className="px-4 py-3"><SeverityBadge severity={c.severity} /></td>
                      <td className={`hidden px-4 py-3 text-sm font-medium lg:table-cell
                                      ${PRIORITY_TEXT[c.priority] ?? "text-slate-600"}`}>
                        {c.priority || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span title={c.risk_score != null ? `Risk score: ${c.risk_score}/100` : undefined}>
                          <RiskBadge level={c.risk_level} />
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell"><StatusBadge status={c.status} /></td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-slate-500 md:table-cell">
                        {formatDate(c.complaint_received_date ?? c.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}