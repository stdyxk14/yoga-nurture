"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  ArrowUpRight,
  BookOpenText,
  Check,
  FilePlus2,
  History,
  Layers3,
  MoreHorizontal,
  Pause,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  X,
} from "lucide-react";
import {
  preflightDailySuggestionAction,
  refreshDailySuggestionAction,
  saveDailySuggestionAsBlockDraftAction,
  saveDailySuggestionAsPlanDraftAction,
  setDailySuggestionStatusAction,
  type DailyActionState,
} from "@/app/dashboard/ai-actions";
import { WorkspaceFeedback, WorkspaceStatus } from "@/components/yoga/workspace-kit";
import type { AiReviewReference, AiReviewReferenceIndex } from "@/lib/ai-review/types";
import type { DailySuggestionItem, DailySuggestionState } from "@/lib/daily-suggestions/queries";
import type { DailyCoachSegment } from "@/lib/daily-suggestions/types";

const segmentMeta = {
  lesson_plan: { label: "レッスン案", icon: BookOpenText, accent: "text-[#4f7959]", soft: "bg-[#e8f2e5]" },
  new_block: { label: "ブロック案", icon: Layers3, accent: "text-[#806445]", soft: "bg-[#f4ead9]" },
  student_support: { label: "生徒対応", icon: UserRoundCheck, accent: "text-[#6f638e]", soft: "bg-[#eeeaf6]" },
} as const;

const statusLabels = { pending: "未判断", accepted: "採用", held: "保留", dismissed: "今回は不要", saved: "下書き保存済み" } as const;

