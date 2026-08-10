"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLessonPlans } from "@/lib/lesson-plans";
import { getSchedulePayload, type ScheduleFormState } from "@/lib/schedules";
import { createMutationContext } from "@/lib/supabase/server";
import { formatRpcError } from "@/lib/supabase/rpc-errors";

function scheduleRpcPayload(scheduleId: string | null, parsed: ReturnType<typeof getSchedulePayload>) {
  if ("error" in parsed) throw new Error(parsed.error);
  return {
    p_schedule_id: scheduleId,
    p_lesson_plan_id: parsed.payload.lesson_plan_id,
    p_lesson_name: parsed.payload.lesson_name,
    p_starts_at: parsed.payload.starts_at,
    p_ends_at: parsed.payload.ends_at,
    p_place: parsed.payload.place,
    p_format: parsed.payload.format,
    p_schedule_caution: parsed.payload.schedule_caution,
    p_schedule_memo: parsed.payload.schedule_memo,
    p_status: parsed.payload.status,
    p_participant_ids: parsed.participantIds,
  };
}

export async function createScheduleAction(
  _prevState: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  let nextPath = "";

  try {
    const { supabase } = await createMutationContext();
    const plans = await getLessonPlans(supabase);
    const parsed = getSchedulePayload(formData, plans);
    if ("error" in parsed) return { error: parsed.error };

    const { data: scheduleId, error } = await supabase.rpc("save_schedule", scheduleRpcPayload(null, parsed));
    if (error || !scheduleId) return { error: formatRpcError(error, "予定を保存できませんでした") };
    nextPath = `/schedules/${scheduleId}`;
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
    const { supabase } = await createMutationContext();
    const plans = await getLessonPlans(supabase);
    const parsed = getSchedulePayload(formData, plans);
    if ("error" in parsed) return { error: parsed.error };

    const { error } = await supabase.rpc("save_schedule", scheduleRpcPayload(id, parsed));
    if (error) return { error: formatRpcError(error, "予定を更新できませんでした") };

    nextPath = `/schedules/${id}`;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "予定を更新できませんでした。" };
  }

  revalidatePath("/lessons");
  revalidatePath(`/schedules/${id}`);
  redirect(nextPath);
}

export async function deleteScheduleAction(id: string, formData?: FormData): Promise<void> {
  void formData;
  const { supabase, userId } = await createMutationContext();
  const { error } = await supabase
    .from("schedules")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    redirect(`/schedules/${id}?error=${encodeURIComponent(`予定を削除できませんでした: ${error.message}`)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/lessons");
  revalidatePath("/schedules");
  redirect("/lessons?tab=schedule");
}
