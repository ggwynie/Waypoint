"use client";

import type { FeedItem } from "@/lib/api";
import { CAT, catColor, catInk, catText } from "@/lib/categories";
import { checkedAgo } from "@/lib/format";
import { DeadlineBadge, TagBadge, TrustBadge } from "@/components/ui/badge";
import { FitBreakdown } from "@/components/ui/fit-breakdown";
import { FitRing } from "@/components/ui/fit-ring";

export function CategoryTile({ item, size = 44 }: { item: FeedItem; size?: 40 | 44 }) {
  return (
    <div className="flex shrink-0 items-center justify-center rounded-field font-bold" style={{ width: size, height: size, background: catColor(item.category), color: catInk(item.category) }} aria-hidden="true">
      {CAT[item.category].letter}
    </div>
  );
}

export function metaLine(item: FeedItem) {
  return `${item.organizer}${item.distance_km === null ? " · online" : ` · on-site · ${item.distance_km} km`}`;
}

export function tagLabels(item: FeedItem, labelOf: (slug: string) => string) {
  return [...item.topic_tags.map(labelOf), ...(item.min_semester ? [`Semester ${item.min_semester}+`] : [])];
}

type Props = {
  item: FeedItem;
  origin: string;
  open: boolean;
  onToggleOpen: () => void;
  onToggleSave: () => void;
  onHide: () => void;
  labelOf: (slug: string) => string;
};

/** OpportunityCard. Scraped text is rendered as plain text only. */
export function OpportunityCard({ item, origin, open, onToggleOpen, onToggleSave, onHide, labelOf }: Props) {
  const inRange = item.eligible && item.in_radius;
  const color = catColor(item.category);
  const panelId = `fit-${item.id}`;
  return (
    <article
      className="box-border flex flex-col gap-3 rounded-[20px] bg-card p-[18px]"
      style={{ border: `1px ${item.in_radius ? "solid" : "dashed"} ${inRange ? "var(--line2)" : "var(--line)"}`, opacity: item.eligible ? 1 : 0.7 }}
    >
      <div className="flex items-center gap-3">
        <CategoryTile item={item} />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold tracking-[.06em]" style={{ color: catText(item.category) }}>
            {CAT[item.category].label} · {item.distance_km === null ? "ONLINE" : `${item.distance_km} KM`}
            {!item.in_radius && " · OUTSIDE YOUR RADIUS"}
          </div>
          <h3 className="m-0 text-[17px] font-bold">{item.title}</h3>
          <div className="text-[13px] text-muted">{metaLine(item)}</div>
        </div>
        <FitRing fit={item.fit} category={item.category} size={56} />
      </div>

      {item.block_reason && <div className="rounded-field bg-warn-bg px-3 py-2 text-[13px] font-semibold text-warn">{item.block_reason}</div>}

      <div className="text-sm leading-normal text-ink2">
        <span className="text-muted">Why it fits:</span> {item.why}
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs">
        <TrustBadge level={item.trust_level} />
        <DeadlineBadge daysLeft={item.days_left} deadline={item.registration_deadline} />
        {tagLabels(item, labelOf).map((t) => (
          <TagBadge key={t}>{t}</TagBadge>
        ))}
        {item.mode !== "online" && (item.lat === null || item.lng === null) && <TagBadge>No map location</TagBadge>}
      </div>
      <div className="-mt-1 text-xs text-faint">{checkedAgo(item.last_verified_at)}</div>

      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex h-[34px] cursor-pointer items-center gap-1.5 self-start rounded-sm border border-line bg-transparent px-3 font-[inherit] text-[13px] font-semibold text-link"
      >
        {open ? "Hide breakdown" : `How ${item.fit} is built`}
      </button>
      {open && <FitBreakdown id={panelId} parts={item.fit_parts} fit={item.fit} distanceKm={item.distance_km} daysLeft={item.days_left} origin={origin} />}

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          aria-pressed={item.is_saved}
          onClick={onToggleSave}
          className="h-10 cursor-pointer rounded-field border px-3.5 font-[inherit] text-sm font-bold"
          style={{ borderColor: color, background: item.is_saved ? "transparent" : color, color: item.is_saved ? catText(item.category) : catInk(item.category) }}
        >
          {item.is_saved ? "✓ Saved · reminders on" : "Save + remind me"}
        </button>
        <a href={item.primary_source_url} target="_blank" rel="noopener noreferrer nofollow" className="text-sm font-semibold">
          View original on {item.source_host}
        </a>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onHide}
          aria-label={`Mark ${item.title} as not relevant`}
          className="h-10 cursor-pointer rounded-field border border-line2 bg-transparent px-3 font-[inherit] text-[13px] text-muted"
        >
          Not relevant
        </button>
      </div>
    </article>
  );
}
