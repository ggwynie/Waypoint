"use client";

import { useCallback, useMemo } from "react";
import type { Reminder } from "@/lib/api";
import { formatDay } from "@/lib/format";
import { useMe, useRefData } from "./queries";

/** Names and labels derived from the profile and reference lists. */
export function useProfileView() {
  const me = useMe();
  const ref = useRefData();
  const m = me.data;
  const major = ref.majors.data?.find((x) => x.id === m?.major_id);
  const campus = ref.campuses.data?.find((x) => x.id === m?.campus_id);
  const district = ref.districts.data?.find((x) => x.code === m?.home_district_code);
  const tagData = ref.tags.data;
  const tags = useMemo(() => tagData ?? [], [tagData]);
  const labelOf = useCallback((slug: string) => tags.find((t) => t.slug === slug)?.label ?? slug.replace(/_/g, " "), [tags]);
  return {
    me: m,
    majorName: major?.name ?? "",
    campus,
    district,
    originWord: (m?.distance_origin ?? "home") as "home" | "campus",
    labelOf,
    tags,
    ref,
  };
}

/** Next scheduled reminder date for an opportunity, or "none left". */
export function nextReminder(reminders: Reminder[] | undefined, opportunityId: string) {
  const next = reminders?.filter((r) => r.opportunity_id === opportunityId && r.status === "scheduled").sort((a, b) => a.due_on.localeCompare(b.due_on))[0];
  return next ? formatDay(`${next.due_on}T12:00:00+07:00`) : "none left";
}
