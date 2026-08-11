"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getBlockPayload, replaceBlockTags, type BlockFormState } from "@/lib/blocks";
import { isUuid } from "@/lib/ids";
import { createMutationContext } from "@/lib/supabase/server";

export async function createBlockAction(_state: BlockFormState, formData: FormData): Promise<BlockFormState> {
  const parsed = getBlockPayload(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { supabase, userId } = await createMutationContext();
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
    await replaceBlockTags({ supabase, userId }, data.id, parsed.tags);
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

  const { supabase, userId } = await createMutationContext();
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
    await replaceBlockTags({ supabase, userId }, id, parsed.tags);
  } catch (caught) {
    return { error: caught instanceof Error ? caught.message : "タグを更新できませんでした。" };
  }

  revalidatePath("/lessons");
  revalidatePath(`/blocks/${id}`);
  redirect(`/blocks/${id}`);
}

export async function deleteBlockAction(id: string, formData?: FormData): Promise<void> {
  void formData;
  const { supabase, userId } = await createMutationContext();
  const { error } = await supabase.from("block_templates").delete().eq("id", id).eq("user_id", userId);

  if (error) {
    redirect(`/blocks/${id}/edit?error=${encodeURIComponent(`ブロックを削除できませんでした。${error.message}`)}`);
  }

  revalidatePath("/lessons");
  redirect("/lessons?tab=blocks");
}

export async function publishAiBlockDraftAction(id: string, formData?: FormData): Promise<void> {
  void formData;
  if (!isUuid(id)) throw new Error("ブロック下書きを確認できませんでした。");
  const { supabase } = await createMutationContext();
  const { error } = await supabase.rpc("publish_ai_block_draft", { p_block_template_id: id });
  if (error) throw new Error(`ブロック下書きを確定できませんでした: ${error.message}`);
  revalidatePath("/dashboard");
  revalidatePath("/lessons");
  revalidatePath(`/blocks/${id}`);
}
