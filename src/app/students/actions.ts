"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStudentPayload, type StudentFormState } from "@/lib/students";
import { createMutationContext } from "@/lib/supabase/server";

export type QuickStudentFormState = {
  error?: string;
  student?: { id: string; name: string; kana: string };
};

export async function createStudentAction(_state: StudentFormState, formData: FormData): Promise<StudentFormState> {
  const parsed = getStudentPayload(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { supabase, userId } = await createMutationContext();
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

export async function createStudentFromScheduleAction(
  _state: QuickStudentFormState,
  formData: FormData,
): Promise<QuickStudentFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const kana = String(formData.get("kana") ?? "").trim();
  if (!name) return { error: "名前を入力してください。" };

  const { supabase, userId } = await createMutationContext();
  const { data, error } = await supabase
    .from("students")
    .insert({ user_id: userId, name, kana })
    .select("id,name,kana")
    .single();

  if (error || !data) {
    return { error: `生徒を保存できませんでした。${error?.message ?? ""}`.trim() };
  }

  revalidatePath("/students");
  return { student: { id: data.id, name: data.name, kana: data.kana ?? "" } };
}

export async function updateStudentAction(
  id: string,
  _state: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const parsed = getStudentPayload(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { supabase, userId } = await createMutationContext();
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

export async function archiveStudentAction(id: string, formData?: FormData): Promise<void> {
  void formData;
  const { supabase, userId } = await createMutationContext();
  const { data, error } = await supabase
    .from("students")
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect(`/students/${id}/edit?error=${encodeURIComponent(`生徒をアーカイブできませんでした。${error?.message ?? "対象が見つかりません。"}`)}`);
  }

  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  redirect("/students?filter=archived");
}

export async function restoreStudentAction(id: string, formData?: FormData): Promise<void> {
  void formData;
  const { supabase, userId } = await createMutationContext();
  const { data, error } = await supabase
    .from("students")
    .update({ archived: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect(`/students?filter=archived&error=${encodeURIComponent(`生徒を復元できませんでした。${error?.message ?? "対象が見つかりません。"}`)}`);
  }

  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  redirect("/students");
}
