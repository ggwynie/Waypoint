import {
  ApiError,
  feedItem,
  me,
  reminder,
  savedItem,
  type Campus,
  type District,
  type FeedItem,
  type FeedQuery,
  type FoundTiming,
  type Major,
  type Me,
  type MePatch,
  type Outcome,
  type Reminder,
  type SavedItem,
  type Tag,
} from "./types";
import { z } from "zod";

export type SavedPatch = { muted?: boolean; found_timing?: FoundTiming | null; outcome?: Outcome | null };

/** Every route the web client uses. */
export interface WaypointApi {
  getMe(): Promise<Me>;
  putMe(body: MePatch & { consent_version: string }): Promise<Me>;
  patchMe(body: MePatch): Promise<Me>;
  deleteMe(confirmEmail: string): Promise<void>;
  getFeed(query?: FeedQuery): Promise<FeedItem[]>;
  getSaved(): Promise<SavedItem[]>;
  save(id: string): Promise<void>;
  unsave(id: string): Promise<void>;
  patchSaved(id: string, body: SavedPatch): Promise<void>;
  getReminders(): Promise<Reminder[]>;
  feedback(opportunityId: string, kind: "not_relevant" | "undo_not_relevant"): Promise<void>;
  resetLearned(): Promise<void>;
  majors(): Promise<Major[]>;
  campuses(): Promise<Campus[]>;
  districts(): Promise<District[]>;
  tags(): Promise<Tag[]>;
}

type TokenSource = () => Promise<string | null>;

export function createHttpApi(baseUrl: string, getToken: TokenSource): WaypointApi {
  async function call<T>(method: string, path: string, body?: unknown, schema?: z.ZodType<T>): Promise<T> {
    const token = await getToken();
    let res: Response;
    try {
      res = await fetch(`${baseUrl}/v1${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(0, "network", "Couldn't reach the server. Try again.");
    }
    if (res.status === 204) return undefined as T;
    const json: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const err = (json as { error?: { code?: string; message?: string; details?: unknown[] } } | null)?.error;
      throw new ApiError(res.status, err?.code ?? "internal", err?.message ?? "Something went wrong.", err?.details ?? []);
    }
    return schema ? schema.parse(json) : (json as T);
  }
  const q = (query?: FeedQuery) => {
    const p = new URLSearchParams();
    if (query?.category) p.set("category", query.category);
    if (query?.q) p.set("q", query.q);
    p.set("limit", "50");
    return `?${p.toString()}`;
  };
  return {
    getMe: () => call("GET", "/me", undefined, me),
    putMe: (body) => call("PUT", "/me", body, me),
    patchMe: (body) => call("PATCH", "/me", body, me),
    deleteMe: (confirm_email) => call("DELETE", "/me", { confirm_email }),
    getFeed: (query) => call("GET", `/feed${q(query)}`, undefined, z.array(feedItem)),
    getSaved: () => call("GET", "/saved", undefined, z.array(savedItem)),
    save: (id) => call("POST", `/saved/${encodeURIComponent(id)}`),
    unsave: (id) => call("DELETE", `/saved/${encodeURIComponent(id)}`),
    patchSaved: (id, body) => call("PATCH", `/saved/${encodeURIComponent(id)}`, body),
    getReminders: () => call("GET", "/reminders", undefined, z.array(reminder)),
    feedback: (opportunity_id, kind) => call("POST", "/feedback", { opportunity_id, kind }),
    resetLearned: () => call("DELETE", "/feedback/learned"),
    majors: () => call("GET", "/ref/majors"),
    campuses: () => call("GET", "/ref/campuses"),
    districts: () => call("GET", "/ref/districts"),
    tags: () => call("GET", "/ref/tags"),
  };
}
