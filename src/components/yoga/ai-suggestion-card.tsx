"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Activity, Clock3, HeartHandshake, History, MessageCircle, Sparkles, X } from "lucide-react";
import { AiCopyButton } from "@/components/yoga/ai-copy-button";
import { BlockAiButton } from "@/components/yoga/block-ai-button";
import { LessonPlanAiButton } from "@/components/yoga/lesson-plan-ai-button";
import { LessonRecordAiButton } from "@/components/yoga/lesson-record-ai-button";
import { StudentAiButton } from "@/components/yoga/student-ai-button";
import { formatJapaneseDateTime } from "@/lib/date-format";
import type { AiSuggestion, MentorType } from "@/lib/ai-suggestions";

type AiSuggestionCardProps = {
  title: string;
  description: string;
  emptyText: string;
  latest?: AiSuggestion;
  history?: AiSuggestion[];
  isConfigured?: boolean;
  storageReady?: boolean;
  storageError?: string;
  actionKind: "student" | "lesson_plan" | "block" | "lesson_record";
  targetId?: string;
  extraActions?: ReactNode;
  note?: string;
  anchorId?: string;
  generateLabel: string;
  modalTitle: string;
};

const mentors: Array<{
  type: MentorType;
  title: string;
  desc: string;
  label: string;
  icon: typeof Sparkles;
}> = [
  { type: "body", title: "身体分析メンター", desc: "身体面・安全面を重点確認", label: "身体面で相談", icon: Activity },
  { type: "communication", title: "寄り添い接客コーチ", desc: "声かけ・継続支援を整理", label: "接し方を相談", icon: HeartHandshake },
  { type: "lesson_design", title: "レッスン設計＆戦略家", desc: "構成・順番・時間配分を確認", label: "設計を相談", icon: Sparkles },
  { type: "general", title: "まとめて相談", desc: "全体をバランスよく確認", label: "総合提案を生成", icon: MessageCircle },
];

