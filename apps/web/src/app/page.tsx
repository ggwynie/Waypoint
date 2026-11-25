"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { syncSession } from "@/lib/auth";

export default function Index() {
  const router = useRouter();
  useEffect(() => {
    syncSession().then((s) => router.replace(s ? "/home" : "/login"));
  }, [router]);
  return null;
}
