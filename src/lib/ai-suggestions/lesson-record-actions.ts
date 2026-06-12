"use server";

import { generateLessonRecordAiSuggestion, type StudentAiActionState } from "@/lib/ai-suggestions";

export async function generateLessonRecordAiSuggestionAction(recordId: string): Promise<StudentAiActionState> {
  const normalizedRecordId = recordId.trim();

  if (!normalizedRecordId) {
    return { error: "実施後記録が見つかりません。先に記録を保存してください。" };
  }

  return generateLessonRecordAiSuggestion(normalizedRecordId);
}
