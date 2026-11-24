"use client";

import { usePathname, useRouter } from "next/navigation";
import { hasUnread, markSeen, readSeen } from "@/lib/unread";
import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import { Header } from "@/components/shell/header";
import { NavRail } from "@/components/shell/nav-rail";
import { HowFitDialog } from "@/components/ui/how-fit-dialog";
import { ErrorState, LoadingBlock } from "@/components/ui/states";
import { ApiError } from "@/lib/api";
import { currentSession } from "@/lib/auth";
import { useMe, useReminders, useWaking } from "@/lib/hooks/queries";
import { initialsOf } from "@/lib/format";
import { useTheme } from "@/lib/theme";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [howFit, setHowFit] = useState(false);
  const closeHowFit = useCallback(() => setHowFit(false), []);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const me = useMe();
  const reminders = useReminders();
  const waking = useWaking(me.isPending);
  const { theme, setTheme } = useTheme();
  const path = usePathname();
  const [seenOn, setSeenOn] = useState<string | null>(null);

  // Opening Reminders marks today's in-app reminders as seen.
  useEffect(() => {
    if (path === "/reminders") markSeen();
    setSeenOn(readSeen());
  }, [path]);

  useEffect(() => {
    const ok = !!currentSession();
    setHasSession(ok);
    if (!ok) router.replace("/login");
  }, [router]);

  useEffect(() => {
    const e = me.error;
    if (e instanceof ApiError && e.status === 401) router.replace("/login");
    if (e instanceof ApiError && e.code === "profile_missing") router.replace("/setup");
  }, [me.error, router]);

  // profiles.theme wins once signed in.
  useEffect(() => {
    if (me.data && me.data.theme !== theme) setTheme(me.data.theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.data?.theme]);

  if (hasSession === false) return null;

  const unread = path !== "/reminders" && hasUnread(reminders.data, seenOn);

  return (
    <div className="box-border flex min-h-screen items-stretch gap-6 p-6 max-[760px]:flex-col max-[760px]:gap-4 max-[760px]:p-4">
      <NavRail initials={me.data ? initialsOf(me.data.display_name) : ""} />
      <div className="flex min-w-0 flex-1 flex-col gap-6 max-[760px]:gap-4">
        <Suspense>
          <Header onHowFit={() => setHowFit(true)} hasUnread={unread} />
        </Suspense>
        {me.data ? (
          <main className="flex min-w-0 flex-col gap-6">{children}</main>
        ) : me.isError && !(me.error instanceof ApiError && (me.error.status === 401 || me.error.code === "profile_missing")) ? (
          <ErrorState text="Couldn't load your profile." onRetry={() => me.refetch()} retrying={me.isFetching} />
        ) : (
          <LoadingBlock waking={waking} rows={2} label="Loading your profile" />
        )}
      </div>
      <HowFitDialog open={howFit} onClose={closeHowFit} />
    </div>
  );
}
