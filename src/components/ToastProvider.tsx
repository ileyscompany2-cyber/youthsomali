"use client";

import { createContext, useContext, useState, useCallback, useEffect, useId } from "react";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────── */
export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

/* ─── Context ────────────────────────────────────────────────── */
const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
});

/* ─── Provider ───────────────────────────────────────────────── */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((opts: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...opts, id }]);
    const duration = opts.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

/* ─── Individual Toast ───────────────────────────────────────── */
const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />,
  error:   <AlertCircle   className="w-5 h-5 text-danger flex-shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />,
  info:    <Info          className="w-5 h-5 text-info flex-shrink-0" />,
};

const toastStyles: Record<ToastType, string> = {
  success: "border-l-4 border-success bg-white dark:bg-surface-card-dark",
  error:   "border-l-4 border-danger  bg-white dark:bg-surface-card-dark",
  warning: "border-l-4 border-warning bg-white dark:bg-surface-card-dark",
  info:    "border-l-4 border-info    bg-white dark:bg-surface-card-dark",
};

function ToastItem({ t, dismiss }: { t: Toast; dismiss: (id: string) => void }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl shadow-modal min-w-[300px] max-w-sm
        animate-slide-up ${toastStyles[t.type]}
      `}
    >
      {icons[t.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink">{t.title}</p>
        {t.message && <p className="text-xs text-ink-muted mt-0.5">{t.message}</p>}
      </div>
      <button
        onClick={() => dismiss(t.id)}
        className="ml-2 text-ink-muted hover:text-ink transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─── Container ──────────────────────────────────────────────── */
function ToastContainer({
  toasts,
  dismiss,
}: {
  toasts: Toast[];
  dismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem t={t} dismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}
