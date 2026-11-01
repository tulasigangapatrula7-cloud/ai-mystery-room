// client/src/components/UI.jsx
// Small reusable pieces: spinner, error box, empty state, confirm popup, toasts.

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";

// ---------- Spinner ----------
export function Spinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" role="status">
      <Loader2 className="h-10 w-10 animate-spin text-gold-400" aria-hidden="true" />
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}

// ---------- Error box ----------
export function ErrorBox({ message, onRetry }) {
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 sm:flex-row sm:items-center"
      role="alert"
    >
      <AlertTriangle className="h-6 w-6 shrink-0 text-red-400" aria-hidden="true" />
      <p className="flex-1 text-sm text-red-100">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-ghost">
          Try again
        </button>
      )}
    </div>
  );
}

// ---------- Empty state ----------
export function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="glass flex flex-col items-center gap-3 px-6 py-12 text-center">
      {Icon && <Icon className="h-10 w-10 text-gold-400" aria-hidden="true" />}
      <h2 className="text-xl">{title}</h2>
      {text && <p className="max-w-md text-sm text-slate-400">{text}</p>}
      {children}
    </div>
  );
}

// ---------- Confirm popup ----------
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  // Escape closes the popup.
  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape" && !busy) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={() => !busy && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="glass-gold fade-up w-full max-w-md bg-navy-900/95 p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-2xl">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{message}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? "btn-danger" : "btn-gold"}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Toast notifications ----------
const ToastContext = createContext({ notify: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_STYLES = {
  success: { icon: CheckCircle2, color: "text-emerald-400", border: "border-emerald-500/40" },
  error: { icon: XCircle, color: "text-red-400", border: "border-red-500/40" },
  info: { icon: Info, color: "text-gold-400", border: "border-gold-500/40" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4500);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
        aria-live="polite"
        role="status"
      >
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              className={`fade-up pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border bg-navy-900/95 px-4 py-3 text-sm shadow-lg ${style.border}`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.color}`} aria-hidden="true" />
              <span>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
