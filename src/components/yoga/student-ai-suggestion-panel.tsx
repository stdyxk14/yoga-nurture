import { AiSuggestionCard } from "@/components/yoga/ai-suggestion-card";
import type { StudentRecord } from "@/components/yoga/records";
import type { StudentAiSuggestionState } from "@/lib/ai-suggestions";

export function StudentAiSuggestionPanel({
  student,
  aiSuggestionState,
}: {
  student: StudentRecord;
  aiSuggestionState: StudentAiSuggestionState;
  compact?: boolean;
}) {
  if (!aiSuggestionState.featureEnabled) return null;

  const latest = aiSuggestionState.history[0];

  return (
    <AiSuggestionCard
      title="次回レッスンに向けたAI提案"
      description="生徒情報・受講履歴・観察メモをもとに、次回の配慮ポイントを整理します。"
      emptyText="AIに相談すると、この生徒に合わせた次回レッスンの配慮ポイントが表示されます。"
      latest={latest}
      history={aiSuggestionState.history}
      isConfigured={aiSuggestionState.isConfigured}
      storageReady={aiSuggestionState.storageReady}
      storageError={aiSuggestionState.storageError}
      generateLabel="次回レッスン提案を生成"
      modalTitle="この生徒について相談"
      actionKind="student"
      targetId={student.id}
    />
  );
}
