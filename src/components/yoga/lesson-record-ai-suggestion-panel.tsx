import { AiSuggestionCard } from "@/components/yoga/ai-suggestion-card";
import { LessonRecordAiButton } from "@/components/yoga/lesson-record-ai-button";
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
      title="実施後記録のAI振り返り提案"
      description="レッスン全体・ブロック評価・生徒コメントから、次回に活かす点を整理します。"
      emptyText="AIに相談すると、今日の振り返り・ブロック改善・生徒フォローが表示されます。"
      latest={latest}
      history={aiSuggestionState?.history ?? []}
      isConfigured={aiSuggestionState?.isConfigured ?? false}
      storageReady={aiSuggestionState?.storageReady ?? true}
      storageError={aiSuggestionState?.storageError}
      note={!recordId ? "下書き保存または記録完了後にAI相談できます。" : undefined}
      action={<LessonRecordAiButton recordId={recordId} label={latest ? "再生成" : "AIに相談"} />}
    />
  );
}
