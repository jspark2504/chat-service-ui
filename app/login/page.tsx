"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username.trim(), password);
      router.replace("/chat");
    } catch (err) {
      const message = err instanceof Error ? err.message : "로그인에 실패했습니다.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#B2C7D9] px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-xl font-bold text-neutral-900">로그인</h1>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="username" className="mb-1 block text-xs font-medium text-neutral-600">
              아이디
            </label>
            <input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#4A6FA5]"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-medium text-neutral-600">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#4A6FA5]"
              required
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-[#FEE500] py-3 text-sm font-semibold text-neutral-900 hover:bg-[#F5DC00] disabled:opacity-50"
          >
            {loading ? "로그인 중…" : "로그인"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-neutral-600">
          계정이 없나요?{" "}
          <Link href="/register" className="font-medium text-[#4A6FA5] hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
