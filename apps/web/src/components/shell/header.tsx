"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BellIcon, SearchIcon } from "@/components/ui/icons";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Wordmark } from "@/components/ui/logo";
import { usePatchMe } from "@/lib/hooks/queries";

const TITLES: Record<string, string> = {
  "/home": "Dashboard",
  "/feed": "All opportunities",
  "/saved": "Saved",
  "/reminders": "Reminders",
  "/radius": "Radius & location",
  "/profile": "Profile",
};

export function Header({ onHowFit, hasUnread }: { onHowFit: () => void; hasUnread: boolean }) {
  const path = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const patch = usePatchMe();
  const urlQ = path === "/feed" ? (params.get("q") ?? "") : "";
  const [q, setQ] = useState(urlQ);
  useEffect(() => setQ(urlQ), [urlQ]);

  useEffect(() => {
    if (q === urlQ) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(path === "/feed" ? params.toString() : "");
      if (q.trim()) next.set("q", q.trim());
      else next.delete("q");
      router.replace(`/feed${next.toString() ? `?${next}` : ""}`);
    }, 250);
    return () => clearTimeout(t);
  }, [q, urlQ, path, params, router]);

  return (
    <header className="glass flex flex-wrap items-center gap-4 rounded-[20px] px-5 py-4">
      <Wordmark />
      <div className="rounded-sm bg-chip px-3 py-1.5 text-[13px] font-semibold text-ink2">{TITLES[path] ?? ""}</div>
      <label className="flex h-12 min-w-0 flex-[1_1_280px] items-center gap-2.5 rounded-btn border border-chip bg-inset px-3.5 text-muted">
        <SearchIcon size={18} />
        <span className="sr-only">Search opportunities</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search internships, seminars, calls for papers, competitions"
          className="h-11 min-w-0 flex-1 border-0 bg-transparent font-[inherit] text-[15px] text-ink outline-none"
        />
      </label>
      <button
        type="button"
        onClick={onHowFit}
        className="flex h-11 cursor-pointer items-center gap-2 rounded-btn border px-3.5 font-[inherit] text-sm font-semibold"
        style={{ borderColor: "var(--vio-line)", background: "var(--vio)", color: "var(--vioInk)" }}
      >
        <span className="h-2 w-2 rounded-full bg-ok-solid" aria-hidden="true" />
        How Fit is scored
      </button>
      <ThemeToggle onChange={(theme) => patch.mutate({ theme })} />
      <Link
        href="/reminders"
        aria-label={hasUnread ? "Notifications: open reminders, new reminders" : "Notifications: open reminders"}
        className="relative flex h-12 w-12 items-center justify-center rounded-btn border border-chip bg-inset text-ink"
      >
        <BellIcon size={20} />
        {hasUnread && <span className="absolute top-2.5 right-2.5 h-[9px] w-[9px] rounded-full bg-danger" aria-hidden="true" />}
      </Link>
    </header>
  );
}
