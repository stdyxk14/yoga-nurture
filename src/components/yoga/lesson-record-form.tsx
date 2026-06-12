"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState } from "react";
import { ArrowLeft, CheckCircle2, FilePenLine, MessageSquareText, Save, UserRound } from "lucide-react";
import { saveLessonRecordAction } from "@/app/lessons/[id]/record/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LessonRecordAiSuggestionPanel } from "@/components/yoga/lesson-record-ai-suggestion-panel";
import { PageHeader, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import type { StudentAiSuggestionState } from "@/lib/ai-suggestions";

type LessonRecordFormState = {
  error?: string;
};

type LessonRecordFormData = {
  schedule: {
    id: string;
    lessonPlanId: string | null;
    lessonName: string;
    dateLabel: string;
    startTimeLabel: string;
    endTimeLabel: string;
    place: string;
    formatLabel: string;
    statusLabel: string;
    lessonPlanName: string;
    participantCount: number;
  } | null;
  record: {
    id: string;
    overallMemo: string;
    overallReaction: string;
    improvementPoints: string;
    status: "draft" | "completed";
  } | null;
  blocks: Array<{
    id: string;
    planBlockId: string;
    sortOrder: number;
    name: string;
    majorCategory: string;
    minorCategory: string;
    plannedMinutes: number;
    done: boolean;
    actualMinutes: number;
    reaction: "good" | "neutral" | "poor";
    teacherMemo: string;
    improvementMemo: string;
    useAgain: boolean;
    reviseScript: boolean;
    scriptRevision: string;
  }>;
  students: Array<{
    id: string;
    name: string;
    caution: string;
    attendanceStatus: "present" | "cancelled" | "no_show";
    todayNote: string;
    personalMemo: string;
    nextFollow: string;
  }>;
};

const recordStatusOptions = [
  { value: "draft", label: "下書き" },
  { value: "completed", label: "記録済み" },
] as const;

const blockReactionOptions = [
  { value: "good", label: "良かった" },
  { value: "neutral", label: "普通" },
  { value: "poor", label: "いまいち" },
] as const;

const attendanceOptions = [
  { value: "present", label: "参加" },
  { value: "cancelled", label: "キャンセル" },
  { value: "no_show", label: "無断欠席" },
] as const;

const initialState: LessonRecordFormState = {};

export function LessonRecordForm({
  data,
  aiSuggestionState,
}: {
  data: LessonRecordFormData;
  aiSuggestionState?: StudentAiSuggestionState;
}) {
  const [state, formAction, pending] = useActionState(saveLessonRecordAction, initialState);

  if (!data.schedule) {
    return (
      <SoftCard className="p-6 text-center">
        <p className="text-[16px] font-extrabold">予定が見つかりません</p>
        <p className="mt-2 text-[13px] font-semibold leading-6 text-[#6b7468]">
          削除済み、または現在のアカウントでは表示できない予定です。
        </p>
        <Link href="/lessons" className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white">
          レッスン管理へ戻る
        </Link>
      </SoftCard>
    );
  }

  const { schedule, record, blocks, students } = data;

  return (
    <form action={formAction} className="space-y-4 pb-28 md:pb-0">
      <input type="hidden" name="schedule_id" value={schedule.id} />
      <input type="hidden" name="record_id" value={record?.id ?? ""} />

      <PageHeader title="レッスン後の記録" subtitle="実施内容・ブロックごとの反応・参加生徒ごとのコメントを保存します" />

      {state.error ? (
        <p className="rounded-xl border border-[#f2c7be] bg-[#fff0ea] px-4 py-3 text-[13px] font-bold text-[#c4523d]">{state.error}</p>
      ) : null}

      <div className="flex flex-col gap-2 md:flex-row md:justify-end">
        <Link href={`/schedules/${schedule.id}`} className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-[#d8e3d4] bg-white px-3 text-[12px] font-bold text-[#4f7b58]">
          <ArrowLeft className="h-3.5 w-3.5" />
          予定詳細へ戻る
        </Link>
        {schedule.lessonPlanId ? (
          <Link href={`/lessons/${schedule.lessonPlanId}/script`} className="inline-flex h-9 items-center justify-center rounded-xl border border-[#e6dff2] bg-[#faf7ff] px-3 text-[12px] font-bold text-[#7469bf]">
            原稿を見る
          </Link>
        ) : null}
      </div>

      <SoftCard className="p-4">
        <SectionTitle icon={FilePenLine} title={schedule.lessonName} subtitle={`${schedule.dateLabel} ${schedule.startTimeLabel}-${schedule.endTimeLabel} / ${schedule.place || "場所未設定"} / ${schedule.formatLabel}`} />
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <Info label="使用レッスンプラン" value={schedule.lessonPlanName} />
          <Info label="参加予定生徒" value={`${schedule.participantCount}名`} />
          <Info label="予定ステータス" value={schedule.statusLabel} />
          <label className="block min-w-0 rounded-xl border border-[#eee4d8] bg-white/65 p-3">
            <span className="mb-1 block text-[11px] font-bold text-[#7c8476]">記録ステータス</span>
            <select name="status" defaultValue={record?.status ?? "draft"} className="h-9 w-full rounded-lg border border-[#e1d9ce] bg-white px-2 text-[13px] font-bold">
              {recordStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </SoftCard>

      <LessonRecordAiSuggestionPanel recordId={record?.id} aiSuggestionState={aiSuggestionState} />

      <SoftCard className="p-4">
        <SectionTitle icon={MessageSquareText} title="レッスン全体の記録" subtitle="レッスン全体として残したいことを簡潔に記録します" />
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <Field label="全体メモ">
            <Textarea name="overall_memo" defaultValue={record?.overallMemo ?? ""} className="min-h-[130px] bg-white/85 text-[14px]" />
          </Field>
          <Field label="生徒の反応・観察">
            <Textarea name="overall_reaction" defaultValue={record?.overallReaction ?? ""} className="min-h-[130px] bg-white/85 text-[14px]" />
          </Field>
          <Field label="次回への改善ポイント">
            <Textarea name="improvement_points" defaultValue={record?.improvementPoints ?? ""} className="min-h-[130px] bg-white/85 text-[14px]" />
          </Field>
        </div>
      </SoftCard>

      <SoftCard className="p-4">
        <SectionTitle icon={CheckCircle2} title="ブロックごとの記録" subtitle="各ブロックの実施状態・反応・改善メモを残します" />
        {blocks.length ? (
          <div className="mt-4 grid gap-3">
            {blocks.map((block, index) => (
              <article key={`${block.planBlockId}-${block.id}`} className="rounded-2xl border border-[#eee4d8] bg-white/74 p-3">
                <input type="hidden" name="block_template_ids" value={block.id} />
                <input type="hidden" name={`block_${block.id}_plan_block_id`} value={block.planBlockId} />
                <input type="hidden" name={`block_${block.id}_sort_order`} value={block.sortOrder} />
                <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#5d956d]">#{index + 1} {block.majorCategory} / {block.minorCategory}</p>
                    <Link href={`/blocks/${block.id}`} className="line-clamp-1 text-[16px] font-extrabold text-[#2f342e] hover:text-[#5d956d]">{block.name}</Link>
                  </div>
                  <span className="w-fit rounded-full bg-[#fff7e8] px-3 py-1 text-[12px] font-bold text-[#9b7338]">目安 {block.plannedMinutes}分</span>
                </div>
                <div className="grid gap-3 md:grid-cols-[150px_130px_150px_minmax(0,1fr)_minmax(0,1fr)]">
                  <Field label="実施状態">
                    <select name={`block_${block.id}_done`} defaultValue={block.done ? "done" : "skipped"} className="h-10 w-full rounded-md border border-input bg-white/90 px-2 text-[13px]">
                      <option value="done">実施した</option>
                      <option value="skipped">スキップした</option>
                    </select>
                  </Field>
                  <Field label="実際の所要時間">
                    <Input name={`block_${block.id}_actual_minutes`} type="number" min={0} defaultValue={block.actualMinutes} className="h-10 bg-white/90 text-[13px]" />
                  </Field>
                  <Field label="生徒の反応">
                    <select name={`block_${block.id}_reaction`} defaultValue={block.reaction} className="h-10 w-full rounded-md border border-input bg-white/90 px-2 text-[13px]">
                      {blockReactionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </Field>
                  <Field label="講師メモ">
                    <Textarea name={`block_${block.id}_teacher_memo`} defaultValue={block.teacherMemo} className="min-h-[88px] bg-white/90 text-[13px]" />
                  </Field>
                  <Field label="改善メモ / セリフ直し">
                    <Textarea name={`block_${block.id}_improvement_memo`} defaultValue={block.improvementMemo} className="min-h-[88px] bg-white/90 text-[13px]" />
                  </Field>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[180px_180px_minmax(0,1fr)]">
                  <label className="flex items-center gap-2 text-[12px] font-bold"><input name={`block_${block.id}_use_again`} type="checkbox" defaultChecked={block.useAgain} className="h-4 w-4 accent-[#5d956d]" />次回も使いたい</label>
                  <label className="flex items-center gap-2 text-[12px] font-bold"><input name={`block_${block.id}_revise_script`} type="checkbox" defaultChecked={block.reviseScript} className="h-4 w-4 accent-[#ef6f5b]" />セリフを見直す</label>
                  <Input name={`block_${block.id}_script_revision`} defaultValue={block.scriptRevision} placeholder="セリフ見直しメモ" className="h-10 bg-white/90 text-[13px]" />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyMessage text="この予定に紐づくレッスンプランのブロックがありません。レッスンプランにブロックを追加すると、ここで評価できます。" />
        )}
      </SoftCard>

      <SoftCard className="p-4">
        <SectionTitle icon={UserRound} title="参加生徒ごとのコメント" subtitle="出席ステータス・今日の様子・個別メモ・次回フォローだけを保存します" />
        {students.length ? (
          <div className="mt-4 grid gap-3">
            {students.map((student) => (
              <article key={student.id} className="rounded-2xl border border-[#eee4d8] bg-white/74 p-3">
                <input type="hidden" name="student_ids" value={student.id} />
                <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="text-[15px] font-extrabold">{student.name}</p>
                    <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-5 text-[#6b7468]">注意点: {student.caution || "未登録"}</p>
                  </div>
                  <Field label="出席ステータス">
                    <select name={`student_${student.id}_attendance_status`} defaultValue={student.attendanceStatus} className="h-10 w-full rounded-md border border-input bg-white/90 px-2 text-[13px] md:w-[150px]">
                      {attendanceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="今日の様子">
                    <Textarea name={`student_${student.id}_today_note`} defaultValue={student.todayNote} className="min-h-[82px] bg-white/90 text-[13px]" />
                  </Field>
                  <Field label="個別メモ">
                    <Textarea name={`student_${student.id}_personal_memo`} defaultValue={student.personalMemo} className="min-h-[82px] bg-white/90 text-[13px]" />
                  </Field>
                  <Field label="次回フォロー">
                    <Textarea name={`student_${student.id}_next_follow`} defaultValue={student.nextFollow} className="min-h-[82px] bg-white/90 text-[13px]" />
                  </Field>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyMessage text="この予定には参加予定生徒が登録されていません。予定登録で生徒を紐づけると、生徒別コメントを残せます。" />
        )}
      </SoftCard>

      <div className="sticky bottom-20 z-20 grid gap-2 rounded-2xl border border-[#e7dfd4] bg-[#fbfaf6]/95 p-3 shadow-[0_-8px_24px_rgba(91,76,53,0.10)] backdrop-blur md:bottom-4 md:flex md:justify-end">
        <button name="status" value="draft" disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d8e3d4] bg-white px-5 text-[13px] font-bold text-[#4f7b58] disabled:opacity-60">
          <Save className="h-4 w-4" />
          {pending ? "保存中..." : "下書き保存"}
        </button>
        <button name="status" value="completed" disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#5d956d] px-5 text-[13px] font-bold text-white disabled:opacity-60">
          <CheckCircle2 className="h-4 w-4" />
          {pending ? "保存中..." : "記録を完了する"}
        </button>
      </div>
    </form>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#eee4d8] bg-white/65 p-3">
      <p className="text-[11px] font-bold text-[#7c8476]">{label}</p>
      <p className="mt-1 break-words text-[13px] font-extrabold">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <Label className="mb-2 text-[12px] font-bold text-[#394238]">{label}</Label>
      {children}
    </label>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-[#d8e3d4] bg-[#f8fcf6] p-4 text-[13px] font-semibold leading-6 text-[#657064]">
      {text}
    </div>
  );
}
