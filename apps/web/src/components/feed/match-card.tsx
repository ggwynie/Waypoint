"use client";

import type { FeedItem } from "@/lib/api";
import { DeadlineBadge, TagBadge, TrustBadge } from "@/components/ui/badge";
import { FitRingButton } from "@/components/ui/fit-ring";
import { CategoryTile, metaLine } from "./opportunity-card";

/** MatchCard: compact card on Home; the first one is highlighted in gold. */
export function MatchCard({ item, first, onExplain }: { item: FeedItem; first: boolean; onExplain: () => void }) {
  return (
    <article
      className="box-border flex flex-col gap-2.5 rounded-card border p-4"
      style={
        first
          ? { background: "linear-gradient(160deg, var(--gold-tint) 0%, var(--card) 60%)", borderColor: "var(--gold-line)", boxShadow: "var(--gold-glow)" }
          : { background: "var(--card)", borderColor: "var(--line2)" }
      }
    >
      <div className="flex items-center gap-3">
        <CategoryTile item={item} size={40} />
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-base font-bold">{item.title}</h3>
          <div className="text-[13px] text-muted">{metaLine(item)}</div>
        </div>
        <FitRingButton fit={item.fit} category={item.category} label={item.title} onClick={onExplain} />
      </div>
      <div className="flex flex-wrap gap-1.5 text-xs">
        <TrustBadge level={item.trust_level} />
        <DeadlineBadge daysLeft={item.days_left} deadline={item.registration_deadline} />
        <TagBadge>{item.is_saved ? "Saved" : "Not saved"}</TagBadge>
      </div>
      {first && (
        <div className="rounded-field border border-chip bg-inset px-3 py-2.5 text-[13px] leading-normal text-ink2">
          <span className="font-bold" style={{ color: "var(--cat-competition-text)" }}>Why it fits:</span> {item.why}
        </div>
      )}
    </article>
  );
}
