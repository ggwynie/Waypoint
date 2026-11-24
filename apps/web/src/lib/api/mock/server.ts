/* In-browser stand-in for the FastAPI routes, used only while NEXT_PUBLIC_API_URL is empty.
 * It exists so the UI can be built and demoed before apps/api ships. It mirrors the Fit rules so the
 * demo re-ranks when the radius changes; the real ranking lives in packages/core ranking.py, and
 * components only ever read `fit` and `fit_parts` from these responses. Delete this folder once the
 * API is deployed. */
import type { SavedPatch, WaypointApi } from "../client";
import {
  ApiError,
  type FeedItem,
  type FeedQuery,
  type FitPart,
  type FoundTiming,
  type Me,
  type MePatch,
  type Outcome,
  type Reminder,
  type SavedItem,
  type TrustLevel,
} from "../types";
import { CAMPUSES, DEMO_EMAIL, DISTRICTS, MAJORS, OPPORTUNITIES, TAGS, fromScenePx, type DemoOpportunity } from "./fixtures";

const STORE_KEY = "wp-demo-v1";
const SESSION_KEY = "wp-demo-session";
const DAY = 86_400_000;
const TRUST_VALUE: Record<TrustLevel, number> = { official: 1, corroborated: 0.8, reviewed: 0.6 };
const TRUST_LABEL: Record<TrustLevel, string> = {
  official: "Official source",
  corroborated: "Confirmed by 2 sources",
  reviewed: "Reviewed by admin",
};

type SavedRow = { saved_at: string; muted: boolean; found_timing: FoundTiming | null; outcome: Outcome | null };
type Store = {
  profile: Omit<Me, "email" | "learned" | "origin" | "campus"> | null;
  saved: Record<string, SavedRow>;
  hidden: string[];
  events: { opportunity_id: string; tag: string; created_at: string }[];
};
export type DemoSession = { email: string; name: string };

/** Start of today in Asia/Jakarta (UTC+7, no DST), as a UTC timestamp. */
export function todayWib(now = Date.now()): number {
  const wib = now + 7 * 3600_000;
  return wib - (wib % DAY) - 7 * 3600_000;
}

function seed(): Store {
  const now = Date.now();
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
  return {
    profile: {
      display_name: "Rani Putri",
      semester: 6,
      major_id: 1,
      campus_id: 1,
      home_district_code: "pademangan",
      distance_origin: "home",
      radius_km: 25,
      fallback_mode: "online_first",
      looking_for: ["internship", "seminar", "call_for_papers", "competition"],
      email_reminders: true,
      in_app_reminders: true,
      daily_digest: true,
      theme: "dark",
      consent_version: "2026-11-v1",
      tags: ["software", "data", "cyber_security", "javascript", "sql", "figma"],
    },
    saved: {
      c1: { saved_at: iso(4 * DAY), muted: false, found_timing: null, outcome: null },
      s1: { saved_at: iso(2 * DAY), muted: false, found_timing: "late", outcome: null },
      i1: { saved_at: iso(6 * DAY), muted: false, found_timing: "early", outcome: null },
      p1: { saved_at: iso(1 * DAY), muted: false, found_timing: null, outcome: null },
    },
    hidden: [],
    events: [{ opportunity_id: "seed", tag: "research", created_at: iso(5 * DAY) }],
  };
}

