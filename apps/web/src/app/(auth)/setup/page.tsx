"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { OriginFields } from "@/components/shell/location-fields";
import { Button } from "@/components/ui/button";
import { ToggleChip } from "@/components/ui/chips";
import { RadioCards, RadiusControl, Select, Stepper } from "@/components/ui/form";
import { api, ApiError, CATEGORIES, type Category, type DistanceOrigin, type FallbackMode } from "@/lib/api";
import { currentSession } from "@/lib/auth";
import { CAT } from "@/lib/categories";
import { keys, useMe, useRefData } from "@/lib/hooks/queries";
import { useTheme } from "@/lib/theme";

const CONSENT_VERSION = "2026-11-v1";
const DRAFT_KEY = "wp-setup-draft";
const STEPS: [string, string][] = [
  ["About you", "We use your major and semester to check who can join."],
  ["Looking for", "Pick the types you want to see. You can change this any time."],
  ["Interests and skills", "These two drive 30 of the 100 Fit points."],
  ["Location and radius", "Distance counts 20 points. Measure it from home or from campus."],
];

type Draft = {
  major_id: number;
  semester: number;
  campus_id: number;
  looking_for: Category[];
  tags: string[];
  distance_origin: DistanceOrigin;
  home_district_code: string;
  radius_km: number;
  fallback_mode: FallbackMode;
  consent: boolean;
};
const EMPTY: Draft = { major_id: 1, semester: 5, campus_id: 1, looking_for: [...CATEGORIES], tags: [], distance_origin: "home", home_district_code: "pademangan", radius_km: 25, fallback_mode: "online_first", consent: false };

type Stored = { owner: string; step: number; draft: Partial<Draft> };

/** Answers and the current step survive a reload (R1.2), only for the account that wrote them. */
function loadDraft(owner: string): { step: number; draft: Draft } | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Stored;
    if (s.owner !== owner) return null;
    return { step: Math.min(4, Math.max(1, s.step || 1)), draft: { ...EMPTY, ...s.draft } };
  } catch {
    return null;
  }
}
function saveDraft(owner: string, step: number, draft: Draft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ owner, step, draft } satisfies Stored));
  } catch {
    /* storage blocked: answers last for this page view */
  }
}

export default function SetupPage() {
  return (
    <Suspense>
      <Setup />
    </Suspense>
  );
}

