"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type ToastMsg = { id: number; text: string; action?: { label: string; run: () => void } };
const ToastCtx = createContext<(text: string, action?: ToastMsg["action"]) => void>(() => {});

/** Toast: bottom-centre, 5 s, optional Undo. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((text: string, action?: ToastMsg["action"]) => {
    setMsg({ id: Date.now(), text, action });
  }, []);
  useEffect(() => {
    if (!msg) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 5000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [msg]);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-40">
        {msg && (
          <div
            key={msg.id}
            className="wp-toast glass-float pointer-events-auto absolute left-1/2 flex max-w-[calc(100vw-32px)] items-center gap-3 rounded-btn px-4 py-3 text-sm text-ink"
          >
            <span>{msg.text}</span>
            {msg.action && (
              <button
                type="button"
                onClick={() => {
                  msg.action?.run();
                  setMsg(null);
                }}
                className="h-9 shrink-0 cursor-pointer rounded-sm border border-link bg-transparent px-3.5 font-semibold text-link"
              >
                {msg.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
