"use client";

import { useMemo, useState, useActionState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, FileText, Save, UsersRound } from "lucide-react";
import { createScheduleAction } from "@/app/schedules/actions";
import { Input } from "@/components/ui/input";
import type { StudentRecord } from "@/components/yoga/records";
import { PageHeader, Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
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
  const title = mode === "edit" ? "予定編集" : "予定登録";
  const subtitle = mode === "edit" ? "レッスン予定の日時・場所・参加予定生徒を更新します。" : "作成済みレッスンプランに日時・場所・参加予定生徒を紐づけます。";
  const submitLabel = mode === "edit" ? "予定を更新" : "この内容で予定を登録";
  const pendingLabel = mode === "edit" ? "更新中..." : "保存中...";
  const cancelHref = schedule ? `/schedules/${schedule.id}` : "/lessons";

  return (
    <form action={formAction} className="space-y-4 pb-24 md:pb-0">
      <PageHeader title={title} subtitle={subtitle} />

      {state.error ? (
        <p className="rounded-xl border border-[#f2c7be] bg-[#fff0ea] px-4 py-3 text-[13px] font-bold text-[#c4523d]">{state.error}</p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <SoftCard className="p-4">
            <SectionTitle icon={FileText} title="使用するレッスンプランを選択" subtitle="保存済みのレッスンプランから予定に使う内容を選びます。" />
            {plans.length ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {plans.map((plan) => {
                  const active = selectedPlanId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={
                        active
                          ? "min-h-[176px] rounded-2xl border border-[#5d956d] bg-[#edf5ef] p-3 text-left shadow-[0_8px_18px_rgba(64,113,77,0.12)]"
                          : "min-h-[176px] rounded-2xl border border-[#eee4d8] bg-white/75 p-3 text-left"
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="line-clamp-2 text-[15px] font-extrabold leading-5">{plan.name}</h2>
                        {active ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[#5d956d]" /> : null}
                      </div>
                      <p className="mt-2 line-clamp-2 text-[12px] font-semibold leading-5 text-[#5f665c]">{plan.theme || "テーマ未設定"}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <MiniInfo label="合計時間" value={`${plan.totalMinutes}分`} />
                        <MiniInfo label="ブロック数" value={`${plan.blockCount}個`} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {plan.tags.length ? plan.tags.slice(0, 3).map((tag) => <Pill key={tag}>{tag}</Pill>) : <Pill>タグ未設定</Pill>}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-[#d8e3d4] bg-white/60 p-6 text-center">
                <p className="text-[15px] font-extrabold">まだレッスンプランがありません。</p>
                <p className="mt-2 text-[13px] font-medium leading-6 text-[#6b7468]">先にブロックを組み合わせて、予定に紐づけるレッスンプランを作成してください。</p>
                <Link href="/lessons/new" className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white">
                  レッスンプランを作成
                </Link>
              </div>
            )}
            <input type="hidden" name="lesson_plan_id" value={selectedPlanId} />
          </SoftCard>

          <SoftCard className="p-4">
            <SectionTitle icon={CalendarDays} title="日時・場所" subtitle="60分以外の予定も、開始と終了で登録できます。" />
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Field label="日付">
                <Input name="date" type="date" defaultValue={startsAt?.date ?? defaultDate} required className="h-10 bg-white/90" />
              </Field>
              <Field label="開始時間">
                <Input name="start_time" type="time" defaultValue={startsAt?.time ?? "10:00"} required className="h-10 bg-white/90" />
              </Field>
              <Field label="終了時間">
                <Input name="end_time" type="time" defaultValue={endsAt?.time ?? "11:00"} required className="h-10 bg-white/90" />
              </Field>
              <Field label="場所">
                <Input name="place" defaultValue={schedule?.place || selectedPlan?.place || "スタジオA"} required className="h-10 bg-white/90" />
              </Field>
              <Field label="形式">
                <select name="format" defaultValue={schedule?.format || selectedPlan?.format || "group"} className="h-10 w-full rounded-xl border border-[#e1d9ce] bg-white/90 px-3 text-[13px] font-semibold">
                  {lessonFormatOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </Field>
              <Field label="ステータス">
                <select name="status" defaultValue={schedule?.status ?? "scheduled"} className="h-10 w-full rounded-xl border border-[#e1d9ce] bg-white/90 px-3 text-[13px] font-semibold">
                  {scheduleStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </Field>
            </div>
          </SoftCard>
        </div>

        <div className="space-y-4">
          <SoftCard className="p-4">
            <SectionTitle icon={UsersRound} title="参加予定生徒" subtitle="予定時点の参加予定者を選びます。" />
            {students.length ? (
              <div className="mt-4 grid gap-2">
                {students.map((student) => (
                  <label key={student.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#eee4d8] bg-white/75 p-3">
                    <input name="student_ids" value={student.id} type="checkbox" defaultChecked={selectedStudentIds.has(student.id)} className="mt-1 h-4 w-4 shrink-0 accent-[#5d956d]" />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-extrabold">{student.name}</span>
                      <span className="mt-1 block line-clamp-2 text-[11px] font-medium leading-5 text-[#6b7468]">注意点: {student.caution || "未登録"}</span>
                      <span className="mt-1 block line-clamp-2 text-[11px] font-medium leading-5 text-[#6b7468]">メモ: {student.memo || "未登録"}</span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-[#d8e3d4] bg-white/60 p-5 text-center">
                <p className="text-[13px] font-bold text-[#6b7468]">まだ生徒が登録されていません。</p>
                <Link href="/students/new" className="mt-3 inline-flex h-9 items-center justify-center rounded-xl border border-[#d8e3d4] bg-white px-4 text-[12px] font-bold text-[#4f7b58]">
                  生徒を登録
                </Link>
              </div>
            )}
          </SoftCard>

          <SoftCard className="p-4">
            <p className="text-[13px] font-extrabold text-[#4f7b58]">次の流れ</p>
            <div className="mt-3 grid gap-2 text-[12px] font-semibold leading-5 text-[#50584e]">
              <p>1. 予定を保存する</p>
              <p>2. 紐づくレッスンプランから原稿を印刷する</p>
              <p>3. レッスン後に実施後記録へ進む</p>
            </div>
            <div className="mt-4 grid gap-2">
              <button type="submit" disabled={pending || !plans.length} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#5d956d] px-5 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(64,113,77,0.2)] disabled:opacity-60">
                <Save className="h-4 w-4" />
                {pending ? pendingLabel : submitLabel}
              </button>
              <Link href={cancelHref} className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58]">
                キャンセル
              </Link>
            </div>
          </SoftCard>
        </div>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[12px] font-bold text-[#5f665c]">{label}</span>
      {children}
    </label>
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

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#eee4d8] bg-white/70 px-2 py-2">
      <p className="truncate text-[10px] font-bold text-[#7c8476]">{label}</p>
      <p className="mt-0.5 truncate text-[13px] font-extrabold text-[#4f875a]">{value}</p>
    </div>
  );
}
