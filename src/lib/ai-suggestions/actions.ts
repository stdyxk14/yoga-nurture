"use server";

import { generateStudentAiSuggestion, type StudentAiActionState } from "@/lib/ai-suggestions";

export async function generateStudentAiSuggestionAction(
  _state: StudentAiActionState,
  formData: FormData,
): Promise<StudentAiActionState> {
  const studentId = String(formData.get("student_id") ?? "").trim();

  if (!studentId) {
    return { error: "生徒情報が見つかりません。" };
  }

  return generateStudentAiSuggestion(studentId);
}
