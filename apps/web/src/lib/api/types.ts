import { z } from "zod";

/* Shapes returned by the FastAPI v1 routes. Keys and enums follow the data model;
 * the web client displays these values and never recomputes Fit. */

export const CATEGORIES = ["internship", "seminar", "call_for_papers", "competition"] as const;
export const category = z.enum(CATEGORIES);
export type Category = z.infer<typeof category>;

export const trustLevel = z.enum(["official", "corroborated", "reviewed"]);
export type TrustLevel = z.infer<typeof trustLevel>;

export const distanceOrigin = z.enum(["home", "campus"]);
export type DistanceOrigin = z.infer<typeof distanceOrigin>;

export const fallbackMode = z.enum(["online_first", "nearest_first", "radius_only"]);
export type FallbackMode = z.infer<typeof fallbackMode>;

export const theme = z.enum(["dark", "light"]);
export type Theme = z.infer<typeof theme>;

export const foundTiming = z.enum(["early", "late"]);
export type FoundTiming = z.infer<typeof foundTiming>;

export const outcome = z.enum(["applied", "missed", "skipped"]);
export type Outcome = z.infer<typeof outcome>;

export const FIT_PART_KEYS = ["major", "match", "distance", "prep_time", "trust"] as const;
export const fitPart = z.object({
  key: z.enum(FIT_PART_KEYS),
  points: z.number(),
  max: z.number(),
  explain: z.string(),
});
export type FitPart = z.infer<typeof fitPart>;

/** API response shape */
export const feedItem = z.object({
  id: z.string(),
  title: z.string(),
  category,
  organizer: z.string(),
  mode: z.enum(["online", "onsite", "hybrid"]),
  registration_deadline: z.string(),
  days_left: z.number().int(),
  distance_km: z.number().nullable(),
  in_radius: z.boolean(),
  eligible: z.boolean(),
  block_reason: z.string().nullable(),
  fit: z.number().int(),
  fit_parts: z.array(fitPart),
  why: z.string(),
  trust_level: trustLevel,
  primary_source_url: z.string(),
  source_host: z.string(),
  last_verified_at: z.string(),
  topic_tags: z.array(z.string()),
  required_skill_tags: z.array(z.string()),
  min_semester: z.number().int().nullable(),
  is_saved: z.boolean(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
});
export type FeedItem = z.infer<typeof feedItem>;

/** API response shape */
export const learnedTag = z.object({ tag: z.string(), weight: z.number(), last_clicked_at: z.string() });
export type LearnedTag = z.infer<typeof learnedTag>;

export const me = z.object({
  display_name: z.string(),
  email: z.string(),
  semester: z.number().int(),
  major_id: z.number().int(),
  campus_id: z.number().int().nullable(),
  home_district_code: z.string().nullable(),
  distance_origin: distanceOrigin,
  radius_km: z.number().int(),
  fallback_mode: fallbackMode,
  looking_for: z.array(category).min(1),
  email_reminders: z.boolean(),
  in_app_reminders: z.boolean(),
  daily_digest: z.boolean(),
  theme,
  consent_version: z.string().nullable(),
  tags: z.array(z.string()),
  learned: z.array(learnedTag),
  origin: z.object({ lat: z.number(), lng: z.number() }).nullable(),
  campus: z.object({ lat: z.number(), lng: z.number() }).nullable(),
});
export type Me = z.infer<typeof me>;
export type MePatch = Partial<
  Pick<
    Me,
    | "display_name"
    | "semester"
    | "major_id"
    | "campus_id"
    | "home_district_code"
    | "distance_origin"
    | "radius_km"
    | "fallback_mode"
    | "looking_for"
    | "email_reminders"
    | "in_app_reminders"
    | "daily_digest"
    | "theme"
    | "consent_version"
    | "tags"
  >
>;

export const savedItem = z.object({
  opportunity: feedItem,
  saved_at: z.string(),
  muted: z.boolean(),
  found_timing: foundTiming.nullable(),
  outcome: outcome.nullable(),
});
export type SavedItem = z.infer<typeof savedItem>;

export const reminder = z.object({
  id: z.string(),
  opportunity_id: z.string(),
  offset_days: z.union([z.literal(7), z.literal(3), z.literal(1)]),
  due_on: z.string(),
  channel: z.enum(["email", "in_app"]),
  status: z.enum(["scheduled", "sent", "failed", "skipped", "cancelled"]),
});
export type Reminder = z.infer<typeof reminder>;

export type Major = { id: number; slug: string; name: string };
export type Campus = { id: number; name: string; district_code: string; lat: number; lng: number };
export type District = { code: string; name: string; city_name: string; lat: number; lng: number };
export type Tag = { id: number; slug: string; label: string; kind: "interest" | "skill" };

export type FeedQuery = { category?: Category; q?: string };

/** Error body from every route: {"error": {"code", "message", "details"}} */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: unknown[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}
