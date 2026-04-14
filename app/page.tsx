"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    router.replace(token ? "/chat" : "/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#B2C7D9] text-sm text-neutral-600">이동 중…</div>
  );
}
