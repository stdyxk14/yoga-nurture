"use client";

import Link from "next/link";
import { useActionState, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, FileText, ListChecks, MessageSquareText, Users } from "lucide-react";
import { saveLessonRecordAction } from "@/app/lessons/[id]/record/actions";
import type { ImprovisedItemInput } from "@/components/yoga/improvised-item-dialog";
import { LessonRecordFlowStep } from "@/components/yoga/lesson-record-flow-step";
import { LessonRecordFooter } from "@/components/yoga/lesson-record-footer";
import { LessonRecordReflectionStep } from "@/components/yoga/lesson-record-reflection-step";
import { LessonRecordStudentsStep, type LessonRecordStudentEditorItem } from "@/components/yoga/lesson-record-students-step";
import type { StudentAiSuggestionState } from "@/lib/ai-suggestions";
import type { DbBlockTemplate } from "@/lib/blocks";
import { markUnconfirmedItemsAsPlanned, moveLessonExecutionItem } from "@/lib/lesson-record-flow";
import type { LessonRecordBlockFormItem, LessonRecordFormData, LessonRecordFormState } from "@/lib/lesson-records";
import { cn } from "@/lib/utils";

const initialState: LessonRecordFormState = {};
const steps = [
  { id: 1, label: "実施フロー", icon: ListChecks },
  { id: 2, label: "生徒ごとの記録", icon: Users },
  { id: 3, label: "全体の振り返り", icon: MessageSquareText },
] as const;

