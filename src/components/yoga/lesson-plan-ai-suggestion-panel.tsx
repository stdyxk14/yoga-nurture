import { AiSuggestionCard } from "@/components/yoga/ai-suggestion-card";
import type { StudentAiSuggestionState } from "@/lib/ai-suggestions";
import type { DbLessonPlan } from "@/lib/lesson-plans";

type Props = {
  plan?: DbLessonPlan;
  planId?: string;
  aiSuggestionState?: StudentAiSuggestionState;
  context?: "detail" | "edit" | "script";
};

export function LessonPlanAiSuggestionPanel({ plan, planId, aiSuggestionState, context = "detail" }: Props) {
  if (aiSuggestionState?.featureEnabled === false) return null;

  const resolvedPlanId = plan?.id ?? planId;
  const latest = aiSuggestionState?.history[0];

  return (
    <AiSuggestionCard
      title={context === "script" ? "この原稿に対するAI改善提案" : "このレッスンに対するAI改善提案"}
      description="ブロック構成・時間配分・参加予定生徒の注意点をもとに、レッスン前の改善ポイントを提案します。"
      emptyText="AIに相談すると、流れ・時間配分・安全面・声かけの観点で改善ポイントが表示されます。"
      latest={latest}
      history={aiSuggestionState?.history ?? []}
      isConfigured={aiSuggestionState?.isConfigured ?? false}
      storageReady={aiSuggestionState?.storageReady ?? true}
      storageError={aiSuggestionState?.storageError}
      note={context === "edit" ? "保存済みの内容をもとに提案します。未保存の変更は保存後に反映されます。" : undefined}
      generateLabel="プラン改善提案を生成"
      modalTitle="このレッスンプランについて相談"
      actionKind="lesson_plan"
      targetId={resolvedPlanId}
    />
  );
}
