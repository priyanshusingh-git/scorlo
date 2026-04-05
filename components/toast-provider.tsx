"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X, TriangleAlert } from "lucide-react";

type ToastTone = "success" | "error" | "info" | "warning";

type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
};

type ToastRecord = ToastInput & {
  id: number;
  tone: ToastTone;
};

const ToastContext = createContext<{
  pushToast: (toast: ToastInput) => void;
} | null>(null);

function toneStyles(tone: ToastTone) {
  switch (tone) {
    case "success":
      return {
        shell: "border-success/20 bg-success-soft/95 text-success",
        icon: <CheckCircle2 className="h-4 w-4" />
      };
    case "error":
      return {
        shell: "border-danger/20 bg-danger-soft/95 text-danger",
        icon: <AlertCircle className="h-4 w-4" />
      };
    case "warning":
      return {
        shell: "border-warning/20 bg-warning-soft/95 text-warning",
        icon: <TriangleAlert className="h-4 w-4" />
      };
    default:
      return {
        shell: "border-info/20 bg-info-soft/95 text-info",
        icon: <Info className="h-4 w-4" />
      };
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast: ToastInput) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [
      ...current,
      {
        id,
        tone: toast.tone ?? "info",
        title: toast.title,
        description: toast.description
      }
    ]);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      window.setTimeout(() => dismissToast(toast.id), toast.tone === "error" ? 6000 : 4200)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [dismissToast, toasts]);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[120] flex flex-col gap-3 sm:left-auto sm:right-6 sm:w-[360px]">
        {toasts.map((toast) => {
          const styles = toneStyles(toast.tone);

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-[1.2rem] border px-4 py-3 shadow-[0_20px_40px_-24px_rgba(16,32,49,0.4)] backdrop-blur ${styles.shell}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{styles.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink">{toast.title}</div>
                  {toast.description ? (
                    <p className="mt-1 text-xs leading-6 text-slate">{toast.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="rounded-full p-1 text-mist transition hover:bg-black/5 hover:text-ink"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}
