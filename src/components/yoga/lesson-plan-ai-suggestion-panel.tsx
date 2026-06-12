import { Lightbulb, Sparkles } from "lucide-react";
import { SectionTitle } from "@/components/yoga/page-kit";
import { LessonPlanAiButton } from "@/components/yoga/lesson-plan-ai-button";
import type { StudentAiSuggestionState } from "@/lib/ai-suggestions";
import type { DbLessonPlan } from "@/lib/lesson-plans";

type Props = {
  plan?: DbLessonPlan;
  planId?: string;
  aiSuggestionState?: StudentAiSuggestionState;
  context?: "detail" | "edit" | "script";
};

export function LessonPlanAiSuggestionPanel({ plan, planId, aiSuggestionState, context = "detail" }: Props) {
  const resolvedPlanId = plan?.id ?? planId;
  const latest = aiSuggestionState?.history[0];
  const history = aiSuggestionState?.history.slice(0, 3) ?? [];
  const configured = aiSuggestionState?.isConfigured ?? false;
  const storageReady = aiSuggestionState?.storageReady ?? true;

  return (
    <section className="min-w-0 rounded-2xl border border-[#eee4d8] bg-[#fbf8f1] p-4 print:hidden">
      <SectionTitle
        icon={Sparkles}
        title="AIメンターからのプラン改善提案"
        subtitle="ブロック構成・時間配分・参加予定生徒の注意点をもとに、レッスン前の改善ポイントを提案します。"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill label={configured ? "AI接続準備済み" : "AI未設定"} tone={configured ? "green" : "orange"} />
        {latest ? <StatusPill label="最新提案あり" tone="lavender" /> : <StatusPill label="未生成" tone="gray" />}
      </div>

      {context === "edit" ? (
        <p className="mt-3 rounded-xl border border-[#efd3a7] bg-[#fff7e8] px-3 py-2 text-[12px] font-semibold leading-5 text-[#8b704c]">
          AI相談は保存済みの内容をもとに行います。未保存の変更がある場合は、保存後にAI相談してください。
        </p>
      ) : null}

      {!configured ? (
        <p className="mt-3 rounded-xl border border-[#efd3a7] bg-[#fff7e8] px-3 py-2 text-[12px] font-semibold leading-5 text-[#8b704c]">
          AI連携は未設定です。Vercel に OPENAI_API_KEY を設定すると、レッスンプラン改善提案を生成できます。
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
            <p className="text-[13px] font-extrabold text-[#394238]">最新の改善提案</p>
            <p className="text-[11px] font-bold text-[#7a7f73]">{formatAiDate(latest.createdAt)} / レッスン設計メンター</p>
          </div>
          <div className="whitespace-pre-line text-[13px] font-medium leading-6 text-[#394238]">{latest.response}</div>
        </article>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-[#d8e3d4] bg-white/70 p-3">
          <div className="flex items-start gap-2 text-[13px] font-semibold leading-6 text-[#657064]">
            <Lightbulb className="mt-1 h-4 w-4 shrink-0 text-[#8b704c]" />
            <p>
              AIメンターに相談すると、流れ・時間配分・安全面・声かけの観点で改善ポイントが表示されます。
            </p>
          </div>
        </div>
      )}

      <div className="mt-4">
        <LessonPlanAiButton
          planId={resolvedPlanId}
          label={latest ? (context === "script" ? "この原稿の流れをAIに確認" : "最新の提案を更新") : "このレッスンプランをAIに相談"}
        />
      </div>

      {history.length ? (
        <details className="mt-3 rounded-xl border border-[#d8e3d4] bg-[#f8fcf6] p-3">
          <summary className="cursor-pointer text-[13px] font-bold text-[#4f7b58]">履歴を見る</summary>
          <div className="mt-3 space-y-2">
            {history.map((item) => (
              <article key={item.id} className="rounded-xl border border-[#eee4d8] bg-white/80 p-3">
                <p className="mb-1 text-[11px] font-bold text-[#7a7f73]">{formatAiDate(item.createdAt)} / レッスン設計メンター</p>
                <p className="line-clamp-5 whitespace-pre-line text-[12px] font-medium leading-5 text-[#394238]">{item.response}</p>
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
