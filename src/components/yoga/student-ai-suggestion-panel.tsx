import { Sparkles, Target } from "lucide-react";
import { SectionTitle } from "@/components/yoga/page-kit";
import type { StudentRecord } from "@/components/yoga/records";
import { StudentAiButton } from "@/components/yoga/student-ai-button";
import type { StudentAiSuggestionState } from "@/lib/ai-suggestions";

export function StudentAiSuggestionPanel({
  student,
  aiSuggestionState,
  compact = false,
}: {
  student: StudentRecord;
  aiSuggestionState: StudentAiSuggestionState;
  compact?: boolean;
}) {
  const latest = aiSuggestionState.history[0];
  const history = aiSuggestionState.history.slice(0, 3);

  return (
    <div className="min-w-0">
      <SectionTitle
        icon={Sparkles}
        title="AIメンターからの次回提案"
        subtitle="生徒情報・受講履歴・観察メモをもとに、次回レッスンの配慮ポイントを提案します。"
      />

      <div className="rounded-2xl border border-[#eee4d8] bg-[#fbf8f1] p-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatusPill label={aiSuggestionState.isConfigured ? "AI接続準備済み" : "AI未設定"} tone={aiSuggestionState.isConfigured ? "green" : "orange"} />
          {latest ? <StatusPill label="最新提案あり" tone="lavender" /> : <StatusPill label="履歴なし" tone="gray" />}
        </div>

        {!aiSuggestionState.isConfigured ? (
          <p className="rounded-xl border border-[#efd3a7] bg-[#fff7e8] px-3 py-2 text-[12px] font-semibold leading-5 text-[#8b704c]">
            AI連携は未設定です。Vercel に OPENAI_API_KEY を設定すると、この生徒に合わせた次回提案を生成できます。
          </p>
        ) : null}

        {!aiSuggestionState.storageReady ? (
          <p className="mt-2 rounded-xl border border-[#f2c9bd] bg-[#fff0ea] px-3 py-2 text-[12px] font-semibold leading-5 text-[#b75b48]">
            {aiSuggestionState.storageError}
          </p>
        ) : null}

        {latest ? (
          <article className="mt-3 rounded-2xl border border-[#d8e3d4] bg-white/82 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-extrabold text-[#394238]">最新のAI提案</p>
              <p className="text-[11px] font-bold text-[#7a7f73]">
                {formatAiDate(latest.createdAt)} / {mentorLabel(latest.mentorType)}
              </p>
            </div>
            <div className="whitespace-pre-line text-[13px] font-medium leading-6 text-[#394238]">{latest.response}</div>
          </article>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-[#d8e3d4] bg-white/70 p-3">
            <p className="text-[13px] font-semibold leading-6 text-[#657064]">
              AIメンターに相談すると、この生徒に合わせた次回レッスンの配慮ポイントが表示されます。
            </p>
            <div className="mt-3 grid gap-2 text-[12px] font-medium leading-5 text-[#50584e]">
              {student.caution ? <BasicInfoHint label="ケガなどの注意点" value={student.caution} /> : null}
              {student.memo ? <BasicInfoHint label="その他メモ" value={student.memo} /> : null}
              {!student.caution && !student.memo ? <p>ヨガ他経験・ケガなどの注意点・その他メモを登録すると、提案の材料が増えます。</p> : null}
            </div>
          </div>
        )}

        <div className={compact ? "mt-3" : "mt-4"}>
          <StudentAiButton studentId={student.id} label={latest ? "最新のAI提案を更新" : "AIメンターに次回プランを相談"} />
        </div>

        {history.length ? (
          <details className="mt-3 rounded-xl border border-[#d8e3d4] bg-[#f8fcf6] p-3">
            <summary className="cursor-pointer text-[13px] font-bold text-[#4f7b58]">AI提案履歴を見る</summary>
            <div className="mt-3 space-y-2">
              {history.map((item) => (
                <article key={item.id} className="rounded-xl border border-[#eee4d8] bg-white/80 p-3">
                  <p className="mb-1 text-[11px] font-bold text-[#7a7f73]">
                    {formatAiDate(item.createdAt)} / {mentorLabel(item.mentorType)}
                  </p>
                  <p className="line-clamp-5 whitespace-pre-line text-[12px] font-medium leading-5 text-[#394238]">{item.response}</p>
                </article>
              ))}
            </div>
          </details>
        ) : null}
      </div>

      <div className="mt-3 rounded-2xl border border-dashed border-[#d8e3d4] bg-white/60 p-3 text-[11px] font-semibold leading-5 text-[#7a7f73]">
        将来的には、年代・性別・ヨガ他経験・ケガなどの注意点・観察メモ・受講履歴・ブロック評価をAI提案の材料にします。
      </div>
    </div>
  );
}

function BasicInfoHint({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Target className="mt-0.5 h-4 w-4 shrink-0 text-[#629268]" />
      <p className="min-w-0 break-words">
        <span className="font-bold text-[#8b704c]">{label}：</span>
        {value}
      </p>
    </div>
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

function mentorLabel(type: StudentAiSuggestionState["history"][number]["mentorType"]) {
  const labels = {
    body: "身体分析メンター",
    communication: "寄り添い接客コーチ",
    lesson_design: "レッスン設計メンター",
    general: "総合AIメンター",
  } satisfies Record<StudentAiSuggestionState["history"][number]["mentorType"], string>;

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
