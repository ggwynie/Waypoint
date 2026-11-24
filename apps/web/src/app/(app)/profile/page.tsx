"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ToggleChip } from "@/components/ui/chips";
import { Field, Select } from "@/components/ui/form";
import { GlassPanel } from "@/components/ui/glass-panel";
import { api, ApiError, CATEGORIES, type Category } from "@/lib/api";
import { signOut } from "@/lib/auth";
import { CAT } from "@/lib/categories";
import { formatDay, initialsOf } from "@/lib/format";
import { useProfileView } from "@/lib/hooks/profile";
import { usePatchMe, useResetLearned } from "@/lib/hooks/queries";

export default function ProfilePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { me, ref, tags, labelOf } = useProfileView();
  const patch = usePatchMe();
  const reset = useResetLearned();
  const [lookingError, setLookingError] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [deleteError, setDeleteError] = useState<string>();
  const [deleting, setDeleting] = useState(false);
  if (!me) return null;

  const toggleTag = (slug: string) => patch.mutate({ tags: me.tags.includes(slug) ? me.tags.filter((t) => t !== slug) : [...me.tags, slug] });
  const toggleLooking = (c: Category) => {
    const next = me.looking_for.includes(c) ? me.looking_for.filter((x) => x !== c) : [...me.looking_for, c];
    if (!next.length) return setLookingError(true);
    setLookingError(false);
    patch.mutate({ looking_for: next });
  };
  const doSignOut = async () => {
    await signOut();
    qc.clear();
    router.replace("/login");
  };
  const doDelete = async () => {
    setDeleting(true);
    setDeleteError(undefined);
    try {
      await api.deleteMe(confirm);
      qc.clear();
      router.replace("/login");
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : "Couldn't reach the server. Try again.");
    } finally {
      setDeleting(false);
    }
  };

  const section = "flex flex-col gap-2.5";
  const heading = "text-[15px] font-bold";

  return (
    <div className="flex flex-wrap items-start gap-6">
      <GlassPanel aria-label="Profile" className="flex-[999_1_560px] gap-[22px] p-7 max-[760px]:p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full text-[22px] font-bold text-[var(--on-grad)]" style={{ background: "var(--grad-avatar)" }} aria-hidden="true">
            {initialsOf(me.display_name)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="m-0 font-heading text-[30px] tracking-[-1px]">{me.display_name}</h1>
            <div className="text-sm text-muted">{me.email}</div>
          </div>
          <Button onClick={() => router.push("/setup?redo=1")}>Redo setup</Button>
          <Button variant="quiet" onClick={doSignOut}>
            Sign out
          </Button>
        </div>
        <div className="text-[13px] text-muted">Every change re-ranks your feed right away.</div>

        <div className={section}>
          <h2 className={`m-0 ${heading}`}>About you</h2>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <Select label="Major" value={String(me.major_id)} onChange={(e) => patch.mutate({ major_id: Number(e.target.value) })} options={(ref.majors.data ?? []).map((m) => ({ value: String(m.id), label: m.name }))} />
            <Select label="Semester" value={String(me.semester)} onChange={(e) => patch.mutate({ semester: Number(e.target.value) })} options={Array.from({ length: 14 }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` }))} />
            <Select label="Campus" value={String(me.campus_id ?? "")} onChange={(e) => patch.mutate({ campus_id: Number(e.target.value) })} options={(ref.campuses.data ?? []).map((c) => ({ value: String(c.id), label: c.name }))} />
          </div>
        </div>

        <div className={section}>
          <h2 className={`m-0 ${heading}`}>I am looking for</h2>
          <div role="group" aria-label="Opportunity types" className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <ToggleChip key={c} label={CAT[c].name} category={c} on={me.looking_for.includes(c)} onToggle={() => toggleLooking(c)} />
            ))}
          </div>
          {lookingError && (
            <div role="alert" className="text-[13px] text-warn">
              Pick at least one type.
            </div>
          )}
        </div>

        {(["interest", "skill"] as const).map((kind) => (
          <div key={kind} className={section}>
            <h2 className={`m-0 ${heading}`}>
              {kind === "interest" ? "Interests" : "Skills"}
              {kind === "skill" && <span className="font-normal text-muted"> · matched against what each listing asks for</span>}
            </h2>
            <div role="group" aria-label={kind === "interest" ? "Interests" : "Skills"} className="flex flex-wrap gap-2">
              {tags.filter((t) => t.kind === kind).map((t) => (
                <ToggleChip key={t.slug} label={t.label} on={me.tags.includes(t.slug)} onToggle={() => toggleTag(t.slug)} />
              ))}
            </div>
          </div>
        ))}
      </GlassPanel>

      <div className="flex flex-[1_1_340px] flex-col gap-6">
        <GlassPanel as="aside" aria-label="What Waypoint learned" className="gap-3.5 p-6 max-[760px]:p-4">
          <h2 className="m-0 font-heading text-[22px] tracking-[-0.5px]">What Waypoint learned</h2>
          <p className="m-0 text-[13px] leading-[1.55] text-muted">
            From your Not relevant clicks. Each one multiplies that topic by ×0.8 in the interest part of Fit, never below ×0.5, and it recovers on its own in about two weeks.
          </p>
          {me.learned.length === 0 ? (
            <div className="text-[13px] text-muted">Nothing learned yet. Every topic counts at full weight (×1.0).</div>
          ) : (
            me.learned.map((l) => (
              <div key={l.tag} className="inset flex flex-col gap-1.5 rounded-btn px-3.5 py-3">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{labelOf(l.tag)}</span>
                  <span className="wp-num" style={{ color: "var(--cat-competition-text)" }}>
                    ×{l.weight.toFixed(2)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-[6px] bg-track">
                  <div className="h-full bg-gold" style={{ width: `${Math.round(l.weight * 100)}%` }} />
                </div>
                <div className="text-xs text-muted">Last marked not relevant on {formatDay(l.last_clicked_at)}</div>
              </div>
            ))
          )}
          <Button size="sm" className="self-start" onClick={() => reset.mutate()} loading={reset.isPending} disabled={me.learned.length === 0}>
            Reset to full weight
          </Button>
        </GlassPanel>

        <GlassPanel as="section" aria-labelledby="danger-title" className="gap-3 p-6 max-[760px]:p-4" style={{ borderColor: "var(--warn)" }}>
          <h2 id="danger-title" className="m-0 font-heading text-[22px] tracking-[-0.5px]">
            Danger zone
          </h2>
          <p className="m-0 text-[13px] leading-[1.55] text-muted">
            Delete your account and everything Waypoint stores about you: profile, saved items, reminders and feedback. This can&apos;t be undone.
          </p>
          <Field label="Type your email to confirm" type="email" autoComplete="off" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={deleteError} />
          <Button variant="ghost" className="self-start !border-[var(--warn)] !text-warn" disabled={confirm.trim().toLowerCase() !== me.email.toLowerCase()} loading={deleting} onClick={doDelete}>
            Delete account
          </Button>
        </GlassPanel>
      </div>
    </div>
  );
}
