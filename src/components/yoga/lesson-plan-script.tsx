"use client";

import Link from "next/link";
import { Copy, ExternalLink, Pencil } from "lucide-react";
import { LessonPlanAiSuggestionPanel } from "@/components/yoga/lesson-plan-ai-suggestion-panel";
import { LessonPlanPrintDocument } from "@/components/yoga/lesson-plan-print-document";
import { ScriptPrintButton } from "@/components/yoga/script-print-actions";
import type { StudentAiSuggestionState } from "@/lib/ai-suggestions";
import type { DbLessonPlan } from "@/lib/lesson-plans";
import type { DbSchedule } from "@/lib/schedules";

type Props = {
  plan: DbLessonPlan;
  schedule?: DbSchedule;
  aiSuggestionState: StudentAiSuggestionState;
};

export function LessonPlanScript({ plan, schedule, aiSuggestionState }: Props) {
  const isScheduleScript = Boolean(schedule);
  const copyText = buildCopyText(plan, schedule);
  const printHref = schedule ? `/schedules/${schedule.id}/script/print` : `/lessons/${plan.id}/script/print`;

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-3 py-4 text-[#20231e] print:p-0">
      <section className="rounded-2xl border border-[#e7dfd4] bg-[#fbfaf6] p-4 print:hidden">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[12px] font-extrabold tracking-[0.2em] text-[#5d956d]">SCRIPT PREVIEW</p>
            <h1 className="mt-1 text-[24px] font-extrabold leading-tight">{plan.name}</h1>
            <p className="mt-2 max-w-2xl text-[13px] font-semibold leading-6 text-[#6b7468]">
              {isScheduleScript
                ? "この予定に紐づく注意事項・メモを含めた、現場用の印刷原稿です。"
                : "レッスンプラン単体の印刷原稿です。予定ごとのメモは含めません。"}
            </p>
            <p className="mt-1 text-[12px] font-semibold text-[#8a7d6c]">
              ブラウザの印刷設定でヘッダーとフッターをOFFにすると、よりきれいに印刷できます。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[430px]">
            <ScriptPrintButton label="この画面を印刷" />
            <Link href={printHref} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-[#2f4535] px-3 text-[12px] font-bold text-white">
              <ExternalLink className="h-4 w-4" />
              印刷用ページ
            </Link>
            <button type="button" onClick={() => void navigator.clipboard.writeText(copyText)} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-[#d8e3d4] bg-white px-3 text-[12px] font-bold text-[#4f7b58]">
              <Copy className="h-4 w-4" />
              コピー
            </button>
            <Link href={`/lessons/${plan.id}/edit`} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-[#d8e3d4] bg-white px-3 text-[12px] font-bold text-[#4f7b58]">
              <Pencil className="h-4 w-4" />
              編集
            </Link>
          </div>
        </div>
      </section>

      <div className="print:hidden">
        <LessonPlanAiSuggestionPanel plan={plan} aiSuggestionState={aiSuggestionState} context="script" />
      </div>

      <LessonPlanPrintDocument plan={plan} schedule={schedule} />
    </div>
  );
}

function buildCopyText(plan: DbLessonPlan, schedule?: DbSchedule) {
  return [
    `${plan.name}`,
    `テーマ: ${plan.theme || "未設定"}`,
    `合計時間: ${plan.totalMinutes}分`,
    schedule
      ? [
          "",
          "この予定の確認メモ",
          `日付: ${schedule.dateLabel}`,
          `時間: ${schedule.startTimeLabel}-${schedule.endTimeLabel}`,
          `場所: ${schedule.place || "未設定"}`,
          schedule.scheduleCaution ? `注意事項: ${schedule.scheduleCaution}` : "",
          schedule.scheduleMemo ? `メモ: ${schedule.scheduleMemo}` : "",
        ].filter(Boolean).join("\n")
      : "",
    "",
    "ブロック一覧",
    ...plan.blocks.map((block, index) => `${index + 1}. ${block.name} / ${block.plannedDurationMinutes}分 / ${block.majorCategory} / ${block.minorCategory}`),
    "",
    "誘導セリフ全文",
    ...plan.blocks.map((block, index) =>
      [
        `${index + 1}. ${block.name}`,
        `${block.majorCategory} / ${block.minorCategory} / ${block.plannedDurationMinutes}分`,
        block.cautionsOverride || block.cautions ? `注意点: ${block.cautionsOverride || block.cautions}` : "",
        block.scriptOverride || block.script || "",
      ].filter(Boolean).join("\n"),
    ),
  ].filter(Boolean).join("\n\n");
}
