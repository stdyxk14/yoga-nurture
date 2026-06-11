"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { CalendarDays, CheckCircle2, Layers3, Save, UsersRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import type { LessonTemplate, StudentRecord } from "@/components/yoga/records";

export function ScheduleForm({
  templates,
  students,
  initialTemplateId,
}: {
  templates: LessonTemplate[];
  students: StudentRecord[];
  initialTemplateId?: string;
}) {
  const [selectedId, setSelectedId] = useState(initialTemplateId ?? templates[0]?.id ?? "");
  const [useTemplate, setUseTemplate] = useState(true);
  const selectedTemplate = templates.find((template) => template.id === selectedId) ?? templates[0];

  return (
    <>
      <PageHeader title="予定登録" subtitle="テンプレートを選び、日時・場所・参加生徒を紐づける" />

      <SoftCard className="p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_310px] gap-5">
          <div className="min-w-0">
            <SectionTitle icon={Layers3} title="テンプレートを選択" subtitle="選んだ内容が予定の土台になります" />
            <div className="grid grid-cols-4 gap-2">
              {templates.map((template) => {
                const active = useTemplate && selectedId === template.id;

                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => {
                      setUseTemplate(true);
                      setSelectedId(template.id);
                    }}
                    className={
                      active
                        ? "min-h-[88px] rounded-xl border border-[#5d956d] bg-[#edf5ef] p-3 text-left shadow-[0_8px_18px_rgba(64,113,77,0.12)]"
                        : "min-h-[88px] rounded-xl border border-[#eee4d8] bg-white/72 p-3 text-left"
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-extrabold">{template.name}</p>
                      {active ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[#5d956d]" /> : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-4 text-[#5f665c]">{template.theme}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setUseTemplate(true)}
                className="inline-flex h-8 items-center rounded-lg bg-[#5d956d] px-3 text-[12px] font-bold text-white"
              >
                テンプレートを選択
              </button>
              <button
                type="button"
                onClick={() => setUseTemplate(false)}
                className="inline-flex h-8 items-center rounded-lg border border-[#d8e3d4] bg-white px-3 text-[12px] font-bold text-[#4f7b58]"
              >
                テンプレートを使わずに予定を作成
              </button>
            </div>

            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_150px_150px] gap-3">
              <Field label="レッスン名">
                <Input defaultValue={useTemplate ? selectedTemplate.name : ""} className="h-10 bg-white/80 text-[14px]" />
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

            <div className="mt-4 rounded-xl border border-[#eee4d8] bg-white/62 p-3">
              <SectionTitle icon={CalendarDays} title="予定内容に反映される項目" />
              <div className="grid grid-cols-[1fr_1.2fr] gap-3">
                <Info label="目的・テーマ" value={useTemplate ? selectedTemplate.theme : "自由入力で作成します"} />
                <div className="rounded-xl border border-[#eee4d8] bg-white/72 p-3">
                  <p className="text-[12px] font-bold text-[#4f7b58]">タグ</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(useTemplate ? selectedTemplate.tags : ["#自由作成"]).map((tag) => (
                      <Pill key={tag}>{tag}</Pill>
                    ))}
                  </div>
                </div>
                <Info label="基本構成" value={useTemplate ? selectedTemplate.structure : "予定作成後にカルテで構成を作成します"} />
                <Info label="注意点" value={useTemplate ? selectedTemplate.cautions : "生徒情報を見ながら個別に設定します"} />
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
              <p className="text-[12px] font-bold text-[#4f7b58]">次の流れ</p>
              <p className="mt-1 text-[12px] font-medium leading-5 text-[#5f665c]">
                この内容で予定を登録し、レッスン前にカルテを準備します。
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/lessons" className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#5d956d] px-5 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(64,113,77,0.2)]">
                  <Save className="h-4 w-4" />
                  この内容で予定を登録
                </Link>
                <Link href="/lessons" className="inline-flex h-9 items-center justify-center rounded-lg border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58]">
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#eee4d8] bg-white/72 p-3">
      <p className="text-[12px] font-bold text-[#4f7b58]">{label}</p>
      <p className="mt-1 line-clamp-3 text-[12px] font-medium leading-5 text-[#50584e]">{value}</p>
    </div>
  );
}
