"use client";
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
};

type ToastContextValue = {
  show: (input: { type?: ToastType; title: string; message?: string; duration?: number }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show: ToastContextValue["show"] = useCallback(
    ({ type = "info", title, message, duration = 3500 }) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);
      if (duration > 0) {
        setTimeout(() => remove(id), duration);
      }
    },
    [remove]
  );

  const success = useCallback((title: string, message?: string) => show({ type: "success", title, message }), [show]);
  const error = useCallback((title: string, message?: string) => show({ type: "error", title, message, duration: 5000 }), [show]);
  const info = useCallback((title: string, message?: string) => show({ type: "info", title, message }), [show]);

  return (
    <ToastContext.Provider value={{ show, success, error, info }}>
      {children}

      {/* Toast container — top-right, stacked */}
      <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const styles = {
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: "text-emerald-500",
      title: "text-emerald-900",
      iconPath: "M5 13l4 4L19 7",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: "text-red-500",
      title: "text-red-900",
      iconPath: "M6 18L18 6M6 6l12 12",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-500",
      title: "text-blue-900",
      iconPath: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto ${styles.bg} border ${styles.border} rounded-lg shadow-lg p-4 transform transition-all duration-300 ${
        visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 mt-0.5 ${styles.icon}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={styles.iconPath} />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${styles.title}`}>{toast.title}</p>
          {toast.message && (
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">{toast.message}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-stone-400 hover:text-stone-700 transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
