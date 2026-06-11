import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, Save, UsersRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { lessonTemplates, students } from "@/components/yoga/records";

export default async function NewSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template } = await searchParams;
  const selectedTemplate = lessonTemplates.find((item) => item.id === template) ?? lessonTemplates[0];

  return (
    <>
      <PageHeader title="予定登録" subtitle="テンプレートを選び、日時・場所・参加生徒を紐づける" />

      <SoftCard className="p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_310px] gap-5">
          <div className="min-w-0">
            <div className="grid grid-cols-[1fr_150px_150px] gap-3">
              <Field label="レッスンテンプレート">
                <div className="rounded-xl border border-[#eee4d8] bg-white/76 px-3 py-2.5">
                  <p className="text-[14px] font-extrabold">{selectedTemplate.name}</p>
                  <p className="mt-1 line-clamp-1 text-[12px] font-semibold text-[#5f665c]">{selectedTemplate.theme}</p>
                </div>
              </Field>
              <Field label="日付">
                <Input defaultValue="2025/5/24" className="h-10 bg-white/80 text-[14px]" />
              </Field>
              <Field label="時間">
                <Input defaultValue="10:00-11:00" className="h-10 bg-white/80 text-[14px]" />
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-[minmax(180px,1fr)_250px] gap-3">
              <Field label="場所">
                <Input defaultValue="スタジオA" className="h-10 bg-white/80 text-[14px]" />
              </Field>
              <Field label="形式">
                <div className="grid grid-cols-3 gap-1.5">
                  {["パーソナル", "グループ", "オンライン"].map((format) => (
                    <span key={format} className="flex h-10 items-center justify-center rounded-lg border border-[#d8e3d4] bg-white/80 text-[12px] font-bold text-[#4f7b58]">
                      {format}
                    </span>
                  ))}
                </div>
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-[160px_minmax(0,1fr)] gap-3">
              <Field label="ステータス">
                <div className="flex h-10 items-center justify-center rounded-lg border border-[#d8d1ef] bg-[#f2efff] text-[12px] font-bold text-[#6b61b8]">
                  予定
                </div>
              </Field>
              <div className="rounded-xl border border-[#eee4d8] bg-white/62 px-3 py-2">
                <p className="text-[12px] font-bold text-[#4f7b58]">運用メモ</p>
                <p className="mt-1 text-[12px] font-medium text-[#5f665c]">予定作成後、実施後に「カルテを書く」から記録へ進みます。</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#eee4d8] bg-white/62 p-3">
              <SectionTitle icon={CalendarDays} title="テンプレート内容" />
              <div className="mb-2 flex flex-wrap gap-2">
                {selectedTemplate.tags.map((tag) => (
                  <Pill key={tag}>{tag}</Pill>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Info label="基本構成" value={selectedTemplate.structure} />
                <Info label="注意点" value={selectedTemplate.cautions} />
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

            <div className="mt-3 grid gap-2">
              <Link
                href="/lessons"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#5d956d] px-5 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(64,113,77,0.2)]"
              >
                <Save className="h-4 w-4" />
                保存する
              </Link>
              <Link
                href="/lessons"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58]"
              >
                キャンセル
              </Link>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#eee4d8] bg-white/72 p-3">
      <p className="text-[12px] font-bold text-[#4f7b58]">{label}</p>
      <p className="mt-1 text-[12px] font-medium leading-5 text-[#50584e]">{value}</p>
    </div>
  );
}
