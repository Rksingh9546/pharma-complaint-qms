import { useDispatch, useSelector } from "react-redux";
import { setField } from "../../store/slices/formSlice";

const AI_PLACEHOLDER = "Awaiting AI extraction...";

/** Bind one form field to Redux: [value, setValue]. */
export function useField(name) {
  const value = useSelector((s) => s.form[name]);
  const dispatch = useDispatch();
  return [value, (value) => dispatch(setField({ field: name, value }))];
}

/**
 * Generic controlled field. type: text | email | date | number | select | textarea.
 *
 * Details worth explaining in an interview:
 * - Placeholder shows "Awaiting AI extraction..." until an analysis completes,
 *   then switches to a normal prompt (signals: the AI had its turn, now it's yours).
 * - If the AI returned a select value that isn't in our option list, it is added
 *   as an extra option — the data is never silently dropped.
 */
export function Field({ name, label, type = "text", options = [], placeholder,
                        required, hint, rows = 4, min }) {
  const [value, setValue] = useField(name);
  const aiDone = useSelector((s) => s.ai.status === "complete");

  const ph = placeholder ?? (aiDone ? `Enter ${label.toLowerCase()}` : AI_PLACEHOLDER);
  const id = `field-${name}`;

  let control;
  if (type === "select") {
    const normalized = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
    const current = value ?? "";
    const list = current && !normalized.some((o) => o.value === current)
      ? [{ value: current, label: current }, ...normalized]
      : normalized;
    control = (
      <select id={id} className="select" value={current}
              onChange={(e) => setValue(e.target.value)}>
        <option value="">{ph}</option>
        {list.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  } else if (type === "textarea") {
    control = (
      <textarea id={id} className="textarea" rows={rows} value={value ?? ""}
                placeholder={ph} onChange={(e) => setValue(e.target.value)} />
    );
  } else {
    control = (
      <input id={id} type={type} className="input" value={value ?? ""} min={min}
             placeholder={ph} onChange={(e) => setValue(e.target.value)} />
    );
  }

  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {control}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

/** Labeled on/off switch (used for the two Section-4 flags). */
export function ToggleField({ name, label, description, danger = false }) {
  const [value, setValue] = useField(name);
  const on = !!value;
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4
                      rounded-lg border border-slate-200 bg-white p-3.5 transition hover:bg-slate-50">
      <span>
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-slate-500">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" checked={on}
               onChange={(e) => setValue(e.target.checked)} />
        <span className={`h-5 w-9 rounded-full transition ${on ? (danger ? "bg-red-600" : "bg-indigo-600") : "bg-slate-300"}`} />
        <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${on ? "translate-x-4" : ""}`} />
      </span>
    </label>
  );
}