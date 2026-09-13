import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import RiskBadge from "../components/common/RiskBadge";
import SeverityBadge from "../components/common/SeverityBadge";
import StatusBadge from "../components/common/StatusBadge";
import ComplaintRecord from "../components/complaint/ComplaintRecord";
import RecordCompletenessCard from "../components/complaint/RecordCompletenessCard";
import RecordRecommendationCard from "../components/complaint/RecordRecommendationCard";
import RecordRiskCard from "../components/complaint/RecordRiskCard";
import { clearCurrent, fetchComplaintById } from "../store/slices/complaintsSlice";
import { formatDate, formatDateTime } from "../utils/format";

function DetailsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
      <div className="card p-6">
        <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="card space-y-4 p-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-slate-200"
                 style={{ width: `${88 - i * 7}%` }} />
          ))}
        </div>
        <div className="space-y-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-40 animate-pulse bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ComplaintDetailsPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current, currentLoading, currentError } = useSelector((s) => s.complaints);

  useEffect(() => {
    dispatch(fetchComplaintById(id));
    return () => dispatch(clearCurrent()); // unmount / id change -> no stale flash
  }, [id, dispatch]);

  if (currentError) {
    return (
      <div className="card mx-auto flex max-w-lg flex-col items-center gap-3 p-12 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
               className="h-5 w-5" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6M9 9l6 6" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">Could not load this complaint</p>
          <p className="mt-1 text-xs text-slate-500">{currentError}</p>
        </div>
        <div className="mt-1 flex gap-3">
          <button type="button" className="btn-secondary text-xs"
                  onClick={() => dispatch(fetchComplaintById(id))}>
            Retry
          </button>
          <Link to="/complaints" className="btn-primary text-xs">Back to List</Link>
        </div>
      </div>
    );
  }

  if (currentLoading || !current) return <DetailsSkeleton />;

  const c = current;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs" aria-label="Breadcrumb">
        <Link to="/complaints" className="font-medium text-slate-500 hover:text-indigo-600">
          Complaints
        </Link>
        <span aria-hidden="true" className="text-slate-400">/</span>
        <span className="font-semibold text-slate-700">{c.complaint_number}</span>
      </nav>

      {/* Header */}
      <div className="card px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">{c.complaint_number}</h1>
              <StatusBadge status={c.status} />
              <SeverityBadge severity={c.severity} />
              <RiskBadge level={c.risk_level} />
            </div>
            <p className="mt-1.5 truncate text-sm font-medium text-slate-700">
              {c.customer_name} · {c.product_name}
              {c.batch_number && (
                <span className="font-mono text-slate-500"> · {c.batch_number}</span>
              )}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Received {formatDate(c.complaint_received_date) ?? "—"}
              {" · "}Logged {formatDateTime(c.created_at) ?? "—"}
              {c.product_type && <> · {c.product_type}</>}
            </p>
          </div>
          <Link to="/complaints" className="btn-secondary shrink-0 self-start text-xs">
            ← Back to List
          </Link>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="space-y-5">
          <ComplaintRecord complaint={c} />

          {/* Metadata footer */}
          <div className="card px-5 py-4">
            <h2 className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Record Metadata
            </h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-3">
              {[
                ["Record ID", `#${c.id}`],
                ["Complaint Number", c.complaint_number],
                ["Status", c.status],
                ["Created", formatDateTime(c.created_at)],
                ["Last Updated", formatDateTime(c.updated_at)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                  <dd className="mt-0.5 text-slate-700">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="space-y-5">
          <RecordRiskCard complaint={c} />
          <RecordRecommendationCard complaint={c} />
          <RecordCompletenessCard complaint={c} />
        </div>
      </div>
    </div>
  );
}