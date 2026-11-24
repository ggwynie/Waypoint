import type { FitPart } from "@/lib/api";
import { PART_META } from "@/lib/categories";
import { fmtPoints } from "@/lib/format";

function partLabel(p: FitPart, ctx: { distanceKm: number | null; daysLeft: number; origin: string }) {
  switch (p.key) {
    case "major":
      return p.points === p.max ? "Major: yours is listed" : p.points > 0 ? "Major: open to all" : "Major: not listed";
    case "match":
      return "Interests and skills";
    case "distance":
      return ctx.distanceKm === null ? "Distance: online" : `Distance: ${ctx.distanceKm} km from ${ctx.origin}`;
    case "prep_time":
      return `Time to prepare: ${ctx.daysLeft} days`;
    case "trust":
      return "Source trust";
  }
}

/** FitBreakdown: five rows in Fit-part order, values straight from `fit_parts`. */
export function FitBreakdown({ parts, fit, distanceKm, daysLeft, origin, id }: { parts: FitPart[]; fit: number; distanceKm: number | null; daysLeft: number; origin: string; id?: string }) {
  return (
    <div id={id} className="inset flex flex-col gap-2.5 rounded-btn p-3.5">
      {parts.map((p) => {
        const meta = PART_META[p.key];
        return (
          <div key={p.key} className="flex flex-col gap-[5px]">
            <div className="flex justify-between gap-2.5 text-[13px]">
              <span className="font-semibold">{partLabel(p, { distanceKm, daysLeft, origin })}</span>
              <span className="wp-num font-bold" style={{ color: meta.color }}>
                {fmtPoints(p.points)} / {p.max}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-[6px] bg-track">
              <div className="wp-bar h-full rounded-[6px]" style={{ width: `${Math.round((p.points / p.max) * 100)}%`, background: meta.color }} />
            </div>
            <div className="text-xs leading-normal text-muted">{p.explain}</div>
          </div>
        );
      })}
      <div className="flex justify-between border-t border-line2 pt-2 text-sm font-bold">
        <span>Total Fit</span>
        <span className="wp-num">{fit} / 100</span>
      </div>
    </div>
  );
}
