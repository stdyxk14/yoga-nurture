"use server";

import { generateLessonPlanAiSuggestion, type StudentAiActionState } from "@/lib/ai-suggestions";

export async function generateLessonPlanAiSuggestionAction(
  _state: StudentAiActionState,
  formData: FormData,
): Promise<StudentAiActionState> {
  const planId = String(formData.get("lesson_plan_id") ?? "").trim();
  const mentorType = String(formData.get("mentor_type") ?? "lesson_design").trim();

  if (!planId) {
    return { error: "レッスンプラン情報が見つかりません。" };
  }

  return generateLessonPlanAiSuggestion(planId, mentorType);
}
