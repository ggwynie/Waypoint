import type { Reminder } from "./api/types";

const KEY = "wp-reminders-seen";

/** In-app reminders sent after the day the student last opened Reminders (`due_on` is a WIB date). */
export function hasUnread(reminders: Reminder[] | undefined, seenOn: string | null) {
  return !!reminders?.some((r) => r.channel === "in_app" && r.status === "sent" && (!seenOn || r.due_on > seenOn));
}

/** Today's date in Asia/Jakarta as YYYY-MM-DD. */
export function todayWibIso(now = Date.now()) {
  return new Date(now + 7 * 3600_000).toISOString().slice(0, 10);
}

/* Per-device convenience only: losing it just shows the dot once more. */
export function readSeen(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
export function markSeen(day = todayWibIso()) {
  try {
    localStorage.setItem(KEY, day);
  } catch {
    /* storage blocked */
  }
}
