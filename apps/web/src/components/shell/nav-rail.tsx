"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookmarkIcon, CalendarIcon, CompassIcon, ListIcon, PinIcon, PulseIcon } from "@/components/ui/icons";

const ITEMS = [
  { href: "/home", label: "Dashboard", Icon: PulseIcon },
  { href: "/feed", label: "All opportunities", Icon: ListIcon },
  { href: "/saved", label: "Saved", Icon: BookmarkIcon },
  { href: "/reminders", label: "Reminders", Icon: CalendarIcon },
  { href: "/radius", label: "Radius and location", Icon: PinIcon },
];

/** Left nav rail, 72 px. Turns into a top bar on narrow screens. */
export function NavRail({ initials }: { initials: string }) {
  const path = usePathname();
  return (
    <nav
      aria-label="Main"
      className="glass box-border flex shrink-0 flex-row items-center gap-3 rounded-[20px] px-4 py-2 max-[760px]:w-full max-[760px]:overflow-x-auto min-[761px]:w-[72px] min-[761px]:flex-col min-[761px]:px-0 min-[761px]:py-4"
    >
      <Link
        href="/home"
        aria-label="Waypoint home"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-btn text-[var(--on-grad)] min-[761px]:mb-3"
        style={{ background: "var(--grad-logo)", boxShadow: "var(--logo-shadow)" }}
      >
        <CompassIcon size={24} />
      </Link>
      {ITEMS.map(({ href, label, Icon }) => {
        const on = path === href;
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            title={label}
            aria-current={on ? "page" : undefined}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-btn border"
            style={on ? { background: "var(--navOn)", borderColor: "var(--line)", color: "var(--link)" } : { background: "transparent", borderColor: "transparent", color: "var(--muted)" }}
          >
            <Icon size={22} />
          </Link>
        );
      })}
      <div className="flex-1" />
      <Link
        href="/profile"
        aria-label="Profile"
        title="Profile"
        aria-current={path === "/profile" ? "page" : undefined}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold text-[var(--on-grad)] no-underline"
        style={{ background: "var(--grad-avatar)", borderColor: path === "/profile" ? "var(--link)" : "transparent" }}
      >
        {initials}
      </Link>
    </nav>
  );
}
