"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

const FIELD =
  "box-border h-[46px] w-full rounded-field border bg-inset2 px-3.5 font-[inherit] text-[15px] text-ink";
const LABEL = "flex min-w-0 flex-col gap-1.5 text-sm font-semibold text-ink2";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <div id={id} role="alert" className="-mt-2 text-[13px] text-warn">
      {message}
    </div>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string };

/** Field: visible label, error below with role="alert". */
export function Field({ label, error, hint, className = "", ...rest }: FieldProps) {
  const id = useId();
  return (
    <>
      <label className={LABEL}>
        {label}
        <input
          {...rest}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined}
          className={`${FIELD} ${className}`}
          style={{ borderColor: error ? "var(--danger-solid)" : "var(--line)" }}
        />
      </label>
      <FieldError id={`${id}-e`} message={error} />
      {!error && hint && (
        <div id={`${id}-h`} className="-mt-2 text-xs text-muted">
          {hint}
        </div>
      )}
    </>
  );
}

export function PasswordField({ label, error, hint, ...rest }: FieldProps) {
  const [show, setShow] = useState(false);
  const id = useId();
  return (
    <>
      <label className={LABEL}>
        {label}
        <span className="relative block">
          <input
            {...rest}
            type={show ? "text" : "password"}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined}
            className={`${FIELD} pr-[84px]`}
            style={{ borderColor: error ? "var(--danger-solid)" : "var(--line)" }}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute top-1.5 right-1.5 h-[34px] cursor-pointer rounded-sm border border-line bg-inset2 px-3 font-[inherit] text-[13px] text-ink2"
          >
            {show ? "Hide" : "Show"}
          </button>
        </span>
      </label>
      <FieldError id={`${id}-e`} message={error} />
      {!error && hint && (
        <div id={`${id}-h`} className="-mt-2 text-xs text-muted">
          {hint}
        </div>
      )}
    </>
  );
}

export function Select({ label, options, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string; label: string }[] }) {
  return (
    <label className={LABEL}>
      {label}
      <select {...rest} className={`${FIELD} border-line`}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** RadiusControl: number input + slider, 1–100 km. */
export function RadiusControl({ value, onChange }: { value: number; onChange: (km: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = (raw: string) => {
    const v = Math.round(Number(raw));
    if (Number.isFinite(v) && v >= 1) onChange(Math.min(100, v));
    setDraft(null);
  };
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[15px] font-bold">Travel radius for on-site events</span>
        <span className="flex items-center gap-1.5">
          <input
            type="number"
            min={1}
            max={100}
            step={1}
            value={draft ?? value}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commit((e.target as HTMLInputElement).value)}
            aria-label="Radius in kilometers"
            className="wp-num box-border h-10 w-[76px] rounded-sm border border-line bg-inset2 px-2.5 text-right font-[inherit] text-base font-bold text-ink"
          />
          <span className="text-sm text-muted">km</span>
        </span>
      </div>
      <input type="range" min={1} max={100} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label="Radius slider" className="w-full" />
      <div className="flex justify-between gap-2 text-xs text-faint">
        <span>1 km</span>
        <span className="text-center">Default 25 km fits 10 of 14 surveyed</span>
        <span>100</span>
      </div>
    </div>
  );
}

/** RadioCards: selected = 2 px link border + selBg; role="radio" in a radiogroup. */
export function RadioCards<T extends string>({ label, value, options, onChange, columns = 1, legend }: { label: string; value: T; options: { value: T; title: string; sub: string }[]; onChange: (v: T) => void; columns?: 1 | 2; legend?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {legend}
      <div role="radiogroup" aria-label={label} className={`grid gap-2 ${columns === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              className="flex min-w-0 cursor-pointer flex-col gap-0.5 rounded-btn px-3.5 py-3 text-left font-[inherit] text-ink"
              style={{ border: on ? "2px solid var(--cat-internship)" : "1px solid var(--track)", background: on ? "var(--selBg)" : "var(--inset)" }}
            >
              <span className="text-sm font-semibold">{o.title}</span>
              <span className="truncate text-xs text-muted">{o.sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Switch: 48 × 28 track, role="switch". */
export function Switch({ label, sub, on, onToggle }: { label: string; sub: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="inset flex items-center justify-between gap-3 rounded-btn px-3.5 py-3">
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted">{sub}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onToggle}
        className="flex h-7 w-12 shrink-0 cursor-pointer rounded-pill border-0 p-[3px]"
        style={{ background: on ? "var(--cat-internship)" : "var(--swOff)", justifyContent: on ? "flex-end" : "flex-start" }}
      >
        <span className="h-[22px] w-[22px] rounded-full bg-[var(--on-grad)]" />
      </button>
    </div>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol aria-label="Setup steps" className="m-0 grid list-none grid-cols-4 gap-2 p-0">
      {steps.map((label, i) => {
        const n = i + 1;
        return (
          <li key={label} aria-current={n === current ? "step" : undefined} className="flex flex-col gap-1.5">
            <span className="h-1 rounded-[4px]" style={{ background: n <= current ? "var(--cat-internship)" : "var(--track)" }} />
            <span className="text-xs font-semibold" style={{ color: n === current ? "var(--ink)" : "var(--faint)" }}>
              {n}. {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
