import type { Reminder } from "./api/types";
import { hasUnread, todayWibIso } from "./unread";

const r = (p: Partial<Reminder>): Reminder => ({ id: "x", opportunity_id: "o", offset_days: 7, due_on: "2026-11-24", channel: "in_app", status: "sent", ...p });

describe("hasUnread", () => {
  it("is true for a sent in-app reminder never seen", () => {
    expect(hasUnread([r({})], null)).toBe(true);
  });
  it("is false once Reminders was opened on or after that day", () => {
    expect(hasUnread([r({ due_on: "2026-11-24" })], "2026-11-24")).toBe(false);
    expect(hasUnread([r({ due_on: "2026-11-25" })], "2026-11-24")).toBe(true);
  });
  it("ignores email and unsent reminders", () => {
    expect(hasUnread([r({ channel: "email" }), r({ status: "scheduled" }), r({ status: "cancelled" })], null)).toBe(false);
  });
});

describe("todayWibIso", () => {
  it("rolls over at midnight WIB, not UTC", () => {
    expect(todayWibIso(Date.parse("2026-11-24T16:59:00Z"))).toBe("2026-11-24");
    expect(todayWibIso(Date.parse("2026-11-24T17:00:00Z"))).toBe("2026-11-25");
  });
});
