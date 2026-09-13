import SeverityBadge from "../common/SeverityBadge";
import { formatDate } from "../../utils/format";
import DetailField, { DETAIL_LABEL } from "./DetailField";
import FormSection from "./FormSection";

const PRIORITY_TEXT = {
  Low: "text-slate-500", Medium: "text-blue-600",
  High: "text-orange-600", Urgent: "text-red-600",
};

function FlagChip({ label, on, danger = false }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]
                      font-bold ring-1 ring-inset ${
                        on
                          ? danger
                            ? "bg-red-50 text-red-700 ring-red-600/20"
                            : "bg-indigo-50 text-indigo-700 ring-indigo-600/20"
                          : "bg-slate-50 text-slate-400 ring-slate-400/20"
                      }`}>
      <span aria-hidden="true">{on ? "✓" : "✕"}</span>
      {label}
    </span>
  );
}

/** The four form sections, mirrored read-only — what you reviewed is what was stored. */
export default function ComplaintRecord({ complaint: c }) {
  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <h2 className="text-sm font-bold text-slate-900">Complaint Record</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Data as logged and reviewed by Quality personnel.
        </p>
      </div>

      <div className="divide-y divide-slate-200">
        <FormSection number={1} title="Origin & Customer Details"
                     description="Who raised the complaint and how it reached us.">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <DetailField label="Complaint Source" value={c.source} />
            <DetailField label="Customer Name" value={c.customer_name} />
            <DetailField label="Customer Email" value={c.customer_email} />
            <DetailField label="Country" value={c.country} />
            <DetailField label="Complaint Received Date"
                         value={formatDate(c.complaint_received_date)} />
          </div>
        </FormSection>

        <FormSection number={2} title="Product & Batch Identification"
                     description="Affected product, batch and traceability data.">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <DetailField label="Product Name" value={c.product_name} />
            <DetailField label="Product Type" value={c.product_type} />
            <DetailField label="Strength / Grade" value={c.strength} />
            <DetailField label="Batch / Lot Number" value={c.batch_number} mono />
            <DetailField label="Manufacturing Date" value={formatDate(c.manufacturing_date)} />
            <DetailField label="Expiry Date" value={formatDate(c.expiry_date)} />
            <DetailField label="Quantity Affected"
                         value={c.quantity_affected != null
                           ? `${c.quantity_affected}${c.unit ? ` ${c.unit}` : ""}`
                           : null} />
          </div>
        </FormSection>

        <FormSection number={3} title="Complaint Details"
                     description="What the customer reported.">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <DetailField label="Complaint Type" value={c.complaint_type} />
            <DetailField label="Complaint Date" value={formatDate(c.complaint_date)} />
            <DetailField label="Detailed Complaint Description" full value={c.description} />
          </div>
        </FormSection>

        <FormSection number={4} title="Initial Assessment"
                     description="Human-reviewed assessment — authoritative.">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <p className={DETAIL_LABEL}>Initial Severity</p>
              <div className="mt-1"><SeverityBadge severity={c.severity} /></div>
            </div>
            <div>
              <p className={DETAIL_LABEL}>Priority</p>
              <p className={`mt-1 text-sm font-bold ${PRIORITY_TEXT[c.priority] ?? "text-slate-600"}`}>
                {c.priority || "—"}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className={DETAIL_LABEL}>Flags</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <FlagChip label="Investigation Required" on={c.investigation_required} />
                <FlagChip label="Adverse Event Suspected" on={c.adverse_event} danger />
              </div>
            </div>
          </div>
        </FormSection>
      </div>
    </div>
  );
}