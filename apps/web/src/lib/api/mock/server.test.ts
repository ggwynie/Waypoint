import { ApiError } from "../types";
import { createMockApi, resetDemoStore, setDemoSession } from "./server";

/* The demo API stands in for FastAPI; these tests pin the contract the UI relies on
 * (feed order, item shape, failure rules). */

const api = createMockApi();

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  localStorage.clear();
  window.history.replaceState(null, "", "/");
  resetDemoStore(true);
  setDemoSession({ email: "rani@example.com", name: "Rani Putri" });
});
afterEach(() => vi.useRealTimers());

const run = <T,>(p: Promise<T>) => {
  vi.advanceTimersByTime(300);
  return p;
};

describe("feed", () => {
  it("returns five fit parts in Fit-part order that sum to fit", async () => {
    const feed = await run(api.getFeed());
    for (const x of feed) {
      expect(x.fit_parts.map((p) => p.key)).toEqual(["major", "match", "distance", "prep_time", "trust"]);
      expect(Math.round(x.fit_parts.reduce((a, p) => a + p.points, 0))).toBe(x.fit);
    }
  });

  it("orders in-radius eligible items first, then outside the radius, then ineligible", async () => {
    await run(api.patchMe({ radius_km: 3 }));
    const feed = await run(api.getFeed());
    const group = (x: (typeof feed)[number]) => (!x.eligible ? 2 : x.in_radius ? 0 : 1);
    const groups = feed.map(group);
    expect([...groups].sort()).toEqual(groups);
    expect(groups).toContain(1);
    const ineligible = feed.find((x) => x.id === "i2");
    expect(ineligible?.eligible).toBe(false);
    expect(ineligible?.block_reason).toBe("For semester 7 and up. You are in semester 6.");
  });

  it("drops on-site items beyond the radius with radius_only", async () => {
    await run(api.patchMe({ radius_km: 3, fallback_mode: "radius_only" }));
    const feed = await run(api.getFeed());
    expect(feed.every((x) => x.in_radius)).toBe(true);
  });

  it("filters by category and query", async () => {
    const seminars = await run(api.getFeed({ category: "seminar" }));
    expect(seminars.every((x) => x.category === "seminar")).toBe(true);
    const q = await run(api.getFeed({ q: "hackathon" }));
    expect(q.map((x) => x.id)).toEqual(["c1"]);
  });

  it("fails with a retryable error in ?demo=error mode", async () => {
    window.history.replaceState(null, "", "/feed?demo=error");
    await expect(run(api.getFeed())).rejects.toBeInstanceOf(ApiError);
  });

  it("rejects calls without a session (401) and before setup (404 profile_missing)", async () => {
    setDemoSession(null);
    await expect(run(api.getMe())).rejects.toMatchObject({ status: 401 });
    setDemoSession({ email: "new@example.com", name: "New" });
    resetDemoStore(false);
    await expect(run(api.getMe())).rejects.toMatchObject({ code: "profile_missing" });
  });
});

describe("profile", () => {
  it("validates radius and looking_for (422)", async () => {
    await expect(run(api.patchMe({ radius_km: 0 }))).rejects.toMatchObject({ status: 422, code: "validation_failed" });
    await expect(run(api.patchMe({ looking_for: [] }))).rejects.toMatchObject({ status: 422 });
  });

  it("delete requires the account email", async () => {
    await expect(run(api.deleteMe("someone@else.com"))).rejects.toMatchObject({ status: 422 });
    await run(api.deleteMe("RANI@example.com"));
    await expect(run(api.getMe())).rejects.toMatchObject({ status: 401 });
  });
});

describe("save, reminders, not relevant", () => {
  it("creates only reminder offsets that are still ahead", async () => {
    await run(api.save("c2")); // 2 days left: only the 1-day reminder
    const rows = (await run(api.getReminders())).filter((r) => r.opportunity_id === "c2");
    expect(new Set(rows.map((r) => r.offset_days))).toEqual(new Set([1]));
  });

  it("unsave removes the item and its reminders", async () => {
    await run(api.unsave("i1"));
    expect((await run(api.getSaved())).some((s) => s.opportunity.id === "i1")).toBe(false);
    expect((await run(api.getReminders())).some((r) => r.opportunity_id === "i1")).toBe(false);
  });

  it("saving an unknown listing is 404", async () => {
    await expect(run(api.save("nope"))).rejects.toMatchObject({ status: 404 });
  });

  it("not relevant hides the card and lowers that tag; undo restores it", async () => {
    await run(api.feedback("s1", "not_relevant"));
    expect((await run(api.getFeed())).some((x) => x.id === "s1")).toBe(false);
    const me = await run(api.getMe());
    expect(me.learned.find((l) => l.tag === "data")?.weight).toBeCloseTo(0.8, 2);
    await run(api.feedback("s1", "undo_not_relevant"));
    expect((await run(api.getFeed())).some((x) => x.id === "s1")).toBe(true);
  });
});