export function TodayAiSuggestionPanel({ state }: { state: DailySuggestionState }) {
  const [active, setActive] = useState<DailyCoachSegment>("lesson_plan");
  const [detail, setDetail] = useState<DailySuggestionItem | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const suggestions = new Map(state.suggestions.map((suggestion) => [suggestion.segment, suggestion]));
  const selected = suggestions.get(active) ?? state.suggestions[0] ?? null;

  return (
    <>
      <section className="relative overflow-hidden rounded-[24px] border border-[#d5e1d1] bg-[radial-gradient(circle_at_88%_2%,rgba(205,226,198,0.72),transparent_32%),linear-gradient(145deg,#f5faf2_0%,#fffaf5_72%)] shadow-[0_14px_42px_rgba(57,76,58,0.08)]">
        <div className="absolute -left-16 top-24 h-44 w-44 rounded-full bg-[#e7efe1]/55 blur-3xl" />
        <div className="relative p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-semibold tracking-[0.08em] text-[#6c8b70]">TODAY&apos;S COACH</p>
              <div className="mt-1 flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#537b59]" /><h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#314337]">今日のAIコーチ</h2></div>
              {state.run ? <p className="mt-1 text-[13px] text-[#727b73]">{formatDate(state.run.suggestionDate)}の提案</p> : null}
            </div>
            <button type="button" onClick={() => setManageOpen(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/80 bg-white/70 text-[#617064] shadow-sm transition hover:bg-white" aria-label="AIコーチの履歴と管理"><MoreHorizontal className="h-5 w-5" /></button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2" role="tablist" aria-label="AIコーチ提案の種類">
            {(Object.keys(segmentMeta) as DailyCoachSegment[]).map((segment) => {
              const meta = segmentMeta[segment];
              const suggestion = suggestions.get(segment);
              const Icon = meta.icon;
              const isActive = selected?.segment === segment;
              return (
                <button
                  key={segment}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(segment)}
                  className={`min-w-0 rounded-xl border px-3 py-2.5 text-left transition ${isActive ? "border-[#bdcfb9] bg-white shadow-[0_5px_18px_rgba(70,88,69,0.08)]" : "border-white/70 bg-white/45 hover:bg-white/75"}`}
                >
                  <span className="flex items-center gap-2"><span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${meta.soft} ${meta.accent}`}><Icon className="h-4 w-4" /></span><span className="truncate text-[13px] font-semibold text-[#3f4d42]">{meta.label}</span><span className="ml-auto rounded-full bg-[#f1f3ee] px-2 py-0.5 text-[12px] font-semibold text-[#6d756e]">{suggestion ? 1 : 0}</span></span>
                  <span className="mt-1.5 hidden truncate text-[12px] text-[#778078] sm:block">{suggestion?.title ?? "次回生成を待っています"}</span>
                </button>
              );
            })}
          </div>

          {state.latestRun?.status === "running" ? <div className="mt-3"><WorkspaceFeedback tone="info">新しい提案を準備中です。現在の提案はそのまま確認できます。</WorkspaceFeedback></div> : null}
          {state.latestRun?.status === "failed" && state.suggestions.length ? <div className="mt-3"><WorkspaceFeedback tone="error">最新の生成は完了しませんでした。保存済みの提案を表示しています。</WorkspaceFeedback></div> : null}

          {selected ? (
            <article className="mt-4 min-h-[220px] rounded-2xl border border-white/85 bg-white/78 p-4 shadow-[0_8px_26px_rgba(68,82,66,0.06)] backdrop-blur-sm sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-[#59705e]">{segmentMeta[selected.segment].label}</span>
                <WorkspaceStatus tone={selected.status === "dismissed" ? "coral" : selected.status === "held" ? "sand" : "green"}>{statusLabels[selected.status]}</WorkspaceStatus>
              </div>
              <h3 className="mt-3 text-[20px] font-bold leading-7 tracking-[-0.02em] text-[#304137]">{selected.title}</h3>
              <p className="mt-2 line-clamp-3 max-w-3xl text-[14px] leading-6 text-[#5d685f]">{selected.summary}</p>
              <p className="mt-3 text-[13px] text-[#6d766e]"><span className="font-semibold text-[#46564a]">対象:</span> {targetLabel(selected, state.run?.references)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => setDetail(selected)} className="inline-flex h-10 items-center justify-center rounded-xl border border-[#ccd9c8] bg-white px-4 text-[13px] font-semibold text-[#4f7156] transition hover:border-[#aebfaa]">詳しく見る</button>
                {selected.segment === "lesson_plan" || selected.segment === "new_block" ? (
                  <button type="button" onClick={() => setDetail(selected)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#557b5c] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#476c50]"><FilePlus2 className="h-4 w-4" />下書きを確認</button>
                ) : <QuickStudentActions suggestion={selected} />}
              </div>
            </article>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-[#cbd9c7] bg-white/65 p-5">
              <h3 className="text-[16px] font-semibold text-[#35503a]">新しいAIコーチ提案はまだありません</h3>
              <p className="mt-2 text-[14px] leading-6 text-[#657067]">最新の柔軟レビューを根拠に、レッスン案・新規ブロック案・生徒対応案を1件ずつ準備します。ホームを開いただけではAI生成しません。</p>
            </div>
          )}

          {state.run?.maintenanceCandidates.length ? (
            <details className="mt-3 rounded-xl border border-[#e3dfd6] bg-white/52 px-3.5 py-2.5">
              <summary className="cursor-pointer text-[12px] font-semibold text-[#6c7068]">改善・整備候補（{state.run.maintenanceCandidates.length}件）</summary>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">{state.run.maintenanceCandidates.map((item) => <Link key={item.href} href={item.href} className="rounded-lg bg-white/80 px-3 py-2 text-[12px] text-[#5e685f] hover:underline"><span className="font-semibold text-[#445348]">{item.title}</span><span className="mt-0.5 block">{item.reason}</span></Link>)}</div>
            </details>
          ) : null}
        </div>
      </section>

      {detail ? <SuggestionDialog suggestion={detail} references={state.run?.references} onClose={() => setDetail(null)} /> : null}
      {manageOpen ? <CoachManagementDialog state={state} onClose={() => setManageOpen(false)} /> : null}
    </>
  );
}

function SuggestionDialog({ suggestion, references, onClose }: { suggestion: DailySuggestionItem; references?: AiReviewReferenceIndex; onClose: () => void }) {
  const [feedbackState, feedbackAction, feedbackPending] = useActionState<DailyActionState, FormData>(setDailySuggestionStatusAction, {});
  const saveAction = suggestion.draftPayload.kind === "block" ? saveDailySuggestionAsBlockDraftAction : saveDailySuggestionAsPlanDraftAction;
  const [saveState, saveFormAction, saving] = useActionState<DailyActionState, FormData>(saveAction, {});
  const savedHref = suggestion.savedPlanId ? `/lessons/${suggestion.savedPlanId}/edit` : suggestion.savedBlockTemplateId ? `/blocks/${suggestion.savedBlockTemplateId}` : null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#243028]/45 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby={`coach-title-${suggestion.id}`} className="max-h-[92vh] w-full max-w-[960px] overflow-y-auto rounded-[24px] border border-white/70 bg-[#fffdf9] shadow-[0_30px_90px_rgba(31,43,34,0.28)]">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e8e2d9] bg-[#fffdf9]/95 p-4 backdrop-blur sm:p-5">
          <div><p className="text-[12px] font-semibold tracking-[0.06em] text-[#65806a]">{segmentMeta[suggestion.segment].label}</p><h2 id={`coach-title-${suggestion.id}`} className="mt-1 text-[21px] font-bold leading-7 text-[#314137]">{suggestion.title}</h2></div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#deddd6] bg-white text-[#616a62]" aria-label="閉じる"><X className="h-5 w-5" /></button>
        </header>
        <div className="space-y-5 p-4 sm:p-6">
          <section><h3 className="text-[14px] font-semibold text-[#415045]">提案の内容</h3><p className="mt-2 text-[14px] leading-7 text-[#5d665e]">{suggestion.summary}</p></section>
          <section className="rounded-xl border border-[#e3e4dc] bg-[#f8faf6] p-4"><h3 className="text-[14px] font-semibold text-[#415045]">なぜ今この提案なのか</h3><p className="mt-2 text-[14px] leading-7 text-[#5d665e]">{suggestion.rationale}</p><EvidenceLinks references={suggestion.evidenceRefs} index={references} /></section>

          {suggestion.draftPayload.kind !== "none" && suggestion.status !== "saved" ? (
            <DraftForm suggestion={suggestion} references={references} action={saveFormAction} pending={saving} state={saveState} />
          ) : null}
          {savedHref ? <Link href={savedHref} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#cddcc9] bg-white px-4 text-[13px] font-semibold text-[#4f7356]"><FilePlus2 className="h-4 w-4" />保存した下書きを開く</Link> : null}

          <form action={feedbackAction} className="flex flex-wrap gap-2 border-t border-[#e8e2d9] pt-4">
            <input type="hidden" name="suggestion_id" value={suggestion.id} />
            <button name="status" value="accepted" disabled={feedbackPending || suggestion.status === "saved"} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#557b5c] px-4 text-[13px] font-semibold text-white disabled:opacity-45"><Check className="h-4 w-4" />採用</button>
            <button name="status" value="held" disabled={feedbackPending || suggestion.status === "saved"} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#ddd3bf] bg-[#fffaf0] px-4 text-[13px] font-semibold text-[#786344] disabled:opacity-45"><Pause className="h-4 w-4" />保留</button>
            <button name="status" value="dismissed" disabled={feedbackPending || suggestion.status === "saved"} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#ead5ce] bg-[#fff8f5] px-4 text-[13px] font-semibold text-[#8b6256] disabled:opacity-45"><X className="h-4 w-4" />今回は不要</button>
          </form>
          {feedbackState.error ? <WorkspaceFeedback tone="error">{feedbackState.error}</WorkspaceFeedback> : null}
          {feedbackState.message ? <WorkspaceFeedback tone="success">{feedbackState.message}</WorkspaceFeedback> : null}
        </div>
      </section>
    </div>
  );
}

function DraftForm({ suggestion, references, action, pending, state }: { suggestion: DailySuggestionItem; references?: AiReviewReferenceIndex; action: (payload: FormData) => void; pending: boolean; state: DailyActionState }) {
  const draft = suggestion.draftPayload;
  return (
    <form action={action} className="rounded-2xl border border-[#d9e3d5] bg-[#f7faf5] p-4 sm:p-5">
      <input type="hidden" name="suggestion_id" value={suggestion.id} />
      <input type="hidden" name="category_id" value={draft.category_id ?? ""} />
      <input type="hidden" name="subcategory_id" value={draft.subcategory_id ?? ""} />
      <div className="mb-4"><h3 className="text-[16px] font-semibold text-[#3e4f42]">下書き内容を確認・編集</h3><p className="mt-1 text-[13px] text-[#6d756e]">保存するまで既存のプランやブロックは変更されません。</p></div>
      <div className="grid gap-4">
        <DraftField label={draft.kind === "plan" ? "プラン名" : "ブロック名"} name="name" defaultValue={draft.name ?? ""} required />
        {draft.kind === "plan" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2"><DraftField label="テーマ" name="theme" defaultValue={draft.theme ?? ""} required /><label className="grid gap-1.5 text-[13px] font-semibold text-[#58655b]">形式<select name="format" defaultValue={draft.format ?? "group"} className="h-11 rounded-xl border border-[#d5ddd2] bg-white px-3 text-[14px]"><option value="personal">パーソナル</option><option value="group">グループ</option><option value="online">オンライン</option></select></label></div>
            <DraftField label="対象者" name="target" defaultValue={draft.target ?? ""} />
            <DraftArea label="全体の狙い" name="overall_goal" defaultValue={draft.overall_goal ?? ""} />
            <DraftArea label="強度の流れ" name="intensity_flow" defaultValue={draft.intensity_flow ?? ""} />
            <div><h4 className="text-[13px] font-semibold text-[#58655b]">ブロック構成と時間</h4><div className="mt-2 divide-y divide-[#e0e6dd] rounded-xl border border-[#dbe2d8] bg-white">{(draft.blocks ?? []).map((block, index) => <div key={`${block.block_template_id}-${index}`} className="grid grid-cols-[32px_minmax(0,1fr)_92px] items-center gap-2 px-3 py-2.5"><span className="text-[12px] font-semibold text-[#819083]">{index + 1}</span><div className="min-w-0"><input type="hidden" name="block_template_id" value={block.block_template_id} /><p className="truncate text-[13px] font-semibold text-[#425047]">{references?.block?.[block.block_template_id]?.label ?? "ブロック"}</p></div><label className="flex items-center gap-1 text-[12px] text-[#667067]"><input name="block_minutes" type="number" min={1} max={180} defaultValue={block.planned_duration_minutes} className="h-9 w-16 rounded-lg border border-[#d5ddd2] px-2 text-[13px]" />分</label></div>)}</div></div>
            <DraftArea label="補足メモ" name="memo" defaultValue={draft.memo ?? ""} />
          </>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2"><DraftField label="目安時間（分）" name="duration_minutes" defaultValue={String(draft.duration_minutes ?? 8)} type="number" required /><DraftField label="対象レベル" name="level" defaultValue={draft.level ?? ""} required /></div>
            <DraftField label="目的" name="purpose" defaultValue={draft.purpose ?? ""} required />
            <DraftField label="対象" name="target" defaultValue={draft.target ?? ""} />
            <DraftArea label="実施内容" name="content" defaultValue={draft.content ?? ""} />
            <DraftArea label="誘導セリフ" name="script" defaultValue={draft.script ?? ""} />
            <DraftArea label="注意点" name="cautions" defaultValue={draft.cautions ?? ""} />
            <DraftField label="使いやすいレッスン" name="suitable_lessons" defaultValue={draft.suitable_lessons ?? ""} />
            <DraftField label="タグ（空白区切り）" name="tags" defaultValue={(draft.tags ?? []).join(" ")} />
            <DraftArea label="補足メモ" name="memo" defaultValue={draft.memo ?? ""} />
          </>
        )}
      </div>
      <button disabled={pending} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#557b5c] px-4 text-[14px] font-semibold text-white disabled:opacity-55"><FilePlus2 className="h-4 w-4" />{pending ? "保存中…" : "下書きとして保存"}</button>
      {state.error ? <div className="mt-3"><WorkspaceFeedback tone="error">{state.error}</WorkspaceFeedback></div> : null}
      {state.message ? <div className="mt-3"><WorkspaceFeedback tone="success">{state.message}{state.createdHref ? <Link href={state.createdHref} className="ml-2 underline">開く</Link> : null}</WorkspaceFeedback></div> : null}
    </form>
  );
}

function CoachManagementDialog({ state, onClose }: { state: DailySuggestionState; onClose: () => void }) {
  const [refreshState, refreshAction, refreshing] = useActionState<DailyActionState, FormData>(refreshDailySuggestionAction, {});
  const [preflightState, preflightAction, preflighting] = useActionState<DailyActionState, FormData>(preflightDailySuggestionAction, {});
  const currentIds = new Set(state.suggestions.map((item) => item.id));
  const history = state.history.filter((item) => !currentIds.has(item.id));
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#243028]/45 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="coach-management-title" className="max-h-[88vh] w-full max-w-[720px] overflow-y-auto rounded-[24px] bg-[#fffdf9] shadow-[0_30px_90px_rgba(31,43,34,0.28)]">
        <header className="flex items-start justify-between gap-3 border-b border-[#e8e2d9] p-5"><div><p className="text-[12px] font-semibold tracking-[0.06em] text-[#6d806f]">管理</p><h2 id="coach-management-title" className="mt-1 text-[20px] font-bold">AIコーチの更新と履歴</h2></div><button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#deddd6] bg-white" aria-label="閉じる"><X className="h-5 w-5" /></button></header>
        <div className="space-y-5 p-5">
          <div className="flex flex-wrap gap-2"><form action={refreshAction}><button disabled={refreshing} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#557b5c] px-4 text-[13px] font-semibold text-white disabled:opacity-55"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />{refreshing ? "生成中…" : "提案を再生成"}</button></form><form action={preflightAction}><button disabled={preflighting} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d5ddd1] bg-white px-4 text-[13px] font-semibold text-[#55715b] disabled:opacity-55"><ShieldCheck className="h-4 w-4" />{preflighting ? "確認中…" : "モデル接続を確認"}</button></form></div>
          {refreshState.error ? <WorkspaceFeedback tone="error">{refreshState.error}</WorkspaceFeedback> : null}
          {refreshState.message ? <WorkspaceFeedback tone={refreshState.ok ? "success" : "info"}>{refreshState.message}</WorkspaceFeedback> : null}
          {preflightState.error ? <WorkspaceFeedback tone="error">{preflightState.error}</WorkspaceFeedback> : null}
          {preflightState.message ? <WorkspaceFeedback tone="success">モデル接続を確認しました。</WorkspaceFeedback> : null}
          <section><h3 className="flex items-center gap-2 text-[15px] font-semibold"><History className="h-4 w-4" />過去の提案</h3>{history.length ? <div className="mt-3 divide-y divide-[#ebe5dc] rounded-xl border border-[#e5e0d7] bg-white">{history.slice(0, 24).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 p-3"><div className="min-w-0"><p className="truncate text-[13px] font-semibold text-[#3f4b42]">{item.title}</p><p className="mt-0.5 text-[12px] text-[#767e77]">{formatDate(item.suggestionDate)}・{segmentMeta[item.segment].label}</p></div><WorkspaceStatus tone={item.status === "dismissed" ? "coral" : item.status === "held" ? "sand" : "green"}>{statusLabels[item.status]}</WorkspaceStatus></div>)}</div> : <p className="mt-3 text-[13px] text-[#737b74]">新形式の過去提案はまだありません。</p>}</section>
        </div>
      </section>
    </div>
  );
}

function QuickStudentActions({ suggestion }: { suggestion: DailySuggestionItem }) {
  const [state, action, pending] = useActionState<DailyActionState, FormData>(setDailySuggestionStatusAction, {});
  return <div><form action={action} className="flex gap-2"><input type="hidden" name="suggestion_id" value={suggestion.id} /><button name="status" value="accepted" disabled={pending || suggestion.status === "saved"} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#557b5c] px-4 text-[13px] font-semibold text-white disabled:opacity-45"><Check className="h-4 w-4" />採用</button><button name="status" value="held" disabled={pending || suggestion.status === "saved"} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#ddd3bf] bg-[#fffaf0] px-4 text-[13px] font-semibold text-[#786344] disabled:opacity-45"><Pause className="h-4 w-4" />保留</button></form>{state.error ? <p className="mt-1 text-[12px] text-[#a45549]">{state.error}</p> : null}{state.message ? <p className="mt-1 text-[12px] text-[#4e7656]">{state.message}</p> : null}</div>;
}

function DraftField({ label, name, defaultValue, required = false, type = "text" }: { label: string; name: string; defaultValue: string; required?: boolean; type?: string }) {
  return <label className="grid gap-1.5 text-[13px] font-semibold text-[#58655b]">{label}<input name={name} type={type} min={type === "number" ? 1 : undefined} defaultValue={defaultValue} required={required} className="h-11 rounded-xl border border-[#d5ddd2] bg-white px-3 text-[14px]" /></label>;
}

function DraftArea({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return <label className="grid gap-1.5 text-[13px] font-semibold text-[#58655b]">{label}<textarea name={name} defaultValue={defaultValue} rows={4} className="rounded-xl border border-[#d5ddd2] bg-white px-3 py-2.5 text-[14px] leading-6" /></label>;
}

function EvidenceLinks({ references, index }: { references: AiReviewReference[]; index?: AiReviewReferenceIndex }) {
  const links = references
    .map((reference) => index?.[reference.type]?.[reference.ref])
    .filter((target): target is NonNullable<typeof target> => Boolean(target));
  if (!links.length) return null;
  return <div className="mt-3 flex flex-wrap gap-2">{links.map((target) => <Link key={`${target.href}-${target.id}`} href={target.href} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#d8e0d5] bg-white px-3 text-[12px] font-semibold text-[#52705a] hover:underline">{target.label}<ArrowUpRight className="h-3.5 w-3.5" /></Link>)}</div>;
}

function targetLabel(suggestion: DailySuggestionItem, references?: AiReviewReferenceIndex) {
  if (suggestion.draftPayload.target) return suggestion.draftPayload.target;
  const students = suggestion.evidenceRefs.map((reference) => reference.type === "student" ? references?.student?.[reference.ref]?.label : null).filter(Boolean);
  if (students.length) return students.join("・");
  return suggestion.segment === "student_support" ? "次回参加する生徒・クラス全体" : "最近のレッスンと次回クラス";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric", timeZone: "Asia/Tokyo" }).format(new Date(`${value.slice(0, 10)}T12:00:00+09:00`));
}
