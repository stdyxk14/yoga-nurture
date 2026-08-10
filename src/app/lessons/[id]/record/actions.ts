"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseLessonRecordPayload, type LessonRecordFormState } from "@/lib/lesson-records";
import { formatRpcError } from "@/lib/supabase/rpc-errors";
import { createMutationContext } from "@/lib/supabase/server";

export async function saveLessonRecordAction(
  _prevState: LessonRecordFormState,
  formData: FormData,
): Promise<LessonRecordFormState> {
  const parsed = parseLessonRecordPayload(formData);
  if ("error" in parsed) return { error: parsed.error };

  try {
    const { supabase } = await createMutationContext();
    const { error } = await supabase.rpc("save_lesson_record", {
      p_record_id: parsed.recordId || null,
      p_schedule_id: parsed.scheduleId,
      p_status: parsed.status,
      p_overall_memo: parsed.overallMemo,
      p_overall_reaction: parsed.overallReaction,
      p_improvement: parsed.improvementPoints,
      p_blocks: parsed.blocks,
      p_students: parsed.students,
      p_previous_followups: parsed.previousFollowUps,
    });

    if (error) return { error: formatRpcError(error, "実施後記録を保存できませんでした") };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "実施後記録を保存できませんでした。" };
  }

  revalidatePath("/lessons");
  revalidatePath(`/lessons/${parsed.scheduleId}/record`);
  revalidatePath(`/schedules/${parsed.scheduleId}`);
  redirect("/lessons?tab=records");
}
