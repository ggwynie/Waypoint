import type { ReactNode } from "react";
import type { TrustLevel } from "@/lib/api";
import { TRUST_LABEL } from "@/lib/categories";
import { formatDay } from "@/lib/format";

function Base({ bg, ink, children }: { bg: string; ink: string; children: ReactNode }) {
  return (
    <span className="rounded-xs px-2 py-[3px] text-xs" style={{ background: bg, color: ink }}>
      {children}
    </span>
  );
}

/** Badge. */
export function TrustBadge({ level }: { level: TrustLevel }) {
  return level === "official" ? (
    <Base bg="var(--okBg)" ink="var(--ok)">✓ {TRUST_LABEL[level]}</Base>
  ) : (
    <Base bg="var(--infoBg)" ink="var(--soft)">{TRUST_LABEL[level]}</Base>
  );
}

export function DeadlineBadge({ daysLeft, deadline }: { daysLeft: number; deadline?: string }) {
  const urgent = daysLeft < 7;
  return (
    <Base bg={urgent ? "var(--warnBg)" : "var(--track)"} ink={urgent ? "var(--warn)" : "var(--ink2)"}>
      {daysLeft} {daysLeft === 1 ? "day" : "days"} left{deadline ? ` · ${formatDay(deadline)}` : ""}
    </Base>
  );
}

export function TagBadge({ children }: { children: ReactNode }) {
  return <Base bg="var(--track)" ink="var(--ink2)">{children}</Base>;
}
