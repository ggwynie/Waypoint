const TZ = "Asia/Jakarta";

/** "2 Dec" in WIB. */
export function formatDay(d: Date | string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: TZ }).format(new Date(d));
}

/** Day number and short month for the reminder date block. */
export function dayParts(d: Date | string) {
  const [day, month] = formatDay(d).split(" ");
  return { day, month };
}

/** "Checked 3 hours ago" relative time for last_verified_at. */
export function checkedAgo(iso: string, now = Date.now()) {
  const mins = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (mins < 1) return "Checked just now";
  if (mins < 60) return `Checked ${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Checked ${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  return `Checked ${days} ${days === 1 ? "day" : "days"} ago`;
}

export const fmtPoints = (n: number) => (Math.round(n * 10) / 10).toString();

export function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
