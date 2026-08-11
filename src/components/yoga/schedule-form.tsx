"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, FileText, Save, UsersRound } from "lucide-react";
import { createScheduleAction } from "@/app/schedules/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { StudentRecord } from "@/components/yoga/records";
import {
  WorkspaceAction,
  WorkspaceActionBar,
  WorkspaceEmptyState,
  WorkspaceFeedback,
  WorkspaceField,
  WorkspaceFormSection,
  WorkspacePageHeader,
  WorkspaceStatus,
} from "@/components/yoga/workspace-kit";
import type { DbLessonPlan } from "@/lib/lesson-plans";
import type { DbSchedule, ScheduleFormState } from "@/lib/schedules";

type Props = {
  plans: DbLessonPlan[];
  students: StudentRecord[];
  initialPlanId?: string;
  schedule?: DbSchedule;
  action?: (state: ScheduleFormState, formData: FormData) => Promise<ScheduleFormState>;
  mode?: "create" | "edit";
};

const initialState: ScheduleFormState = {};
const lessonFormatOptions = [
  { value: "group", label: "グループ" },
  { value: "personal", label: "パーソナル" },
  { value: "online", label: "オンライン" },
] as const;
const scheduleStatusOptions = [
  { value: "scheduled", label: "予定" },
  { value: "preparing", label: "事前準備中" },
  { value: "prepared", label: "事前準備済み" },
  { value: "record_pending", label: "記録待ち" },
  { value: "recorded", label: "記録済み" },
] as const;

