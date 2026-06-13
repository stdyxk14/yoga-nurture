"use server";

import { generateBlockAiSuggestion, type StudentAiActionState } from "@/lib/ai-suggestions";

export async function generateBlockAiSuggestionAction(
  _state: StudentAiActionState,
  formData: FormData,
): Promise<StudentAiActionState> {
  const blockId = String(formData.get("block_id") ?? "").trim();
  const mentorType = String(formData.get("mentor_type") ?? "lesson_design").trim();

  if (!blockId) {
    return { error: "ブロック情報が見つかりません。保存済みのブロックを開いてからAI相談してください。" };
  }

  return generateBlockAiSuggestion(blockId, mentorType);
}
