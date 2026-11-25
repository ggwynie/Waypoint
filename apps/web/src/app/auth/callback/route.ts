import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/env";

/** Target of the confirmation email: confirmed → setup step 1; expired → log in with a message. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const fail = NextResponse.redirect(new URL("/login?error=link_expired", url.origin));
  if (!hasSupabase) return fail;

  const supabase = await supabaseServer();
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("missing code") };

  return error ? fail : NextResponse.redirect(new URL("/setup", url.origin));
}
