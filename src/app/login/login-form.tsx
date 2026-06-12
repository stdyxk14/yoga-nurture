"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSupabaseConfigError } from "@/lib/supabase/config";

export function LoginShell() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--yoga-bg)] px-4 py-8 text-[#20231e]">
      <section className="w-full max-w-[430px] rounded-[28px] border border-[#eee4d8] bg-white/86 p-6 shadow-[0_22px_56px_rgba(91,76,53,0.14)]">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#5d956d] bg-[#f5faf3] text-[#4f875a]">
            <Sprout className="h-9 w-9" strokeWidth={1.6} />
          </div>
          <p className="mt-3 font-serif text-[18px] tracking-[0.16em] text-[#3e764e]">YOGA NURTURE</p>
          <h1 className="mt-5 text-[24px] font-extrabold">ログイン</h1>
          <p className="mt-2 text-[13px] font-medium leading-6 text-[#6b7468]">ログイン画面を準備しています。</p>
        </div>
      </section>
    </main>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard";
  const configError = useMemo(() => getSupabaseConfigError(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("メールアドレスまたはパスワードを確認してください。");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ログイン設定を確認してください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--yoga-bg)] px-4 py-8 text-[#20231e]">
      <section className="w-full max-w-[430px] rounded-[28px] border border-[#eee4d8] bg-white/86 p-6 shadow-[0_22px_56px_rgba(91,76,53,0.14)]">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#5d956d] bg-[#f5faf3] text-[#4f875a]">
            <Sprout className="h-9 w-9" strokeWidth={1.6} />
          </div>
          <p className="mt-3 font-serif text-[18px] tracking-[0.16em] text-[#3e764e]">YOGA NURTURE</p>
          <h1 className="mt-5 text-[24px] font-extrabold">ログイン</h1>
          <p className="mt-2 text-[13px] font-medium leading-6 text-[#6b7468]">
            メールアドレスとパスワードで、インストラクター用の管理画面に入ります。
          </p>
        </div>

        {configError ? (
          <div className="rounded-2xl border border-[#f0c7b4] bg-[#fff3ec] p-4 text-[13px] font-semibold leading-6 text-[#b95542]">
            Supabase接続設定が未完了です。
            <br />
            {configError}
            <br />
            VercelのProject Settings → Environment Variablesに設定してください。
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <Label className="text-[13px] font-bold">メールアドレス</Label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-12 rounded-2xl border-[#ded7cb] bg-white text-[15px]"
              />
            </label>
            <label className="grid gap-2">
              <Label className="text-[13px] font-bold">パスワード</Label>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="h-12 rounded-2xl border-[#ded7cb] bg-white text-[15px]"
              />
            </label>

            {error ? (
              <p className="rounded-2xl border border-[#f0c7b4] bg-[#fff3ec] px-3 py-2 text-[12px] font-bold text-[#b95542]">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-2xl bg-[#5d956d] text-[14px] font-bold text-white hover:bg-[#4f835d]"
            >
              <LockKeyhole className="mr-2 h-4 w-4" />
              {loading ? "ログイン中..." : "ログインする"}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
