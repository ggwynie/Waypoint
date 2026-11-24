"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { currentSession } from "@/lib/auth";

export default function Index() {
  const router = useRouter();
  useEffect(() => {
    router.replace(currentSession() ? "/home" : "/login");
  }, [router]);
  return null;
}
