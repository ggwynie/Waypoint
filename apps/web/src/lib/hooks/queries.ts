"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api, ApiError, type FeedItem, type FeedQuery, type MePatch, type SavedItem, type SavedPatch } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { formatDay } from "@/lib/format";

export const keys = {
  me: ["me"] as const,
  feed: (q?: FeedQuery) => ["feed", q?.category ?? "all", q?.q ?? ""] as const,
  saved: ["saved"] as const,
  reminders: ["reminders"] as const,
  ref: (name: string) => ["ref", name] as const,
};

const retry = (count: number, err: unknown) => !(err instanceof ApiError && err.status < 500 && err.status !== 0) && count < 1;

export const useMe = () => useQuery({ queryKey: keys.me, queryFn: () => api.getMe(), retry });
export const useFeed = (q?: FeedQuery) => useQuery({ queryKey: keys.feed(q), queryFn: () => api.getFeed(q), retry });
export const useSaved = () => useQuery({ queryKey: keys.saved, queryFn: () => api.getSaved(), retry });
export const useReminders = () => useQuery({ queryKey: keys.reminders, queryFn: () => api.getReminders(), retry });

export function useRefData() {
  const opts = { staleTime: Infinity, retry } as const;
  return {
    majors: useQuery({ queryKey: keys.ref("majors"), queryFn: () => api.majors(), ...opts }),
    campuses: useQuery({ queryKey: keys.ref("campuses"), queryFn: () => api.campuses(), ...opts }),
    districts: useQuery({ queryKey: keys.ref("districts"), queryFn: () => api.districts(), ...opts }),
    tags: useQuery({ queryKey: keys.ref("tags"), queryFn: () => api.tags(), ...opts }),
  };
}

/** "Waking the server" notice after 3 s of waiting. */
export function useWaking(pending: boolean) {
  const [waking, setWaking] = useState(false);
  useEffect(() => {
    if (!pending) {
      setWaking(false);
      return;
    }
    const t = setTimeout(() => setWaking(true), 3000);
    return () => clearTimeout(t);
  }, [pending]);
  return waking;
}

export function usePatchMe() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (body: MePatch) => api.patchMe(body),
    onSuccess: (me) => {
      qc.setQueryData(keys.me, me);
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: keys.saved });
      qc.invalidateQueries({ queryKey: keys.reminders });
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : "Couldn't save that change. Try again."),
  });
}

function setSavedFlag(qc: ReturnType<typeof useQueryClient>, id: string, value: boolean) {
  qc.setQueriesData<FeedItem[]>({ queryKey: ["feed"] }, (list) => list?.map((x) => (x.id === id ? { ...x, is_saved: value } : x)));
  if (!value) qc.setQueryData<SavedItem[]>(keys.saved, (list) => list?.filter((s) => s.opportunity.id !== id));
}

/** Save / unsave with optimistic update and Undo. */
export function useToggleSave() {
  const qc = useQueryClient();
  const toast = useToast();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: keys.saved });
    qc.invalidateQueries({ queryKey: keys.reminders });
    qc.invalidateQueries({ queryKey: ["feed"] });
  };
  const m = useMutation({
    mutationFn: ({ item, save }: { item: FeedItem; save: boolean }) => (save ? api.save(item.id) : api.unsave(item.id)),
    onMutate: ({ item, save }) => setSavedFlag(qc, item.id, save),
    onError: (e, { item, save }) => {
      if (e instanceof ApiError && e.status === 409) return refresh();
      if (e instanceof ApiError && (e.status === 404 || e.status === 410)) {
        toast("This listing has closed.");
        return refresh();
      }
      setSavedFlag(qc, item.id, !save);
      toast(save ? "Couldn't save. Retry." : "Couldn't remove it. Retry.", { label: "Retry", run: () => m.mutate({ item, save }) });
    },
    onSuccess: (_d, { item, save }) => {
      refresh();
      const undo = { label: "Undo", run: () => m.mutate({ item, save: !save }) };
      if (!save) return toast(`Removed “${item.title}”.`, undo);
      const offsets = [7, 3, 1].filter((o) => item.days_left >= o);
      if (!offsets.length) return toast("Closes today, no reminder scheduled.", undo);
      const first = new Date(Date.parse(item.registration_deadline) - offsets[0] * 86_400_000);
      toast(`Saved. First reminder on ${formatDay(first)}.`, undo);
    },
  });
  return m;
}

/** Not relevant with Undo. */
export function useNotRelevant() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ item, undo }: { item: FeedItem; undo?: boolean }) => api.feedback(item.id, undo ? "undo_not_relevant" : "not_relevant"),
    onMutate: async ({ item, undo }) => {
      await qc.cancelQueries({ queryKey: ["feed"] });
      const snapshot = qc.getQueriesData<FeedItem[]>({ queryKey: ["feed"] });
      if (!undo) qc.setQueriesData<FeedItem[]>({ queryKey: ["feed"] }, (list) => list?.filter((x) => x.id !== item.id));
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snapshot.forEach(([k, v]) => qc.setQueryData(k, v));
      toast("Couldn't update your feed. Try again.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: keys.me });
    },
  });
}

export function usePatchSaved() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SavedPatch }) => api.patchSaved(id, body),
    onMutate: ({ id, body }) => {
      const prev = qc.getQueryData<SavedItem[]>(keys.saved);
      qc.setQueryData<SavedItem[]>(keys.saved, (list) => list?.map((s) => (s.opportunity.id === id ? { ...s, ...body } : s)));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(keys.saved, ctx?.prev);
      toast("Couldn't save your answer. Try again.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.reminders }),
  });
}

export function useResetLearned() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: () => api.resetLearned(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.me });
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast("Every topic is back to full weight.");
    },
    onError: () => toast("Couldn't reset. Try again."),
  });
}
