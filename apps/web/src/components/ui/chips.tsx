import type { Category } from "@/lib/api";
import { CAT, catColor } from "@/lib/categories";

const PILL = "inline-flex h-[38px] cursor-pointer items-center gap-2 rounded-pill border px-3.5 font-[inherit] text-sm font-semibold";

/** ToggleChip for interests, skills and looking-for categories. */
export function ToggleChip({ label, on, onToggle, category }: { label: string; on: boolean; onToggle: () => void; category?: Category }) {
  const style = on
    ? category
      ? { borderColor: catColor(category), background: CAT[category].chipBg, color: "var(--ink)" }
      : { borderColor: "var(--cat-internship)", background: "var(--selBg)", color: "var(--ink)" }
    : { borderColor: "var(--line)", background: "var(--inset)", color: "var(--ink2)" };
  return (
    <button type="button" aria-pressed={on} onClick={onToggle} className={PILL} style={style}>
      {on ? "✓ " : ""}
      {label}
    </button>
  );
}

/** CategoryTab on Feed: "All you look for" inverts when on; categories show their dot. */
export function CategoryTab({ label, on, onPick, category }: { label: string; on: boolean; onPick: () => void; category?: Category }) {
  const col = category ? catColor(category) : "var(--ink)";
  const style = on
    ? { borderColor: col, background: category ? CAT[category].chipBg : "var(--ink)", color: category ? "var(--ink)" : "var(--page)" }
    : { borderColor: "var(--line)", background: "transparent", color: "var(--ink)" };
  return (
    <button type="button" aria-pressed={on} onClick={onPick} className={`${PILL} h-10 px-4`} style={style}>
      <span className="h-2 w-2 rounded-full" style={{ background: col }} aria-hidden="true" />
      {label}
    </button>
  );
}

/** Small radio pill used on Saved rows ("When did you find it?", "Did you apply?"). */
export function PillRadio({ label, on, color, onPick }: { label: string; on: boolean; color: string; onPick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onPick}
      className="h-8 cursor-pointer rounded-sm border px-2.5 font-[inherit] text-xs"
      style={on ? { borderColor: color, background: `color-mix(in srgb, ${color} 14%, transparent)`, color } : { borderColor: "var(--line)", background: "transparent", color: "var(--ink2)" }}
    >
      {label}
    </button>
  );
}
