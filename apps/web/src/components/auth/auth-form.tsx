"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Field, PasswordField } from "@/components/ui/form";
import { logIn, resendConfirmation, signUp } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Log in and Sign up forms. */
export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [f, setF] = useState({ name: "", email: "", pass: "" });
  const [submitted, setSubmitted] = useState(false);
  const [server, setServer] = useState<{ field: "email" | "password" | "form"; message: string; canResend?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [inbox, setInbox] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const signup = mode === "signup";

  // Coming back from an expired or used confirmation link.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "link_expired")
      setServer({ field: "form", message: "This link expired. Enter your email and send a new one.", canResend: true });
  }, []);

  async function resend() {
    if (emailBad) return setSubmitted(true);
    setBusy(true);
    const res = await resendConfirmation(f.email);
    setBusy(false);
    if (!res.ok) return setServer(res);
    setResent(true);
    setInbox(f.email.trim());
  }

  const emailBad = !EMAIL_RE.test(f.email);
  const passBad = signup ? f.pass.length < 8 : f.pass.length === 0;
  const nameBad = signup && !f.name.trim();
  const errors = {
    name: submitted && nameBad ? "Enter your name." : undefined,
    email: submitted && emailBad ? (f.email ? "Check the email format, for example name@example.com." : "Enter your email.") : server?.field === "email" ? server.message : undefined,
    pass: submitted && passBad ? (signup ? "Use at least 8 characters." : "Enter your password.") : server?.field === "password" ? server.message : undefined,
  };

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF({ ...f, [k]: e.target.value });
    setServer(null);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (emailBad || passBad || nameBad) return setSubmitted(true);
    setBusy(true);
    const res = signup ? await signUp(f.name, f.email, f.pass) : await logIn(f.email, f.pass);
    setBusy(false);
    if (!res.ok) return setServer(res);
    if (res.checkInbox) return setInbox(f.email.trim());
    qc.clear();
    router.push(res.needsSetup ? "/setup" : "/home");
  }

  if (inbox)
    return (
      <div role="status" className="flex max-w-[440px] flex-col gap-4">
        <h1 className="m-0 font-heading text-4xl tracking-[-1px]">Check your inbox</h1>
        <p className="m-0 text-[15px] leading-normal text-muted2">
          {resent ? "We sent a new link to " : "We sent a confirmation link to "}
          <span className="font-semibold text-ink">{inbox}</span>. Open it on this device to continue to setup. The link works once.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="ghost" onClick={resend} loading={busy}>
            Send a new link
          </Button>
          <Link href="/login" className="flex items-center px-2 text-sm font-semibold underline" onClick={() => setInbox(null)}>
            Back to log in
          </Link>
        </div>
        {server?.field === "form" && (
          <div role="alert" className="text-[13px] text-warn">
            {server.message}
          </div>
        )}
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="flex max-w-[440px] flex-col gap-4">
      <div>
        <h1 className="m-0 font-heading text-4xl tracking-[-1px]">{signup ? "Create your account" : "Log in"}</h1>
        <div className="mt-1.5 text-[15px] text-muted2">{signup ? "Takes a minute. Then four short questions so your feed fits you." : "Pick up where you left off."}</div>
      </div>
      {signup && <Field label="Full name" autoComplete="name" value={f.name} onChange={set("name")} error={errors.name} />}
      <Field label="Email" type="email" autoComplete="email" value={f.email} onChange={set("email")} error={errors.email} />
      <PasswordField label="Password" autoComplete={signup ? "new-password" : "current-password"} value={f.pass} onChange={set("pass")} error={errors.pass} hint={signup ? "At least 8 characters." : undefined} />
      {server?.field === "form" && (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-[13px] text-warn">
          {server.message}
          {server.canResend && (
            <Button size="sm" onClick={resend} loading={busy}>
              Send a new link
            </Button>
          )}
        </div>
      )}
      <Button type="submit" variant="primary" className="!h-[50px] !text-base" loading={busy}>
        {signup ? "Create account" : "Log in"}
      </Button>
      <div className="text-sm text-muted2">
        {signup ? "Already have an account? " : "New to Waypoint? "}
        <Link href={signup ? "/login" : "/signup"} className="font-semibold underline">
          {signup ? "Log in" : "Create an account"}
        </Link>
      </div>
    </form>
  );
}
