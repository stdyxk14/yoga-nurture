"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CalendarRange, ClipboardList, Sparkles } from "lucide-react";
import { refreshTeachingReviewAction, type ReviewActionState } from "@/app/reports/actions";
import { WorkspaceFeedback } from "@/components/yoga/workspace-kit";
import type { TeachingReviewState } from "@/lib/ai-review/queries";

export function AiReviewControls({ state }: { state: TeachingReviewState }) {
  const [actionState, action, pending] = useActionState<ReviewActionState, FormData>(refreshTeachingReviewAction, {});
  const selection = state.scope.selection;
  const lessonMode = selection.mode === "lesson";
  const periodSelection = selection.mode === "period" ? selection : null;
  return (
    <section className="rounded-2xl border border-[#dce3d8] bg-[#fbfcf8] p-4 shadow-[0_8px_24px_rgba(63,79,61,0.05)] sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold tracking-[0.05em] text-[#6f8e70]">分析範囲</p>
          <div className="mt-2 inline-flex rounded-xl border border-[#d9dfd5] bg-white p-1" role="tablist" aria-label="AIレビューの分析範囲">
            <Link
              href={state.records[0] ? `/reports?view=ai_review&ai_mode=lesson&ai_record=${state.records[0].id}` : "/reports?view=ai_review&ai_mode=lesson"}
              className={modeClass(lessonMode)}
              role="tab"
              aria-selected={lessonMode}
            >
              <ClipboardList className="h-4 w-4" />1レッスン
            </Link>
            <Link
              href="/reports?view=ai_review&ai_mode=period&ai_range=recent3"
              className={modeClass(!lessonMode)}
              role="tab"
              aria-selected={!lessonMode}
            >
              <CalendarRange className="h-4 w-4" />複数レッスン・期間
            </Link>
          </div>

          {lessonMode ? (
            <form action="/reports" className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,560px)_auto] sm:items-end">
              <input type="hidden" name="view" value="ai_review" />
              <input type="hidden" name="ai_mode" value="lesson" />
              <label className="grid gap-1.5 text-[13px] font-semibold text-[#59635a]">
                完了済みの実施後記録
                <select name="ai_record" defaultValue={state.scope.lessonRecordId ?? ""} className="h-11 rounded-xl border border-[#d8ddd4] bg-white px-3 text-[14px] text-[#39433b]">
                  {state.records.map((record) => <option key={record.id} value={record.id}>{record.label}</option>)}
                </select>
              </label>
              <button disabled={!state.records.length} className="h-11 rounded-xl border border-[#ccd7c8] bg-white px-4 text-[13px] font-semibold text-[#4d7355] disabled:opacity-45">対象を表示</button>
            </form>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {([
                  ["recent3", "直近3回"],
                  ["recent5", "直近5回"],
                  ["month", "今月"],
                  ["custom", "カスタム期間"],
                ] as const).map(([range, label]) => (
                  <Link key={range} href={`/reports?view=ai_review&ai_mode=period&ai_range=${range}`} className={rangeClass(selection.mode === "period" && selection.range === range)}>{label}</Link>
                ))}
              </div>
              {selection.mode === "period" && selection.range === "custom" ? (
                <form action="/reports" className="grid gap-2 sm:grid-cols-[180px_180px_auto] sm:items-end">
                  <input type="hidden" name="view" value="ai_review" />
                  <input type="hidden" name="ai_mode" value="period" />
                  <input type="hidden" name="ai_range" value="custom" />
                  <DateField label="開始日" name="ai_from" value={selection.from} />
                  <DateField label="終了日" name="ai_to" value={selection.to} />
                  <button className="h-11 rounded-xl border border-[#ccd7c8] bg-white px-4 text-[13px] font-semibold text-[#4d7355]">対象を表示</button>
                </form>
              ) : null}
            </div>
          )}
        </div>

        <form action={action} className="xl:pt-5">
          <input type="hidden" name="review_mode" value={state.scope.mode} />
          {state.scope.mode === "lesson" ? (
            <input type="hidden" name="record_id" value={state.scope.lessonRecordId ?? ""} />
          ) : (
            <>
              <input type="hidden" name="review_range" value={periodSelection?.range ?? "recent3"} />
              <input type="hidden" name="from" value={periodSelection?.from ?? ""} />
              <input type="hidden" name="to" value={periodSelection?.to ?? ""} />
            </>
          )}
          <button disabled={pending || !state.scope.targetRecordIds.length} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#567d5e] px-5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#486d51] disabled:opacity-45">
            <Sparkles className={`h-4 w-4 ${pending ? "animate-pulse" : ""}`} />
            {pending ? "分析中…" : state.snapshot ? "記録の変更を確認して分析" : "分析する"}
          </button>
        </form>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#687168]">
        <span className="font-semibold text-[#455b49]">{state.scope.scopeLabel}</span>
        <span>{state.scope.targetRecordIds.length ? `${state.scope.targetRecordIds.length}回の完了記録を対象` : "対象となる完了記録がありません"}</span>
        <span>範囲を変えただけではAI生成しません</span>
      </div>
      {actionState.error ? <div className="mt-3"><WorkspaceFeedback tone="error">{actionState.error}</WorkspaceFeedback></div> : null}
      {actionState.message ? <div className="mt-3"><WorkspaceFeedback tone={actionState.ok ? "success" : "info"}>{actionState.message}</WorkspaceFeedback></div> : null}
    </section>
  );
}

function modeClass(active: boolean) {
  return active
    ? "inline-flex h-9 items-center gap-2 rounded-lg bg-[#e5efe2] px-3.5 text-[13px] font-semibold text-[#386b46]"
    : "inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-[13px] font-semibold text-[#697169] hover:bg-[#f4f3ee]";
}

function rangeClass(active: boolean) {
  return active
    ? "inline-flex h-9 items-center rounded-lg bg-[#5d8f68] px-3.5 text-[13px] font-semibold text-white"
    : "inline-flex h-9 items-center rounded-lg border border-[#ddd8cf] bg-white px-3.5 text-[13px] font-semibold text-[#626a60] hover:bg-[#f7f5f0]";
}

function DateField({ label, name, value }: { label: string; name: string; value?: string }) {
  return <label className="grid gap-1.5 text-[13px] font-semibold text-[#59635a]">{label}<input type="date" name={name} defaultValue={value ?? ""} required className="h-11 rounded-xl border border-[#d8ddd4] bg-white px-3 text-[14px]" /></label>;
}
