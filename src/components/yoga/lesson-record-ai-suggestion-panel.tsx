import { AiSuggestionCard } from "@/components/yoga/ai-suggestion-card";
import type { StudentAiSuggestionState } from "@/lib/ai-suggestions";

type Props = {
  recordId?: string;
  aiSuggestionState?: StudentAiSuggestionState;
};

export function LessonRecordAiSuggestionPanel({ recordId, aiSuggestionState }: Props) {
  if (aiSuggestionState?.featureEnabled === false) return null;

  const latest = aiSuggestionState?.history[0];

  return (
    <AiSuggestionCard
      anchorId="ai-reflection"
      title="AIメンターからの振り返り提案"
      description="全体記録・ブロック評価・生徒コメントをもとに、次回に活かせる改善ポイントを整理します。"
      emptyText="AIに相談すると、今日の振り返り・ブロック改善・生徒フォローが表示されます。"
      latest={latest}
      history={aiSuggestionState?.history ?? []}
      isConfigured={aiSuggestionState?.isConfigured ?? false}
      storageReady={aiSuggestionState?.storageReady ?? true}
      storageError={aiSuggestionState?.storageError}
      note={!recordId ? "下書き保存または記録完了後にAI相談できます。" : undefined}
      generateLabel="振り返り提案を生成"
      modalTitle="この記録について相談"
      actionKind="lesson_record"
      targetId={recordId}
    />
  );
}
