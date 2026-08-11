"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Bookmark, Check, ChevronDown, FilePlus2, History, Pause, RefreshCw, ShieldCheck, Sparkles, X } from "lucide-react";
import {
  preflightDailySuggestionAction,
  refreshDailySuggestionAction,
  saveDailySuggestionAsBlockDraftAction,
  saveDailySuggestionAsPlanDraftAction,
  setDailySuggestionStatusAction,
  type DailyActionState,
} from "@/app/dashboard/ai-actions";
import { WorkspaceFeedback, WorkspaceStatus } from "@/components/yoga/workspace-kit";
import type { DailySuggestionItem, DailySuggestionState } from "@/lib/daily-suggestions/queries";
import type { AiReviewReference, AiReviewReferenceIndex } from "@/lib/ai-review/types";

const typeLabels = {
  new_plan: "新しいレッスンプラン",
  plan_revision: "既存プランの改訂案",
  new_block: "新しいブロック",
  block_revision: "ブロック改善",
  improvised_template: "即興内容のテンプレート化",
  script_revision: "誘導セリフの改訂",
  alternative_block: "代替ブロック",
  next_schedule_adaptation: "次回参加者に合わせた当日案",
  observation_point: "観察ポイント",
  recording_improvement: "記録改善",
} as const;

const statusLabels = { pending: "未判断", accepted: "採用", held: "保留", dismissed: "今回は不要", saved: "下書き保存済み" } as const;

