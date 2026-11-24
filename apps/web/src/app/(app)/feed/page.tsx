"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { OpportunityCard } from "@/components/feed/opportunity-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { CategoryTab } from "@/components/ui/chips";
import { GlassPanel } from "@/components/ui/glass-panel";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/states";
import { CATEGORIES, category as categorySchema, isDemo, type Category, type FeedItem } from "@/lib/api";
import { CAT } from "@/lib/categories";
import { useProfileView } from "@/lib/hooks/profile";
import { useFeed, useNotRelevant, useToggleSave, useWaking } from "@/lib/hooks/queries";

export default function FeedPage() {
  return (
    <Suspense>
      <Feed />
    </Suspense>
  );
}

function Feed() {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const parsed = categorySchema.safeParse(params.get("category"));
  const cat: Category | undefined = parsed.success ? parsed.data : undefined;
  const q = params.get("q") ?? "";
  const [open, setOpen] = useState<string | null>(params.get("open"));
  const [hidden, setHidden] = useState<FeedItem | null>(null);

  const { me, originWord, labelOf } = useProfileView();
  const feed = useFeed({ category: cat, q });
  const waking = useWaking(feed.isPending);
  const save = useToggleSave();
  const notRelevant = useNotRelevant();

  // Apply ?open= once per link, after the cards exist; later refetches must not reopen or scroll.
  const applied = useRef<string | null>(null);
  const hasData = !!feed.data;
  useEffect(() => {
    const id = params.get("open");
    if (!id || !hasData || applied.current === id) return;
    applied.current = id;
    setOpen(id);
    const t = setTimeout(() => document.getElementById(`card-${id}`)?.scrollIntoView({ block: "center" }), 50);
    return () => clearTimeout(t);
  }, [params, hasData]);

  if (!me) return <LoadingBlock waking={waking} rows={3} label="Loading opportunities" />;

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (v) next.set(k, v);
    else next.delete(k);
    next.delete("open");
    router.replace(`${path}${next.toString() ? `?${next}` : ""}`);
  };

  const items = feed.data ?? [];
  const inCount = items.filter((x) => x.eligible && x.in_radius).length;
  const tag = hidden?.topic_tags[0];
  const weight = tag ? me.learned.find((l) => l.tag === tag)?.weight : undefined;

  return (
    <GlassPanel aria-label="All opportunities" className="gap-[18px] p-7 max-[760px]:p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 font-heading text-[34px] tracking-[-1px]">All opportunities</h1>
          <div className="mt-1.5 text-sm text-muted2">
            {feed.data
              ? `${inCount} open to you within ${me.radius_km} km of ${originWord} or online · ${items.length - inCount} more listed after them`
              : "Loading your ranked feed"}
          </div>
        </div>
        <div className="rounded-sm bg-chip px-3 py-1.5 text-[13px] text-ink2">Highest Fit first, then outside your radius, then not open to you</div>
      </div>

      <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2.5">
        <CategoryTab label="All you look for" on={!cat} onPick={() => setParam("category", null)} />
        {CATEGORIES.map((c) => (
          <CategoryTab key={c} label={CAT[c].name} category={c} on={cat === c} onPick={() => setParam("category", c)} />
        ))}
      </div>

      {q && (
        <div className="flex items-center gap-3 text-sm text-ink2">
          Matching “{q}”
          <Button size="sm" onClick={() => setParam("q", null)}>
            Clear search
          </Button>
        </div>
      )}

      {hidden && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-btn border border-line bg-chip px-4 py-3 text-sm">
          <span>
            Hidden “{hidden.title}”.
            {tag && weight !== undefined && ` Its topic “${labelOf(tag)}” now counts ×${weight.toFixed(2)} in your Fit and recovers over two weeks.`}
          </span>
          <button
            type="button"
            onClick={() => {
              notRelevant.mutate({ item: hidden, undo: true });
              setHidden(null);
            }}
            className="h-9 shrink-0 cursor-pointer rounded-sm border bg-transparent px-3.5 font-[inherit] font-semibold text-link"
            style={{ borderColor: "var(--cat-internship)" }}
          >
            Undo
          </button>
        </div>
      )}

      {feed.isPending ? (
        <LoadingBlock waking={waking} rows={3} label="Loading opportunities" />
      ) : feed.isError ? (
        <ErrorState text="Couldn't load opportunities." onRetry={() => feed.refetch()} retrying={feed.isFetching} />
      ) : items.length === 0 ? (
        q || cat ? (
          <EmptyState
            title="Nothing matches here"
            text="Clear the search, pick another category, or widen your radius."
            action={
              <div className="flex flex-wrap gap-2.5">
                {q && (
                  <Button variant="primary" onClick={() => setParam("q", null)}>
                    Clear search
                  </Button>
                )}
                <ButtonLink href="/radius" variant={q ? "ghost" : "primary"}>Adjust radius</ButtonLink>
              </div>
            }
          />
        ) : (
          <EmptyState
            title="Nothing matches"
            text="Widen your radius or pick more types."
            action={
              <div className="flex flex-wrap gap-2.5">
                <ButtonLink href="/radius" variant="primary">Widen your radius</ButtonLink>
                <ButtonLink href="/profile" variant="ghost">Pick more types</ButtonLink>
              </div>
            }
          />
        )
      ) : (
        <>
          {inCount === 0 && <div className="inset rounded-field px-3 py-2.5 text-[13px] text-ink2">Nothing within {me.radius_km} km. Online items and farther ones are below.</div>}
          <div className="grid items-start gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(380px, 100%), 1fr))" }}>
            {items.map((x) => (
              <div key={x.id} id={`card-${x.id}`} className="min-w-0 scroll-mt-6">
                <OpportunityCard
                  item={x}
                  origin={originWord}
                  labelOf={labelOf}
                  open={open === x.id}
                  onToggleOpen={() => setOpen(open === x.id ? null : x.id)}
                  onToggleSave={() => save.mutate({ item: x, save: !x.is_saved })}
                  onHide={() => {
                    setHidden(x);
                    notRelevant.mutate({ item: x });
                  }}
                />
              </div>
            ))}
          </div>
        </>
      )}
      <div className="text-xs text-faint">
        {isDemo ? "Demo data for UI illustration only. " : ""}Items beyond your radius have a dashed border and come after everything within range.
      </div>
    </GlassPanel>
  );
}
