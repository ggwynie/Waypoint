"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookmarkIcon, CalendarIcon, CompassIcon, ListIcon, PinIcon, PulseIcon } from "@/components/ui/icons";

const ITEMS = [
  { href: "/home", label: "Home", title: "Dashboard", Icon: PulseIcon },
  { href: "/feed", label: "Feed", title: "All opportunities", Icon: ListIcon },
  { href: "/saved", label: "Saved", title: "Saved", Icon: BookmarkIcon },
  { href: "/reminders", label: "Reminders", title: "Reminders", Icon: CalendarIcon },
  { href: "/radius", label: "Radius", title: "Radius and location", Icon: PinIcon },
];

/* Every item is icon + label (nav-label-icon), with hover, pressed and current states that differ
 * by more than colour: the current page also gets a filled pill and an indicator bar. */
const ITEM =
  "nav-item group relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-btn border no-underline transition-[background-color,border-color,color,transform] duration-200 active:scale-95 " +
  "max-[760px]:h-14 max-[760px]:flex-1 min-[761px]:h-[60px] min-[761px]:w-[60px]";

function itemStyle(on: boolean) {
  return on
    ? { background: "var(--navOn)", borderColor: "var(--line)", color: "var(--link)" }
    : { background: "transparent", borderColor: "transparent", color: "var(--muted)" };
}

function Indicator({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute rounded-pill bg-link max-[760px]:bottom-[-5px] max-[760px]:left-1/2 max-[760px]:h-[3px] max-[760px]:w-5 max-[760px]:-translate-x-1/2 min-[761px]:top-1/2 min-[761px]:left-[-6px] min-[761px]:h-6 min-[761px]:w-[3px] min-[761px]:-translate-y-1/2"
    />
  );
}

/** Left nav rail, 72 px; a top tab bar below 760 px. */
export function NavRail({ initials }: { initials: string }) {
  const path = usePathname();
  const profileOn = path === "/profile";
  return (
    <nav
      aria-label="Main"
      className="glass box-border flex shrink-0 flex-row items-center gap-1 rounded-[20px] p-1.5 max-[760px]:w-full min-[761px]:sticky min-[761px]:top-6 min-[761px]:h-[calc(100vh-48px)] min-[761px]:overflow-y-auto min-[761px]:w-[72px] min-[761px]:flex-col min-[761px]:self-start min-[761px]:gap-2 min-[761px]:px-0 min-[761px]:py-4"
    >
      <span
        aria-hidden="true"
        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-field text-[var(--on-grad)] min-[761px]:flex"
        style={{ background: "var(--grad-logo)" }}
      >
        <CompassIcon size={22} />
      </span>
      <span aria-hidden="true" className="hidden h-px w-8 bg-line2 min-[761px]:mt-1 min-[761px]:mb-1 min-[761px]:block" />

      {ITEMS.map(({ href, label, title, Icon }) => {
        const on = path === href;
        return (
          <Link key={href} href={href} title={title} aria-current={on ? "page" : undefined} className={ITEM} style={itemStyle(on)}>
            <Indicator on={on} />
            <Icon size={22} />
            <span className={`max-w-full truncate text-[11px] leading-none max-[760px]:text-[10px] max-[760px]:tracking-[-0.2px] ${on ? "font-bold" : "font-semibold"}`}>{label}</span>
          </Link>
        );
      })}

      <div className="hidden flex-1 min-[761px]:block" />
      <Link href="/profile" title="Profile" aria-current={profileOn ? "page" : undefined} className={ITEM} style={itemStyle(profileOn)}>
        <Indicator on={profileOn} />
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-bold text-[var(--on-grad)]"
          style={{ background: "var(--grad-avatar)", borderColor: profileOn ? "var(--link)" : "transparent" }}
          aria-hidden="true"
        >
          {initials}
        </span>
        <span className={`text-[11px] leading-none max-[760px]:text-[10px] max-[760px]:tracking-[-0.2px] ${profileOn ? "font-bold" : "font-semibold"}`}>Profile</span>
      </Link>
    </nav>
  );
}
