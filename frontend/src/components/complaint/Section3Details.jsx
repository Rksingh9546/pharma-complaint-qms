import { useRef } from "react";
import { useDispatch } from "react-redux";
import { addToast } from "../../store/slices/uiSlice";
import { Field, useField } from "./FormFields";
import FormSection from "./FormSection";

const COMPLAINT_TYPES = [
  "Physical Defect", "Packaging Defect", "Labeling Error", "Contamination",
  "Potency/Assay Failure", "Stability Issue", "Documentation Error",
  "Adverse Event", "Quantity Shortage", "Other",
];

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".eml"];
const MAX_BYTES = 10 * 1024 * 1024;

function formatSize(bytes) {
  return bytes >= 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Optional supporting document. Metadata only — files are not persisted in this scope. */
function AttachmentField() {
  const [attachment, setAttachment] = useField("attachment");
  const dispatch = useDispatch();
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const ext = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      dispatch(addToast({ type: "error",
        message: `Unsupported attachment type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}.` }));
      return;
    }
    if (file.size > MAX_BYTES) {
      dispatch(addToast({ type: "error", message: "Attachment exceeds the 10 MB limit." }));
      return;
    }
    setAttachment({ name: file.name, size: file.size });
  };

  return (
    <div>
      <span className="form-label">Attachment</span>
      {attachment ? (
        <div className="flex items-center gap-3 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
               className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">{attachment.name}</p>
            <p className="text-xs text-slate-500">
              {formatSize(attachment.size)} · not stored in this demo
            </p>
          </div>
          <button type="button" aria-label="Remove attachment"
                  className="text-slate-400 transition hover:text-red-600"
                  onClick={() => setAttachment(null)}>
            ✕
          </button>
        </div>
      ) : (
        <button type="button" className="btn-secondary w-full"
                onClick={() => inputRef.current?.click()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               className="h-4 w-4" aria-hidden="true">
            <path d="M21.4 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.2-9.19a4 4 0 1 1 5.65 5.66l-9.2 9.19a2 2 0 1 1-2.83-2.83l8.49-8.48" />
          </svg>
          Attach supporting document (optional)
        </button>
      )}
      <input ref={inputRef} type="file" accept=".pdf,.docx,.txt,.eml" className="hidden"
             onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}

export default function Section3Details() {
  return (
    <FormSection number={3} title="Complaint Details"
                 description="What the customer reported, in their own terms.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field name="complaint_type" label="Complaint Type" type="select" options={COMPLAINT_TYPES} />
        <Field name="complaint_date" label="Complaint Date" type="date" />
        <div className="sm:col-span-2">
          <Field name="description" label="Detailed Complaint Description" type="textarea" rows={5} />
        </div>
        <div className="sm:col-span-2">
          <AttachmentField />
        </div>
      </div>
    </FormSection>
  );
}