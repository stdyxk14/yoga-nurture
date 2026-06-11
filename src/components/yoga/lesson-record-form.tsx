import Link from "next/link";
import type { ReactNode } from "react";
import { CheckCircle2, FilePenLine, MessageSquareText, Save, UserRound } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { blockResults, getLessonBlocks, getStudent } from "@/components/yoga/records";
import type { LessonRecord } from "@/components/yoga/records";

export function LessonRecordForm({ lesson }: { lesson: LessonRecord }) {
  const blocks = getLessonBlocks(lesson);
  const results = blockResults[lesson.id] ?? [];
  const plannedStudents = lesson.plannedStudentIds.map(getStudent);

  return (
    <>
      <PageHeader title="レッスン後の記録" subtitle="ブロックごとの反応と参加生徒ごとのコメントを残す" />

      <div className="mb-3 flex justify-end gap-2">
        <Link href={`/lessons/${lesson.id}`} className="inline-flex h-8 items-center rounded-lg border border-[#d8e3d4] bg-white px-3 text-[13px] font-bold text-[#4f7b58]">
          キャンセル
        </Link>
      </div>

      <SoftCard className="p-4">
        <div className="mb-4 rounded-xl border border-[#eee4d8] bg-white/68 p-3">
          <SectionTitle icon={FilePenLine} title={lesson.title} subtitle={`${lesson.date} ${lesson.startTime}-${lesson.endTime}`} />
          <div className="grid grid-cols-4 gap-3 text-[12px] font-bold text-[#5f665c]">
            <p>場所：{lesson.place}</p>
            <p>形式：{lesson.format}</p>
            <p>参加予定：{plannedStudents.length}名</p>
            <p>状態：記録待ち</p>
          </div>
        </div>

        <section className="mb-5">
          <SectionTitle icon={CheckCircle2} title="ブロックごとの記録" subtitle="実施/スキップ、反応、改善メモを残す" />
          <div className="grid gap-3">
            {blocks.map((block, index) => {
              const result = results.find((item) => item.blockId === block.id);
              return (
                <div key={block.id} className="rounded-xl border border-[#eee4d8] bg-white/72 p-3">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#edf5ef] text-[12px] font-extrabold text-[#4f875a]">{index + 1}</span>
                    <Link href={`/blocks/${block.id}`} className="text-[15px] font-extrabold text-[#2f342e] hover:text-[#5d956d]">{block.name}</Link>
                    <span className="rounded-full bg-[#fff7e8] px-2 py-0.5 text-[11px] font-bold text-[#9b7338]">{block.majorCategory}</span>
                    <span className="text-[12px] font-bold text-[#5d956d]">{block.duration}</span>
                  </div>
                  <div className="grid grid-cols-[160px_120px_150px_minmax(0,1fr)_minmax(0,1fr)] gap-3">
                    <Field label="実施状態">
                      <select defaultValue={result?.done === false ? "スキップした" : "実施した"} className="h-9 w-full rounded-md border border-input bg-white/80 px-2 text-[13px]">
                        <option>実施した</option>
                        <option>スキップした</option>
                      </select>
                    </Field>
                    <Field label="実際の所要時間">
                      <input defaultValue={result?.actualDuration ?? block.duration} className="h-9 w-full rounded-md border border-input bg-white/80 px-2 text-[13px]" />
                    </Field>
                    <Field label="生徒の反応">
                      <select defaultValue={result?.reaction ?? "普通"} className="h-9 w-full rounded-md border border-input bg-white/80 px-2 text-[13px]">
                        <option>良かった</option>
                        <option>普通</option>
                        <option>いまいち</option>
                      </select>
                    </Field>
                    <Field label="講師メモ">
                      <Textarea defaultValue={result?.teacherMemo ?? ""} className="min-h-[84px] bg-white/80 text-[13px]" />
                    </Field>
                    <Field label="改善メモ / セリフ見直し">
                      <Textarea defaultValue={result?.scriptRevision ?? result?.improvementMemo ?? ""} className="min-h-[84px] bg-white/80 text-[13px]" />
                    </Field>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-[12px] font-bold">
                    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked={result?.useAgain ?? true} className="accent-[#5d956d]" />次回も使いたい</label>
                    <label className="flex items-center gap-2"><input type="checkbox" className="accent-[#ef6f5b]" />セリフを見直す</label>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-5">
          <SectionTitle icon={UserRound} title="参加予定者と実際の参加者" subtitle="出席ステータスと個別コメント" />
          <div className="grid gap-3">
            {plannedStudents.map((student) => {
              const participant = lesson.participants.find((item) => item.studentId === student.id);
              return (
                <div key={student.id} className="rounded-xl border border-[#eee4d8] bg-white/72 p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[14px] font-extrabold">{student.name} さん</p>
                      <p className="text-[11px] font-medium text-[#6b7468]">{student.caution}</p>
                    </div>
                    <div className="grid grid-cols-[120px_180px] gap-2">
                      <select defaultValue={participant?.status ?? "参加"} className="h-9 rounded-md border border-input bg-white/80 px-2 text-[13px]">
                        <option>参加</option>
                        <option>キャンセル</option>
                        <option>無断欠席</option>
                      </select>
                      <input defaultValue={participant?.cancelReason ?? ""} placeholder="キャンセル理由メモ" className="h-9 rounded-md border border-input bg-white/80 px-2 text-[13px]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    <Field label="今日の様子"><Textarea defaultValue={participant?.condition} className="min-h-[76px] bg-white/80 text-[12px]" /></Field>
                    <Field label="身体面の変化"><Textarea defaultValue={participant?.bodyChange} className="min-h-[76px] bg-white/80 text-[12px]" /></Field>
                    <Field label="気になったこと"><Textarea defaultValue={participant?.concern} className="min-h-[76px] bg-white/80 text-[12px]" /></Field>
                    <Field label="次回確認したいこと"><Textarea defaultValue={participant?.nextCheck} className="min-h-[76px] bg-white/80 text-[12px]" /></Field>
                    <Field label="個別メモ"><Textarea defaultValue={participant?.memo} className="min-h-[76px] bg-white/80 text-[12px]" /></Field>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <SectionTitle icon={MessageSquareText} title="レッスン全体の記録" />
          <div className="grid grid-cols-3 gap-3">
            <Field label="全体の実施メモ"><Textarea defaultValue={lesson.actualContent} className="min-h-[130px] bg-white/80 text-[14px]" /></Field>
            <Field label="生徒の反応・観察"><Textarea defaultValue={lesson.reaction} className="min-h-[130px] bg-white/80 text-[14px]" /></Field>
            <Field label="次回への改善ポイント"><Textarea defaultValue={lesson.improvement} className="min-h-[130px] bg-white/80 text-[14px]" /></Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#ef6f5b] px-4 text-[13px] font-bold text-white">
              <MessageSquareText className="h-4 w-4" />
              AIメンターに振り返り相談
            </button>
            <Link href={`/lessons/${lesson.id}`} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#5d956d] px-5 text-[13px] font-bold text-white">
              <Save className="h-4 w-4" />
              記録を保存
            </Link>
          </div>
        </section>
      </SoftCard>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <Label className="mb-2 text-[12px] font-bold text-[#394238]">{label}</Label>
      {children}
    </div>
  );
}