function Setup() {
  const router = useRouter();
  const qc = useQueryClient();
  const params = useSearchParams();
  const ref = useRefData();
  const me = useMe();
  const { theme } = useTheme();
  const [step, setStep] = useState(1);
  const [d, setD] = useState<Draft>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const owner = currentSession()?.email ?? "";
  const redo = !!params.get("redo");

  useEffect(() => {
    if (!currentSession()) return router.replace("/login");
    const saved = loadDraft(currentSession()!.email);
    if (saved) {
      setD(saved.draft);
      setStep(saved.step);
      setTouched(true);
    }
  }, [router]);

  // Redo setup: start from the current profile unless a draft was restored.
  useEffect(() => {
    if (!redo || !me.data || touched) return;
    const m = me.data;
    setD({ ...EMPTY, major_id: m.major_id, semester: m.semester, campus_id: m.campus_id ?? 1, looking_for: m.looking_for, tags: m.tags, distance_origin: m.distance_origin, home_district_code: m.home_district_code ?? EMPTY.home_district_code, radius_km: m.radius_km, fallback_mode: m.fallback_mode, consent: !!m.consent_version });
  }, [redo, me.data, touched]);

  const update = (patch: Partial<Draft>) => {
    setTouched(true);
    setD((cur) => {
      const next = { ...cur, ...patch };
      saveDraft(owner, step, next);
      return next;
    });
  };
  const goStep = (n: number) => {
    setTouched(true);
    setStep(n);
    saveDraft(owner, n, d);
  };
  const cancelRedo = () => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    router.push("/profile");
  };

  const lookingNone = d.looking_for.length === 0;
  const campus = ref.campuses.data?.find((c) => c.id === d.campus_id);
  const district = ref.districts.data?.find((x) => x.code === d.home_district_code);
  const origin = d.distance_origin === "home" ? district : campus;
  const anchor = campus ? { lat: campus.lat, lng: campus.lng } : { lat: 0, lng: 0 };
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  async function finish() {
    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      const body = {
        major_id: d.major_id,
        semester: d.semester,
        campus_id: d.campus_id,
        looking_for: d.looking_for,
        tags: d.tags,
        distance_origin: d.distance_origin,
        home_district_code: d.home_district_code,
        radius_km: d.radius_km,
        fallback_mode: d.fallback_mode,
        // The theme on screen now (system or picked) becomes profiles.theme.
        theme,
      };
      const profile = await api.putMe({ ...body, consent_version: CONSENT_VERSION, display_name: currentSession()?.name });
      qc.setQueryData(keys.me, profile);
      qc.invalidateQueries({ queryKey: ["feed"] });
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      router.push("/home");
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) {
        const fe: Record<string, string> = {};
        for (const x of e.details as { field?: string; message?: string }[]) if (x.field && x.message) fe[x.field] = x.message;
        setFieldErrors(fe);
        setError(e.message);
      } else if (e instanceof ApiError && e.status !== 0 && e.status < 500) {
        setError(e.message);
      } else {
        setError("Saved on this device. We'll finish when you're back online.");
      }
    } finally {
      setBusy(false);
    }
  }

  const next = () => {
    if (step === 2 && lookingNone) return;
    if (step === 4) return void finish();
    goStep(step + 1);
  };

  return (
    <AuthShell
      preview={{
        title: step === 4 ? "Your radius, live" : "Your map so far",
        sub: step === 4 ? "Move the slider or switch to home and the city recolours." : "Your feed is ranked the moment you finish setup.",
        radiusKm: d.radius_km,
        anchor,
        origin: origin ? { lat: origin.lat, lng: origin.lng } : anchor,
        originKind: d.distance_origin,
        homeLabel: district?.name,
      }}
    >
      <div className="flex max-w-[560px] flex-col gap-[18px]">
        <Stepper steps={STEPS.map((s) => s[0])} current={step} />
        <div>
          <h1 className="m-0 font-heading text-[32px] tracking-[-1px]">{STEPS[step - 1][0]}</h1>
          <div className="mt-1.5 text-[15px] text-muted2">{STEPS[step - 1][1]}</div>
        </div>

        {step === 1 && (
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <Select label="Major" value={String(d.major_id)} onChange={(e) => update({ major_id: Number(e.target.value) })} options={(ref.majors.data ?? []).map((m) => ({ value: String(m.id), label: m.name }))} />
            <Select label="Semester" value={String(d.semester)} onChange={(e) => update({ semester: Number(e.target.value) })} options={Array.from({ length: 14 }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` }))} />
            <Select label="Campus" value={String(d.campus_id)} onChange={(e) => update({ campus_id: Number(e.target.value) })} options={(ref.campuses.data ?? []).map((c) => ({ value: String(c.id), label: c.name }))} />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-2.5">
            <div className="text-[15px] font-bold">I am looking for</div>
            <div role="group" aria-label="Opportunity types" className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <ToggleChip key={c} label={CAT[c].name} category={c} on={d.looking_for.includes(c)} onToggle={() => update({ looking_for: toggle(d.looking_for, c) })} />
              ))}
            </div>
            {(lookingNone || fieldErrors.looking_for) && (
              <div role="alert" className="text-[13px] text-warn">
                Pick at least one type.
              </div>
            )}
          </div>
        )}

        {step === 3 &&
          (["interest", "skill"] as const).map((kind) => (
            <div key={kind} className="flex flex-col gap-2.5">
              <div className="text-[15px] font-bold">
                {kind === "interest" ? "Interests" : "Skills"}
                {kind === "skill" && <span className="font-normal text-muted"> · matched against what each listing asks for</span>}
              </div>
              <div role="group" aria-label={kind === "interest" ? "Interests" : "Skills"} className="flex flex-wrap gap-2">
                {(ref.tags.data ?? []).filter((t) => t.kind === kind).map((t) => (
                  <ToggleChip key={t.slug} label={t.label} on={d.tags.includes(t.slug)} onToggle={() => update({ tags: toggle(d.tags, t.slug) })} />
                ))}
              </div>
            </div>
          ))}

        {step === 4 && (
          <>
            <RadiusControl value={d.radius_km} onChange={(radius_km) => update({ radius_km })} />
            {fieldErrors.radius_km && <div role="alert" className="-mt-2 text-[13px] text-warn">{fieldErrors.radius_km}</div>}
            <OriginFields origin={d.distance_origin} districtCode={d.home_district_code} campus={campus} districts={ref.districts.data ?? []} onOrigin={(distance_origin) => update({ distance_origin })} onDistrict={(home_district_code) => update({ home_district_code })} />
            <RadioCards
              label="If nothing is within range, show me"
              legend={<div className="text-sm font-semibold">If nothing is within range, show me</div>}
              value={d.fallback_mode}
              onChange={(fallback_mode) => update({ fallback_mode })}
              options={[
                { value: "online_first", title: "Online first", sub: "Then the rest beyond your radius, by Fit" },
                { value: "nearest_first", title: "Nearest first", sub: `Beyond ${d.radius_km} km, closest first` },
                { value: "radius_only", title: "Only within my radius", sub: "Hide everything farther" },
              ]}
            />
            <div className="inset flex flex-col gap-2 rounded-btn px-3.5 py-3 text-sm leading-normal">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={d.consent} onChange={(e) => update({ consent: e.target.checked })} className="mt-0.5 h-5 w-5 shrink-0" style={{ accentColor: "var(--cat-internship)" }} />
                <span>I agree that Waypoint stores my major, semester, campus, district, interests and skills to rank opportunities for me.</span>
              </label>
              <details className="pl-8">
                <summary className="cursor-pointer font-semibold text-link">What we store and why</summary>
                <ul className="mt-2 mb-0 flex list-disc flex-col gap-1 pl-4 text-[13px] text-muted">
                  <li>Major and semester: to check who can join each listing.</li>
                  <li>Campus and home district: to measure distance. Only the district, never a street address or GPS. Never shown to others.</li>
                  <li>Interests and skills: to score how well a listing matches you.</li>
                  <li>Saved items, reminders and Not relevant clicks: to remind you and tune your feed.</li>
                  <li>You can edit all of it in Profile, or delete your account there at any time.</li>
                </ul>
              </details>
            </div>
          </>
        )}

        {error && (
          <div role="alert" className="text-[13px] text-warn">
            {error}
          </div>
        )}
        <div className="mt-1 flex flex-wrap gap-2.5">
          {redo && step === 1 && (
            <Button size="lg" variant="quiet" onClick={cancelRedo}>
              Cancel
            </Button>
          )}
          {step > 1 && (
            <Button size="lg" onClick={() => goStep(step - 1)}>
              Back
            </Button>
          )}
          <Button variant="primary" size="lg" className="flex-1" onClick={next} loading={busy} disabled={(step === 2 && lookingNone) || (step === 4 && !d.consent)}>
            {step === 4 ? "Finish setup" : "Continue"}
          </Button>
        </div>
        {step === 4 && !d.consent && <div className="-mt-2 text-xs text-muted">Tick the agreement above to finish setup.</div>}
      </div>
    </AuthShell>
  );
}
