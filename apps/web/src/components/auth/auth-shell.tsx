"use client";

import type { ReactNode } from "react";
import { CityMap3D } from "@/components/map/city-map-3d";
import { LogoTile, Wordmark } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { LatLng } from "@/components/map/geometry";

type Preview = { title: string; sub: string; radiusKm: number; anchor: LatLng; origin: LatLng | null; originKind: "home" | "campus"; homeLabel?: string };

/** Auth layout: form panel + live map panel; stacks below 1100 px. */
export function AuthShell({ children, preview }: { children: ReactNode; preview: Preview }) {
  return (
    <div className="box-border flex min-h-screen flex-wrap items-stretch gap-6 p-6 max-[760px]:gap-4 max-[760px]:p-4">
      <main className="glass box-border flex min-w-0 flex-[1_1_520px] flex-col gap-[22px] rounded-panel px-10 py-9 max-[760px]:px-5 max-[760px]:py-6">
        <div className="flex items-center gap-2.5">
          <LogoTile />
          <Wordmark size={24} />
          <span className="flex-1" />
          <ThemeToggle height={40} />
        </div>
        {children}
      </main>
      <section aria-label="Live preview" className="glass-map box-border flex min-w-0 flex-[1_1_520px] flex-col gap-3.5 rounded-panel p-6 max-[760px]:p-4">
        <div>
          <div className="font-heading text-[22px] font-bold">{preview.title}</div>
          <div className="mt-1 text-sm text-muted2">{preview.sub}</div>
        </div>
        <div className="min-h-[560px] flex-1 max-[760px]:min-h-[420px]">
          <CityMap3D
            items={[]}
            anchor={preview.anchor}
            origin={preview.origin}
            originKind={preview.originKind}
            homeLabel={preview.homeLabel}
            radiusKm={preview.radiusKm}
            selectedId={null}
            onSelect={() => {}}
            height={560}
            ringChip
          />
        </div>
      </section>
    </div>
  );
}
