"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Clock3, History, Sparkles, X } from "lucide-react";
import { AiCopyButton } from "@/components/yoga/ai-copy-button";
import type { AiSuggestion } from "@/lib/ai-suggestions";

type AiSuggestionCardProps = {
  title: string;
  description: string;
  emptyText: string;
  latest?: AiSuggestion;
  history?: AiSuggestion[];
  isConfigured?: boolean;
  storageReady?: boolean;
  storageError?: string;
  action?: ReactNode;
  extraActions?: ReactNode;
  note?: string;
  anchorId?: string;
};

export function AiSuggestionCard({
  title,
  description,
  emptyText,
  latest,
  history = [],
  isConfigured = true,
  storageReady = true,
  storageError,
  action,
  extraActions,
  note,
  anchorId,
}: AiSuggestionCardProps) {
  const [open, setOpen] = useState(false);
  const visibleHistory = history.filter((item) => item.id !== latest?.id).slice(0, 3);

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
        {latest ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex min-h-9 items-center justify-center rounded-xl border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58] transition hover:bg-[#f8fcf6]"
          >
            提案を見る
          </button>
        ) : null}
        {action}
      </div>

      {visibleHistory.length ? (
        <details className="mt-3 rounded-xl border border-[#d8e3d4] bg-[#f8fcf6] p-3">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] font-bold text-[#4f7b58]">
            <History className="h-4 w-4" />
            履歴を見る
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

      {open && latest ? (
        <div className="fixed inset-0 z-[90] print:hidden">
          <button type="button" aria-label="AI提案を閉じる" onClick={() => setOpen(false)} className="absolute inset-0 bg-[#1f261e]/38" />
          <div className="absolute inset-x-3 top-8 max-h-[calc(100vh-4rem)] overflow-auto rounded-3xl border border-[#e7dfd4] bg-[#fbfaf6] p-4 shadow-[0_20px_60px_rgba(45,38,28,0.24)] md:left-1/2 md:right-auto md:w-[680px] md:-translate-x-1/2 md:p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-[#5d956d]">AIメンターからの提案</p>
                <h3 className="mt-1 text-[18px] font-extrabold text-[#283026]">{title}</h3>
                <p className="mt-1 text-[12px] font-semibold text-[#7a7f73]">{formatAiDate(latest.createdAt)} / {mentorLabel(latest.mentorType)}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e4dbcf] bg-white text-[#5d6b58]" aria-label="閉じる">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="rounded-2xl border border-[#d8e3d4] bg-white/84 p-3">
              <p className="whitespace-pre-line break-words text-[13px] font-medium leading-6 text-[#394238] md:text-[14px]">{latest.response}</p>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <AiCopyButton text={latest.response} label="提案をコピー" />
              {extraActions}
            </div>
          </div>
        </div>
      ) : null}
    </section>
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

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
