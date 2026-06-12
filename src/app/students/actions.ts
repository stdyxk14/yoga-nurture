"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStudentPayload, requireUserId, type StudentFormState } from "@/lib/students";

export async function createStudentAction(_state: StudentFormState, formData: FormData): Promise<StudentFormState> {
  const parsed = getStudentPayload(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("students")
    .insert({
      ...parsed.payload,
      user_id: userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: `生徒を保存できませんでした。${error?.message ?? ""}`.trim() };
  }

  revalidatePath("/students");
  redirect(`/students/${data.id}`);
}

export async function updateStudentAction(
  id: string,
  _state: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const parsed = getStudentPayload(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("students")
    .update({
      ...parsed.payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { error: `生徒情報を更新できませんでした。${error?.message ?? "対象の生徒が見つかりません。"}`.trim() };
  }

  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  redirect(`/students/${id}`);
}

export async function deleteStudentAction(id: string, formData?: FormData): Promise<void> {
  void formData;
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase.from("students").delete().eq("id", id).eq("user_id", userId);

  if (error) {
    redirect(`/students/${id}/edit?error=${encodeURIComponent(`生徒を削除できませんでした。${error.message}`)}`);
  }

  revalidatePath("/students");
  redirect("/students");
}
