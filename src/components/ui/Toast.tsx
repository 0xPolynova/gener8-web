"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type ToastKind = "info" | "success" | "error";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = nextId++;
    setItems((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-20 right-4 z-[90] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2 md:bottom-6">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto rounded-[10px] border bg-elevated px-3.5 py-2.5 text-sm text-paper shadow-[0_12px_40px_rgba(0,0,0,0.45)] animate-rise",
              item.kind === "error"
                ? "border-[#3a1515]"
                : item.kind === "success"
                  ? "border-[#143322]"
                  : "border-line",
            )}
          >
            <span
              className={cn(
                "mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle",
                item.kind === "error"
                  ? "bg-danger"
                  : item.kind === "success"
                    ? "bg-ok"
                    : "bg-yellow",
              )}
            />
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
