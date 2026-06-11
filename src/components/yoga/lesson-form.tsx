import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, Layers3, Save, Sparkles, Tag, UsersRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { lessonTemplates, students } from "@/components/yoga/records";
import type { LessonRecord } from "@/components/yoga/records";

const defaultTags = ["#ベーシックフロー", "#肩こり改善", "#呼吸", "#体幹強化"];

export function LessonForm({ mode, lesson }: { mode: "new" | "edit"; lesson?: LessonRecord }) {
  const isEdit = mode === "edit";
  const returnHref = isEdit && lesson ? `/lessons/${lesson.id}` : "/lessons";
  const selectedTemplate = lessonTemplates.find((template) => template.id === lesson?.templateId) ?? lessonTemplates[0];
  const tags = lesson?.tags ?? selectedTemplate.tags ?? defaultTags;

  return (
    <>
      <PageHeader
        title={isEdit ? "レッスンカルテ編集" : "レッスンカルテを準備"}
        subtitle={isEdit ? "事前準備と実施後記録を整理" : "レッスン前のプランを作成"}
      />

      <SoftCard className="p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-5">
          <div className="min-w-0">
            <SectionTitle icon={CalendarDays} title="レッスン前の準備" subtitle="事前プラン" />
            <div className="grid grid-cols-[minmax(0,1fr)_140px] gap-3">
              <Field label="レッスン名">
                <Input
                  defaultValue={lesson?.title ?? selectedTemplate.name}
                  placeholder="ベーシックフロー"
                  className="h-10 bg-white/80 text-[14px]"
                />
              </Field>
              <Field label="日付">
                <Input defaultValue={lesson?.date.replace(/（.*）/, "") ?? "2025/5/23"} className="h-10 bg-white/80 text-[14px]" />
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <Field label="開始時間">
                <Input defaultValue={lesson?.startTime ?? "10:00"} className="h-10 bg-white/80 text-[14px]" />
              </Field>
              <Field label="終了時間">
                <Input defaultValue={lesson?.endTime ?? "11:00"} className="h-10 bg-white/80 text-[14px]" />
              </Field>
              <Field label="レッスン時間">
                <Input defaultValue={lesson?.duration ?? "60分"} className="h-10 bg-white/80 text-[14px]" />
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-[1fr_210px] gap-3">
              <Field label="場所">
                <Input defaultValue={lesson?.place ?? "スタジオA"} className="h-10 bg-white/80 text-[14px]" />
              </Field>
              <Field label="形式">
                <div className="grid grid-cols-3 gap-1.5">
                  {["パーソナル", "グループ", "オンライン"].map((format) => (
                    <label
                      key={format}
                      className="flex h-10 cursor-pointer items-center justify-center rounded-lg border border-[#d8e3d4] bg-white/80 text-[12px] font-bold text-[#4f7b58]"
                    >
                      <input className="sr-only" name="format" type="radio" defaultChecked={(lesson?.format ?? "グループ") === format} />
                      {format}
                    </label>
                  ))}
                </div>
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-[250px_minmax(0,1fr)] gap-3">
              <Field label="使用テンプレート">
                <select
                  defaultValue={selectedTemplate.id}
                  className="h-10 w-full rounded-md border border-input bg-white/80 px-3 text-[14px] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#9fc2a6]"
                >
                  {lessonTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="目的・テーマ">
                <Input defaultValue={lesson?.theme ?? selectedTemplate.theme} className="h-10 bg-white/80 text-[14px]" />
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-[1fr_260px] gap-4">
              <Field label="事前のレッスン構成">
                <Textarea
                  defaultValue={lesson?.prePlan ?? selectedTemplate.structure}
                  placeholder="導入、呼吸法、ウォームアップ、メインポーズ、クールダウン、シャバーサナまで"
                  className="min-h-[210px] bg-white/80 text-[14px]"
                />
              </Field>
              <div>
                <SectionTitle icon={Tag} title="タグ" />
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Pill key={tag}>{tag}</Pill>
                  ))}
                </div>
                <Input placeholder="#タグを追加" className="mt-2 h-9 bg-white/80 text-[13px]" />
                <div className="mt-4 rounded-xl border border-[#eee4d8] bg-white/62 p-3">
                  <SectionTitle icon={Layers3} title="テンプレートから反映" />
                  <p className="text-[12px] font-medium leading-5 text-[#5f665c]">
                    テンプレートを選ぶと、レッスン名・目的・タグ・基本構成・注意点を下書きに使えます。
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <Field label="事前に意識したいこと">
                <Textarea
                  defaultValue={lesson?.preFocus ?? "呼吸と動きの連動を丁寧に確認し、無理な可動域に入らないよう声かけする。"}
                  className="min-h-[120px] bg-white/80 text-[14px]"
                />
              </Field>
              <Field label="生徒ごとの配慮ポイント">
                <Textarea
                  defaultValue={lesson?.studentCare ?? "膝・腰・首に注意点がある生徒は、代替ポーズと休息の選択肢を先に伝える。"}
                  className="min-h-[120px] bg-white/80 text-[14px]"
                />
              </Field>
            </div>

            <button className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-[#5d956d] px-4 text-[13px] font-bold text-white">
              <Sparkles className="h-4 w-4" />
              この事前プランについてAIメンターに相談
            </button>

            {isEdit ? (
              <div className="mt-5 rounded-xl border border-[#eee4d8] bg-[#fffdf9]/80 p-3">
                <SectionTitle icon={Save} title="レッスン後の記録" subtitle="必要に応じて追記" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="実際に行った内容">
                    <Textarea defaultValue={lesson?.actualContent} className="min-h-[96px] bg-white/80 text-[14px]" />
                  </Field>
                  <Field label="生徒の反応・観察">
                    <Textarea defaultValue={lesson?.reaction} className="min-h-[96px] bg-white/80 text-[14px]" />
                  </Field>
                  <Field label="参加生徒ごとの個別メモ">
                    <Textarea defaultValue={lesson?.individualMemos} className="min-h-[96px] bg-white/80 text-[14px]" />
                  </Field>
                  <Field label="次回への改善ポイント">
                    <Textarea defaultValue={lesson?.improvement} className="min-h-[96px] bg-white/80 text-[14px]" />
                  </Field>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-[#f0d1c6] bg-[#fff4ef] p-3">
                <p className="text-[13px] font-bold text-[#d96c55]">レッスン後に追記できます</p>
                <p className="mt-1 text-[12px] font-medium leading-5 text-[#6f5d55]">
                  実施内容、生徒の反応、個別メモ、次回への改善ポイントは、レッスン後に専用画面から記録します。
                </p>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="rounded-xl border border-[#eee4d8] bg-white/62 p-3">
              <SectionTitle icon={UsersRound} title="参加予定生徒" />
              <div className="grid gap-2">
                {students.map((student, index) => (
                  <label key={student.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#eee4d8] bg-white/70 px-3 py-2">
                    <input type="checkbox" defaultChecked={index < 4} className="h-4 w-4 accent-[#5d956d]" />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold">{student.name}</span>
                      <span className="block truncate text-[11px] font-medium text-[#6b7468]">{student.caution}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-[#eee4d8] bg-white/62 p-3">
              <SectionTitle icon={CalendarDays} title="保存先" />
              <p className="text-[12px] font-medium leading-5 text-[#5f665c]">
                まだDB接続前の静的UIです。保存・更新ボタンは仮動作として一覧または詳細へ戻ります。
              </p>
              <div className="mt-4 grid gap-2">
                <Link
                  href={returnHref}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#5d956d] px-5 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(64,113,77,0.2)]"
                >
                  <Save className="h-4 w-4" />
                  {isEdit ? "更新する" : "保存する"}
                </Link>
                <Link
                  href={returnHref}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58]"
                >
                  キャンセル
                </Link>
              </div>
            </div>
          </div>
        </div>
      </SoftCard>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <Label className="mb-2 text-[13px] font-bold text-[#394238]">{label}</Label>
      {children}
    </div>
  );
}
