"use client";

import Link from "next/link";
import { Copy, Pencil, Printer } from "lucide-react";
import { LessonPlanAiSuggestionPanel } from "@/components/yoga/lesson-plan-ai-suggestion-panel";
import type { StudentAiSuggestionState } from "@/lib/ai-suggestions";
import type { DbLessonPlan } from "@/lib/lesson-plans";

export function LessonPlanScript({ plan, aiSuggestionState }: { plan: DbLessonPlan; aiSuggestionState: StudentAiSuggestionState }) {
  const scriptText = [
    `${plan.name}`,
    `テーマ: ${plan.theme || "未設定"}`,
    `合計時間: ${plan.totalMinutes}分`,
    "",
    ...plan.blocks.map((block, index) =>
      [
        `${index + 1}. ${block.majorCategory} / ${block.minorCategory}`,
        `${block.name}（${block.plannedDurationMinutes}分）`,
        block.cautionsOverride || block.cautions ? `注意点: ${block.cautionsOverride || block.cautions}` : "",
        block.scriptOverride || block.script || "",
      ]
        .filter(Boolean)
        .join("\n"),
    ),
  ].join("\n\n");

  return (
    <div className="mx-auto max-w-4xl space-y-4 bg-white p-4 text-[#20231e] print:max-w-none print:p-0">
      <div className="print:hidden">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[24px] font-extrabold">{plan.name}</h1>
            <p className="mt-1 text-[13px] font-medium text-[#6b7468]">印刷用レッスン原稿</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => window.print()} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-[#5d956d] px-3 text-[12px] font-bold text-white">
              <Printer className="h-4 w-4" />
              印刷
            </button>
            <button type="button" onClick={() => void navigator.clipboard.writeText(scriptText)} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-[#d8e3d4] bg-white px-3 text-[12px] font-bold text-[#4f7b58]">
              <Copy className="h-4 w-4" />
              コピー
            </button>
            <Link href={`/lessons/${plan.id}/edit`} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-[#d8e3d4] bg-white px-3 text-[12px] font-bold text-[#4f7b58]">
              <Pencil className="h-4 w-4" />
              編集
            </Link>
          </div>
        </div>
      </div>

      <LessonPlanAiSuggestionPanel plan={plan} aiSuggestionState={aiSuggestionState} context="script" />

      <article className="rounded-2xl border border-[#e7dfd4] bg-white p-5 shadow-[0_10px_24px_rgba(91,76,53,0.05)] print:border-0 print:p-0 print:shadow-none">
        <header className="border-b border-[#e7dfd4] pb-4">
          <h2 className="text-[28px] font-extrabold print:text-[22pt]">{plan.name}</h2>
          <div className="mt-3 grid gap-2 text-[13px] font-semibold text-[#4d554b] sm:grid-cols-3 print:grid-cols-3">
            <p>テーマ: {plan.theme || "未設定"}</p>
            <p>合計時間: {plan.totalMinutes}分</p>
            <p>形式: {plan.formatLabel}</p>
          </div>
          {plan.tags.length ? <p className="mt-2 text-[12px] font-bold text-[#5d956d]">{plan.tags.join(" / ")}</p> : null}
        </header>

        <div className="mt-5 space-y-6">
          {plan.blocks.map((block, index) => (
            <section key={block.planBlockId} className="break-inside-avoid">
              <div className="mb-2 flex items-baseline gap-2 border-b border-[#eee4d8] pb-2">
                <span className="text-[13px] font-extrabold text-[#5d956d]">{index + 1}</span>
                <h3 className="text-[18px] font-extrabold print:text-[15pt]">{block.majorCategory} / {block.minorCategory}</h3>
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <p className="text-[16px] font-extrabold">{block.name}</p>
                <span className="rounded-full bg-[#edf5ef] px-2 py-1 text-[11px] font-bold text-[#4f875a]">{block.plannedDurationMinutes}分</span>
              </div>
              {(block.cautionsOverride || block.cautions) ? (
                <p className="mb-3 rounded-xl bg-[#fff7e8] p-3 text-[12px] font-bold leading-5 text-[#9b7338] print:border print:border-[#ead8b7]">
                  注意点: {block.cautionsOverride || block.cautions}
                </p>
              ) : null}
              <div className="whitespace-pre-wrap break-words text-[14px] font-medium leading-7 print:text-[11pt] print:leading-7">
                {block.scriptOverride || block.script || "誘導セリフは未入力です。"}
              </div>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