export function TodayAiSuggestionPanel({ state }: { state: DailySuggestionState }) {
  const [refreshState, refreshAction, refreshing] = useActionState<DailyActionState, FormData>(refreshDailySuggestionAction, {});
  const [preflightState, preflightAction, preflighting] = useActionState<DailyActionState, FormData>(preflightDailySuggestionAction, {});
  const currentIds = new Set(state.suggestions.map((item) => item.id));
  const history = state.history.filter((item) => !currentIds.has(item.id));
  return (
    <section className="rounded-[26px] border border-[#d6e2d3] bg-white shadow-[0_14px_45px_rgba(57,76,58,0.07)]">
      <div className="flex flex-col gap-3 border-b border-[#e6ebe3] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-[10px] font-black tracking-[0.12em] text-[#6c8b70]">INTERNAL EVIDENCE / 毎日の学習ループ</p>
          <div className="mt-1 flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#537b59]" /><h2 className="text-[19px] font-black tracking-[-0.02em] text-[#314337]">今日のAI提案</h2></div>
          {state.run ? <p className="mt-1 text-[11px] font-semibold text-[#747d75]">生成日 {formatDate(state.run.suggestionDate)}・分析対象 {state.run.reviewPeriodDays ?? "—"}日・{state.run.model}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={refreshAction}><button disabled={refreshing} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#557b5c] px-3 text-[12px] font-bold text-white disabled:opacity-55"><RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />{refreshing ? "生成中…" : "根拠を更新"}</button></form>
          {!state.run ? <form action={preflightAction}><button disabled={preflighting} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#d5ddd1] bg-white px-3 text-[12px] font-bold text-[#55715b] disabled:opacity-55"><ShieldCheck className="h-3.5 w-3.5" />{preflighting ? "確認中…" : "モデル接続を確認"}</button></form> : null}
        </div>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {refreshState.error ? <WorkspaceFeedback tone="error">{refreshState.error}</WorkspaceFeedback> : null}
        {refreshState.message ? <WorkspaceFeedback tone={refreshState.ok ? "success" : "info"}>{refreshState.message}</WorkspaceFeedback> : null}
        {preflightState.error ? <WorkspaceFeedback tone="error">{preflightState.error}</WorkspaceFeedback> : null}
        {preflightState.message ? <WorkspaceFeedback tone="success">{preflightState.message}{preflightState.preflight ? ` ${preflightState.preflight.responseModel ?? preflightState.preflight.model}・入力${preflightState.preflight.inputTokens}／出力${preflightState.preflight.outputTokens} tokens・概算$${preflightState.preflight.estimatedCostUsd.toFixed(4)}` : ""}</WorkspaceFeedback> : null}
        {state.latestRun?.status === "running" ? <WorkspaceFeedback tone="info">新しい提案を生成中です。完了まで前回の成功結果を表示します。</WorkspaceFeedback> : null}
        {state.latestRun?.status === "failed" && state.suggestions.length ? <WorkspaceFeedback tone="error">最新の生成は失敗しました（{state.latestRun.errorCode ?? "unknown"}）。前回の提案は保持されています。</WorkspaceFeedback> : null}

        {state.suggestions.length ? (
          <>
            <SuggestionCard suggestion={state.suggestions[0]} references={state.run?.references} primary />
            {state.suggestions.length > 1 ? <div className="grid gap-3 lg:grid-cols-2">{state.suggestions.slice(1, 3).map((suggestion) => <SuggestionCard key={suggestion.id} suggestion={suggestion} references={state.run?.references} />)}</div> : null}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#cfdccb] bg-[#f7fbf5] p-5">
            <p className="text-[15px] font-black text-[#35503a]">まだ提案はありません</p>
            <p className="mt-2 max-w-3xl text-[12px] font-medium leading-6 text-[#6a756b]">AI総合指導レビューを根拠に、具体的なプラン・ブロック改善、安全確認、観察点から最も価値のある1件を選びます。ホーム表示だけではOpenAIを呼びません。</p>
          </div>
        )}

        <details className="group rounded-xl border border-[#e3e6df] bg-[#fafbf9]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[12px] font-bold text-[#56645a]"><span className="inline-flex items-center gap-2"><History className="h-4 w-4" />過去の提案を見る（{history.length}件）</span><ChevronDown className="h-4 w-4 transition group-open:rotate-180" /></summary>
          <div className="border-t border-[#e3e6df] p-3">
            {history.length ? <div className="grid gap-2">{history.slice(0, 12).map((item) => <div key={item.id} className="flex flex-col gap-2 rounded-xl bg-white p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-[12px] font-bold text-[#3f4b42]">{item.title}</p><p className="mt-1 text-[10px] font-semibold text-[#7b827b]">{formatDate(item.suggestionDate)}・{typeLabels[item.type]}</p></div><WorkspaceStatus tone={item.status === "dismissed" ? "coral" : item.status === "held" ? "sand" : "green"}>{statusLabels[item.status]}</WorkspaceStatus></div>)}</div> : <p className="p-2 text-[12px] text-[#747c74]">過去の提案はまだありません。</p>}
          </div>
        </details>
      </div>
    </section>
  );
}

function SuggestionCard({ suggestion, references, primary = false }: { suggestion: DailySuggestionItem; references?: AiReviewReferenceIndex; primary?: boolean }) {
  const [feedbackState, feedbackAction, feedbackPending] = useActionState<DailyActionState, FormData>(setDailySuggestionStatusAction, {});
  const saveAction = suggestion.draftPayload.kind === "block" ? saveDailySuggestionAsBlockDraftAction : saveDailySuggestionAsPlanDraftAction;
  const [saveState, saveFormAction, saving] = useActionState<DailyActionState, FormData>(saveAction, {});
  const refIndex = references;
  const savedHref = suggestion.savedPlanId ? `/lessons/${suggestion.savedPlanId}/edit` : suggestion.savedBlockTemplateId ? `/blocks/${suggestion.savedBlockTemplateId}` : null;
  return (
    <article className={primary ? "rounded-2xl border border-[#cfe0cc] bg-[linear-gradient(135deg,#f4faf2,#fffdf9)] p-4 shadow-[0_8px_24px_rgba(72,94,70,0.07)] sm:p-5" : "rounded-2xl border border-[#e3e4dd] bg-[#fbfcfa] p-4"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2"><WorkspaceStatus tone={primary ? "green" : "sand"}>{primary ? "主提案" : "補助提案"}</WorkspaceStatus><span className="text-[10px] font-bold text-[#738078]">{typeLabels[suggestion.type]}・根拠{suggestion.evidenceCount}件・確信度{confidenceLabel(suggestion.confidence)}</span></div>
        <WorkspaceStatus tone={suggestion.status === "dismissed" ? "coral" : suggestion.status === "held" ? "sand" : "green"}>{statusLabels[suggestion.status]}</WorkspaceStatus>
      </div>
      <h3 className={primary ? "mt-3 text-[18px] font-black leading-7 text-[#304237]" : "mt-3 text-[15px] font-black leading-6 text-[#35443a]"}>{suggestion.title}</h3>
      <p className="mt-2 text-[12px] font-medium leading-6 text-[#5f6a61]">{suggestion.summary}</p>
      <div className="mt-3 rounded-xl border border-[#e3e8df] bg-white/80 p-3"><p className="text-[10px] font-black tracking-[0.05em] text-[#6b846d]">なぜこの提案なのか</p><p className="mt-1 text-[11px] font-medium leading-5 text-[#626b63]">{suggestion.rationale}</p>{suggestion.includesInference ? <p className="mt-2 text-[10px] font-bold text-[#8a7049]">AIの推測を含みます。根拠を確認して判断してください。</p> : null}</div>

      <details className="group mt-3 rounded-xl border border-[#e2e5df] bg-white/75">
        <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-[11px] font-bold text-[#56665b]"><span>根拠を見る</span><ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" /></summary>
        <div className="flex flex-wrap gap-2 border-t border-[#e5e7e2] p-3">{suggestion.evidenceRefs.length ? suggestion.evidenceRefs.map((reference) => <EvidenceLink key={`${reference.type}:${reference.ref}`} reference={reference} index={refIndex} />) : <span className="text-[11px] text-[#747c74]">最新レビュー全体を根拠にした観察候補です。</span>}</div>
      </details>

      {suggestion.draftPayload.kind !== "none" && suggestion.status !== "saved" ? <DraftEditor suggestion={suggestion} action={saveFormAction} pending={saving} state={saveState} /> : null}
      {savedHref ? <Link href={savedHref} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#cddcc9] bg-white px-3 text-[11px] font-bold text-[#4f7356]"><FilePlus2 className="h-3.5 w-3.5" />保存した下書きを開く</Link> : null}

      <form action={feedbackAction} className="mt-3 flex flex-wrap gap-2">
        <input type="hidden" name="suggestion_id" value={suggestion.id} />
        <button name="status" value="accepted" disabled={feedbackPending || suggestion.status === "saved"} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#557b5c] px-3 text-[11px] font-bold text-white disabled:opacity-45"><Check className="h-3.5 w-3.5" />採用</button>
        <button name="status" value="held" disabled={feedbackPending || suggestion.status === "saved"} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#ddd3bf] bg-[#fffaf0] px-3 text-[11px] font-bold text-[#786344] disabled:opacity-45"><Pause className="h-3.5 w-3.5" />保留</button>
        <button name="status" value="dismissed" disabled={feedbackPending || suggestion.status === "saved"} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#ead5ce] bg-[#fff8f5] px-3 text-[11px] font-bold text-[#8b6256] disabled:opacity-45"><X className="h-3.5 w-3.5" />今回は不要</button>
      </form>
      {feedbackState.error ? <p className="mt-2 text-[11px] font-bold text-[#a45549]">{feedbackState.error}</p> : null}
      {feedbackState.message ? <p className="mt-2 text-[11px] font-bold text-[#4e7656]">{feedbackState.message}</p> : null}
    </article>
  );
}

function DraftEditor({ suggestion, action, pending, state }: { suggestion: DailySuggestionItem; action: (payload: FormData) => void; pending: boolean; state: DailyActionState }) {
  const draft = suggestion.draftPayload;
  return (
    <details className="group mt-3 rounded-xl border border-[#d9e3d5] bg-[#f8fbf6]">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-[11px] font-bold text-[#4f7256]"><span className="inline-flex items-center gap-2"><Bookmark className="h-3.5 w-3.5" />詳細を確認・編集して下書き保存</span><ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" /></summary>
      <form action={action} className="grid gap-3 border-t border-[#dfe7dc] p-3">
        <input type="hidden" name="suggestion_id" value={suggestion.id} />
        <input type="hidden" name="category_id" value={draft.category_id ?? ""} />
        <input type="hidden" name="subcategory_id" value={draft.subcategory_id ?? ""} />
        <DraftField label={draft.kind === "plan" ? "プラン名" : "ブロック名"} name="name" defaultValue={draft.name ?? ""} required />
        {draft.kind === "plan" ? <><DraftField label="テーマ" name="theme" defaultValue={draft.theme ?? ""} /><label className="grid gap-1 text-[11px] font-bold text-[#5f6b61]">形式<select name="format" defaultValue={draft.format ?? "group"} className="min-h-10 rounded-lg border border-[#d8ded5] bg-white px-3 text-[12px]"><option value="personal">パーソナル</option><option value="group">グループ</option><option value="online">オンライン</option></select></label><DraftArea label="補足メモ" name="memo" defaultValue={draft.memo ?? ""} /></> : <><DraftField label="目安時間（分）" name="duration_minutes" defaultValue={String(draft.duration_minutes ?? 5)} type="number" required /><DraftField label="目的" name="purpose" defaultValue={draft.purpose ?? ""} /><DraftField label="対象レベル" name="level" defaultValue={draft.level ?? ""} /><DraftArea label="誘導セリフ" name="script" defaultValue={draft.script ?? ""} /><DraftArea label="注意点" name="cautions" defaultValue={draft.cautions ?? ""} /><DraftArea label="改善・補足メモ" name="memo" defaultValue={draft.memo ?? ""} /><DraftField label="タグ（空白区切り）" name="tags" defaultValue={(draft.tags ?? []).join(" ")} /></>}
        <button disabled={pending} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#557b5c] px-3 text-[12px] font-bold text-white disabled:opacity-55"><FilePlus2 className="h-4 w-4" />{pending ? "保存中…" : "下書きとして保存"}</button>
        {state.error ? <p className="text-[11px] font-bold text-[#a45549]">{state.error}</p> : null}
        {state.message ? <p className="text-[11px] font-bold text-[#4e7656]">{state.message}{state.createdHref ? <Link href={state.createdHref} className="ml-2 underline">開く</Link> : null}</p> : null}
      </form>
    </details>
  );
}

function DraftField({ label, name, defaultValue, required = false, type = "text" }: { label: string; name: string; defaultValue: string; required?: boolean; type?: string }) {
  return <label className="grid gap-1 text-[11px] font-bold text-[#5f6b61]">{label}<input name={name} type={type} min={type === "number" ? 1 : undefined} defaultValue={defaultValue} required={required} className="min-h-10 rounded-lg border border-[#d8ded5] bg-white px-3 text-[12px] font-medium" /></label>;
}

function DraftArea({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return <label className="grid gap-1 text-[11px] font-bold text-[#5f6b61]">{label}<textarea name={name} defaultValue={defaultValue} rows={4} className="rounded-lg border border-[#d8ded5] bg-white px-3 py-2 text-[12px] font-medium leading-5" /></label>;
}

function EvidenceLink({ reference, index }: { reference: AiReviewReference; index?: AiReviewReferenceIndex }) {
  const target = index?.[reference.type]?.[reference.ref];
  return target ? <Link href={target.href} className="inline-flex min-h-8 items-center rounded-lg border border-[#dce3d8] bg-white px-2.5 text-[10px] font-bold text-[#52705a] hover:underline">{target.label}</Link> : null;
}

function confidenceLabel(value: DailySuggestionItem["confidence"]) {
  return value === "high" ? "高" : value === "medium" ? "中" : "低";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Tokyo" }).format(new Date(`${value}T12:00:00+09:00`));
}
