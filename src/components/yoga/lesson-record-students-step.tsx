"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { LessonRecordStudentFormItem, StudentAttendanceCode } from "@/lib/lesson-records";
import { cn } from "@/lib/utils";

export type LessonRecordStudentEditorItem = Omit<LessonRecordStudentFormItem, "pendingFollowUps"> & {
  pendingFollowUps: Array<LessonRecordStudentFormItem["pendingFollowUps"][number] & {
    status: "completed" | "pending" | "dismissed";
    note: string;
  }>;
};

type Props = {
  students: LessonRecordStudentEditorItem[];
  detailedMode: boolean;
  onChange: (students: LessonRecordStudentEditorItem[]) => void;
};

const attendanceOptions: Array<{ value: StudentAttendanceCode; label: string }> = [
  { value: "present", label: "参加" },
  { value: "cancelled", label: "キャンセル" },
  { value: "no_show", label: "無断欠席" },
];

export function LessonRecordStudentsStep({ students, detailedMode, onChange }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function update(id: string, patch: Partial<LessonRecordStudentEditorItem>) {
    onChange(students.map((student) => student.id === id ? { ...student, ...patch } : student));
  }

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <section className="space-y-4" aria-labelledby="student-record-heading">
      <div className="flex flex-col gap-3 rounded-xl border border-[#dfe5da] bg-[#f8faf6] p-4 md:flex-row md:items-center md:justify-between">
        <div><h2 id="student-record-heading" className="text-lg font-semibold">生徒ごとの記録</h2><p className="mt-1 text-sm leading-6 text-[#687166]">出欠を先に確定し、メモや次回フォローは必要な生徒だけ追加します。</p></div>
        <button type="button" onClick={() => onChange(students.map((student) => ({ ...student, attendanceStatus: "present" })))} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#8eae91] bg-white px-4 text-sm font-medium text-[#426449]"><UserCheck className="h-4 w-4" />全員を参加にする</button>
      </div>

      <div className="grid gap-3">
        {students.map((student) => {
          const showDetails = detailedMode || expanded.has(student.id);
          return (
            <article key={student.id} className="rounded-lg border border-[#dde3da] bg-white">
              <div className="grid items-start gap-3 p-4 lg:grid-cols-[minmax(200px,1fr)_minmax(330px,auto)_120px]">
                <div className="min-w-0"><p className="text-[15px] font-semibold">{student.name}</p><p className="mt-1 line-clamp-2 text-sm leading-6 text-[#687166]">注意点：{student.caution || "未登録"}</p></div>
                <div className="flex flex-wrap gap-2" role="group" aria-label={`${student.name}の出欠`}>
                  {attendanceOptions.map((option) => <button key={option.value} type="button" aria-pressed={student.attendanceStatus === option.value} onClick={() => update(student.id, { attendanceStatus: option.value })} className={cn("h-9 rounded-lg border px-3 text-sm font-medium", student.attendanceStatus === option.value ? "border-[#6f9676] bg-[#eaf3e8] text-[#3f6647]" : "border-[#dfe3da] bg-white text-[#60685f]")}>{option.label}</button>)}
                </div>
                <button type="button" onClick={() => toggle(student.id)} className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-[#dfe3da] bg-white px-3 text-sm font-medium text-[#4f6f55]">{showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}メモを追加</button>
              </div>

              {showDetails ? (
                <div className="grid gap-4 border-t border-[#eceee8] bg-[#fbfcf9] p-4 md:grid-cols-3">
                  {student.pendingFollowUps.length ? (
                    <div className="grid gap-2 rounded-lg border border-[#efd3a7] bg-[#fffaf0] p-3 md:col-span-3">
                      <p className="text-sm font-semibold text-[#8d6934]">前回からのフォロー</p>
                      {student.pendingFollowUps.map((follow) => (
                        <div key={follow.id} className="grid gap-3 rounded-lg bg-white p-3 lg:grid-cols-[minmax(220px,1fr)_minmax(300px,auto)]">
                          <div><p className="text-sm text-[#687166]">{follow.date} / {follow.lessonName}</p><p className="mt-1 text-sm leading-6">{follow.text}</p></div>
                          <div className="grid gap-2">
                            <div className="flex flex-wrap gap-2">
                              {(["completed", "pending", "dismissed"] as const).map((status) => <button key={status} type="button" onClick={() => update(student.id, { pendingFollowUps: student.pendingFollowUps.map((item) => item.id === follow.id ? { ...item, status } : item) })} className={cn("rounded-lg border px-3 py-1.5 text-sm", follow.status === status ? "border-[#719878] bg-[#eaf3e8]" : "border-[#dfe3da] bg-white")}>{status === "completed" ? "確認済み" : status === "pending" ? "継続" : "見送り"}</button>)}
                            </div>
                            <Input value={follow.note} onChange={(event) => update(student.id, { pendingFollowUps: student.pendingFollowUps.map((item) => item.id === follow.id ? { ...item, note: event.target.value } : item) })} placeholder="対応メモ（任意）" className="h-9 bg-white text-sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <label className="grid gap-1.5 text-sm font-medium">今日の様子<Textarea value={student.todayNote} onChange={(event) => update(student.id, { todayNote: event.target.value })} className="min-h-24 bg-white text-sm" /></label>
                  <label className="grid gap-1.5 text-sm font-medium">個別メモ<Textarea value={student.personalMemo} onChange={(event) => update(student.id, { personalMemo: event.target.value })} className="min-h-24 bg-white text-sm" /></label>
                  <label className="grid gap-1.5 text-sm font-medium">次回フォロー<Textarea value={student.nextFollow} onChange={(event) => update(student.id, { nextFollow: event.target.value })} className="min-h-24 bg-white text-sm" /></label>
                </div>
              ) : null}
            </article>
          );
        })}
        {!students.length ? <p className="rounded-lg border border-dashed border-[#ccd8ca] bg-[#f8fbf6] p-6 text-center text-sm text-[#687166]">この予定には参加予定の生徒が登録されていません。</p> : null}
      </div>
    </section>
  );
}