export function ScheduleForm({ plans, students, initialPlanId, schedule, action = createScheduleAction, mode = "create" }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const initialSelectedPlanId = schedule?.lessonPlanId ?? initialPlanId;
  const [selectedPlanId, setSelectedPlanId] = useState(
    initialSelectedPlanId && plans.some((plan) => plan.id === initialSelectedPlanId) ? initialSelectedPlanId : plans[0]?.id ?? "",
  );
  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlanId), [plans, selectedPlanId]);
  const defaultDate = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
  const selectedStudentIds = new Set(schedule?.participants.map((student) => student.id) ?? []);
  const startsAt = schedule ? toTokyoInputValues(schedule.startsAt) : null;
  const endsAt = schedule ? toTokyoInputValues(schedule.endsAt) : null;
  const isEdit = mode === "edit";
  const cancelHref = schedule ? `/schedules/${schedule.id}` : "/lessons";

  return (
    <form action={formAction} aria-busy={pending} className="mx-auto max-w-[1320px] space-y-4 pb-10">
      <WorkspacePageHeader
        title={isEdit ? "レッスン予定を編集" : "レッスン予定を登録"}
        description={isEdit ? "日時・場所・参加予定生徒を更新します。" : "保存済みのレッスンプランに、日時と参加予定生徒を紐づけます。"}
        backLink={{ href: cancelHref, label: isEdit ? "予定詳細へ戻る" : "レッスンカルテへ戻る" }}
        eyebrow="LESSON SCHEDULE"
        meta={<span>プラン → 日時・場所 → 参加予定生徒の順に確認します</span>}
      />

      {state.error ? <WorkspaceFeedback tone="error">{state.error}</WorkspaceFeedback> : null}

      <WorkspaceActionBar className="sticky top-[4.5rem] md:top-4" sticky={false}>
        <WorkspaceAction href={cancelHref} variant="secondary">キャンセル</WorkspaceAction>
        <WorkspaceAction type="submit" disabled={pending || !plans.length} variant="primary" icon={Save}>
          {pending ? (isEdit ? "更新中…" : "保存中…") : isEdit ? "予定を更新" : "予定を登録"}
        </WorkspaceAction>
      </WorkspaceActionBar>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
        <WorkspaceFormSection title="1. 使用するレッスンプラン" description="予定のベースにする保存済みプランを1つ選びます。">
          {plans.length ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--yn-surface-muted)] px-3 py-2.5 text-[13px] text-[var(--yn-text-muted)]">
                <span>選択中：<strong className="font-semibold text-[var(--yn-text)]">{selectedPlan?.name ?? "未選択"}</strong></span>
                <Link href="/lessons/new" className="font-semibold text-[var(--yn-primary-strong)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--yn-focus)]">新しいプランを作成</Link>
              </div>
              <div className="max-h-[430px] space-y-2 overflow-y-auto overscroll-contain pr-1">
                {plans.map((plan) => {
                  const active = selectedPlanId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={active
                        ? "flex w-full items-start gap-3 rounded-xl border border-[#83aa8a] bg-[#edf5ef] p-3 text-left shadow-[0_3px_10px_rgba(64,113,77,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--yn-focus)]"
                        : "flex w-full items-start gap-3 rounded-xl border border-[var(--yn-border)] bg-white/76 p-3 text-left transition hover:border-[#bdcfb9] hover:bg-[#f8faf6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--yn-focus)]"}
                    >
                      <span className={active ? "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5d8f68] text-white" : "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#d8ddd3] bg-white text-[#8a8f86]"}>
                        {active ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <FileText className="h-4 w-4" aria-hidden="true" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-semibold text-[var(--yn-text)]">{plan.name}</span>
                        <span className="mt-1 line-clamp-2 block text-[13px] leading-5 text-[var(--yn-text-muted)]">{plan.theme || "テーマ未設定"}</span>
                        <span className="mt-2 flex flex-wrap gap-1.5">
                          <WorkspaceStatus tone="sand">{plan.totalMinutes}分</WorkspaceStatus>
                          <WorkspaceStatus>{plan.blockCount}ブロック</WorkspaceStatus>
                          {plan.tags.slice(0, 2).map((tag) => <WorkspaceStatus key={tag} tone="green">{tag}</WorkspaceStatus>)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <WorkspaceEmptyState
              title="レッスンプランがありません"
              description="先にブロックを組み合わせて、予定のベースになるプランを作成してください。"
              action={<WorkspaceAction href="/lessons/new" variant="primary">レッスンプランを作成</WorkspaceAction>}
            />
          )}
          <input type="hidden" name="lesson_plan_id" value={selectedPlanId} />
        </WorkspaceFormSection>

        <WorkspaceFormSection title="2. 日時・場所" description="開始と終了を分けて登録できます。">
          <div className="grid gap-4 sm:grid-cols-2">
            <WorkspaceField label="日付" required>
              <Input name="date" type="date" defaultValue={startsAt?.date ?? defaultDate} required className="yn-control" />
            </WorkspaceField>
            <WorkspaceField label="場所" required>
              <Input name="place" defaultValue={schedule?.place || selectedPlan?.place || "スタジオA"} required className="yn-control" />
            </WorkspaceField>
            <WorkspaceField label="開始時間" required>
              <Input name="start_time" type="time" defaultValue={startsAt?.time ?? "10:00"} required className="yn-control" />
            </WorkspaceField>
            <WorkspaceField label="終了時間" required>
              <Input name="end_time" type="time" defaultValue={endsAt?.time ?? "11:00"} required className="yn-control" />
            </WorkspaceField>
            <WorkspaceField label="形式" required>
              <select name="format" defaultValue={schedule?.format || selectedPlan?.format || "group"} required className="yn-control w-full px-3">
                {lessonFormatOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </WorkspaceField>
            <WorkspaceField label="ステータス" required>
              <select name="status" defaultValue={schedule?.status ?? "scheduled"} required className="yn-control w-full px-3">
                {scheduleStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </WorkspaceField>
          </div>
          <div className="rounded-lg border border-[#e7dfd4] bg-[#faf8f3] px-3 py-3 text-[13px] leading-5 text-[var(--yn-text-muted)]">
            <CalendarDays className="mr-1.5 inline h-4 w-4 text-[#5d8f68]" aria-hidden="true" />
            保存後は、この予定から原稿と実施後記録へ進めます。
          </div>
        </WorkspaceFormSection>
      </div>

      <WorkspaceFormSection title="3. 参加予定生徒" description="予定時点の参加者を選びます。未選択でも保存できます。">
        {students.length ? (
          <div className="max-h-[390px] overflow-y-auto overscroll-contain rounded-xl border border-[var(--yn-border)] bg-[#faf8f3] p-2">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {students.map((student) => (
                <label key={student.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent bg-white/80 p-3 transition hover:border-[#cbdac7] has-[:checked]:border-[#8fb296] has-[:checked]:bg-[#f1f7ef]">
                  <input name="student_ids" value={student.id} type="checkbox" defaultChecked={selectedStudentIds.has(student.id)} className="mt-1 h-4 w-4 shrink-0 accent-[#5d8f68] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]" />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-[var(--yn-text)]">{student.name}</span>
                    <span className="mt-1 line-clamp-2 block text-[13px] leading-5 text-[var(--yn-text-muted)]">注意点：{student.caution || "未登録"}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <WorkspaceEmptyState title="生徒が登録されていません" description="参加者は後から編集できます。" action={<WorkspaceAction href="/students/new">生徒を登録</WorkspaceAction>} />
        )}
      </WorkspaceFormSection>

      <WorkspaceFormSection title="当日の注意・補足" description="この予定にだけ必要な情報です。レッスンプラン本体は変更しません。">
        <div className="grid gap-4 xl:grid-cols-2">
          <WorkspaceField label="この予定の注意事項">
            <Textarea name="schedule_caution" defaultValue={schedule?.scheduleCaution ?? ""} placeholder="例：今日は初参加の生徒がいるため、導入をゆっくりめにする" className="min-h-[120px] text-[14px]" />
          </WorkspaceField>
          <WorkspaceField label="この予定のメモ">
            <Textarea name="schedule_memo" defaultValue={schedule?.scheduleMemo ?? ""} placeholder="例：スタジオBは床が冷えやすいのでブランケット確認" className="min-h-[120px] text-[14px]" />
          </WorkspaceField>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-[#f5f3ee] px-3 py-3 text-[13px] leading-5 text-[var(--yn-text-muted)]">
          <UsersRound className="mt-0.5 h-4 w-4 shrink-0 text-[#7568a7]" aria-hidden="true" />
          生徒の注意点は各生徒カルテから参照し、ここでは予定全体に関わる事項だけを記録します。
        </div>
      </WorkspaceFormSection>
    </form>
  );
}

function toTokyoInputValues(value: string) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}
