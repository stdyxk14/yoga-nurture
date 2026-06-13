"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLessonPlans } from "@/lib/lesson-plans";
import { getSchedulePayload, type ScheduleFormState } from "@/lib/schedules";
import { requireUserId } from "@/lib/students";

export async function createScheduleAction(
  _prevState: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  let nextPath = "";

  try {
    const plans = await getLessonPlans();
    const parsed = getSchedulePayload(formData, plans);
    if ("error" in parsed) return { error: parsed.error };

    const { supabase, userId } = await requireUserId();
    const { data: schedule, error: scheduleError } = await supabase
      .from("schedules")
      .insert({
        user_id: userId,
        ...parsed.payload,
      })
      .select("id")
      .single();

    if (scheduleError || !schedule) {
      return { error: `予定を保存できませんでした: ${scheduleError?.message ?? "保存結果を確認できませんでした。"}` };
    }

    if (parsed.participantIds.length) {
      const { error: participantError } = await supabase.from("schedule_participants").insert(
        parsed.participantIds.map((studentId) => ({
          schedule_id: schedule.id,
          student_id: studentId,
          attendance_status: "present",
        })),
      );

      if (participantError) {
        await supabase.from("schedules").delete().eq("id", schedule.id).eq("user_id", userId);
        return { error: `参加予定生徒を保存できませんでした: ${participantError.message}` };
      }
    }

    nextPath = `/schedules/${schedule.id}`;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "予定を保存できませんでした。" };
  }

  revalidatePath("/lessons");
  revalidatePath("/schedules");
  redirect(nextPath);
}

export async function updateScheduleAction(
  id: string,
  _prevState: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  let nextPath = "";

  try {
    const plans = await getLessonPlans();
    const parsed = getSchedulePayload(formData, plans);
    if ("error" in parsed) return { error: parsed.error };

    const { supabase, userId } = await requireUserId();
    const { data: schedule, error: scheduleError } = await supabase
      .from("schedules")
      .update({
        ...parsed.payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (scheduleError || !schedule) {
      return { error: `予定を更新できませんでした。${scheduleError?.message ?? "対象の予定が見つかりません。"}` };
    }

    const { error: deleteParticipantError } = await supabase
      .from("schedule_participants")
      .delete()
      .eq("schedule_id", id);

    if (deleteParticipantError) {
      return { error: `参加予定生徒を更新できませんでした。${deleteParticipantError.message}` };
    }

    if (parsed.participantIds.length) {
      const { error: participantError } = await supabase.from("schedule_participants").insert(
        parsed.participantIds.map((studentId) => ({
          schedule_id: id,
          student_id: studentId,
          attendance_status: "present",
        })),
      );

      if (participantError) {
        return { error: `参加予定生徒を保存できませんでした。${participantError.message}` };
      }
    }

    nextPath = `/schedules/${id}`;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "予定を更新できませんでした。" };
  }

  revalidatePath("/lessons");
  revalidatePath(`/schedules/${id}`);
  redirect(nextPath);
}
