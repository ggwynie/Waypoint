"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { FeedItem } from "@/lib/api";
import { CAT, PART_META } from "@/lib/categories";
import { useTheme } from "@/lib/theme";
import { HomeIcon, TargetIcon } from "@/components/ui/icons";
import { COAST_PATH, CX, CY, PX_PER_KM, RIVER_PATH, ROADS, WATER_PATH, buildLots, mix, project, shade, type LatLng } from "./geometry";

const DEFAULT = { rot: -28, tilt: 56, zoom: 0.8 };
const TOKENS = ["--map-in-a", "--map-in-b", "--map-campus-block", "--map-cat-internship", "--map-cat-seminar", "--map-cat-call-for-papers", "--map-cat-competition"] as const;

type Props = {
  items: FeedItem[];
  /** Scene anchor: the campus. Distances on the map come from `distance_km`. */
  anchor: LatLng;
  origin: LatLng | null;
  originKind: "home" | "campus";
  homeLabel?: string;
  radiusKm: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  height: number;
  ringChip?: boolean;
  children?: ReactNode;
};

function useTokenColors() {
  const { theme } = useTheme();
  const [c, setC] = useState<Record<(typeof TOKENS)[number], string> | null>(null);
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    setC(Object.fromEntries(TOKENS.map((t) => [t, cs.getPropertyValue(t).trim()])) as Record<(typeof TOKENS)[number], string>);
  }, [theme]);
  return c;
}

type Block = { key: string; x: number; y: number; w: number; d: number; h: number; op: number; delay: number; top: string; front: string; back: string; right: string; left: string };
const NEUTRAL = { top: "var(--map-block-top)", front: "var(--map-block-front)", back: "var(--map-block-back)", right: "var(--map-block-right)", left: "var(--map-block-left)" };
function solid(base: string) {
  return { top: shade(base, 0.2), front: base, back: shade(base, 0.08), right: shade(base, -0.18), left: shade(base, 0.04) };
}

function strongestWeakest(item: FeedItem) {
  const ratio = item.fit_parts.map((p) => ({ k: p.key, r: p.points / p.max }));
  const sorted = [...ratio].sort((a, b) => b.r - a.r);
  return `Strongest: ${PART_META[sorted[0].k].title.toLowerCase()} · weakest: ${PART_META[sorted[sorted.length - 1].k].title.toLowerCase()}`;
}

