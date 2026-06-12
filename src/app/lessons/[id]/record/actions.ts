"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseLessonRecordPayload, type LessonRecordFormState } from "@/lib/lesson-records";
import { requireUserId } from "@/lib/students";

export async function saveLessonRecordAction(
  _prevState: LessonRecordFormState,
  formData: FormData,
): Promise<LessonRecordFormState> {
  const parsed = parseLessonRecordPayload(formData);
  if ("error" in parsed) return { error: parsed.error };

  let recordId = parsed.recordId;
  let nextPath = "/lessons?tab=records";

  try {
    const { supabase, userId } = await requireUserId();
    const { data: schedule, error: scheduleError } = await supabase
      .from("schedules")
      .select("id,user_id,lesson_plan_id,lesson_name,starts_at")
      .eq("id", parsed.scheduleId)
      .eq("user_id", userId)
      .maybeSingle();

    if (scheduleError) return { error: `予定を確認できませんでした: ${scheduleError.message}` };
    if (!schedule) return { error: "予定が見つかりません。" };

    if (recordId) {
      const { error } = await supabase
        .from("lesson_records")
        .update({
          lesson_plan_id: schedule.lesson_plan_id,
          lesson_name: schedule.lesson_name,
          record_date: new Date(schedule.starts_at).toISOString().slice(0, 10),
          overall_memo: parsed.overallMemo,
          student_reaction: parsed.overallReaction,
          improvement: parsed.improvementPoints,
          updated_at: new Date().toISOString(),
        })
        .eq("id", recordId)
        .eq("user_id", userId);

      if (error) return { error: `実施後記録を更新できませんでした: ${error.message}` };
    } else {
      const { data: record, error } = await supabase
        .from("lesson_records")
        .insert({
          user_id: userId,
          schedule_id: parsed.scheduleId,
          lesson_plan_id: schedule.lesson_plan_id,
          lesson_name: schedule.lesson_name,
          record_date: new Date(schedule.starts_at).toISOString().slice(0, 10),
          overall_memo: parsed.overallMemo,
          student_reaction: parsed.overallReaction,
          improvement: parsed.improvementPoints,
        })
        .select("id")
        .single();

      if (error || !record) return { error: `実施後記録を保存できませんでした: ${error?.message ?? "保存結果を確認できませんでした。"}` };
      recordId = record.id;
    }

    const { error: deleteBlocksError } = await supabase.from("lesson_record_blocks").delete().eq("lesson_record_id", recordId);
    if (deleteBlocksError) return { error: `既存のブロック記録を更新できませんでした: ${deleteBlocksError.message}` };

    if (parsed.blocks.length) {
      const { error: blockError } = await supabase.from("lesson_record_blocks").insert(
        parsed.blocks.map((block) => ({
          lesson_record_id: recordId,
          block_template_id: block.block_template_id,
          sort_order: block.sort_order,
          done: block.done,
          actual_duration_minutes: block.actual_duration_minutes,
          reaction: block.reaction,
          teacher_memo: block.teacher_memo,
          improvement_memo: block.improvement_memo,
          use_again: block.use_again,
          script_revision: block.script_revision,
        })),
      );

      if (blockError) return { error: `ブロックごとの記録を保存できませんでした: ${blockError.message}` };
    }

    const { error: deleteStudentsError } = await supabase.from("lesson_record_students").delete().eq("lesson_record_id", recordId);
    if (deleteStudentsError) return { error: `既存の生徒別記録を更新できませんでした: ${deleteStudentsError.message}` };

    if (parsed.students.length) {
      const { error: studentError } = await supabase.from("lesson_record_students").insert(
        parsed.students.map((student) => ({
          lesson_record_id: recordId,
          student_id: student.student_id,
          attendance_status: student.attendance_status,
          condition: student.condition,
          memo: student.memo,
          next_follow: student.next_follow,
        })),
      );

      if (studentError) return { error: `参加生徒ごとの記録を保存できませんでした: ${studentError.message}` };
    }

    const { error: scheduleUpdateError } = await supabase
      .from("schedules")
      .update({
        status: parsed.status === "completed" ? "recorded" : "record_pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.scheduleId)
      .eq("user_id", userId);

    if (scheduleUpdateError) return { error: `予定ステータスを更新できませんでした: ${scheduleUpdateError.message}` };

    nextPath = `/lessons?tab=records`;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "実施後記録を保存できませんでした。" };
  }

  revalidatePath("/lessons");
  revalidatePath(`/lessons/${parsed.scheduleId}/record`);
  revalidatePath(`/schedules/${parsed.scheduleId}`);
  redirect(nextPath);
}
