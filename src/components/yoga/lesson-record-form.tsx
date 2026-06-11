import Link from "next/link";
import type { ReactNode } from "react";
import { FilePenLine, MessageSquareText, Save, Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import type { LessonRecord } from "@/components/yoga/records";

export function LessonRecordForm({ lesson }: { lesson: LessonRecord }) {
  return (
    <>
      <PageHeader title="レッスン後の記録" subtitle="実施内容・反応・改善点を追記" />

      <div className="mb-3 flex justify-end gap-2">
        <Link
          href={`/lessons/${lesson.id}`}
          className="inline-flex h-8 items-center rounded-lg border border-[#d8e3d4] bg-white px-3 text-[13px] font-bold text-[#4f7b58]"
        >
          キャンセル
        </Link>
      </div>

      <SoftCard className="p-4">
        <div className="mb-4 rounded-xl border border-[#eee4d8] bg-white/68 p-3">
          <SectionTitle icon={Sparkles} title={lesson.title} subtitle={`${lesson.date} ${lesson.startTime}-${lesson.endTime}`} />
          <div className="grid grid-cols-4 gap-3 text-[12px] font-bold text-[#5f665c]">
            <p>場所：{lesson.place}</p>
            <p>形式：{lesson.format}</p>
            <p>参加：{lesson.participants}名</p>
            <p>状態：記録待ち</p>
          </div>
        </div>

        <SectionTitle icon={FilePenLine} title="実施後記録" subtitle="レッスン後に追記する内容" />
        <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(280px,0.8fr)] gap-4">
          <div className="grid gap-4">
            <Field label="実際に行った内容">
              <Textarea
                defaultValue={lesson.actualContent}
                placeholder="導入、呼吸法、ウォームアップ、メインポーズ、クールダウン、シャバーサナまで実際に行った流れを記録"
                className="min-h-[220px] bg-white/80 text-[14px]"
              />
            </Field>
            <Field label="生徒の反応・観察">
              <Textarea
                defaultValue={lesson.reaction}
                placeholder="表情、呼吸、集中度、姿勢の変化、声かけへの反応など"
                className="min-h-[130px] bg-white/80 text-[14px]"
              />
            </Field>
          </div>

          <div className="grid gap-4">
            <Field label="参加生徒ごとの個別メモ">
              <Textarea
                defaultValue={lesson.individualMemos}
                placeholder="佐藤さん：膝の様子。鈴木さん：首まわりの変化。"
                className="min-h-[160px] bg-white/80 text-[14px]"
              />
            </Field>
            <Field label="次回への改善ポイント">
              <Textarea
                defaultValue={lesson.improvement}
                placeholder="次回の構成、声かけ、時間配分、フォローしたい生徒"
                className="min-h-[130px] bg-white/80 text-[14px]"
              />
            </Field>
            <button className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#ef6f5b] px-4 text-[13px] font-bold text-white">
              <MessageSquareText className="h-4 w-4" />
              この振り返りをAIメンターに相談
            </button>
            <Link
              href={`/lessons/${lesson.id}`}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#5d956d] px-5 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(64,113,77,0.2)]"
            >
              <Save className="h-4 w-4" />
              記録を保存
            </Link>
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
