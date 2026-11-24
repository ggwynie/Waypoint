import { checkedAgo, formatDay, initialsOf } from "./format";

describe("checkedAgo", () => {
  const now = Date.parse("2026-11-24T10:00:00Z");
  it("uses minutes, hours and days", () => {
    expect(checkedAgo("2026-11-24T09:59:50Z", now)).toBe("Checked just now");
    expect(checkedAgo("2026-11-24T09:15:00Z", now)).toBe("Checked 45 min ago");
    expect(checkedAgo("2026-11-24T09:00:00Z", now)).toBe("Checked 1 hour ago");
    expect(checkedAgo("2026-11-24T04:00:00Z", now)).toBe("Checked 6 hours ago");
    expect(checkedAgo("2026-11-21T10:00:00Z", now)).toBe("Checked 3 days ago");
  });
  it("never shows a negative time", () => {
    expect(checkedAgo("2026-11-24T11:00:00Z", now)).toBe("Checked just now");
  });
});

describe("formatDay", () => {
  it("formats in Asia/Jakarta, not UTC", () => {
    // 2 Dec 16:59:59 UTC is 2 Dec 23:59:59 WIB; 17:00 UTC is already 3 Dec in WIB.
    expect(formatDay("2026-12-02T16:59:59Z")).toBe("2 Dec");
    expect(formatDay("2026-12-02T17:00:00Z")).toBe("3 Dec");
  });
});

describe("initialsOf", () => {
  it("takes two initials", () => {
    expect(initialsOf("Rani Putri")).toBe("RP");
    expect(initialsOf("  ana  ")).toBe("A");
  });
});
