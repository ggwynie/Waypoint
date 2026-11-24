/* Schematic city for CityMap3D. Coastline, river and roads are illustrative art;
 * items are placed by real distance and bearing. */

export const SCENE = 1000;
export const CX = 500;
export const CY = 430;
export const PX_PER_KM = 12;
const MAX_KM = 40;

type Pt = [number, number];
export type LatLng = { lat: number; lng: number };

/** Projection: km offsets from the scene anchor (campus), then 12 px per km, clamped at 40 km. */
export function project(p: LatLng, anchor: LatLng): { x: number; y: number; clamped: boolean } {
  let dx = (p.lng - anchor.lng) * 111.32 * Math.cos((anchor.lat * Math.PI) / 180);
  let dy = -(p.lat - anchor.lat) * 110.57;
  const d = Math.hypot(dx, dy);
  const clamped = d > MAX_KM;
  if (clamped) {
    dx = (dx / d) * MAX_KM;
    dy = (dy / d) * MAX_KM;
  }
  return { x: CX + dx * PX_PER_KM, y: CY + dy * PX_PER_KM, clamped };
}

export function coastY(x: number) {
  let y = 382 + 22 * Math.sin(x / 95) + 12 * Math.sin(x / 31 + 1.3);
  if (x > 560 && x < 700) y -= 64 * Math.sin((Math.PI * (x - 560)) / 140);
  if (x > 300 && x < 380) y -= 28 * Math.sin((Math.PI * (x - 300)) / 80);
  return y;
}

export const poly = (pts: Pt[]) => "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L");

const COAST: Pt[] = [];
for (let x = -120; x <= 1120; x += 8) COAST.push([x, coastY(x)]);
export const WATER_PATH = "M-120 -160 L1120 -160 L" + poly(COAST.slice().reverse()).slice(1) + " Z";
export const COAST_PATH = poly(COAST);
const COAST_ROAD = COAST.filter((_, k) => k % 2 === 0).map((p): Pt => [p[0], p[1] + 26]);

const ROADS_RAW: { pts: Pt[]; w: number; casing: number }[] = [
  { pts: COAST_ROAD, w: 10, casing: 14 },
  { pts: [[-120, 860], [200, 770], [420, 712], [640, 676], [1120, 610]], w: 14, casing: 19 },
  { pts: [[470, 1100], [478, 860], [488, 640], [500, 470]], w: 10, casing: 14 },
  { pts: [[60, 520], [260, 560], [520, 560], [760, 520], [1000, 470]], w: 8, casing: 12 },
  { pts: [[760, 1100], [740, 820], [700, 600], [690, 470]], w: 8, casing: 12 },
  { pts: [[160, 1100], [190, 860], [240, 700], [300, 540]], w: 7, casing: 11 },
];
const RIVER: Pt[] = [[120, 1100], [170, 900], [150, 760], [220, 640], [250, 520], [268, 420]];
export const RIVER_PATH = poly(RIVER);
export const ROADS = ROADS_RAW.map((r) => ({ d: poly(r.pts), w: r.w, casing: r.casing }));

function segDist(px: number, py: number, a: Pt, b: Pt) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(a[0] + t * dx - px, a[1] + t * dy - py);
}
function nearLine(px: number, py: number, pts: Pt[], m: number) {
  for (let k = 1; k < pts.length; k++) if (segDist(px, py, pts[k - 1], pts[k]) < m) return true;
  return false;
}
function rnd(i: number, j: number) {
  const x = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export type Lot = { x: number; y: number; w: number; d: number; h: number; op: number; delay: number };

/** Deterministic city blocks; skips water, roads, the river, campus and item sites. */
export function buildLots(sites: Pt[]): Lot[] {
  const lots: Lot[] = [];
  for (let gy = 380; gy < 1000; gy += 32) {
    for (let gx = 10; gx < 1000; gx += 32) {
      const r = rnd(gx, gy);
      const r2 = rnd(gy, gx);
      const x = gx + (r - 0.5) * 14;
      const y = gy + (r2 - 0.5) * 14;
      const dpx = Math.hypot(x - CX, y - CY);
      const keep = dpx < 500 ? 0.92 - Math.pow(dpx / 520, 2.4) * 0.85 : 0;
      if (r > keep) continue;
      if (y < coastY(x) + 40) continue;
      if (Math.abs(x - CX) < 30 && Math.abs(y - CY) < 30) continue;
      if (sites.some((p) => Math.abs(p[0] - x) < 34 && Math.abs(p[1] - y) < 34)) continue;
      if (nearLine(x, y, RIVER, 20)) continue;
      if (ROADS_RAW.some((rd) => nearLine(x, y, rd.pts, rd.casing / 2 + 14))) continue;
      const cbd = Math.max(0, 1 - Math.hypot(x - 560, y - 930) / 220);
      lots.push({
        x,
        y,
        w: Math.round(16 + r2 * 12),
        d: Math.round(16 + rnd(x, y) * 12),
        h: Math.round(8 + rnd(y, x) * 26 + cbd * 70),
        op: dpx > 430 ? Math.max(0.15, 1 - (dpx - 430) / 90) : 1,
        delay: Math.round(dpx * 1.3),
      });
    }
  }
  return lots;
}

/* Colour helpers: inputs are token values read from CSS at runtime. */
function parse(c: string): [number, number, number] | null {
  const s = c.trim();
  const m = /^#([0-9a-f]{6})/i.exec(s);
  if (m) {
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const r = /rgba?\(([^)]+)\)/.exec(s);
  if (r) {
    const [a, b, d] = r[1].split(",").map((v) => parseFloat(v));
    return [a, b, d];
  }
  return null;
}
export function mix(a: string, b: string, t: number) {
  const x = parse(a);
  const y = parse(b);
  if (!x || !y) return a;
  const ch = (i: number) => Math.round(x[i] * (1 - t) + y[i] * t);
  return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`;
}
export const shade = (c: string, f: number) => (f < 0 ? mix(c, "rgb(0, 0, 0)", -f) : mix(c, "rgb(255, 255, 255)", f));
