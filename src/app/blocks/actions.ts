"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getBlockPayload, replaceBlockTags, type BlockFormState } from "@/lib/blocks";
import { requireUserId } from "@/lib/students";

export async function createBlockAction(_state: BlockFormState, formData: FormData): Promise<BlockFormState> {
  const parsed = getBlockPayload(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("block_templates")
    .insert({
      ...parsed.payload,
      user_id: userId,
    })
    .select("id")
    .single();

  if (error || !data) return { error: `ブロックを保存できませんでした。${error?.message ?? ""}`.trim() };

  try {
    await replaceBlockTags(data.id, parsed.tags);
  } catch (caught) {
    return { error: caught instanceof Error ? caught.message : "タグを保存できませんでした。" };
  }

  revalidatePath("/lessons");
  revalidatePath("/blocks");
  redirect(`/blocks/${data.id}`);
}

export async function updateBlockAction(
  id: string,
  _state: BlockFormState,
  formData: FormData,
): Promise<BlockFormState> {
  const parsed = getBlockPayload(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("block_templates")
    .update({
      ...parsed.payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) return { error: `ブロックを更新できませんでした。${error?.message ?? "対象が見つかりません。"}`.trim() };

  try {
    await replaceBlockTags(id, parsed.tags);
  } catch (caught) {
    return { error: caught instanceof Error ? caught.message : "タグを更新できませんでした。" };
  }

  revalidatePath("/lessons");
  revalidatePath(`/blocks/${id}`);
  redirect(`/blocks/${id}`);
}

export async function deleteBlockAction(id: string, formData?: FormData): Promise<void> {
  void formData;
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase.from("block_templates").delete().eq("id", id).eq("user_id", userId);

  if (error) {
    redirect(`/blocks/${id}/edit?error=${encodeURIComponent(`ブロックを削除できませんでした。${error.message}`)}`);
  }

  revalidatePath("/lessons");
  redirect("/lessons?tab=blocks");
}
