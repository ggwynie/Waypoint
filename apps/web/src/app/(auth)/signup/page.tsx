"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { loginPreview } from "@/components/auth/default-preview";
import { useRefData } from "@/lib/hooks/queries";

export default function SignupPage() {
  const { campuses } = useRefData();
  return (
    <AuthShell preview={loginPreview(campuses.data?.[0])}>
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
