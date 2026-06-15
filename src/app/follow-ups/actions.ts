"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/students";
import type { FollowUpStatus } from "@/components/yoga/records";

function isMissingFollowUpColumn(error: { message?: string; code?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "42703" || message.includes("follow_up_status") || message.includes("follow_up_completed");
}

function isFollowUpStatus(value: string): value is Extract<FollowUpStatus, "pending" | "completed" | "dismissed"> {
  return value === "pending" || value === "completed" || value === "dismissed";
}

export async function updateFollowUpStatusAction(formData: FormData): Promise<void> {
  const followUpId = String(formData.get("follow_up_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const studentId = String(formData.get("student_id") ?? "").trim();
  const scheduleId = String(formData.get("schedule_id") ?? "").trim();

  if (!followUpId) return;
  if (!isFollowUpStatus(status)) return;

  try {
    const { supabase } = await requireUserId();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("lesson_record_students")
      .update({
        follow_up_status: status,
        follow_up_completed_at: status === "completed" || status === "dismissed" ? now : null,
        follow_up_completed_note: note || null,
        follow_up_updated_at: now,
      })
      .eq("id", followUpId);

    if (isMissingFollowUpColumn(error)) {
      return;
    }
    if (error) return;
  } catch (error) {
    console.error(error);
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/students");
  revalidatePath("/lessons");
  if (studentId) revalidatePath(`/students/${studentId}`);
  if (scheduleId) revalidatePath(`/lessons/${scheduleId}/record`);
}
