"use client";

import { RadioCards, Select } from "@/components/ui/form";
import { LockIcon } from "@/components/ui/icons";
import type { Campus, DistanceOrigin, District } from "@/lib/api";

/** "Measure distance from" cards + city/district selects + privacy note (Radius page and Setup step 4). */
export function OriginFields({
  origin,
  districtCode,
  campus,
  districts,
  onOrigin,
  onDistrict,
}: {
  origin: DistanceOrigin;
  districtCode: string | null;
  campus: Campus | undefined;
  districts: District[];
  onOrigin: (o: DistanceOrigin) => void;
  onDistrict: (code: string) => void;
}) {
  const district = districts.find((d) => d.code === districtCode) ?? districts[0];
  const cities = [...new Set(districts.map((d) => d.city_name))];
  const inCity = districts.filter((d) => d.city_name === district?.city_name);
  return (
    <div className="flex flex-col gap-2">
      <RadioCards
        label="Measure distance from"
        legend={<div className="text-[15px] font-bold">Measure distance from</div>}
        columns={2}
        value={origin}
        onChange={onOrigin}
        options={[
          { value: "home", title: "My home", sub: district ? `${district.name}, ${district.city_name}` : "Pick your district" },
          { value: "campus", title: "My campus", sub: campus?.name ?? "Pick your campus" },
        ]}
      />
      {origin === "home" && (
        <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <Select
            label="City or regency"
            value={district?.city_name ?? ""}
            onChange={(e) => {
              const first = districts.find((d) => d.city_name === e.target.value);
              if (first) onDistrict(first.code);
            }}
            options={cities.map((c) => ({ value: c, label: c }))}
          />
          <Select label="District (kecamatan)" value={district?.code ?? ""} onChange={(e) => onDistrict(e.target.value)} options={inCity.map((d) => ({ value: d.code, label: d.name }))} />
        </div>
      )}
      <div className="flex items-start gap-2 text-xs leading-normal text-muted">
        <LockIcon size={16} className="mt-px shrink-0" style={{ color: "var(--ok-solid)" }} />
        Only your district is stored, never a street address or GPS. Not shown to other students or organizers.
      </div>
    </div>
  );
}
