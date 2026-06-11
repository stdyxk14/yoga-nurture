import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, Save, Tag, UsersRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { students } from "@/components/yoga/records";
import type { LessonRecord } from "@/components/yoga/records";

const defaultTags = ["#ベーシックフロー", "#肩こり改善", "#呼吸", "#体幹強化"];

export function LessonForm({ mode, lesson }: { mode: "new" | "edit"; lesson?: LessonRecord }) {
  const isEdit = mode === "edit";
  const returnHref = isEdit && lesson ? `/lessons/${lesson.id}` : "/lessons";
  const tags = lesson?.tags ?? defaultTags;

  return (
    <>
      <PageHeader
        title={isEdit ? "レッスンカルテ編集" : "レッスンカルテ新規登録"}
        subtitle={isEdit ? "レッスン内容・気づき・改善点を更新" : "60分レッスンの記録をすぐ登録"}
      />

      <SoftCard className="p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-5">
          <div className="min-w-0">
            <div className="grid grid-cols-[minmax(0,1fr)_140px] gap-3">
              <Field label="レッスン名">
                <Input defaultValue={lesson?.title ?? ""} placeholder="ベーシックフロー" className="h-10 bg-white/80 text-[14px]" />
              </Field>
              <Field label="日付">
                <Input defaultValue={lesson?.date.replace(/（.*）/, "") ?? ""} placeholder="2025/5/20" className="h-10 bg-white/80 text-[14px]" />
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
                <Input defaultValue={lesson?.place ?? ""} placeholder="スタジオA" className="h-10 bg-white/80 text-[14px]" />
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

            <div className="mt-4 grid grid-cols-[1fr_260px] gap-4">
              <Field label="目的・テーマ">
                <Textarea
                  defaultValue={lesson?.theme ?? ""}
                  placeholder="体幹強化・柔軟性向上・呼吸の安定"
                  className="min-h-[86px] bg-white/80 text-[14px]"
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
              </div>
            </div>

            <div className="mt-4 grid grid-cols-[1.25fr_0.9fr] gap-4">
              <Field label="実施内容">
                <Textarea
                  defaultValue={
                    isEdit
                      ? "センタリング・呼吸法（5分）\n肩甲骨まわりのウォームアップ（8分）\n太陽礼拝A（2周）\n立位ポーズ：戦士II、三角のポーズ、椅子のポーズ\nバランスポーズ：木のポーズ、戦士III\nツイスト・前屈・開脚系のポーズ\nクールダウン\nシャバーサナ・呼吸の観察"
                      : ""
                  }
                  placeholder="導入、呼吸法、ウォームアップ、メインポーズ、クールダウン、シャバーサナまで詳しく記録"
                  className="min-h-[240px] bg-white/80 text-[14px]"
                />
              </Field>
              <div className="grid gap-4">
                <Field label="生徒の反応・観察">
                  <Textarea
                    defaultValue={isEdit ? "集中力が高く、呼吸を意識しながら丁寧に動けていた。" : ""}
                    placeholder="表情、呼吸、姿勢、反応、気づいた変化など"
                    className="min-h-[108px] bg-white/80 text-[14px]"
                  />
                </Field>
                <Field label="次回への改善ポイント">
                  <Textarea
                    defaultValue={isEdit ? "後半の疲労を見て、シャバーサナを少し長めにする。" : ""}
                    placeholder="次回の構成、声かけ、注意したい動きなど"
                    className="min-h-[108px] bg-white/80 text-[14px]"
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="rounded-xl border border-[#eee4d8] bg-white/62 p-3">
              <SectionTitle icon={UsersRound} title="参加生徒" />
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
                今回はDB接続前の静的UIです。保存・更新ボタンは仮動作として一覧または詳細へ戻ります。
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
