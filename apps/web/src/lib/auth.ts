import { DEMO_EMAIL } from "./api/mock/fixtures";
import { getDemoSession, resetDemoStore, setDemoSession } from "./api/mock/server";

/* Auth seam. Supabase Auth via supabase-js in the browser (auth only).
 * Until the Supabase project exists this runs a demo session in localStorage; swap the bodies of these
 * functions for supabase.auth.signInWithPassword / signUp / signOut / getSession when it does. */

export type AuthResult = { ok: true; needsSetup: boolean } | { ok: false; field: "email" | "password" | "form"; message: string };

const NETWORK_ERROR: AuthResult = { ok: false, field: "form", message: "Couldn't reach the server. Try again." };

export async function logIn(email: string, password: string): Promise<AuthResult> {
  try {
    await new Promise((r) => setTimeout(r, 300));
    if (!password) return { ok: false, field: "password", message: "Enter your password." };
    const name = email.trim().toLowerCase() === DEMO_EMAIL ? "Rani Putri" : email.split("@")[0];
    if (!getDemoSession() && !hasDemoStore()) resetDemoStore(true);
    setDemoSession({ email: email.trim(), name });
    return { ok: true, needsSetup: !hasDemoProfile() };
  } catch {
    return NETWORK_ERROR;
  }
}

export async function signUp(name: string, email: string, password: string): Promise<AuthResult> {
  try {
    await new Promise((r) => setTimeout(r, 300));
    if (email.trim().toLowerCase() === DEMO_EMAIL)
      return { ok: false, field: "email", message: "An account with this email exists. Log in instead." };
    if (password.length < 8) return { ok: false, field: "password", message: "Use at least 8 characters." };
    resetDemoStore(false);
    setDemoSession({ email: email.trim(), name: name.trim() });
    return { ok: true, needsSetup: true };
  } catch {
    return NETWORK_ERROR;
  }
}

export async function signOut() {
  setDemoSession(null);
}

export function currentSession() {
  return getDemoSession();
}

export async function getToken(): Promise<string | null> {
  return getDemoSession() ? "demo" : null;
}

function hasDemoStore() {
  try {
    return window.localStorage.getItem("wp-demo-v1") !== null;
  } catch {
    return false;
  }
}
function hasDemoProfile() {
  try {
    const raw = window.localStorage.getItem("wp-demo-v1");
    return !!raw && (JSON.parse(raw) as { profile: unknown }).profile !== null;
  } catch {
    return false;
  }
}
