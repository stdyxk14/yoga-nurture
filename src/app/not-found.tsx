import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-10">
      <section className="w-full rounded-3xl border border-[#eee4d8] bg-white/82 p-6 text-center shadow-[0_12px_32px_rgba(91,76,53,0.08)]">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0ea] text-[#d96c55]">
          <AlertCircle className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-[22px] font-extrabold text-[#283026]">見つかりません</h1>
        <p className="mx-auto mt-2 max-w-md text-[13px] font-semibold leading-6 text-[#6b7468]">
          指定されたデータは存在しないか、現在のアカウントでは表示できません。
        </p>
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white"
          >
            ダッシュボードへ戻る
          </Link>
          <Link
            href="/lessons"
            className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58]"
          >
            <ArrowLeft className="h-4 w-4" />
            レッスン一覧へ
          </Link>
        </div>
      </section>
    </div>
  );
}
