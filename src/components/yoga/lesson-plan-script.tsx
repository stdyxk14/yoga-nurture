"use client";

import Link from "next/link";
import { Copy, Pencil, Printer } from "lucide-react";
import { LessonPlanAiSuggestionPanel } from "@/components/yoga/lesson-plan-ai-suggestion-panel";
import { RichScriptText } from "@/components/yoga/rich-script-text";
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
  const participantCautions =
    schedule?.participants
      .filter((student) => student.caution)
      .slice(0, 6)
      .map((student) => `${student.name}: ${student.caution}`) ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-4 bg-white p-4 text-[#20231e] print:max-w-none print:p-0">
      <div className="print:hidden">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[24px] font-extrabold">{plan.name}</h1>
            <p className="mt-1 text-[13px] font-medium text-[#6b7468]">
              {isScheduleScript ? "予定に紐づく印刷用レッスン原稿" : "印刷用レッスン原稿"}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => window.print()} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-[#5d956d] px-3 text-[12px] font-bold text-white">
              <Printer className="h-4 w-4" />
              印刷
            </button>
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
      </div>

      <div className="print:hidden">
        <LessonPlanAiSuggestionPanel plan={plan} aiSuggestionState={aiSuggestionState} context="script" />
      </div>

      <article className="rounded-2xl border border-[#e7dfd4] bg-white p-5 shadow-[0_10px_24px_rgba(91,76,53,0.05)] print:border-0 print:p-0 print:shadow-none">
        <section className="print:break-after-page">
          <p className="text-[13px] font-extrabold tracking-[0.22em] text-[#5d956d] print:text-[11pt]">YOGA NURTURE</p>
          <h2 className="mt-3 text-[30px] font-extrabold leading-tight print:text-[24pt]">{plan.name}</h2>
          <div className="mt-5 grid gap-3 text-[13px] font-semibold text-[#4d554b] sm:grid-cols-2 print:grid-cols-2 print:text-[11pt]">
            <PrintInfo label="テーマ" value={plan.theme || "未設定"} />
            <PrintInfo label="合計時間" value={`${plan.totalMinutes}分`} />
            <PrintInfo label="形式" value={plan.formatLabel} />
            <PrintInfo label="更新日" value={formatDateTime(plan.updatedAt)} />
          </div>
          {plan.tags.length ? <p className="mt-3 text-[12px] font-bold text-[#5d956d] print:text-[10pt]">{plan.tags.join(" / ")}</p> : null}

          {schedule ? (
            <section className="mt-6 rounded-2xl border border-[#ead8b7] bg-[#fffaf0] p-4 print:bg-white">
              <h3 className="text-[16px] font-extrabold text-[#8f6830] print:text-[14pt]">この予定の確認メモ</h3>
              <div className="mt-3 grid gap-2 text-[13px] font-semibold leading-6 text-[#4d554b] sm:grid-cols-2 print:grid-cols-2 print:text-[10.5pt]">
                <PrintInfo label="日付" value={schedule.dateLabel} />
                <PrintInfo label="時間" value={`${schedule.startTimeLabel}-${schedule.endTimeLabel}`} />
                <PrintInfo label="場所" value={schedule.place || "未設定"} />
                <PrintInfo label="形式" value={schedule.formatLabel} />
                <PrintInfo label="参加予定人数" value={`${schedule.participantCount}名`} />
              </div>
              {schedule.scheduleCaution ? (
                <div className="mt-3 rounded-xl border border-[#f0d6bd] bg-white/75 p-3">
                  <p className="text-[12px] font-extrabold text-[#b05f42]">注意事項</p>
                  <p className="mt-1 whitespace-pre-wrap text-[13px] font-semibold leading-6">{schedule.scheduleCaution}</p>
                </div>
              ) : null}
              {schedule.scheduleMemo ? (
                <div className="mt-3 rounded-xl border border-[#dbe4d6] bg-white/75 p-3">
                  <p className="text-[12px] font-extrabold text-[#4f875a]">メモ</p>
                  <p className="mt-1 whitespace-pre-wrap text-[13px] font-semibold leading-6">{schedule.scheduleMemo}</p>
                </div>
              ) : null}
              {participantCautions.length ? (
                <div className="mt-3 rounded-xl border border-[#dbe4d6] bg-white/75 p-3">
                  <p className="text-[12px] font-extrabold text-[#4f875a]">参加予定生徒の注意点</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-[12px] font-semibold leading-5">
                    {participantCautions.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}
        </section>

        <section className="print:break-after-page">
          <h3 className="text-[22px] font-extrabold print:text-[18pt]">ブロックタイトル一覧</h3>
          <p className="mt-1 text-[12px] font-semibold text-[#6b7468] print:text-[10pt]">印刷前に、全体の流れと時間配分を確認できます。</p>
          <div className="mt-4 divide-y divide-[#eee4d8] rounded-2xl border border-[#eee4d8]">
            {plan.blocks.map((block, index) => (
              <div key={block.planBlockId} className="grid grid-cols-[36px_minmax(0,1fr)_72px] gap-3 px-3 py-2 text-[13px] font-semibold print:text-[10.5pt]">
                <span className="font-extrabold text-[#5d956d]">{index + 1}</span>
                <span>
                  <span className="font-extrabold">{block.name}</span>
                  <span className="ml-2 text-[#6b7468]">{block.majorCategory} / {block.minorCategory}</span>
                </span>
                <span className="text-right font-extrabold">{block.plannedDurationMinutes}分</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-right text-[14px] font-extrabold print:text-[12pt]">合計 {plan.totalMinutes}分</p>
        </section>

        <section className="space-y-6">
          <h3 className="text-[22px] font-extrabold print:text-[18pt]">誘導セリフ全文</h3>
          {plan.blocks.map((block, index) => (
            <section key={block.planBlockId} className="break-inside-avoid rounded-2xl border border-[#eee4d8] p-4 print:rounded-none print:border-0 print:border-t print:border-[#d8d1c6] print:px-0">
              <div className="mb-2 flex flex-wrap items-baseline gap-2 border-b border-[#eee4d8] pb-2">
                <span className="text-[13px] font-extrabold text-[#5d956d]">{index + 1}</span>
                <h4 className="text-[18px] font-extrabold print:text-[15pt]">{block.name}</h4>
                <span className="rounded-full bg-[#edf5ef] px-2 py-1 text-[11px] font-bold text-[#4f875a] print:border print:bg-white">{block.plannedDurationMinutes}分</span>
              </div>
              <p className="text-[12px] font-bold text-[#5d956d] print:text-[10pt]">{block.majorCategory} / {block.minorCategory}</p>
              {block.purpose ? <p className="mt-2 text-[12px] font-semibold leading-5 text-[#4d554b]">目的: {block.purpose}</p> : null}
              {(block.cautionsOverride || block.cautions) ? (
                <p className="mt-2 rounded-xl bg-[#fff7e8] p-3 text-[12px] font-bold leading-5 text-[#9b7338] print:border print:border-[#ead8b7] print:bg-white">
                  注意点: {block.cautionsOverride || block.cautions}
                </p>
              ) : null}
              {block.memo ? <p className="mt-2 text-[12px] font-semibold leading-5 text-[#6b7468]">メモ: {block.memo}</p> : null}
              <RichScriptText
                text={block.scriptOverride || block.script}
                emptyText="誘導セリフは未入力です。"
                className="mt-3 whitespace-pre-wrap break-words text-[14px] font-medium leading-7 print:text-[11pt] print:leading-7"
              />
            </section>
          ))}
        </section>
      </article>
    </div>
  );
}

function PrintInfo({ label, value }: { label: string; value: string }) {
  return (
    <p className="min-w-0">
      <span className="mr-2 font-extrabold text-[#6b7468]">{label}:</span>
      <span className="break-words">{value}</span>
    </p>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
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
