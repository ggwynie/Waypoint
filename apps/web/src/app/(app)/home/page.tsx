"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MatchCard } from "@/components/feed/match-card";
import { CityMap3D, MapSelectedCard } from "@/components/map/city-map-3d";
import { ButtonLink } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GlobeIcon } from "@/components/ui/icons";
import { EmptyState, ErrorState, LoadingBlock, Skeleton } from "@/components/ui/states";
import { isDemo } from "@/lib/api";
import { CAT, catColor } from "@/lib/categories";
import { nextReminder, useProfileView } from "@/lib/hooks/profile";
import { useFeed, useReminders, useSaved, useWaking } from "@/lib/hooks/queries";

export default function HomePage() {
  const router = useRouter();
  const { me, majorName, campus, district, originWord, tags } = useProfileView();
  const feed = useFeed();
  const saved = useSaved();
  const reminders = useReminders();
  const waking = useWaking(feed.isPending);
  const [sel, setSel] = useState<string | null>(null);
  if (!me) return null;

  const items = feed.data ?? [];
  const inRange = items.filter((x) => x.eligible && x.in_radius);
  const onMap = items.filter((x) => x.mode !== "online" && x.lat !== null);
  const selected = onMap.find((x) => x.id === sel) ?? onMap.find((x) => x.eligible && x.in_radius) ?? onMap[0] ?? null;
  const online = items.filter((x) => x.distance_km === null && x.eligible).slice(0, 3);
  const top = inRange.slice(0, 4);
  const explain = (id: string) => router.push(`/feed?open=${encodeURIComponent(id)}`);
  const interests = tags.filter((t) => t.kind === "interest" && me.tags.includes(t.slug)).map((t) => t.label);

  return (
    <div className="flex flex-wrap items-stretch gap-6">
      <GlassPanel variant="map" aria-label="Opportunity map" className="flex-[999_1_560px] gap-5 p-7 max-[760px]:p-4">
        <div className="flex flex-wrap justify-between gap-5">
          <div className="flex flex-[1_1_380px] flex-col gap-3.5">
            <div className="flex items-center gap-2 self-start rounded-pill border border-line2 bg-chip px-3 py-1.5 text-[13px] text-ink2">
              <span className="h-2 w-2 rounded-full bg-ok-solid" aria-hidden="true" />
              {majorName} · Semester {me.semester} · within {me.radius_km} km of your {originWord}
            </div>
            <h1 className="m-0 font-heading text-[48px] leading-[1.05] font-bold tracking-[-1.5px] max-[760px]:text-[36px]">
              Find it before
              <br />
              <span className="text-gradient">the tide closes.</span>
            </h1>
            <p className="m-0 max-w-[520px] text-base leading-[1.55] text-muted2">
              Internships, seminars, calls for papers and competitions in one feed, ranked by how well each fits you, and flagged while there is still a week to prepare.
            </p>
          </div>
          <div className="box-border flex flex-[0_1_260px] flex-col gap-2 self-start rounded-[16px] border border-chip bg-inset px-[18px] py-4 text-[13px] text-muted2">
            <div className="font-bold text-ink">How to read the map</div>
            <div>Ring = your {me.radius_km} km radius from {originWord}</div>
            <div>Bubble colour = category</div>
            <div>Number = Fit score out of 100</div>
            <div>Green to yellow blocks = inside your radius</div>
            <div>Drag or use arrow keys to turn it</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {me.looking_for.map((c) => (
            <Link
              key={c}
              href={`/feed?category=${c}`}
              className="flex h-10 items-center gap-2 rounded-pill border px-4 text-sm text-ink no-underline hover:text-ink"
              style={{ borderColor: catColor(c), background: CAT[c].chipBg }}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: catColor(c) }} aria-hidden="true" />
              {CAT[c].name} <span className="wp-num text-muted">{feed.data ? inRange.filter((x) => x.category === c).length : "–"}</span>
            </Link>
          ))}
        </div>

        {feed.isPending ? (
          <Skeleton className="h-[430px]" />
        ) : feed.isError ? (
          <ErrorState text="Couldn't load opportunities." onRetry={() => feed.refetch()} retrying={feed.isFetching} />
        ) : (
          <CityMap3D
            items={items}
            anchor={me.campus ?? me.origin ?? { lat: 0, lng: 0 }}
            origin={me.origin}
            originKind={originWord}
            homeLabel={district?.name}
            radiusKm={me.radius_km}
            selectedId={selected?.id ?? null}
            onSelect={setSel}
            height={430}
          >
            {selected && <MapSelectedCard item={selected} origin={originWord} onWhy={() => explain(selected.id)} />}
            <div className="glass-float absolute right-3.5 bottom-3.5 z-[2] box-border flex w-[250px] flex-col gap-2 rounded-[16px] p-3.5 text-ink max-[760px]:hidden" style={{ borderColor: "var(--line2)" }}>
              <div className="flex items-center gap-2 text-[13px] font-bold">
                <GlobeIcon size={16} style={{ color: "var(--soft)" }} />
                Online, no travel
              </div>
              {online.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => explain(x.id)}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-sm border px-2.5 py-2 text-left font-[inherit] text-[13px] text-ink ${x.days_left < 7 ? "wp-pulse" : ""}`}
                  style={{ background: CAT[x.category].chipBg, borderColor: catColor(x.category) }}
                >
                  <span>
                    {x.title}
                    {x.days_left < 7 ? ` · ${x.days_left}d` : ""}
                  </span>
                  <span className="wp-num font-bold" style={{ color: `var(--cat-${CAT[x.category].css}-text)` }}>
                    {x.fit}
                  </span>
                </button>
              ))}
              {online.length === 0 && <div className="text-xs text-muted">No online items for what you picked.</div>}
            </div>
          </CityMap3D>
        )}
        <div className="-mt-2 text-xs text-faint">Schematic map. Distances are real; streets are illustrative.{campus ? ` Campus: ${campus.name}.` : ""}</div>

        <div className="box-border flex flex-col gap-4 rounded-[16px] border border-chip bg-inset px-5 py-[18px]">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="m-0 text-[15px] font-bold">Tide tracker · your saved deadlines</h2>
            <ButtonLink href="/saved" variant="link" className="!text-[13px] !font-normal">
              Open saved
            </ButtonLink>
          </div>
          {saved.isPending ? (
            <Skeleton className="h-14" />
          ) : saved.isError ? (
            <ErrorState text="Couldn't load your saved deadlines." onRetry={() => saved.refetch()} retrying={saved.isFetching} />
          ) : saved.data.length === 0 ? (
            <div className="text-[13px] text-muted">Nothing saved yet. Save an item to track its deadline here.</div>
          ) : (
            <>
              <div className="h-1 rounded-[4px]" style={{ background: "var(--grad-tide)" }} aria-hidden="true" />
              <ol className="m-0 -mt-2.5 grid list-none grid-cols-4 gap-3 p-0 max-[760px]:grid-cols-2">
                {saved.data.slice(0, 4).map(({ opportunity: o }) => {
                  const next = nextReminder(reminders.data, o.id);
                  const urgent = o.days_left < 7;
                  return (
                    <li key={o.id} className="flex flex-col gap-1">
                      <span className={`box-border h-3.5 w-3.5 rounded-full border-[3px] bg-page ${urgent ? "wp-pulse" : ""}`} style={{ borderColor: catColor(o.category) }} aria-hidden="true" />
                      <span className="text-[13px] font-semibold">{o.title}</span>
                      <span className="text-xs" style={{ color: urgent ? "var(--warn)" : "var(--muted)" }}>
                        {o.days_left} days left{next !== "none left" ? ` · next reminder ${next}` : ""}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </div>
      </GlassPanel>

      <GlassPanel as="aside" aria-label="Your best matches" className="flex-[1_1_380px] gap-3.5 p-6 max-[760px]:p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="m-0 font-heading text-2xl tracking-[-0.5px]">Your best matches</h2>
            <div className="mt-1 text-[13px] text-muted">
              {majorName} · Sem {me.semester} · {interests.join(", ") || "no interests yet"}
            </div>
          </div>
          <div className="rounded-sm bg-chip px-2.5 py-1.5 text-xs whitespace-nowrap text-ink2">Sorted by Fit</div>
        </div>
        {feed.isPending ? (
          <LoadingBlock waking={waking} rows={3} label="Loading your best matches" />
        ) : feed.isError ? (
          <ErrorState text="Couldn't load opportunities." onRetry={() => feed.refetch()} retrying={feed.isFetching} />
        ) : top.length === 0 ? (
          <EmptyState title="No matches yet" text="Widen your radius or add an interest." action={<ButtonLink href="/radius" variant="primary">Adjust radius</ButtonLink>} />
        ) : (
          top.map((x, i) => <MatchCard key={x.id} item={x} first={i === 0} onExplain={() => explain(x.id)} />)
        )}
        <div className="flex-1" />
        <div className="flex gap-2.5">
          <ButtonLink href="/feed" variant="primary" size="lg" className="flex-1">
            Open full feed
          </ButtonLink>
          <ButtonLink href="/radius" variant="ghost" size="lg">
            Adjust radius
          </ButtonLink>
        </div>
        {isDemo && <div className="text-right text-xs text-faint">Demo data for UI illustration only</div>}
      </GlassPanel>
    </div>
  );
}
