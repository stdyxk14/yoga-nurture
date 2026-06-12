"use server";

import { generateBlockAiSuggestion, type StudentAiActionState } from "@/lib/ai-suggestions";

export async function generateBlockAiSuggestionAction(
  _state: StudentAiActionState,
  formData: FormData,
): Promise<StudentAiActionState> {
  const blockId = String(formData.get("block_id") ?? "").trim();

  if (!blockId) {
    return { error: "ブロックが見つかりません。保存済みのブロックを開いてからAI相談してください。" };
  }

  return generateBlockAiSuggestion(blockId);
}
