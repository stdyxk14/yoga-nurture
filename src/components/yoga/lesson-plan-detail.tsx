import Link from "next/link";
import { ArrowLeft, FileText, Pencil, Printer } from "lucide-react";
import { LessonPlanAiSuggestionPanel } from "@/components/yoga/lesson-plan-ai-suggestion-panel";
import { PageHeader, Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { formatJapaneseDate } from "@/lib/date-format";
import type { StudentAiSuggestionState } from "@/lib/ai-suggestions";
import type { DbLessonPlan } from "@/lib/lesson-plans";

export function LessonPlanDetail({ plan, aiSuggestionState }: { plan: DbLessonPlan; aiSuggestionState: StudentAiSuggestionState }) {
  return (
    <div className="space-y-4">
      <PageHeader title={plan.name} subtitle="保存済みレッスンプランの詳細" />

      <SoftCard className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#edf5ef] px-3 py-1 text-[12px] font-bold text-[#4f875a]">{plan.statusLabel}</span>
              <span className="rounded-full bg-[#fff7e8] px-3 py-1 text-[12px] font-bold text-[#9b7338]">{plan.totalMinutes}分</span>
              <span className="rounded-full bg-[#f3eefb] px-3 py-1 text-[12px] font-bold text-[#7469bf]">{plan.blockCount}ブロック</span>
            </div>
            <dl className="mt-4 grid gap-3 text-[13px] font-semibold text-[#4d554b] sm:grid-cols-2 lg:grid-cols-4">
              <Info label="テーマ" value={plan.theme || "未設定"} />
              <Info label="場所" value={plan.place || "未設定"} />
              <Info label="形式" value={plan.formatLabel} />
              <Info label="最終更新" value={formatDate(plan.updatedAt)} />
            </dl>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {plan.tags.length ? plan.tags.map((tag) => <Pill key={tag}>{tag}</Pill>) : <Pill>タグ未設定</Pill>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[390px]">
            <Link href="/lessons?tab=plans" className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-[#d8e3d4] bg-white px-3 text-[12px] font-bold text-[#4f7b58]">
              <ArrowLeft className="h-3.5 w-3.5" />
              一覧
            </Link>
            <Link href={`/lessons/${plan.id}/script`} className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-[#5d956d] px-3 text-[12px] font-bold text-white">
              <Printer className="h-3.5 w-3.5" />
              原稿
            </Link>
            <Link href={`/lessons/${plan.id}/edit`} className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-[#d8e3d4] bg-white px-3 text-[12px] font-bold text-[#4f7b58] sm:col-span-2">
              <Pencil className="h-3.5 w-3.5" />
              編集する
            </Link>
          </div>
        </div>
      </SoftCard>

      <LessonPlanAiSuggestionPanel plan={plan} aiSuggestionState={aiSuggestionState} />

      <SoftCard className="p-4">
        <SectionTitle icon={FileText} title="使用ブロック一覧" subtitle="原稿に出力される順番で表示しています。" />
        {plan.blocks.length ? (
          <div className="mt-4 space-y-3">
            {plan.blocks.map((block, index) => (
              <article key={block.planBlockId} className="rounded-2xl border border-[#eee4d8] bg-white/75 p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf5ef] text-[13px] font-extrabold text-[#4f875a]">{index + 1}</span>
                    <div className="min-w-0">
                      <h2 className="text-[15px] font-extrabold">{block.name}</h2>
                      <p className="mt-1 text-[12px] font-bold text-[#5d956d]">{block.majorCategory} / {block.minorCategory} / {block.plannedDurationMinutes}分</p>
                    </div>
                  </div>
                  <Link href={`/blocks/${block.id}`} className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-[#d8e3d4] bg-white px-3 text-[12px] font-bold text-[#4f7b58]">
                    ブロック詳細
                  </Link>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="rounded-xl bg-[#fff7e8] p-3 text-[12px] font-bold leading-5 text-[#9b7338]">
                    注意点：{block.cautionsOverride || block.cautions || "未入力"}
                  </div>
                  <p className="line-clamp-3 text-[12px] font-medium leading-5 text-[#50584e]">{block.scriptOverride || block.script || "誘導セリフは未入力です。"}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-[#d8e3d4] bg-white/60 p-5 text-center text-[13px] font-medium text-[#6b7468]">
            このレッスンプランにはまだブロックがありません。
          </p>
        )}
      </SoftCard>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#eee4d8] bg-white/65 p-3">
      <dt className="text-[11px] font-bold text-[#7c8476]">{label}</dt>
      <dd className="mt-1 break-words text-[13px] font-extrabold">{value}</dd>
    </div>
  );
}

function formatDate(value: string) {
  return formatJapaneseDate(new Date(value));
}
