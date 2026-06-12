import { ClipboardCheck, Lightbulb, Sparkles } from "lucide-react";
import { AiCopyButton } from "@/components/yoga/ai-copy-button";
import { LessonRecordAiButton } from "@/components/yoga/lesson-record-ai-button";
import { SectionTitle } from "@/components/yoga/page-kit";
import type { StudentAiSuggestionState } from "@/lib/ai-suggestions";

type Props = {
  recordId?: string;
  aiSuggestionState?: StudentAiSuggestionState;
};

export function LessonRecordAiSuggestionPanel({ recordId, aiSuggestionState }: Props) {
  const latest = aiSuggestionState?.history[0];
  const history = aiSuggestionState?.history.slice(0, 3) ?? [];
  const configured = aiSuggestionState?.isConfigured ?? false;
  const storageReady = aiSuggestionState?.storageReady ?? true;

  return (
    <section id="ai-reflection" className="min-w-0 rounded-2xl border border-[#eee4d8] bg-[#fbf8f1] p-4 scroll-mt-24 print:hidden">
      <SectionTitle
        icon={Sparkles}
        title="AIメンターからの振り返り提案"
        subtitle="レッスン全体の記録・ブロックごとの評価・生徒ごとのコメントをもとに、次回に活かせる改善ポイントを整理します。"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill label={configured ? "AI接続済み" : "AI未設定"} tone={configured ? "green" : "orange"} />
        {latest ? <StatusPill label="最新提案あり" tone="lavender" /> : <StatusPill label="未生成" tone="gray" />}
        <StatusPill label="保存済み記録が対象" tone="gray" />
      </div>

      {!recordId ? (
        <p className="mt-3 rounded-xl border border-[#efd3a7] bg-[#fff7e8] px-3 py-2 text-[12px] font-semibold leading-5 text-[#8b704c]">
          AI振り返りは保存済みの実施後記録に対して利用できます。先に下書き保存、または記録を完了してください。
        </p>
      ) : null}

      {!configured ? (
        <p className="mt-3 rounded-xl border border-[#efd3a7] bg-[#fff7e8] px-3 py-2 text-[12px] font-semibold leading-5 text-[#8b704c]">
          AI連携は未設定です。Vercel に OPENAI_API_KEY を設定すると、実施後記録の振り返り提案を生成できます。
        </p>
      ) : null}

      {!storageReady ? (
        <p className="mt-3 rounded-xl border border-[#f2c9bd] bg-[#fff0ea] px-3 py-2 text-[12px] font-semibold leading-5 text-[#b75b48]">
          {aiSuggestionState?.storageError}
        </p>
      ) : null}

      {latest ? (
        <article className="mt-3 rounded-2xl border border-[#d8e3d4] bg-white/82 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[13px] font-extrabold text-[#394238]">
              <ClipboardCheck className="h-4 w-4 text-[#5d956d]" />
              最新の振り返り提案
            </p>
            <p className="text-[11px] font-bold text-[#7a7f73]">{formatAiDate(latest.createdAt)} / レッスン設計メンター</p>
          </div>
          <div className="whitespace-pre-line break-words text-[13px] font-medium leading-6 text-[#394238]">{latest.response}</div>
          <div className="mt-3">
            <AiCopyButton text={latest.response} label="振り返り提案をコピー" />
          </div>
        </article>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-[#d8e3d4] bg-white/70 p-3">
          <div className="flex items-start gap-2 text-[13px] font-semibold leading-6 text-[#657064]">
            <Lightbulb className="mt-1 h-4 w-4 shrink-0 text-[#8b704c]" />
            <p>
              AIメンターに相談すると、今日のレッスン全体・ブロックごとの反応・生徒フォローを整理した振り返りが表示されます。
            </p>
          </div>
        </div>
      )}

      <div className="mt-4">
        <LessonRecordAiButton recordId={recordId} label={latest ? "最新の提案を更新" : "この記録をAIに振り返ってもらう"} />
      </div>

      {history.length ? (
        <details className="mt-3 rounded-xl border border-[#d8e3d4] bg-[#f8fcf6] p-3">
          <summary className="cursor-pointer text-[13px] font-bold text-[#4f7b58]">履歴を見る</summary>
          <div className="mt-3 space-y-2">
            {history.map((item) => (
              <article key={item.id} className="rounded-xl border border-[#eee4d8] bg-white/80 p-3">
                <p className="mb-1 text-[11px] font-bold text-[#7a7f73]">{formatAiDate(item.createdAt)} / レッスン設計メンター</p>
                <p className="line-clamp-5 whitespace-pre-line break-words text-[12px] font-medium leading-5 text-[#394238]">{item.response}</p>
              </article>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "green" | "orange" | "lavender" | "gray" }) {
  const className =
    tone === "green"
      ? "border-[#cfe1ca] bg-[#edf5ef] text-[#4f875a]"
      : tone === "orange"
        ? "border-[#efd3a7] bg-[#fff7e8] text-[#9b7338]"
        : tone === "lavender"
          ? "border-[#d6d1ef] bg-[#f5f2ff] text-[#6b63b7]"
          : "border-[#e2ded7] bg-white text-[#7a7f73]";

  return <span className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[11px] font-bold ${className}`}>{label}</span>;
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