export function LessonRecordForm({
  data,
  aiSuggestionState,
  draftSaved = false,
}: {
  data: LessonRecordFormData;
  aiSuggestionState?: StudentAiSuggestionState;
  draftSaved?: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveLessonRecordAction, initialState);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [detailedMode, setDetailedMode] = useState(false);
  const [blocks, setBlocks] = useState<LessonRecordBlockFormItem[]>(data.blocks);
  const [students, setStudents] = useState<LessonRecordStudentEditorItem[]>(() => data.students.map((student) => ({
    ...student,
    pendingFollowUps: student.pendingFollowUps.map((follow) => ({ ...follow, status: "pending" as const, note: "" })),
  })));
  const [reflection, setReflection] = useState({
    overallMemo: data.record?.overallMemo ?? "",
    overallReaction: data.record?.overallReaction ?? "",
    improvementPoints: data.record?.improvementPoints ?? "",
  });
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [completionError, setCompletionError] = useState<number>();
  const completeSubmitRef = useRef<HTMLButtonElement>(null);

  const schedule = data.schedule;
  const legacyRecord = useMemo(() => Boolean(data.record && blocks.some((block) => (block.itemSource === "planned" && !block.schedulePlanItemId) || (block.done !== null && block.changeType === null))), [blocks, data.record]);

  if (!schedule) {
    return (
      <div className="rounded-xl border border-[#dfe5da] bg-white p-8 text-center">
        <p className="text-lg font-semibold">予定が見つかりません</p>
        <p className="mt-2 text-sm text-[#687166]">削除済み、または現在のアカウントでは表示できない予定です。</p>
        <Link href="/lessons" className="mt-4 inline-flex h-10 items-center rounded-lg bg-[#5d956d] px-4 text-sm font-medium text-white">レッスン管理へ戻る</Link>
      </div>
    );
  }

  function updateBlock(fieldId: string, patch: Partial<LessonRecordBlockFormItem>) {
    setBlocks((current) => current.map((block) => block.fieldId === fieldId ? { ...block, ...patch } : block));
    setCompletionError(undefined);
  }

  function reorderBlocks(fromIndex: number, toIndex: number) {
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= blocks.length || toIndex >= blocks.length || fromIndex === toIndex) return;
    setBlocks((current) => current[fromIndex] ? moveLessonExecutionItem(current, current[fromIndex].fieldId, toIndex) : current);
  }

  function prepareReplacement(current: LessonRecordBlockFormItem[], replacesSchedulePlanItemId: string | null) {
    if (!replacesSchedulePlanItemId) return current;
    return current.map((block) => block.schedulePlanItemId === replacesSchedulePlanItemId && block.itemSource === "planned"
      ? { ...block, changeType: "replaced" as const, done: false, actualMinutes: null }
      : block);
  }

  function insertExtra(item: LessonRecordBlockFormItem, replacesSchedulePlanItemId: string | null) {
    setBlocks((current) => {
      const prepared = prepareReplacement(current, replacesSchedulePlanItemId);
      const sourceIndex = replacesSchedulePlanItemId ? prepared.findIndex((block) => block.schedulePlanItemId === replacesSchedulePlanItemId && block.itemSource === "planned") : -1;
      const insertAt = sourceIndex >= 0 ? sourceIndex + 1 : prepared.length;
      const next = [...prepared];
      next.splice(insertAt, 0, item);
      return next.map((block, index) => ({ ...block, sortOrder: index }));
    });
  }

  function addLibrary(block: DbBlockTemplate, replacesSchedulePlanItemId: string | null) {
    const fieldId = crypto.randomUUID();
    insertExtra({
      ...block,
      fieldId,
      planBlockId: null,
      schedulePlanItemId: null,
      blockTemplateId: block.id,
      itemSource: "library",
      recordBlockId: undefined,
      sortOrder: 0,
      plannedSortOrder: null,
      plannedMinutes: block.durationMinutes,
      changeType: "added",
      changeReasonCodes: [],
      changeReasonNote: "",
      actualContentNote: "",
      replacesSchedulePlanItemId,
      done: true,
      actualMinutes: block.durationMinutes,
      reaction: null,
      teacherMemo: "",
      improvementMemo: "",
      useAgain: null,
      reviseScript: false,
      scriptRevision: "",
    }, replacesSchedulePlanItemId);
    setExpandedIds((current) => new Set(current).add(fieldId));
  }

  function addImprovised(input: ImprovisedItemInput, replacesSchedulePlanItemId: string | null) {
    const fieldId = crypto.randomUUID();
    const now = new Date().toISOString();
    insertExtra({
      id: `improvised-${fieldId}`,
      fieldId,
      name: input.name,
      categoryId: input.categoryId,
      subcategoryId: input.subcategoryId,
      majorCategory: input.majorCategory,
      minorCategory: input.minorCategory,
      duration: input.actualMinutes === null ? "未入力" : `${input.actualMinutes}分`,
      durationMinutes: input.actualMinutes ?? 0,
      purpose: input.purpose,
      level: input.level,
      cautions: input.cautions,
      script: input.script,
      tags: input.tags,
      memo: input.memo,
      usageCount: 0,
      averageRating: 0,
      goodRate: null,
      improvementCount: 0,
      skipCount: 0,
      lastUsed: "未使用",
      lastUsedAt: "",
      archived: false,
      favorite: false,
      createdAt: now,
      updatedAt: now,
      planBlockId: null,
      schedulePlanItemId: null,
      blockTemplateId: null,
      itemSource: "improvised",
      recordBlockId: undefined,
      sortOrder: 0,
      plannedSortOrder: null,
      plannedMinutes: 0,
      changeType: "added",
      changeReasonCodes: input.reasonCodes,
      changeReasonNote: input.reasonNote,
      actualContentNote: input.actualContentNote,
      replacesSchedulePlanItemId,
      done: true,
      actualMinutes: input.actualMinutes,
      reaction: null,
      teacherMemo: "",
      improvementMemo: "",
      useAgain: null,
      reviseScript: false,
      scriptRevision: "",
    }, replacesSchedulePlanItemId);
    setExpandedIds((current) => new Set(current).add(fieldId));
  }

  function deleteExtra(fieldId: string) {
    const target = blocks.find((block) => block.fieldId === fieldId);
    if (!target || target.itemSource === "planned") return;
    if (target.recordBlockId && !window.confirm(`保存済みの「${target.name}」を実施記録から削除しますか？`)) return;
    setBlocks((current) => {
      const next = current.filter((block) => block.fieldId !== fieldId).map((block) => target.replacesSchedulePlanItemId && block.schedulePlanItemId === target.replacesSchedulePlanItemId
        ? { ...block, changeType: null, done: null, actualMinutes: null }
        : block);
      return next.map((block, index) => ({ ...block, sortOrder: index }));
    });
  }

  function cancelReplacement(sourceFieldId: string) {
    const source = blocks.find((block) => block.fieldId === sourceFieldId);
    if (!source?.schedulePlanItemId) return;
    const savedReplacement = blocks.find((block) => block.replacesSchedulePlanItemId === source.schedulePlanItemId && block.recordBlockId);
    if (savedReplacement && !window.confirm("保存済みの置き換え内容を削除し、元の予定項目を未確認へ戻しますか？")) return;
    setBlocks((current) => current
      .filter((block) => block.replacesSchedulePlanItemId !== source.schedulePlanItemId)
      .map((block) => block.fieldId === sourceFieldId ? { ...block, changeType: null, done: null, actualMinutes: null } : block)
      .map((block, index) => ({ ...block, sortOrder: index })));
  }

  function toggleExpanded(fieldId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(fieldId)) next.delete(fieldId); else next.add(fieldId);
      return next;
    });
  }

  function completeRecord() {
    const unresolved = blocks.filter((block) => block.itemSource === "planned" && block.done === null).length;
    if (unresolved) {
      setCompletionError(unresolved);
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    completeSubmitRef.current?.click();
  }

  function guardSubmit(event: FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.value !== "completed") return;
    const unresolved = blocks.filter((block) => block.itemSource === "planned" && block.done === null).length;
    if (!unresolved) return;
    event.preventDefault();
    setCompletionError(unresolved);
    setStep(1);
  }

  const blocksPayload = JSON.stringify(blocks.map((block, index) => ({
    field_id: block.fieldId,
    record_block_id: block.recordBlockId ?? null,
    schedule_plan_item_id: block.schedulePlanItemId,
    block_template_id: block.blockTemplateId,
    lesson_plan_block_id: block.planBlockId,
    item_source: block.itemSource,
    sort_order: index,
    display_name_snapshot: block.name,
    category_name_snapshot: block.majorCategory,
    subcategory_name_snapshot: block.minorCategory,
    planned_duration_minutes: block.plannedMinutes,
    purpose_snapshot: block.purpose,
    level_snapshot: block.level,
    script_snapshot: block.script,
    cautions_snapshot: block.cautions,
    memo_snapshot: block.memo,
    tags_snapshot: block.tags,
    change_type: block.changeType,
    change_reason_codes: block.changeReasonCodes,
    change_reason_note: block.changeReasonNote,
    actual_content_note: block.actualContentNote,
    replaces_schedule_plan_item_id: block.replacesSchedulePlanItemId,
    done: block.done,
    actual_duration_minutes: block.actualMinutes,
    reaction: block.reaction,
    teacher_memo: block.teacherMemo,
    improvement_memo: block.improvementMemo,
    use_again: block.useAgain,
    script_revision: block.reviseScript ? block.scriptRevision : null,
  })));
  const studentsPayload = JSON.stringify(students.map((student) => ({ student_id: student.id, attendance_status: student.attendanceStatus, condition: student.todayNote, memo: student.personalMemo, next_follow: student.nextFollow })));
  const followUpsPayload = JSON.stringify(students.flatMap((student) => student.pendingFollowUps.map((follow) => ({ id: follow.id, status: follow.status, note: follow.note }))));

  return (
    <form action={formAction} onSubmit={guardSubmit} className="space-y-4 pb-28">
      <input type="hidden" name="schedule_id" value={schedule.id} />
      <input type="hidden" name="record_id" value={data.record?.id ?? ""} />
      <input type="hidden" name="overall_memo" value={reflection.overallMemo} />
      <input type="hidden" name="overall_reaction" value={reflection.overallReaction} />
      <input type="hidden" name="improvement_points" value={reflection.improvementPoints} />
      <input type="hidden" name="blocks_payload" value={blocksPayload} />
      <input type="hidden" name="students_payload" value={studentsPayload} />
      <input type="hidden" name="previous_followups_payload" value={followUpsPayload} />
      <button ref={completeSubmitRef} type="submit" name="status" value="completed" className="hidden" tabIndex={-1}>完了</button>

      <header className="rounded-xl border border-[#dfe5da] bg-[#fbfaf6] p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold text-[#2f342e]">実施後記録</h1>{legacyRecord ? <span className="rounded-full bg-[#eeece7] px-2 py-1 text-xs text-[#656b64]">旧形式の記録</span> : null}</div>
            <p className="mt-2 text-[15px] font-medium">{schedule.lessonName}</p>
            <p className="mt-1 text-sm text-[#687166]">{schedule.dateLabel} {schedule.startTimeLabel}–{schedule.endTimeLabel} / {schedule.place || "場所未設定"} / {schedule.lessonPlanName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/schedules/${schedule.id}`} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#dfe3da] bg-white px-3 text-sm font-medium text-[#4f6f55]"><ArrowLeft className="h-4 w-4" />予定詳細</Link>
            {schedule.lessonPlanId ? <Link href={`/schedules/${schedule.id}/script`} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#ded7ef] bg-[#faf7ff] px-3 text-sm font-medium text-[#665ca4]"><FileText className="h-4 w-4" />原稿を見る</Link> : null}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-[#e5e4dc] pt-4 lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label="記録ステップ" className="grid flex-1 grid-cols-3 overflow-hidden rounded-lg border border-[#dfe3da] bg-white">
            {steps.map((item) => {
              const Icon = item.icon;
              return <button key={item.id} type="button" onClick={() => setStep(item.id)} aria-current={step === item.id ? "step" : undefined} className={cn("flex min-h-12 items-center justify-center gap-2 border-r border-[#dfe3da] px-2 text-sm font-medium last:border-r-0", step === item.id ? "bg-[#eaf3e8] text-[#3f6647]" : "text-[#687166] hover:bg-[#f6f8f4]")}><span className="hidden text-xs text-[#7a8278] md:inline">STEP {item.id}</span><Icon className="h-4 w-4" /><span>{item.label}</span></button>;
            })}
          </nav>
          <div className="inline-flex w-fit rounded-lg border border-[#dfe3da] bg-white p-1" role="group" aria-label="記録モード">
            <button type="button" onClick={() => setDetailedMode(false)} aria-pressed={!detailedMode} className={cn("h-8 rounded-md px-3 text-sm font-medium", !detailedMode ? "bg-[#7469bf] text-white" : "text-[#687166]")}>かんたん</button>
            <button type="button" onClick={() => setDetailedMode(true)} aria-pressed={detailedMode} className={cn("h-8 rounded-md px-3 text-sm font-medium", detailedMode ? "bg-[#7469bf] text-white" : "text-[#687166]")}>詳細</button>
          </div>
        </div>
      </header>

      {draftSaved ? <p role="status" className="rounded-lg border border-[#b9d3b7] bg-[#edf7ea] px-4 py-3 text-sm font-medium text-[#3f6647]">下書きを保存しました。</p> : null}
      {state.error ? <p role="alert" className="rounded-lg border border-[#efc9c0] bg-[#fff0ea] px-4 py-3 text-sm font-medium text-[#b84a38]">{state.error}</p> : null}

      <main>
        {step === 1 ? (
          <LessonRecordFlowStep
            blocks={blocks}
            blockLibrary={data.blockLibrary}
            categories={data.blockCategories}
            detailedMode={detailedMode}
            expandedIds={expandedIds}
            completionError={completionError}
            onClearCompletionError={() => setCompletionError(undefined)}
            onToggleExpanded={toggleExpanded}
            onUpdate={updateBlock}
            onReorder={reorderBlocks}
            onDelete={deleteExtra}
            onBulkAsPlanned={() => { setBlocks((current) => markUnconfirmedItemsAsPlanned(current) as LessonRecordBlockFormItem[]); setCompletionError(undefined); }}
            onAddLibrary={addLibrary}
            onAddImprovised={addImprovised}
            onCancelReplacement={cancelReplacement}
            onTemplateCreated={(fieldId, blockTemplateId) => updateBlock(fieldId, { blockTemplateId })}
          />
        ) : null}
        {step === 2 ? <LessonRecordStudentsStep students={students} detailedMode={detailedMode} onChange={setStudents} /> : null}
        {step === 3 ? <LessonRecordReflectionStep recordId={data.record?.id} {...reflection} aiSuggestionState={aiSuggestionState} onChange={(patch) => setReflection((current) => ({ ...current, ...patch }))} /> : null}
      </main>

      <LessonRecordFooter step={step} pending={pending} onPrevious={() => setStep((current) => Math.max(1, current - 1) as 1 | 2 | 3)} onNext={() => setStep((current) => Math.min(3, current + 1) as 1 | 2 | 3)} onComplete={completeRecord} />
    </form>
  );
}
