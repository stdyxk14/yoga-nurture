"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { CalendarDays, CheckCircle2, Layers3, Plus, Save, UsersRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { getLessonBlocks } from "@/components/yoga/records";
import type { LessonRecord, StudentRecord } from "@/components/yoga/records";

export function ScheduleForm({
  plans,
  students,
  initialPlanId,
}: {
  plans: LessonRecord[];
  students: StudentRecord[];
  initialPlanId?: string;
}) {
  const [selectedId, setSelectedId] = useState(initialPlanId ?? plans[0]?.id ?? "");
  const [usePlan, setUsePlan] = useState(true);
  const selectedPlan = plans.find((plan) => plan.id === selectedId) ?? plans[0];
  const selectedBlocks = selectedPlan ? getLessonBlocks(selectedPlan) : [];
  const majorCategories = Array.from(new Set(selectedBlocks.map((block) => block.majorCategory))).slice(0, 5);

  return (
    <>
      <div className="md:hidden">
        <MobileScheduleForm
          plans={plans}
          students={students}
          selectedId={selectedId}
          selectedPlan={selectedPlan}
          selectedBlocks={selectedBlocks}
          majorCategories={majorCategories}
          usePlan={usePlan}
          setSelectedId={setSelectedId}
          setUsePlan={setUsePlan}
        />
      </div>

      <div className="hidden md:block">
        <PageHeader title="予定登録" subtitle="完成済みレッスンプランに日時・場所・参加予定生徒を紐づける" />

        <SoftCard className="p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_310px] gap-5">
            <div className="min-w-0">
              <SectionTitle
                icon={Layers3}
                title="使用するレッスンプランを選択"
                subtitle="事前に作成したレッスンプランを選んで、日時・場所・参加予定生徒を紐づけます。"
              />

              <div className="grid grid-cols-3 gap-3">
                {plans.map((plan) => {
                  const blocks = getLessonBlocks(plan);
                  const active = usePlan && selectedId === plan.id;
                  const categories = Array.from(new Set(blocks.map((block) => block.majorCategory))).slice(0, 3);

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => {
                        setUsePlan(true);
                        setSelectedId(plan.id);
                      }}
                      className={
                        active
                          ? "min-h-[176px] rounded-xl border border-[#5d956d] bg-[#edf5ef] p-3 text-left shadow-[0_8px_18px_rgba(64,113,77,0.12)]"
                          : "min-h-[176px] rounded-xl border border-[#eee4d8] bg-white/72 p-3 text-left"
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[14px] font-extrabold leading-5">{plan.title}</p>
                        {active ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[#5d956d]" /> : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-5 text-[#5f665c]">{plan.theme}</p>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold">
                        <InfoChip label="合計時間" value={plan.duration} />
                        <InfoChip label="使用ブロック" value={`${blocks.length}個`} />
                      </div>

                      <div className="mt-3">
                        <p className="mb-1 text-[11px] font-bold text-[#7c8476]">主な大カテゴリー</p>
                        <p className="line-clamp-1 text-[12px] font-bold text-[#4f7b58]">{categories.join(" / ")}</p>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {plan.tags.slice(0, 3).map((tag) => (
                          <Pill key={tag}>{tag}</Pill>
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] font-semibold text-[#7c8476]">最終更新日：2025/5/20</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setUsePlan(true)}
                  className="inline-flex h-8 items-center rounded-lg bg-[#5d956d] px-3 text-[12px] font-bold text-white"
                >
                  このレッスンプランを選択
                </button>
                <button
                  type="button"
                  onClick={() => setUsePlan(false)}
                  className="inline-flex h-8 items-center rounded-lg border border-[#d8e3d4] bg-white px-3 text-[12px] font-bold text-[#4f7b58]"
                >
                  レッスンプランを使わずに予定を作成
                </button>
                <Link
                  href="/lessons/new"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d8e3d4] bg-[#f8fcf6] px-3 text-[12px] font-bold text-[#4f7b58]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  新しくレッスンプランを作成
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-[minmax(0,1fr)_150px_150px] gap-3">
                <Field label="レッスン名">
                  <Input defaultValue={usePlan ? selectedPlan?.title : ""} className="h-10 bg-white/80 text-[14px]" />
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
                  <Input defaultValue={selectedPlan?.place ?? "スタジオA"} className="h-10 bg-white/80 text-[14px]" />
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
                <div className="grid grid-cols-[1fr_1.1fr] gap-3">
                  <Info label="テーマ" value={usePlan ? selectedPlan?.theme ?? "" : "自由入力で予定を作成します"} />
                  <Info label="主な大カテゴリー" value={usePlan ? majorCategories.join(" / ") : "予定作成後にプランを組みます"} />
                  <div className="rounded-xl border border-[#eee4d8] bg-white/72 p-3">
                    <p className="text-[12px] font-bold text-[#4f7b58]">タグ</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(usePlan ? selectedPlan?.tags ?? [] : ["#自由作成"]).map((tag) => (
                        <Pill key={tag}>{tag}</Pill>
                      ))}
                    </div>
                  </div>
                  <Info label="使用ブロック" value={usePlan ? `${selectedBlocks.length}個 / ${selectedBlocks.map((block) => block.name).slice(0, 4).join("、")}` : "未設定"} />
                </div>
              </div>
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
                <p className="text-[12px] font-bold text-[#4f7b58]">次の流れ</p>
                <p className="mt-1 text-[12px] font-medium leading-5 text-[#5f665c]">
                  予定を登録したあと、必要に応じて原稿を印刷し、レッスン後はブロックごとの反応を記録します。
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
      </div>
    </>
  );
}

function MobileScheduleForm({
  plans,
  students,
  selectedId,
  selectedPlan,
  selectedBlocks,
  majorCategories,
  usePlan,
  setSelectedId,
  setUsePlan,
}: {
  plans: LessonRecord[];
  students: StudentRecord[];
  selectedId: string;
  selectedPlan: LessonRecord | undefined;
  selectedBlocks: ReturnType<typeof getLessonBlocks>;
  majorCategories: string[];
  usePlan: boolean;
  setSelectedId: (id: string) => void;
  setUsePlan: (value: boolean) => void;
}) {
  return (
    <div className="mx-auto max-w-[430px] space-y-4 overflow-x-hidden">
      <section className="rounded-[24px] border border-[#eee4d8] bg-white/84 p-4 shadow-[0_12px_26px_rgba(122,104,80,0.08)]">
        <h1 className="text-[22px] font-extrabold tracking-normal">予定登録</h1>
        <p className="mt-1 text-[12px] font-semibold leading-5 text-[#6d7469]">レッスンプランに日時・場所・参加予定生徒を紐づけます。</p>
      </section>

      <MobileCard title="使用するレッスンプランを選択">
        <p className="mb-3 text-[12px] font-semibold leading-5 text-[#6d7469]">事前に作成したレッスンプランを選んで、予定内容へ反映します。</p>
        <div className="grid gap-3">
          {plans.map((plan) => {
            const blocks = getLessonBlocks(plan);
            const active = usePlan && selectedId === plan.id;
            const categories = Array.from(new Set(blocks.map((block) => block.majorCategory))).slice(0, 3);
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => {
                  setUsePlan(true);
                  setSelectedId(plan.id);
                }}
                className={active ? "rounded-2xl border border-[#5d956d] bg-[#edf5ef] p-3 text-left" : "rounded-2xl border border-[#eee4d8] bg-white/76 p-3 text-left"}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 break-words text-[15px] font-extrabold leading-5">{plan.title}</p>
                  {active ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[#5d956d]" /> : null}
                </div>
                <p className="mt-2 line-clamp-2 text-[12px] font-medium leading-5 text-[#5f665c]">{plan.theme}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <InfoChip label="合計時間" value={plan.duration} />
                  <InfoChip label="使用ブロック" value={`${blocks.length}個`} />
                </div>
                <p className="mt-2 text-[11px] font-bold text-[#4f7b58]">主な大カテゴリー：{categories.join(" / ")}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {plan.tags.slice(0, 3).map((tag) => <Pill key={tag}>{tag}</Pill>)}
                </div>
                <p className="mt-2 text-[11px] font-semibold text-[#7c8476]">最終更新日：2025/5/20</p>
              </button>
            );
          })}
        </div>
        <div className="mt-3 grid gap-2">
          <button type="button" onClick={() => setUsePlan(true)} className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#5d956d] text-[13px] font-bold text-white">このプランを選択</button>
          <button type="button" onClick={() => setUsePlan(false)} className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#d8e3d4] bg-white text-[13px] font-bold text-[#4f7b58]">プランを使わずに予定を作成</button>
          <Link href="/lessons/new" className="inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-[#d8e3d4] bg-[#f8fcf6] text-[13px] font-bold text-[#4f7b58]"><Plus className="h-4 w-4" />新しくレッスンプランを作成</Link>
        </div>
      </MobileCard>

      <MobileCard title="日時・場所">
        <div className="grid gap-3">
          <Field label="レッスン名"><Input defaultValue={usePlan ? selectedPlan?.title : ""} className="h-11 bg-white/90 text-[15px]" /></Field>
          <Field label="日付"><Input defaultValue="2025/5/24" className="h-11 bg-white/90 text-[15px]" /></Field>
          <Field label="開始時間"><Input defaultValue="10:00" className="h-11 bg-white/90 text-[15px]" /></Field>
          <Field label="終了時間"><Input defaultValue="11:00" className="h-11 bg-white/90 text-[15px]" /></Field>
          <Field label="場所"><Input defaultValue={selectedPlan?.place ?? "スタジオA"} className="h-11 bg-white/90 text-[15px]" /></Field>
          <Field label="形式">
            <select className="h-11 w-full rounded-md border border-input bg-white/90 px-3 text-[15px]">
              <option>グループ</option>
              <option>パーソナル</option>
              <option>オンライン</option>
            </select>
          </Field>
        </div>
      </MobileCard>

      <MobileCard title="予定内容に反映される項目">
        <div className="grid gap-2">
          <Info label="テーマ" value={usePlan ? selectedPlan?.theme ?? "" : "自由入力で予定を作成します"} />
          <Info label="主な大カテゴリー" value={usePlan ? majorCategories.join(" / ") : "予定作成後にプランを組みます"} />
          <Info label="使用ブロック" value={usePlan ? `${selectedBlocks.length}個 / ${selectedBlocks.map((block) => block.name).slice(0, 4).join("、")}` : "未設定"} />
        </div>
      </MobileCard>

      <MobileCard title="参加予定生徒">
        <div className="grid gap-2">
          {students.map((student, index) => (
            <label key={student.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#eee4d8] bg-white/76 p-3">
              <input type="checkbox" defaultChecked={index < 4} className="mt-1 h-4 w-4 shrink-0 accent-[#5d956d]" />
              <span className="min-w-0">
                <span className="block text-[13px] font-extrabold">{student.name}</span>
                <span className="mt-1 block line-clamp-2 text-[11px] font-medium leading-5 text-[#6b7468]">注意：{student.caution}</span>
                <span className="mt-1 block line-clamp-2 text-[11px] font-medium leading-5 text-[#6b7468]">メモ：{student.memo}</span>
              </span>
            </label>
          ))}
        </div>
      </MobileCard>

      <MobileCard title="次の流れ">
        <div className="grid gap-2 text-[13px] font-semibold leading-5 text-[#50584e]">
          <p>1. 原稿を印刷してスタジオへ持参</p>
          <p>2. レッスン後に実施記録を入力</p>
          <p>3. ブロックごとの反応を評価</p>
        </div>
      </MobileCard>

      <div className="grid gap-2">
        <Link href="/lessons" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#5d956d] text-[15px] font-bold text-white"><Save className="h-5 w-5" />この内容で予定を登録</Link>
        <Link href="/lessons" className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#d8e3d4] bg-white text-[14px] font-bold text-[#4f7b58]">キャンセル</Link>
      </div>
    </div>
  );
}

function MobileCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[24px] border border-[#eee4d8] bg-white/84 p-4 shadow-[0_10px_24px_rgba(122,104,80,0.06)]">
      <h2 className="mb-3 text-[16px] font-extrabold">{title}</h2>
      {children}
    </section>
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

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/72 px-2 py-1.5">
      <p className="text-[10px] text-[#7c8476]">{label}</p>
      <p className="text-[12px] text-[#304134]">{value}</p>
    </div>
  );
}
