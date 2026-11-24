"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CityMap3D, MapSelectedCard } from "@/components/map/city-map-3d";
import { OriginFields } from "@/components/shell/location-fields";
import { RadioCards, RadiusControl } from "@/components/ui/form";
import { GlassPanel } from "@/components/ui/glass-panel";
import { ErrorState, InlineNote, Skeleton } from "@/components/ui/states";
import type { FallbackMode, FeedItem } from "@/lib/api";
import { useProfileView } from "@/lib/hooks/profile";
import { useFeed, usePatchMe } from "@/lib/hooks/queries";

function fallbackNote(items: FeedItem[], mode: FallbackMode, R: number) {
  const beyond = items.filter((x) => x.mode !== "online" && x.distance_km !== null && !x.in_radius);
  if (mode === "radius_only") return `Everything on-site beyond ${R} km is hidden from your feed and map. Online items still show.`;
  if (!beyond.length) return `Right now nothing on-site is beyond ${R} km, so this choice changes nothing yet. Lower the radius to see it work.`;
  const n = `${beyond.length} ${beyond.length === 1 ? "item is" : "items are"} beyond ${R} km: `;
  if (mode === "nearest_first")
    return n + [...beyond].sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0)).map((x) => `${x.title} (${x.distance_km} km)`).join(", ") + ". Listed after everything in range, closest first.";
  return n + [...beyond].sort((a, b) => b.fit - a.fit).map((x) => `${x.title} (Fit ${x.fit})`).join(", ") + ". Listed after everything in range, highest Fit first.";
}

export default function RadiusPage() {
  const router = useRouter();
  const { me, campus, district, originWord, ref } = useProfileView();
  const feed = useFeed();
  const patch = usePatchMe();
  const [draft, setDraft] = useState<number | null>(null);
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    if (draft === null || !me || draft === me.radius_km) return;
    const t = setTimeout(() => patch.mutate({ radius_km: draft }, { onSettled: () => setDraft(null) }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  if (!me) return null;
  const R = draft ?? me.radius_km;
  const items = feed.data ?? [];
  const onsite = items.filter((x) => x.distance_km !== null);
  const within = onsite.filter((x) => x.in_radius).length;
  const onMap = items.filter((x) => x.mode !== "online" && x.lat !== null);
  const selected = onMap.find((x) => x.id === sel) ?? onMap.find((x) => x.eligible && x.in_radius) ?? onMap[0] ?? null;

  return (
    <div className="flex flex-wrap items-stretch gap-6">
      <GlassPanel variant="map" aria-label="Radius preview" className="flex-[999_1_560px] gap-4 p-7 max-[760px]:p-4">
        <div>
          <h1 className="m-0 font-heading text-[34px] tracking-[-1px]">Radius &amp; location</h1>
          <div className="mt-1.5 text-sm text-muted2">
            {feed.data ? `${within} of ${onsite.length} on-site opportunities are within ${me.radius_km} km of your ${originWord}. Online ones always show.` : "Loading your map"}
          </div>
        </div>
        {feed.isPending ? (
          <Skeleton className="h-[500px]" />
        ) : feed.isError ? (
          <ErrorState text="Couldn't load opportunities." onRetry={() => feed.refetch()} retrying={feed.isFetching} />
        ) : (
          <CityMap3D
            items={items}
            anchor={me.campus ?? me.origin ?? { lat: 0, lng: 0 }}
            origin={me.origin}
            originKind={originWord}
            homeLabel={district?.name}
            radiusKm={R}
            selectedId={selected?.id ?? null}
            onSelect={setSel}
            height={500}
            ringChip
          >
            {selected && <MapSelectedCard item={selected} origin={originWord} onWhy={() => router.push(`/feed?open=${selected.id}`)} />}
          </CityMap3D>
        )}
        <div className="-mt-2 text-xs text-faint">Schematic map. Distances are real; streets are illustrative.</div>
      </GlassPanel>

      <GlassPanel as="aside" aria-label="Radius settings" className="flex-[1_1_360px] gap-5 p-6 max-[760px]:p-4">
        <RadiusControl value={R} onChange={setDraft} />
        <OriginFields
          origin={me.distance_origin}
          districtCode={me.home_district_code}
          campus={campus}
          districts={ref.districts.data ?? []}
          onOrigin={(distance_origin) => patch.mutate({ distance_origin })}
          onDistrict={(home_district_code) => patch.mutate({ home_district_code })}
        />
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 p-0 text-sm font-semibold">If nothing is within range, show me</legend>
          <RadioCards
            label="If nothing is within range, show me"
            value={me.fallback_mode}
            onChange={(fallback_mode) => patch.mutate({ fallback_mode })}
            options={[
              { value: "online_first", title: "Online first", sub: "Then the rest beyond your radius, by Fit" },
              { value: "nearest_first", title: "Nearest first", sub: `Beyond ${R} km, closest first` },
              { value: "radius_only", title: "Only within my radius", sub: "Hide everything farther" },
            ]}
          />
          <InlineNote>{feed.data ? fallbackNote(items, me.fallback_mode, me.radius_km) : "Checking what is beyond your radius…"}</InlineNote>
        </fieldset>
      </GlassPanel>
    </div>
  );
}
