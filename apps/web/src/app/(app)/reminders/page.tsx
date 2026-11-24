"use client";

import { ButtonLink } from "@/components/ui/button";
import { Switch } from "@/components/ui/form";
import { GlassPanel } from "@/components/ui/glass-panel";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/states";
import type { Reminder } from "@/lib/api";
import { catColor } from "@/lib/categories";
import { dayParts } from "@/lib/format";
import { useMe, usePatchMe, usePatchSaved, useReminders, useSaved, useWaking } from "@/lib/hooks/queries";

const WHEN = { 7: "1 week before", 3: "3 days before", 1: "1 day before" } as const;

export default function RemindersPage() {
  const me = useMe().data;
  const reminders = useReminders();
  const saved = useSaved();
  const waking = useWaking(reminders.isPending);
  const patchMe = usePatchMe();
  const patchSaved = usePatchSaved();
  if (!me) return null;

  const byId = new Map((saved.data ?? []).map((s) => [s.opportunity.id, s]));
  // One row per (item, offset): channels are folded into the status line.
  const rows = new Map<string, Reminder[]>();
  for (const r of reminders.data ?? []) {
    const k = `${r.opportunity_id}-${r.offset_days}`;
    rows.set(k, [...(rows.get(k) ?? []), r]);
  }
  const channel = me.email_reminders && me.in_app_reminders ? "Email + in-app" : me.email_reminders ? "Email" : me.in_app_reminders ? "In-app" : "Off";
  const pending = reminders.isPending || saved.isPending;
  const failed = reminders.isError || saved.isError;

  return (
    <div className="flex flex-wrap items-start gap-6">
      <GlassPanel aria-label="Upcoming reminders" className="flex-[999_1_560px] gap-3.5 p-7 max-[760px]:p-4">
        <div>
          <h1 className="m-0 font-heading text-[34px] tracking-[-1px]">Reminders</h1>
          <div className="mt-1.5 text-sm text-muted2">We email you 1 week, 3 days and 1 day before each saved deadline.</div>
        </div>
        {pending ? (
          <LoadingBlock waking={waking} rows={3} label="Loading reminders" />
        ) : failed ? (
          <ErrorState text="Couldn't load your reminders." onRetry={() => { reminders.refetch(); saved.refetch(); }} retrying={reminders.isFetching} />
        ) : rows.size === 0 ? (
          <EmptyState title="No reminders scheduled" text="Save an opportunity to get one." action={<ButtonLink href="/feed" variant="primary">Browse opportunities</ButtonLink>} />
        ) : (
          [...rows.values()].map((group) => {
            const r = group[0];
            const s = byId.get(r.opportunity_id);
            if (!s) return null;
            const o = s.opportunity;
            const sent = group.every((g) => g.status === "sent");
            const muted = s.muted;
            const { day, month } = dayParts(`${r.due_on}T12:00:00+07:00`);
            return (
              <div key={`${r.opportunity_id}-${r.offset_days}`} className="flex items-center gap-4 rounded-[16px] border border-line2 bg-card px-4 py-3" style={{ opacity: sent || muted ? 0.55 : 1 }}>
                <div className="w-[52px] shrink-0 text-center">
                  <div className="font-heading text-[22px] font-bold">{day}</div>
                  <div className="text-xs text-muted">{month}</div>
                </div>
                <div className="w-1 shrink-0 self-stretch rounded-[4px]" style={{ background: catColor(o.category) }} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{o.title}</div>
                  <div className="text-[13px] text-muted">
                    {WHEN[r.offset_days]} · {sent ? "Sent" : muted ? "Muted" : channel}
                  </div>
                </div>
                <button
                  type="button"
                  aria-pressed={muted}
                  onClick={() => patchSaved.mutate({ id: o.id, body: { muted: !muted } })}
                  className="h-9 shrink-0 cursor-pointer rounded-sm border border-line bg-transparent px-3 font-[inherit] text-[13px] text-ink2"
                >
                  {muted ? "Unmute item" : "Mute item"}
                </button>
              </div>
            );
          })
        )}
      </GlassPanel>
      <GlassPanel as="aside" aria-label="How we remind you" className="flex-[1_1_340px] gap-3.5 p-6 max-[760px]:p-4">
        <h2 className="m-0 font-heading text-[22px] tracking-[-0.5px]">How we remind you</h2>
        <Switch label="Email" sub={`To ${me.email}`} on={me.email_reminders} onToggle={() => patchMe.mutate({ email_reminders: !me.email_reminders })} />
        <Switch label="In-app" sub="Badge on the bell icon" on={me.in_app_reminders} onToggle={() => patchMe.mutate({ in_app_reminders: !me.in_app_reminders })} />
        <Switch label="Combine into one email per day" sub="Avoids several emails on busy days" on={me.daily_digest} onToggle={() => patchMe.mutate({ daily_digest: !me.daily_digest })} />
        <p className="m-0 text-[13px] leading-[1.55] text-muted">At most 3 reminders per item. WhatsApp and push notifications are planned for a later version.</p>
      </GlassPanel>
    </div>
  );
}
