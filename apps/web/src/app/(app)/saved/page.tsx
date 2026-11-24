"use client";

import { ButtonLink } from "@/components/ui/button";
import { PillRadio } from "@/components/ui/chips";
import { GlassPanel } from "@/components/ui/glass-panel";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/states";
import type { FoundTiming, Outcome, SavedItem } from "@/lib/api";
import { CAT, catColor, catText } from "@/lib/categories";
import { formatDay } from "@/lib/format";
import { nextReminder } from "@/lib/hooks/profile";
import { usePatchSaved, useReminders, useSaved, useToggleSave, useWaking } from "@/lib/hooks/queries";

const GOOD = "var(--ok)";
const BAD = "var(--warn)";

export default function SavedPage() {
  const saved = useSaved();
  const reminders = useReminders();
  const waking = useWaking(saved.isPending);
  const patch = usePatchSaved();
  const toggle = useToggleSave();
  const list = saved.data ?? [];

  const count = (pred: (s: SavedItem) => boolean) => list.filter(pred).length;
  const tallies = [
    { n: count((s) => s.outcome === "applied"), label: "Applied", color: GOOD },
    { n: count((s) => s.outcome === "missed"), label: "Missed", color: BAD },
    { n: count((s) => s.outcome === "skipped"), label: "Skipped", color: "var(--ink2)" },
    { n: count((s) => s.found_timing === "late"), label: "Found late", color: "var(--cat-competition-text)" },
  ];
  const pickFound = (s: SavedItem, v: FoundTiming) => patch.mutate({ id: s.opportunity.id, body: { found_timing: s.found_timing === v ? null : v } });
  const pickOutcome = (s: SavedItem, v: Outcome) => patch.mutate({ id: s.opportunity.id, body: { outcome: s.outcome === v ? null : v } });

  return (
    <div className="flex flex-wrap items-start gap-6">
      <GlassPanel aria-label="Saved opportunities" className="flex-[999_1_560px] gap-4 p-7 max-[760px]:p-4">
        <div>
          <h1 className="m-0 font-heading text-[34px] tracking-[-1px]">Saved</h1>
          <div className="mt-1.5 text-sm text-muted2">{saved.data ? `${list.length} saved · closest deadline first` : "Loading"}</div>
        </div>
        {saved.isPending ? (
          <LoadingBlock waking={waking} rows={3} label="Loading saved opportunities" />
        ) : saved.isError ? (
          <ErrorState text="Couldn't load your saved opportunities." onRetry={() => saved.refetch()} retrying={saved.isFetching} />
        ) : list.length === 0 ? (
          <EmptyState title="No saved opportunities yet" text="Save an item and we will remind you 7, 3 and 1 days before it closes." action={<ButtonLink href="/feed" variant="primary">Browse opportunities</ButtonLink>} />
        ) : (
          list.map((s) => {
            const o = s.opportunity;
            const urgent = o.days_left < 7;
            return (
              <article key={o.id} className="box-border flex flex-wrap items-center gap-4 rounded-card border border-line2 bg-card px-[18px] py-4">
                <div className="w-1.5 shrink-0 self-stretch rounded-[6px]" style={{ background: catColor(o.category) }} aria-hidden="true" />
                <div className="min-w-0 flex-[1_1_240px]">
                  <div className="text-[11px] font-bold tracking-[.06em]" style={{ color: catText(o.category) }}>
                    {CAT[o.category].label}
                  </div>
                  <h2 className="m-0 text-base font-bold">{o.title}</h2>
                  <div className="text-[13px] text-muted">
                    Deadline {formatDay(o.registration_deadline)} · <span style={{ color: urgent ? "var(--warn)" : "var(--ink2)" }}>{o.days_left} days left</span> · next reminder {nextReminder(reminders.data, o.id)}
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="w-[140px] text-xs text-muted">When did you find it?</div>
                    <div role="radiogroup" aria-label={`When you found ${o.title}`} className="flex gap-1.5">
                      <PillRadio label="7+ days before" on={s.found_timing === "early"} color={GOOD} onPick={() => pickFound(s, "early")} />
                      <PillRadio label="Under 7 days before" on={s.found_timing === "late"} color={BAD} onPick={() => pickFound(s, "late")} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="w-[140px] text-xs text-muted">Did you apply?</div>
                    <div role="radiogroup" aria-label={`Outcome for ${o.title}`} className="flex gap-1.5">
                      <PillRadio label="Applied" on={s.outcome === "applied"} color={GOOD} onPick={() => pickOutcome(s, "applied")} />
                      <PillRadio label="Missed it" on={s.outcome === "missed"} color={BAD} onPick={() => pickOutcome(s, "missed")} />
                      <PillRadio label="Skipped" on={s.outcome === "skipped"} color="var(--ink2)" onPick={() => pickOutcome(s, "skipped")} />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${o.title} from saved`}
                  onClick={() => toggle.mutate({ item: o, save: false })}
                  className="h-9 cursor-pointer rounded-sm border border-line2 bg-transparent px-3 font-[inherit] text-[13px] text-muted"
                >
                  Remove
                </button>
              </article>
            );
          })
        )}
      </GlassPanel>
      <GlassPanel as="aside" aria-label="Your record" className="flex-[1_1_340px] gap-4 p-6 max-[760px]:p-4">
        <h2 className="m-0 font-heading text-[22px] tracking-[-0.5px]">Your record</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {tallies.map((t) => (
            <div key={t.label} className="inset rounded-btn p-3.5">
              <div className="wp-num font-heading text-[28px] font-bold" style={{ color: t.color }}>
                {t.n}
              </div>
              <div className="text-[13px] text-muted">{t.label}</div>
            </div>
          ))}
        </div>
        <p className="m-0 text-[13px] leading-[1.55] text-muted">
          Found late means you saw it with under 7 days left. During the two-week trial only anonymous totals are counted, to check whether Waypoint cuts late discovery and missed deadlines. Your answers stay private.
        </p>
      </GlassPanel>
    </div>
  );
}