function read<T>(storage: () => Storage, key: string): T | null {
  try {
    const raw = storage().getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(storage: () => Storage, key: string, value: unknown) {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked: the demo still works for this page view */
  }
}
const local = () => window.localStorage;

let memory: Store | null = null;
function store(): Store {
  if (!memory) memory = read<Store>(local, STORE_KEY) ?? seed();
  return memory;
}
function commit() {
  write(local, STORE_KEY, memory);
}

export function getDemoSession(): DemoSession | null {
  return read<DemoSession>(local, SESSION_KEY);
}
export function setDemoSession(s: DemoSession | null) {
  write(local, SESSION_KEY, s);
}
/** New sign-up: fresh store with no profile, so setup runs. */
export function resetDemoStore(withProfile: boolean) {
  memory = seed();
  if (!withProfile) memory.profile = null;
  commit();
}

/* ---- demo switches: ?demo=slow | error | empty on any app URL ---- */
function demoMode(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("demo");
}
async function latency() {
  const ms = demoMode() === "slow" ? 4500 : 220;
  await new Promise((r) => setTimeout(r, ms));
}
function maybeFail() {
  if (demoMode() === "error") throw new ApiError(503, "internal", "Couldn't load opportunities.");
}

/* ---- Fit ---- */
function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r;
  const dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
const fmt = (n: number) => (Math.round(n * 10) / 10).toString();
const label = (slug: string) => TAGS.find((t) => t.slug === slug)?.label ?? slug;

function weights(s: Store): Record<string, number> {
  const w: Record<string, number> = {};
  for (const e of s.events) {
    const age = (Date.now() - Date.parse(e.created_at)) / DAY;
    w[e.tag] = (w[e.tag] ?? 1) * (1 - 0.2 * 0.5 ** (age / 14));
  }
  for (const k of Object.keys(w)) w[k] = Math.max(0.5, w[k]);
  return w;
}

function origins(p: NonNullable<Store["profile"]>) {
  const campus = CAMPUSES.find((c) => c.id === p.campus_id) ?? null;
  const home = DISTRICTS.find((d) => d.code === p.home_district_code) ?? null;
  const pick = p.distance_origin === "home" ? (home ?? campus) : (campus ?? home);
  return {
    campus: campus ? { lat: campus.lat, lng: campus.lng } : null,
    origin: pick ? { lat: pick.lat, lng: pick.lng } : null,
    word: (pick === home && home ? "home" : "campus") as "home" | "campus",
  };
}

function score(o: DemoOpportunity, s: Store): FeedItem & { group: "A" | "B" | "C" } {
  const p = s.profile!;
  const W = weights(s);
  const major = MAJORS.find((m) => m.id === p.major_id)!;
  const { origin, word } = origins(p);
  const pos = o.scenePx ? fromScenePx(o.scenePx[0], o.scenePx[1]) : null;
  const km = o.mode === "online" || !pos ? null : origin ? Math.max(1, Math.round(haversine(origin, pos))) : null;
  const R = p.radius_km;

  const majorOk = o.eligibleMajorIds === null || o.eligibleMajorIds.includes(p.major_id);
  const semOk = o.minSemester === null || p.semester >= o.minSemester;
  const majorV = o.eligibleMajorIds === null ? 0.6 : majorOk ? 1 : 0;

  const hitTopics = o.topicTags.filter((t) => p.tags.includes(t));
  const hitSkills = o.skillTags.filter((t) => p.tags.includes(t));
  const denom = o.topicTags.length + o.skillTags.length;
  const matchV = denom ? (hitTopics.reduce((a, t) => a + (W[t] ?? 1), 0) + hitSkills.length) / denom : 0.5;
  const damped = hitTopics.filter((t) => W[t] !== undefined);

  const distV = km === null ? 1 : km <= R ? 1 - (0.5 * km) / R : (0.25 * R) / km;
  const deadline = todayWib() + o.daysFromToday * DAY;
  const n = o.daysFromToday;
  const prepV = n >= 7 && n <= 30 ? 1 : n > 30 ? 0.7 : n >= 3 ? 0.6 : 0.2;
  const trustV = TRUST_VALUE[o.trust];

  const parts: FitPart[] = [
    {
      key: "major", points: 30 * majorV, max: 30,
      explain: o.eligibleMajorIds === null
        ? `Open to every major, not aimed at ${major.name}: 30 × 0.6 = 18.`
        : majorOk ? `${major.name} is listed by the organizer: full 30.`
          : `Only for ${o.eligibleMajorIds.map((id) => MAJORS.find((m) => m.id === id)?.name).join(" and ")}: 0 points.`,
    },
    {
      key: "match", points: 30 * matchV, max: 30,
      explain: (denom
        ? `Topics ${o.topicTags.map(label).join(", ")}${o.skillTags.length ? `; skills ${o.skillTags.map(label).join(", ")}` : "; no skills asked"}. You match ${hitTopics.length + hitSkills.length} of ${denom}`
        : "No topics listed, so half points") +
        (damped.length ? `, with ${damped.map((t) => `${label(t)} ×${W[t].toFixed(2)}`).join(", ")} from your Not relevant clicks` : "") +
        `: ${fmt(30 * matchV)}.`,
    },
    {
      key: "distance", points: 20 * distV, max: 20,
      explain: km === null ? "Online, no travel: full 20."
        : km <= R ? `Inside your ${R} km radius: 20 × (1 − 0.5 × ${km}/${R}) = ${fmt(20 * distV)}.`
          : `Outside your ${R} km radius: 20 × 0.25 × ${R}/${km} = ${fmt(20 * distV)}. Still listed, after items in range.`,
    },
    {
      key: "prep_time", points: 10 * prepV, max: 10,
      explain: n >= 7 && n <= 30 ? "7 to 30 days left is enough to prepare: full 10."
        : n > 30 ? "More than 30 days away: 7, it can wait."
          : n >= 3 ? "3 to 6 days left: 6, tight but doable." : "Under 3 days: 2, probably too late to prepare.",
    },
    {
      key: "trust", points: 10 * trustV, max: 10,
      explain: `${TRUST_LABEL[o.trust]}: 10 × ${trustV} = ${fmt(10 * trustV)}. The original listing is linked on the card.`,
    },
  ];
  const fit = Math.round(parts.reduce((a, x) => a + x.points, 0));

  const why = [o.eligibleMajorIds === null ? "open to all majors" : majorOk ? "your major is listed" : `not open to ${major.name}`];
  if (hitTopics.length || hitSkills.length) why.push(`matches ${[...hitTopics, ...hitSkills].map(label).join(", ")}`);
  why.push(km === null ? "online" : `${km} km from ${word}${km > R ? ", outside your radius" : ""}`);
  if (n <= 2) why.push(`closes in ${n} days`);
  const whyText = why.join(", ") + ".";

  const eligible = majorOk && semOk;
  const inRadius = km === null || km <= R;
  return {
    id: o.id,
    title: o.title,
    category: o.category,
    organizer: o.organizer,
    mode: o.mode,
    registration_deadline: new Date(deadline + DAY - 1000).toISOString(),
    days_left: n,
    distance_km: km,
    in_radius: inRadius,
    eligible,
    block_reason: !semOk
      ? `For semester ${o.minSemester} and up. You are in semester ${p.semester}.`
      : !majorOk
        ? `Open to ${o.eligibleMajorIds!.map((id) => MAJORS.find((m) => m.id === id)?.name).join(" and ")} only.`
        : null,
    fit,
    fit_parts: parts,
    why: whyText.charAt(0).toUpperCase() + whyText.slice(1),
    trust_level: o.trust,
    primary_source_url: o.sourceUrl,
    source_host: new URL(o.sourceUrl).host,
    last_verified_at: new Date(Date.now() - o.checkedHoursAgo * 3600_000).toISOString(),
    topic_tags: o.topicTags,
    required_skill_tags: o.skillTags,
    min_semester: o.minSemester,
    is_saved: !!s.saved[o.id],
    lat: pos?.lat ?? null,
    lng: pos?.lng ?? null,
    group: !eligible ? "C" : inRadius ? "A" : "B",
  };
}

function rank(items: ReturnType<typeof score>[], mode: Me["fallback_mode"]): FeedItem[] {
  const tie = (a: FeedItem, b: FeedItem) => a.days_left - b.days_left || a.id.localeCompare(b.id);
  const byFit = (a: FeedItem, b: FeedItem) => b.fit - a.fit || tie(a, b);
  const A = items.filter((x) => x.group === "A").sort(byFit);
  const B = mode === "radius_only" ? [] : items.filter((x) => x.group === "B")
    .sort(mode === "nearest_first" ? (a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0) || tie(a, b) : byFit);
  const C = items.filter((x) => x.group === "C" && (mode !== "radius_only" || x.in_radius)).sort(byFit);
  return [...A, ...B, ...C].map((x) => {
    const item: FeedItem & { group?: string } = { ...x };
    delete item.group;
    return item;
  });
}

function requireProfile(): Store & { profile: NonNullable<Store["profile"]> } {
  const s = store();
  if (!getDemoSession()) throw new ApiError(401, "unauthorized", "Log in to continue.");
  if (!s.profile) throw new ApiError(404, "profile_missing", "Finish setup first.");
  return s as Store & { profile: NonNullable<Store["profile"]> };
}

function meOf(s: Store & { profile: NonNullable<Store["profile"]> }): Me {
  const W = weights(s);
  const last: Record<string, string> = {};
  for (const e of s.events) if (!last[e.tag] || e.created_at > last[e.tag]) last[e.tag] = e.created_at;
  const o = origins(s.profile);
  return {
    ...s.profile,
    email: getDemoSession()?.email ?? DEMO_EMAIL,
    learned: Object.keys(W).map((tag) => ({ tag, weight: +W[tag].toFixed(2), last_clicked_at: last[tag] })),
    origin: o.origin,
    campus: o.campus,
  };
}

function validate(body: MePatch) {
  const details: { field: string; message: string }[] = [];
  if (body.radius_km !== undefined && (body.radius_km < 1 || body.radius_km > 100)) details.push({ field: "radius_km", message: "Use a radius from 1 to 100 km." });
  if (body.looking_for !== undefined && body.looking_for.length === 0) details.push({ field: "looking_for", message: "Pick at least one type." });
  if (body.semester !== undefined && (body.semester < 1 || body.semester > 14)) details.push({ field: "semester", message: "Pick a semester from 1 to 14." });
  if (details.length) throw new ApiError(422, "validation_failed", "Check the highlighted fields.", details);
}

export function createMockApi(): WaypointApi {
  return {
    async getMe() {
      await latency();
      return meOf(requireProfile());
    },
    async putMe(body) {
      await latency();
      validate(body);
      const s = store();
      const base = seed().profile!;
      s.profile = { ...base, tags: [], ...s.profile, ...body, display_name: body.display_name ?? getDemoSession()?.name ?? base.display_name };
      s.saved = s.saved ?? {};
      commit();
      return meOf(requireProfile());
    },
    async patchMe(body) {
      await latency();
      validate(body);
      const s = requireProfile();
      s.profile = { ...s.profile, ...body };
      commit();
      return meOf(s);
    },
    async deleteMe(confirmEmail) {
      await latency();
      if (confirmEmail.trim().toLowerCase() !== (getDemoSession()?.email ?? "").toLowerCase())
        throw new ApiError(422, "validation_failed", "Type the email you signed up with.");
      memory = null;
      write(local, STORE_KEY, null);
      setDemoSession(null);
    },
    async getFeed(query?: FeedQuery) {
      await latency();
      maybeFail();
      const s = requireProfile();
      if (demoMode() === "empty") return [];
      const q = query?.q?.trim().toLowerCase() ?? "";
      const visible = OPPORTUNITIES.filter((o) => {
        if (s.hidden.includes(o.id)) return false;
        if (query?.category ? o.category !== query.category : !s.profile.looking_for.includes(o.category)) return false;
        if (q && !`${o.title} ${o.organizer} ${o.category.replace(/_/g, " ")} ${o.topicTags.map(label).join(" ")}`.toLowerCase().includes(q)) return false;
        return true;
      });
      return rank(visible.map((o) => score(o, s)), s.profile.fallback_mode);
    },
    async getSaved() {
      await latency();
      maybeFail();
      const s = requireProfile();
      if (demoMode() === "empty") return [];
      return OPPORTUNITIES.filter((o) => s.saved[o.id])
        .map((o): SavedItem => ({ opportunity: score(o, s), ...s.saved[o.id] }))
        .sort((a, b) => a.opportunity.days_left - b.opportunity.days_left);
    },
    async save(id) {
      await latency();
      const s = requireProfile();
      if (!OPPORTUNITIES.some((o) => o.id === id)) throw new ApiError(404, "not_found", "This listing has closed.");
      s.saved[id] ??= { saved_at: new Date().toISOString(), muted: false, found_timing: null, outcome: null };
      commit();
    },
    async unsave(id) {
      await latency();
      const s = requireProfile();
      delete s.saved[id];
      commit();
    },
    async patchSaved(id, body: SavedPatch) {
      await latency();
      const s = requireProfile();
      if (!s.saved[id]) throw new ApiError(404, "not_found", "Not in your saved list.");
      s.saved[id] = { ...s.saved[id], ...body };
      commit();
    },
    async getReminders() {
      await latency();
      maybeFail();
      const s = requireProfile();
      if (demoMode() === "empty") return [];
      const today = todayWib();
      const rows: Reminder[] = [];
      for (const o of OPPORTUNITIES) {
        const row = s.saved[o.id];
        if (!row) continue;
        const deadline = today + o.daysFromToday * DAY;
        for (const off of [7, 3, 1] as const) {
          const due = deadline - off * DAY;
          if (due < todayWib(Date.parse(row.saved_at))) continue;
          const channels = [s.profile.email_reminders && "email", s.profile.in_app_reminders && "in_app"].filter(Boolean) as ("email" | "in_app")[];
          for (const channel of channels.length ? channels : (["email"] as const)) {
            rows.push({
              id: `${o.id}-${off}-${channel}`,
              opportunity_id: o.id,
              offset_days: off,
              due_on: new Date(due + 7 * 3600_000).toISOString().slice(0, 10),
              channel,
              status: !channels.length || row.muted ? "cancelled" : due < today ? "sent" : "scheduled",
            });
          }
        }
      }
      return rows.sort((a, b) => a.due_on.localeCompare(b.due_on));
    },
    async feedback(opportunityId, kind) {
      await latency();
      const s = requireProfile();
      const o = OPPORTUNITIES.find((x) => x.id === opportunityId);
      if (!o) throw new ApiError(404, "not_found", "Not found.");
      if (kind === "not_relevant") {
        if (!s.hidden.includes(o.id)) s.hidden.push(o.id);
        if (o.topicTags[0]) s.events.push({ opportunity_id: o.id, tag: o.topicTags[0], created_at: new Date().toISOString() });
      } else {
        s.hidden = s.hidden.filter((h) => h !== o.id);
        const i = s.events.map((e) => e.opportunity_id).lastIndexOf(o.id);
        if (i >= 0) s.events.splice(i, 1);
      }
      commit();
    },
    async resetLearned() {
      await latency();
      requireProfile().events = [];
      commit();
    },
    majors: async () => MAJORS,
    campuses: async () => CAMPUSES,
    districts: async () => DISTRICTS,
    tags: async () => TAGS,
  };
}
