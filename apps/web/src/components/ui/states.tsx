import type { ReactNode } from "react";
import { Button } from "./button";

/** EmptyState: dashed frame, one sentence, one action. */
export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2.5 rounded-card border border-dashed border-line p-7">
      <div className="text-[17px] font-bold">{title}</div>
      <div className="text-sm text-muted">{text}</div>
      {action}
    </div>
  );
}

/** ErrorState: specific sentence + Retry. */
export function ErrorState({ text, onRetry, retrying }: { text: string; onRetry: () => void; retrying?: boolean }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-2.5 rounded-card border border-dashed border-line p-7">
      <div className="text-[17px] font-bold">Something went wrong</div>
      <div className="text-sm text-muted">{text}</div>
      <Button variant="ghost" onClick={onRetry} loading={retrying}>
        Retry
      </Button>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`wp-skeleton rounded-card ${className}`} />;
}

export function WakingNotice() {
  return (
    <div role="status" aria-live="polite" className="inset rounded-field px-3 py-2.5 text-[13px] text-ink2">
      Waking the server, this can take up to a minute.
    </div>
  );
}

export function InlineNote({ children }: { children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" className="rounded-field border border-chip bg-inset px-3 py-2.5 text-[13px] leading-normal text-ink2">
      {children}
    </div>
  );
}

/** Loading block used by pages: skeleton, plus the waking notice after 3 s. */
export function LoadingBlock({ waking, rows = 3, label = "Loading" }: { waking: boolean; rows?: number; label?: string }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label={label}>
      {waking && <WakingNotice />}
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-28" />
      ))}
    </div>
  );
}