export function AiSuggestionCard({
  title,
  description,
  emptyText,
  latest,
  history = [],
  isConfigured = true,
  storageReady = true,
  storageError,
  actionKind,
  targetId,
  extraActions,
  note,
  anchorId,
  generateLabel,
  modalTitle,
}: AiSuggestionCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [consultOpen, setConsultOpen] = useState(false);
  const visibleHistory = history.filter((item) => item.id !== latest?.id).slice(0, 3);
  const canGenerate = isConfigured && storageReady;

  return (
    <section id={anchorId} className="min-w-0 scroll-mt-24 rounded-2xl border border-[#eee4d8] bg-[#fbf8f1] p-3 print:hidden md:p-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[#edf5ef] text-[#5d956d]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-extrabold text-[#283026] md:text-[16px]">{title}</h2>
              <p className="mt-0.5 line-clamp-2 text-[12px] font-semibold leading-5 text-[#6b7468]">{description}</p>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <StatusChip label={latest ? "提案あり" : "未生成"} tone={latest ? "green" : "gray"} />
          {!isConfigured ? <StatusChip label="AI未設定" tone="orange" /> : null}
          {!storageReady ? <StatusChip label="履歴未接続" tone="orange" /> : null}
        </div>
      </div>

      {latest ? (
        <div className="mt-3 rounded-2xl border border-[#d8e3d4] bg-white/82 p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#7a7f73]">
            <Clock3 className="h-3.5 w-3.5 text-[#5d956d]" />
            <span>{formatAiDate(latest.createdAt)}</span>
            <span className="rounded-full bg-[#f5f2ff] px-2 py-0.5 text-[#6b63b7]">{mentorLabel(latest.mentorType)}</span>
          </div>
          <p className="line-clamp-4 whitespace-pre-line break-words text-[13px] font-medium leading-6 text-[#394238]">{latest.response}</p>
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-[#d8e3d4] bg-white/70 p-3">
          <p className="text-[13px] font-semibold leading-6 text-[#657064]">{emptyText}</p>
        </div>
      )}

      {!isConfigured ? (
        <p className="mt-3 rounded-xl border border-[#efd3a7] bg-[#fff7e8] px-3 py-2 text-[12px] font-semibold leading-5 text-[#8b704c]">
          AI連携は未設定です。Vercel に OPENAI_API_KEY を設定すると提案を生成できます。
        </p>
      ) : null}

      {!storageReady && storageError ? (
        <p className="mt-3 rounded-xl border border-[#f2c9bd] bg-[#fff0ea] px-3 py-2 text-[12px] font-semibold leading-5 text-[#b75b48]">{storageError}</p>
      ) : null}

      {note ? <p className="mt-3 text-[11px] font-semibold leading-5 text-[#7a7f73]">{note}</p> : null}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="button"
          onClick={() => setConsultOpen(true)}
          disabled={!canGenerate}
          className="inline-flex min-h-9 items-center justify-center rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white transition hover:bg-[#4f835d] disabled:cursor-not-allowed disabled:opacity-55"
        >
          AIに相談
        </button>
        {latest ? (
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="inline-flex min-h-9 items-center justify-center rounded-xl border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58] transition hover:bg-[#f8fcf6]"
          >
            最新提案を見る
          </button>
        ) : null}
      </div>

      {visibleHistory.length ? (
        <details className="mt-3 rounded-xl border border-[#d8e3d4] bg-[#f8fcf6] p-3">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] font-bold text-[#4f7b58]">
            <History className="h-4 w-4" />
            提案履歴を見る
          </summary>
          <div className="mt-3 space-y-2">
            {visibleHistory.map((item) => (
              <article key={item.id} className="rounded-xl border border-[#eee4d8] bg-white/80 p-3">
                <p className="mb-1 text-[11px] font-bold text-[#7a7f73]">{formatAiDate(item.createdAt)} / {mentorLabel(item.mentorType)}</p>
                <p className="line-clamp-4 whitespace-pre-line break-words text-[12px] font-medium leading-5 text-[#394238]">{item.response}</p>
              </article>
            ))}
          </div>
        </details>
      ) : null}

      {consultOpen ? (
        <Modal title={modalTitle} onClose={() => setConsultOpen(false)}>
          <p className="mb-3 rounded-2xl border border-[#d8e3d4] bg-white/74 p-3 text-[12px] font-semibold leading-5 text-[#657064]">
            相談先を選ぶと、この画面の実データをもとにAI提案を生成して保存します。生成後はこのカードと履歴に反映されます。
          </p>
          <div className="grid gap-2">
            {mentors.map(({ type, title: mentorTitle, desc, label, icon: Icon }) => (
              <article key={type} className="rounded-2xl border border-[#eee4d8] bg-white/78 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#edf5ef] text-[#5d956d]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-extrabold">{mentorTitle}</p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-[#6b7468]">{desc}</p>
                    </div>
                  </div>
                  <div className="shrink-0">{renderMentorAction({ actionKind, targetId, mentorType: type, label: type === "general" ? generateLabel : label })}</div>
                </div>
              </article>
            ))}
          </div>
        </Modal>
      ) : null}

      {detailOpen && latest ? (
        <Modal title={title} subtitle={`${formatAiDate(latest.createdAt)} / ${mentorLabel(latest.mentorType)}`} onClose={() => setDetailOpen(false)}>
          <div className="rounded-2xl border border-[#d8e3d4] bg-white/84 p-3">
            <p className="whitespace-pre-line break-words text-[13px] font-medium leading-6 text-[#394238] md:text-[14px]">{latest.response}</p>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <AiCopyButton text={latest.response} label="提案をコピー" />
            {extraActions}
          </div>
        </Modal>
      ) : null}
    </section>
  );
}

function renderMentorAction({
  actionKind,
  targetId,
  mentorType,
  label,
}: {
  actionKind: AiSuggestionCardProps["actionKind"];
  targetId?: string;
  mentorType: MentorType;
  label: string;
}) {
  if (actionKind === "student") return <StudentAiButton studentId={targetId} mentorType={mentorType} label={label} />;
  if (actionKind === "lesson_plan") return <LessonPlanAiButton planId={targetId} mentorType={mentorType} label={label} />;
  if (actionKind === "block") return <BlockAiButton blockId={targetId} mentorType={mentorType} label={label} />;
  return <LessonRecordAiButton recordId={targetId} mentorType={mentorType} label={label} />;
}

function Modal({ title, subtitle, children, onClose }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] print:hidden">
      <button type="button" aria-label="閉じる" onClick={onClose} className="absolute inset-0 bg-[#1f261e]/38" />
      <div className="absolute inset-x-3 bottom-3 max-h-[calc(100vh-1.5rem)] overflow-auto rounded-3xl border border-[#e7dfd4] bg-[#fbfaf6] p-4 shadow-[0_20px_60px_rgba(45,38,28,0.24)] md:bottom-auto md:left-1/2 md:right-auto md:top-10 md:w-[680px] md:-translate-x-1/2 md:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-[#5d956d]">AIメンター</p>
            <h3 className="mt-1 text-[18px] font-extrabold text-[#283026]">{title}</h3>
            {subtitle ? <p className="mt-1 text-[12px] font-semibold text-[#7a7f73]">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e4dbcf] bg-white text-[#5d6b58]" aria-label="閉じる">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatusChip({ label, tone }: { label: string; tone: "green" | "orange" | "gray" }) {
  const className =
    tone === "green"
      ? "border-[#cfe1ca] bg-[#edf5ef] text-[#4f875a]"
      : tone === "orange"
        ? "border-[#efd3a7] bg-[#fff7e8] text-[#9b7338]"
        : "border-[#e2ded7] bg-white text-[#7a7f73]";

  return <span className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[11px] font-bold ${className}`}>{label}</span>;
}

function mentorLabel(type: AiSuggestion["mentorType"]) {
  const labels = {
    body: "身体分析",
    communication: "接客コーチ",
    lesson_design: "レッスン設計",
    general: "総合",
  } satisfies Record<AiSuggestion["mentorType"], string>;

  return labels[type] ?? labels.general;
}

function formatAiDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatJapaneseDateTime(date);
}
