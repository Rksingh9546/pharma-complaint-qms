import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { removeToast } from "../../store/slices/uiSlice";

const STYLES = {
  success: { box: "border-green-200 bg-green-50 text-green-800", icon: "bg-green-500", glyph: "✓" },
  error: { box: "border-red-200 bg-red-50 text-red-800", icon: "bg-red-500", glyph: "!" },
  info: { box: "border-indigo-200 bg-indigo-50 text-indigo-800", icon: "bg-indigo-500", glyph: "i" },
};

function Toast({ toast }) {
  const dispatch = useDispatch();
  const style = STYLES[toast.type] ?? STYLES.info;

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(toast.id)), 4500);
    return () => clearTimeout(timer); // dismissed early -> cancel the timer
  }, [dispatch, toast.id]);

  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-80 items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${style.box}`}
    >
      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${style.icon}`}>
        {style.glyph}
      </span>
      <p className="flex-1 text-sm font-medium leading-5">{toast.message}</p>
      <button
        onClick={() => dispatch(removeToast(toast.id))}
        className="ml-1 text-sm opacity-50 hover:opacity-100"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useSelector((s) => s.ui.toasts);
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}