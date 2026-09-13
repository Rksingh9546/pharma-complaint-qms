import { Field } from "./FormFields";
import FormSection from "./FormSection";

const SOURCES = [
  "Email", "Phone", "Fax", "Letter", "Distributor",
  "Regulatory Authority", "Internal Audit", "Website", "Other",
];

export default function Section1Origin() {
  return (
    <FormSection number={1} title="Origin & Customer Details"
                 description="Who raised the complaint and how it reached us.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field name="complaint_source" label="Complaint Source" type="select" options={SOURCES} />
        <Field name="customer_name" label="Customer Name" required />
        <Field name="customer_email" label="Customer Email" type="email" />
        <Field name="country" label="Country" />
        <Field name="complaint_received_date" label="Complaint Received Date" type="date" />
      </div>
    </FormSection>
  );
}