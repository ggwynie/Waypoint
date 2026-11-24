"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Field, PasswordField } from "@/components/ui/form";
import { logIn, signUp } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Log in and Sign up forms. */
export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [f, setF] = useState({ name: "", email: "", pass: "" });
  const [submitted, setSubmitted] = useState(false);
  const [server, setServer] = useState<{ field: "email" | "password" | "form"; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

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
    qc.clear();
    router.push(res.needsSetup ? "/setup" : "/home");
  }

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
        <div role="alert" className="text-[13px] text-warn">
          {server.message}
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
