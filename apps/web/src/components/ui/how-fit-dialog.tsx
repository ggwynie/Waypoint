"use client";

import { useEffect, useRef } from "react";
import { PART_META } from "@/lib/categories";

/* Rule text matches the Fit formula (weights 30/30/20/10/10, trust values 1.0 / 0.8 / 0.6). */
const RULES = [
  { key: "major", max: 30, text: "Your major listed by the organizer: 30. Open to all majors: 18. Not open to your major: 0, and the item moves to the end." },
  { key: "match", max: 30, text: "30 × the share of the item’s topics and required skills you have. Topics you marked Not relevant count less for about two weeks." },
  { key: "distance", max: 20, text: "From your home or campus, your choice. Online: 20. Inside your radius: 20 × (1 − 0.5 × km/radius). Outside: 20 × 0.25 × radius/km." },
  { key: "prep_time", max: 10, text: "7 to 30 days left: 10. More than 30: 7. 3 to 6 days: 6. Under 3 days: 2." },
  { key: "trust", max: 10, text: "Official source: 10. Confirmed by 2 sources: 8. Reviewed by admin: 6." },
] as const;

/** HowFitDialog. */
export function HowFitDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(panel.current?.querySelectorAll<HTMLElement>("button, [href], [tabindex]:not([tabindex='-1'])") ?? []);
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-overlay p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="howfit-title"
        className="box-border flex max-h-[calc(100vh-48px)] w-[640px] max-w-full flex-col gap-3.5 overflow-auto rounded-panel border border-line p-7 backdrop-blur-[18px] backdrop-saturate-[1.4]"
        style={{ background: "linear-gradient(160deg, var(--modalA), var(--modalB))", boxShadow: "0 40px 90px -30px var(--shadow)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="howfit-title" className="m-0 font-heading text-[26px] tracking-[-0.5px]">
            How Fit is scored
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="h-10 w-10 shrink-0 cursor-pointer rounded-field border border-line bg-transparent text-lg text-ink">
            ✕
          </button>
        </div>
        <p className="m-0 text-sm leading-[1.6] text-muted2">
          Fixed rules, no black box. Every opportunity gets up to 100 points from five parts. Open any card in the feed to see its own numbers.
        </p>
        {RULES.map((r) => (
          <div key={r.key} className="inset flex items-start gap-3.5 rounded-btn px-3.5 py-3">
            <div className="w-[52px] shrink-0 font-heading text-[22px] font-bold" style={{ color: PART_META[r.key].color }}>
              {r.max}
            </div>
            <div>
              <div className="text-[15px] font-bold">{PART_META[r.key].title}</div>
              <div className="text-[13px] leading-normal text-muted">{r.text}</div>
            </div>
          </div>
        ))}
        <p className="m-0 text-[13px] leading-normal text-muted">
          Items your semester or major cannot join are still listed, but last and marked, so you know they exist.
        </p>
      </div>
    </div>
  );
}