/** CityMap3D. */
export function CityMap3D({ items, anchor, origin, originKind, homeLabel, radiusKm, selectedId, onSelect, height, ringChip, children }: Props) {
  const [view, setView] = useState(DEFAULT);
  const [dragging, setDragging] = useState(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const colors = useTokenColors();

  const placed = useMemo(
    () =>
      items
        .filter((x) => x.mode !== "online" && x.lat !== null && x.lng !== null)
        .map((x) => ({ item: x, ...project({ lat: x.lat!, lng: x.lng! }, anchor) })),
    [items, anchor],
  );
  const sitesKey = placed.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join("|");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const lots = useMemo(() => buildLots(placed.map((p) => [p.x, p.y])), [sitesKey]);

  const o = origin ? project(origin, anchor) : { x: CX, y: CY };
  const ringR = radiusKm * PX_PER_KM;

  const blocks: Block[] = useMemo(() => {
    if (!colors) return [];
    const out: Block[] = lots.map((l, i) => {
      const km = Math.hypot(l.x - o.x, l.y - o.y) / PX_PER_KM;
      const faces = km <= radiusKm ? solid(mix(colors["--map-in-a"], colors["--map-in-b"], Math.min(1, km / radiusKm))) : NEUTRAL;
      return { key: `l${i}`, x: Math.round(l.x - l.w / 2), y: Math.round(l.y - l.d / 2), w: l.w, d: l.d, h: l.h, op: l.op, delay: l.delay, ...faces };
    });
    out.push({ key: "campus", x: CX - 20, y: CY - 17, w: 40, d: 34, h: 60, op: 1, delay: 0, ...solid(colors["--map-campus-block"]) });
    for (const p of placed) {
      const base = colors[`--map-cat-${CAT[p.item.category].css}` as (typeof TOKENS)[number]];
      out.push({ key: `o${p.item.id}`, x: Math.round(p.x - 16), y: Math.round(p.y - 16), w: 32, d: 32, h: 50, op: 1, delay: 200, ...solid(base) });
    }
    return out;
  }, [colors, lots, placed, o.x, o.y, radiusKm]);

  const rr = (view.rot * Math.PI) / 180;
  const faces = { front: Math.cos(rr) > 0.01, back: Math.cos(rr) < -0.01, right: Math.sin(rr) > 0.01, left: Math.sin(rr) < -0.01 };
  const billboard = `rotateZ(${-view.rot}deg) rotateX(${-view.tilt}deg)`;
  const sel = placed.find((p) => p.item.id === selectedId) ?? null;

  let route: { d: string; x: number; y: number; label: string } | null = null;
  if (sel && sel.item.distance_km !== null) {
    const mx = (o.x + sel.x) / 2 - (sel.y - o.y) * 0.18;
    const my = (o.y + sel.y) / 2 + (sel.x - o.x) * 0.18;
    route = {
      d: `M${o.x} ${o.y} Q${mx.toFixed(1)} ${my.toFixed(1)} ${sel.x} ${sel.y}`,
      x: Math.round((o.x + 2 * mx + sel.x) / 4),
      y: Math.round((o.y + 2 * my + sel.y) / 4) - 8,
      label: `${sel.item.distance_km} km`,
    };
  }

  const zoom = (dz: number) => setView((v) => ({ ...v, zoom: Math.min(1.4, Math.max(0.5, +(v.zoom + dz).toFixed(2))) }));
  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (k === "ArrowLeft") setView((v) => ({ ...v, rot: v.rot - 15 }));
    else if (k === "ArrowRight") setView((v) => ({ ...v, rot: v.rot + 15 }));
    else if (k === "ArrowUp") setView((v) => (v.tilt > 0 ? { ...v, tilt: Math.min(66, v.tilt + 4) } : v));
    else if (k === "ArrowDown") setView((v) => (v.tilt > 0 ? { ...v, tilt: Math.max(30, v.tilt - 4) } : v));
    else if (k === "+" || k === "=") zoom(0.1);
    else if (k === "-") zoom(-0.1);
    else return;
    e.preventDefault();
  };

  const ctl = "mc-ctl glass-float flex h-10 w-10 cursor-pointer items-center justify-center rounded-field font-[inherit] text-ink";

  return (
    <div
      className="relative flex-none overflow-hidden rounded-map border border-line"
      style={{ height, background: "var(--map-ground)", color: "var(--map-text)", boxShadow: "var(--map-shadow), 0 0 0 4px var(--mapB)" }}
    >
      <div
        tabIndex={0}
        role="application"
        aria-label="3D map. Drag, or use arrow keys to rotate and plus or minus to zoom. Every item on the map is also in the list."
        onKeyDown={onKey}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          setDragging(true);
          last.current = { x: e.clientX, y: e.clientY };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragging || !last.current) return;
          const dx = e.clientX - last.current.x;
          const dy = e.clientY - last.current.y;
          last.current = { x: e.clientX, y: e.clientY };
          setView((v) => ({ ...v, rot: v.rot + dx * 0.4, tilt: v.tilt > 0 ? Math.max(30, Math.min(66, v.tilt - dy * 0.25)) : 0 }));
        }}
        onPointerUp={() => {
          setDragging(false);
          last.current = null;
        }}
        onPointerCancel={() => setDragging(false)}
        className={`absolute inset-0 touch-none select-none overflow-hidden ${dragging ? "mc-dragging cursor-grabbing" : "cursor-grab"}`}
        style={{ perspective: 1500, perspectiveOrigin: "50% 20%" }}
      >
        <div className="absolute top-[46%] left-1/2 h-[1000px] w-[1000px]" style={{ margin: "-430px 0 0 -500px", transform: `scale(${view.zoom})`, transformOrigin: "500px 430px", transformStyle: "preserve-3d" }}>
          <div className="mc-plane absolute inset-0" style={{ transformStyle: "preserve-3d", transformOrigin: "500px 430px", transform: `rotateX(${view.tilt}deg) rotateZ(${view.rot}deg)` }}>
            <svg width="1000" height="1000" viewBox="0 0 1000 1000" className="absolute top-0 left-0 overflow-visible" aria-hidden="true">
              <defs>
                <radialGradient id="mcFade" cx="500" cy="430" r="520" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="white" stopOpacity="1" />
                  <stop offset="0.72" stopColor="white" stopOpacity="1" />
                  <stop offset="1" stopColor="white" stopOpacity="0" />
                </radialGradient>
                <mask id="mcMask">
                  <rect x="-200" y="-200" width="1400" height="1400" fill="url(#mcFade)" />
                </mask>
              </defs>
              <g mask="url(#mcMask)">
                <path d={WATER_PATH} fill="var(--map-water)" />
                <path d={COAST_PATH} fill="none" stroke="var(--map-coast)" strokeWidth={3} />
                <path d={RIVER_PATH} fill="none" stroke="var(--map-water)" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
                {ROADS.map((rd, i) => (
                  <g key={i}>
                    <path d={rd.d} fill="none" stroke="var(--map-road-case)" strokeWidth={rd.casing} strokeLinecap="round" strokeLinejoin="round" />
                    <path d={rd.d} fill="none" stroke="var(--map-road)" strokeWidth={rd.w} strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                ))}
                <circle cx={o.x} cy={o.y} r={ringR} fill="var(--map-ring-fill)" stroke="var(--map-ring)" strokeWidth={3} />
              </g>
              {route && (
                <>
                  <path d={route.d} fill="none" stroke="var(--map-route)" strokeWidth={4} strokeDasharray="10 8" strokeLinecap="round" />
                  <text x={route.x} y={route.y} fontSize={16} fontWeight={800} fill="var(--map-text)" textAnchor="middle" stroke="var(--map-halo)" strokeWidth={5} paintOrder="stroke">
                    {route.label}
                  </text>
                </>
              )}
              <text x={150} y={170} fontSize={22} fontWeight={700} fill="var(--map-bay)" letterSpacing={2}>
                Jakarta Bay
              </text>
              <text x={o.x} y={o.y + ringR + 22} fontSize={15} fontWeight={700} fill="var(--map-text)" textAnchor="middle">
                {radiusKm} km
              </text>
            </svg>

            {blocks.map((b) => (
              <div key={b.key} className="mc-rise absolute" style={{ left: b.x, top: b.y, width: b.w, height: b.d, transformStyle: "preserve-3d", opacity: b.op, animationDelay: `${b.delay}ms` }}>
                <div className="absolute inset-0" style={{ transform: `translateZ(${b.h}px)`, background: b.top }} />
                {faces.front && <div className="absolute left-0" style={{ top: b.d - b.h, width: b.w, height: b.h, transformOrigin: "50% 100%", transform: "rotateX(-90deg)", background: b.front }} />}
                {faces.back && <div className="absolute top-0 left-0" style={{ width: b.w, height: b.h, transformOrigin: "50% 0%", transform: "rotateX(90deg)", background: b.back }} />}
                {faces.right && <div className="absolute top-0" style={{ left: b.w - b.h, width: b.h, height: b.d, transformOrigin: "100% 50%", transform: "rotateY(90deg)", background: b.right }} />}
                {faces.left && <div className="absolute top-0 left-0" style={{ width: b.h, height: b.d, transformOrigin: "0% 50%", transform: "rotateY(-90deg)", background: b.left }} />}
              </div>
            ))}

            {placed.map(({ item, x, y, clamped }) => {
              const on = item.id === selectedId;
              const grey = !item.in_radius || !item.eligible;
              const color = grey ? "var(--map-grey)" : `var(--map-cat-${CAT[item.category].css})`;
              const note = !item.in_radius ? ", outside" : !item.eligible ? (item.block_reason?.startsWith("For semester") ? `, sem ${item.min_semester}+` : ", not your major") : "";
              return (
                <div key={item.id} className="absolute h-0 w-0" style={{ left: x, top: y, transformStyle: "preserve-3d", transform: "translateZ(54px)" }}>
                  <div className="absolute top-0 left-0" style={{ transformStyle: "preserve-3d", transform: billboard }}>
                    <div className="mc-pin mc-drop absolute bottom-0 -left-20 flex w-40 flex-col items-center">
                      <div
                        className="mc-tip absolute bottom-[calc(100%+8px)] left-1/2 -ml-[110px] box-border w-[220px] rounded-field px-3 py-2.5 text-left text-xs leading-[1.4]"
                        style={{ background: "var(--map-tip-bg)", color: "var(--map-tip-ink)" }}
                        role="tooltip"
                        id={`tip-${item.id}`}
                      >
                        <div className="text-[13px] font-extrabold">{item.title}</div>
                        <div style={{ color: "var(--map-tip-sub)" }}>
                          Fit {item.fit}/100 · {item.days_left} days left · {item.distance_km} km
                        </div>
                        <div className="mt-1">{item.why}</div>
                        <div className="mt-1" style={{ color: "var(--map-tip-sub)" }}>
                          {strongestWeakest(item)}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="mc-bubble h-[92px] w-[92px] cursor-pointer rounded-full border-0 p-1.5"
                        onClick={() => onSelect(item.id)}
                        aria-pressed={on}
                        aria-describedby={`tip-${item.id}`}
                        aria-label={`${item.title}, ${item.distance_km} km away, Fit ${item.fit}`}
                        style={{
                          outline: on ? "3px solid var(--map-stem)" : "0 solid transparent",
                          outlineOffset: 3,
                          background: `conic-gradient(${color} ${Math.round(item.fit * 3.6)}deg, var(--map-bubble-track) 0)`,
                          boxShadow: "var(--map-bubble-shadow)",
                        }}
                      >
                        <span className="flex h-full w-full flex-col items-center justify-center rounded-full" style={{ background: "var(--map-bubble-bg)", color: "var(--map-bubble-ink)" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d={CAT[item.category].icon} />
                          </svg>
                          <span className="wp-num text-[22px] leading-[1.05] font-extrabold">{item.fit}</span>
                          <span className="text-[9.5px] font-bold" style={{ color: "var(--map-bubble-sub)" }}>
                            Fit score
                          </span>
                        </span>
                      </button>
                      {on && (
                        <div className="mt-1.5 rounded-xs border px-2 py-1 text-xs font-bold whitespace-nowrap" style={{ background: "var(--map-label-bg)", color: "var(--map-label-ink)", borderColor: "var(--map-label-line)" }}>
                          {item.title} · {item.distance_km} km{note}
                          {clamped ? " · beyond 40 km" : ""}
                        </div>
                      )}
                      <div className="w-0.5" style={{ height: on ? 46 : 30, background: "var(--map-stem)" }} />
                      <div className="-mt-1 h-2 w-2 rounded-full" style={{ background: "var(--map-stem)" }} />
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="absolute h-0 w-0" style={{ left: CX, top: CY, transformStyle: "preserve-3d", transform: "translateZ(2px)" }}>
              <div className="absolute top-0 left-0" style={{ transformStyle: "preserve-3d", transform: billboard }}>
                <div className="absolute top-[22px] -left-[70px] w-[140px] text-center">
                  <span className="inline-block rounded-sm px-2.5 py-1.5 text-[12.5px] font-bold whitespace-nowrap" style={{ background: "var(--map-campus-bg)", color: "var(--map-campus-ink)" }}>
                    Campus
                  </span>
                </div>
              </div>
            </div>

            {originKind === "home" && origin && (
              <div className="absolute h-0 w-0" style={{ left: o.x, top: o.y, transformStyle: "preserve-3d", transform: "translateZ(8px)" }}>
                <div className="absolute -top-[9px] -left-[9px] h-[18px] w-[18px] rounded-full" style={{ background: "var(--map-home)", boxShadow: "0 0 0 5px var(--map-home-glow)" }} />
                <div className="absolute top-0 left-0" style={{ transformStyle: "preserve-3d", transform: billboard }}>
                  <div className="absolute bottom-3 -left-[90px] w-[180px] text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-sm border-2 px-2.5 py-1.5 text-[12.5px] font-bold whitespace-nowrap" style={{ background: "var(--map-label-bg)", borderColor: "var(--map-home)", color: "var(--map-label-ink)" }}>
                      <HomeIcon size={14} style={{ color: "var(--map-home)" }} strokeWidth={2.4} />
                      Home{homeLabel ? `, ${homeLabel}` : ""}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-3.5 left-3.5 z-[2] flex flex-col gap-2">
        <button type="button" className={`${ctl} text-xl font-bold`} onClick={() => zoom(0.1)} aria-label="Zoom in">+</button>
        <button type="button" className={`${ctl} text-xl font-bold`} onClick={() => zoom(-0.1)} aria-label="Zoom out">−</button>
        <button type="button" className={`${ctl} text-xs font-bold`} onClick={() => setView((v) => ({ ...v, tilt: v.tilt > 0 ? 0 : DEFAULT.tilt }))} aria-label="Switch between 2D and 3D view">
          {view.tilt > 0 ? "2D" : "3D"}
        </button>
        <button type="button" className={`${ctl} text-base`} onClick={() => setView((v) => ({ ...v, rot: v.rot - 45 }))} aria-label="Rotate left">⟲</button>
        <button type="button" className={`${ctl} text-base`} onClick={() => setView((v) => ({ ...v, rot: v.rot + 45 }))} aria-label="Rotate right">⟳</button>
        <button type="button" className={ctl} onClick={() => setView(DEFAULT)} aria-label="Reset view">
          <TargetIcon size={16} />
        </button>
      </div>
      {ringChip && (
        <div className="glass-float absolute top-3.5 right-3.5 z-[2] rounded-pill px-3 py-1.5 text-[13px] text-soft">
          Ring = {radiusKm} km from {originKind}
        </div>
      )}
      {children}
    </div>
  );
}

/** Selected-item card, bottom-left over the map. */
export function MapSelectedCard({ item, origin, onWhy }: { item: FeedItem; origin: string; onWhy: () => void }) {
  const color = `var(--cat-${CAT[item.category].css})`;
  const meta = `${item.distance_km === null ? "Online" : `${item.distance_km} km from ${origin}${item.in_radius ? "" : ", outside your radius"}`} · ${item.days_left} days left`;
  return (
    <div className="glass-float absolute bottom-3.5 left-[66px] z-[2] box-border flex w-[340px] max-w-[calc(100%-80px)] items-center gap-3 rounded-[16px] px-3.5 py-3 text-ink" style={{ borderColor: color }}>
      <div role="img" aria-label={`Fit score ${item.fit} of 100`} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(${color} 0 ${item.fit}%, var(--track) ${item.fit}% 100%)` }}>
        <div className="wp-num flex h-[38px] w-[38px] items-center justify-center rounded-full bg-hole2 font-heading text-[15px] font-bold">{item.fit}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">{item.title}</div>
        <div className="text-xs text-muted">{meta}</div>
      </div>
      <button type="button" onClick={onWhy} className="h-[34px] shrink-0 cursor-pointer rounded-sm border border-line bg-transparent px-2.5 font-[inherit] text-xs font-semibold text-link">
        Why {item.fit}?
      </button>
    </div>
  );
}
