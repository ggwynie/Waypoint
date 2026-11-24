import type { Category } from "@/lib/api";
import { catColor } from "@/lib/categories";

const SIZES = { 48: { hole: 38, font: 15 }, 52: { hole: 40, font: 16 }, 56: { hole: 44, font: 18 } } as const;
type Size = keyof typeof SIZES;

function ringStyle(category: Category, fit: number, size: Size) {
  return { width: size, height: size, flex: `0 0 ${size}px`, background: `conic-gradient(${catColor(category)} 0 ${fit}%, var(--track) ${fit}% 100%)` };
}

function Hole({ fit, size, hole = "var(--hole)" }: { fit: number; size: Size; hole?: string }) {
  const s = SIZES[size];
  return (
    <span className="wp-num flex items-center justify-center rounded-full font-heading font-bold text-ink" style={{ width: s.hole, height: s.hole, background: hole, fontSize: s.font }}>
      {fit}
    </span>
  );
}

/** FitRing. */
export function FitRing({ fit, category, size = 56, hole }: { fit: number; category: Category; size?: Size; hole?: string }) {
  return (
    <div role="img" aria-label={`Fit score ${fit} of 100`} className="flex items-center justify-center rounded-full" style={ringStyle(category, fit, size)}>
      <Hole fit={fit} size={size} hole={hole} />
    </div>
  );
}

/** FitRing as a button that opens the breakdown (Best matches). */
export function FitRingButton({ fit, category, label, onClick }: { fit: number; category: Category; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={`Fit score ${fit} of 100 for ${label}. See how it is built`} className="flex cursor-pointer items-center justify-center rounded-full border-0 p-0" style={ringStyle(category, fit, 52)}>
      <Hole fit={fit} size={52} />
    </button>
  );
}
