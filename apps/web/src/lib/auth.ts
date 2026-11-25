import { DEMO_EMAIL } from "./api/mock/fixtures";
import { getDemoSession, resetDemoStore, setDemoSession } from "./api/mock/server";
import { supabaseBrowser } from "./supabase/client";
import { hasSupabase } from "./supabase/env";

/* Auth. With the Supabase env set, sign up, log in and log out use
 * Supabase Auth; without it, a demo session in localStorage. Until apps/api ships, app data still
 * comes from the demo API, so a real session is mirrored into the demo session it expects. */

export type AuthResult =
  | { ok: true; needsSetup: boolean; checkInbox?: false }
  | { ok: true; checkInbox: true }
  | { ok: false; field: "email" | "password" | "form"; message: string; canResend?: boolean };

const NETWORK: AuthResult = { ok: false, field: "form", message: "Couldn't reach the server. Try again." };

type SupaError = { code?: string; message?: string; status?: number } | null;

/** Maps Supabase Auth errors to user-facing messages. */
export function authMessage(err: SupaError, mode: "login" | "signup"): Extract<AuthResult, { ok: false }> {
  const code = err?.code ?? "";
  const msg = (err?.message ?? "").toLowerCase();
  if (code === "user_already_exists" || code === "email_exists" || msg.includes("already registered"))
    return { ok: false, field: "email", message: "An account with this email exists. Log in instead." };
  if (code === "weak_password" || msg.includes("password should"))
    return { ok: false, field: "password", message: "Use at least 8 characters, with letters and numbers." };
  if (code === "email_address_invalid" || msg.includes("invalid email"))
    return { ok: false, field: "email", message: "Check the email format, for example name@example.com." };
  if (code === "email_not_confirmed")
    return { ok: false, field: "form", message: "Confirm your email first. Check your inbox.", canResend: true };
  if (code === "invalid_credentials" || msg.includes("invalid login"))
    return { ok: false, field: "password", message: "Email or password is wrong." };
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || err?.status === 429)
    return { ok: false, field: "form", message: "Too many tries. Wait a minute and try again." };
  if (!err?.status || err.status >= 500 || msg.includes("fetch")) return NETWORK as Extract<AuthResult, { ok: false }>;
  return { ok: false, field: "form", message: mode === "signup" ? "Couldn't create the account. Try again." : "Couldn't log you in. Try again." };
}

function hasDemoProfile() {
  try {
    const raw = window.localStorage.getItem("wp-demo-v1");
    return !!raw && (JSON.parse(raw) as { profile: unknown }).profile !== null;
  } catch {
    return false;
  }
}
function hasDemoStore() {
  try {
    return window.localStorage.getItem("wp-demo-v1") !== null;
  } catch {
    return false;
  }
}

/** Mirror a real Supabase user into the demo session the demo API reads. */
function mirror(email: string, name: string) {
  const prev = getDemoSession();
  if (!prev || prev.email.toLowerCase() !== email.toLowerCase()) resetDemoStore(false);
  setDemoSession({ email, name });
}

export async function logIn(email: string, password: string): Promise<AuthResult> {
  if (!password) return { ok: false, field: "password", message: "Enter your password." };
  if (hasSupabase) {
    try {
      const { data, error } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.user) return authMessage(error, "login");
      const name = (data.user.user_metadata?.display_name as string | undefined) ?? email.split("@")[0];
      mirror(data.user.email ?? email.trim(), name);
      return { ok: true, needsSetup: !hasDemoProfile() };
    } catch {
      return NETWORK;
    }
  }
  await new Promise((r) => setTimeout(r, 300));
  const name = email.trim().toLowerCase() === DEMO_EMAIL ? "Rani Putri" : email.split("@")[0];
  if (!getDemoSession() && !hasDemoStore()) resetDemoStore(true);
  setDemoSession({ email: email.trim(), name });
  return { ok: true, needsSetup: !hasDemoProfile() };
}

export async function signUp(name: string, email: string, password: string): Promise<AuthResult> {
  if (password.length < 8) return { ok: false, field: "password", message: "Use at least 8 characters." };
  if (hasSupabase) {
    try {
      const { data, error } = await supabaseBrowser().auth.signUp({
        email: email.trim(),
        password,
        options: { data: { display_name: name.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) return authMessage(error, "signup");
      // With confirmation on, an existing address comes back with no identities instead of an error.
      if (data.user && data.user.identities?.length === 0) return authMessage({ code: "user_already_exists" }, "signup");
      if (!data.session) return { ok: true, checkInbox: true };
      mirror(data.user?.email ?? email.trim(), name.trim());
      return { ok: true, needsSetup: true };
    } catch {
      return NETWORK;
    }
  }
  await new Promise((r) => setTimeout(r, 300));
  if (email.trim().toLowerCase() === DEMO_EMAIL)
    return { ok: false, field: "email", message: "An account with this email exists. Log in instead." };
  resetDemoStore(false);
  setDemoSession({ email: email.trim(), name: name.trim() });
  return { ok: true, needsSetup: true };
}

/** "Send a new one" for an expired or unconfirmed sign-up link. */
export async function resendConfirmation(email: string): Promise<AuthResult> {
  if (!hasSupabase) return { ok: true, checkInbox: true };
  try {
    const { error } = await supabaseBrowser().auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    return error ? authMessage(error, "signup") : { ok: true, checkInbox: true };
  } catch {
    return NETWORK;
  }
}

export async function signOut() {
  if (hasSupabase) {
    try {
      await supabaseBrowser().auth.signOut();
    } catch {
      /* still clear the local session */
    }
  }
  setDemoSession(null);
}

/** Brings the local session in line with Supabase (after the email link, or a sign-out elsewhere). */
export async function syncSession() {
  if (!hasSupabase) return getDemoSession();
  try {
    const { data } = await supabaseBrowser().auth.getUser();
    const user = data.user;
    if (!user?.email) {
      setDemoSession(null);
      return null;
    }
    const s = getDemoSession();
    if (!s || s.email.toLowerCase() !== user.email.toLowerCase())
      mirror(user.email, (user.user_metadata?.display_name as string | undefined) ?? user.email.split("@")[0]);
    return getDemoSession();
  } catch {
    // Offline: keep whatever session this device has.
    return getDemoSession();
  }
}

export function currentSession() {
  return getDemoSession();
}

export async function getToken(): Promise<string | null> {
  if (hasSupabase) {
    try {
      const { data } = await supabaseBrowser().auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return null;
    }
  }
  return getDemoSession() ? "demo" : null;
}
