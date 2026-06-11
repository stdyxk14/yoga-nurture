import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, CalendarDays, GripVertical, Plus, Save, Search, Tag, Trash2, UsersRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { blockTemplates, getLessonBlocks, students } from "@/components/yoga/records";
import type { LessonRecord } from "@/components/yoga/records";

export function LessonForm({ mode, lesson }: { mode: "new" | "edit"; lesson?: LessonRecord }) {
  const isEdit = mode === "edit";
  const returnHref = isEdit && lesson ? `/lessons/${lesson.id}` : "/lessons?tab=plans";
  const selectedBlocks = lesson ? getLessonBlocks(lesson) : blockTemplates.slice(0, 7);
  const totalMinutes = selectedBlocks.reduce((sum, block) => sum + Number.parseInt(block.duration, 10), 0);

  return (
    <>
      <PageHeader
        title={isEdit ? "レッスンプラン編集" : "レッスンプランを作成"}
        subtitle="ブロックを組み合わせて、原稿付きの60分レッスンを準備"
      />

      <SoftCard className="p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_310px] gap-5">
          <div className="min-w-0">
            <SectionTitle icon={CalendarDays} title="基本情報" subtitle="予定とプランの土台" />
            <div className="grid grid-cols-[1fr_140px_120px_120px] gap-3">
              <Field label="レッスンプラン名">
                <Input defaultValue={lesson?.title ?? "基礎バランスフロー"} className="h-10 bg-white/80 text-[14px]" />
              </Field>
              <Field label="レッスン日">
                <Input defaultValue={lesson?.date.replace(/（.*）/, "") ?? "2025/6/13"} className="h-10 bg-white/80 text-[14px]" />
              </Field>
              <Field label="開始時間">
                <Input defaultValue={lesson?.startTime ?? "10:00"} className="h-10 bg-white/80 text-[14px]" />
              </Field>
              <Field label="終了時間">
                <Input defaultValue={lesson?.endTime ?? "11:00"} className="h-10 bg-white/80 text-[14px]" />
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-[120px_1fr_180px] gap-3">
              <Field label="合計時間">
                <Input value={`${totalMinutes}分`} readOnly className="h-10 bg-[#f8fcf6] text-[14px] font-bold text-[#4f875a]" />
              </Field>
              <Field label="場所">
                <Input defaultValue={lesson?.place ?? "スタジオA"} className="h-10 bg-white/80 text-[14px]" />
              </Field>
              <Field label="形式">
                <select className="h-10 w-full rounded-md border border-input bg-white/80 px-3 text-[14px]">
                  {["パーソナル", "グループ", "オンライン"].map((format) => <option key={format}>{format}</option>)}
                </select>
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-[1fr_260px] gap-4">
              <Field label="テーマ">
                <Textarea
                  defaultValue={lesson?.theme ?? "片足立ちの安定と呼吸の深まり"}
                  className="min-h-[84px] bg-white/80 text-[14px]"
                />
              </Field>
              <div>
                <SectionTitle icon={Tag} title="タグ" />
                <div className="flex flex-wrap gap-2">
                  {(lesson?.tags ?? ["#バランス", "#呼吸", "#初心者向け"]).map((tag) => <Pill key={tag}>{tag}</Pill>)}
                </div>
                <Input placeholder="#タグを追加" className="mt-2 h-9 bg-white/80 text-[13px]" />
              </div>
            </div>

            <div className="mt-5">
              <SectionTitle icon={GripVertical} title="使用ブロック一覧" subtitle="上へ / 下へ で順番変更する想定" />
              <div className="grid gap-2">
                {selectedBlocks.map((block, index) => (
                  <div key={block.id} className="rounded-xl border border-[#eee4d8] bg-white/72 p-3">
                    <div className="grid grid-cols-[36px_minmax(0,1fr)_96px_180px] gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf5ef] text-[13px] font-extrabold text-[#4f875a]">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="text-[15px] font-extrabold">{block.name}</h3>
                          <span className="rounded-full bg-[#fff7e8] px-2 py-0.5 text-[11px] font-bold text-[#9b7338]">{block.majorCategory}</span>
                          <span className="text-[12px] font-bold text-[#5d956d]">{block.minorCategory}</span>
                        </div>
                        <p className="line-clamp-2 text-[12px] font-medium leading-5 text-[#50584e]">{block.script}</p>
                        <p className="mt-1 line-clamp-1 text-[11px] font-bold text-[#d96c55]">注意：{block.cautions}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {block.tags.slice(0, 4).map((tag) => <Pill key={tag}>{tag}</Pill>)}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] font-bold text-[#7c8476]">目安時間</p>
                        <p className="text-[22px] font-extrabold text-[#4f875a]">{block.duration}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-[#d8e3d4] bg-white text-[11px] font-bold text-[#4f7b58]">
                          <ArrowUp className="h-3.5 w-3.5" />上へ
                        </button>
                        <button className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-[#d8e3d4] bg-white text-[11px] font-bold text-[#4f7b58]">
                          <ArrowDown className="h-3.5 w-3.5" />下へ
                        </button>
                        <Link href="/lessons/blocks/new" className="inline-flex h-8 items-center justify-center rounded-lg border border-[#d8e3d4] bg-[#f8fcf6] text-[11px] font-bold text-[#5d956d]">編集</Link>
                        <button className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-[#f0c7b4] bg-[#fff3ec] text-[11px] font-bold text-[#e46b50]">
                          <Trash2 className="h-3.5 w-3.5" />削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <SoftCard className="p-3">
              <SectionTitle icon={UsersRound} title="参加予定生徒" />
              <div className="grid gap-2">
                {students.slice(0, 5).map((student, index) => (
                  <label key={student.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#eee4d8] bg-white/70 px-3 py-2">
                    <input type="checkbox" defaultChecked={index < 4} className="h-4 w-4 accent-[#5d956d]" />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold">{student.name}</span>
                      <span className="block truncate text-[11px] font-medium text-[#6b7468]">{student.caution}</span>
                    </span>
                  </label>
                ))}
              </div>
            </SoftCard>

            <SoftCard className="mt-3 p-3">
              <SectionTitle icon={Plus} title="ブロックを追加" />
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#e7dfd4] bg-white/80 px-2">
                <Search className="h-4 w-4 text-[#6b7468]" />
                <Input placeholder="ブロック検索" className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
              </div>
              <div className="mb-2 flex flex-wrap gap-1">
                {["すべて", "呼吸法", "クールダウン", "#肩こり改善", "#バランス"].map((item, index) => <Pill key={item} active={index === 0}>{item}</Pill>)}
              </div>
              <div className="grid gap-2">
                {blockTemplates.slice(0, 4).map((block) => (
                  <div key={block.id} className="rounded-lg border border-[#eee4d8] bg-white/70 p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-extrabold">{block.name}</p>
                        <p className="text-[11px] font-bold text-[#5d956d]">{block.majorCategory} / {block.duration}</p>
                        <p className="text-[11px] font-medium text-[#6b7468]">使用{block.usageCount}回 / 評価{block.averageRating}</p>
                      </div>
                      <button className="shrink-0 rounded-lg bg-[#5d956d] px-2 py-1 text-[11px] font-bold text-white">追加</button>
                    </div>
                  </div>
                ))}
              </div>
            </SoftCard>

            <SoftCard className="mt-3 p-3">
              <p className="text-[12px] font-medium leading-5 text-[#5f665c]">
                保存後、原稿表示画面から印刷用HTMLを開けます。PDF出力は次フェーズで接続予定です。
              </p>
              <div className="mt-4 grid gap-2">
                <Link href={returnHref} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#5d956d] px-5 text-[13px] font-bold text-white">
                  <Save className="h-4 w-4" />
                  {isEdit ? "更新する" : "保存する"}
                </Link>
                <Link href={returnHref} className="inline-flex h-9 items-center justify-center rounded-lg border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58]">
                  キャンセル
                </Link>
              </div>
            </SoftCard>
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
