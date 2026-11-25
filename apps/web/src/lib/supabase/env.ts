/* Public by design. Supabase is used for auth only, never for app data. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** True when the Supabase project is configured; otherwise the app uses the demo session. */
export const hasSupabase = SUPABASE_URL !== "" && SUPABASE_KEY !== "";
