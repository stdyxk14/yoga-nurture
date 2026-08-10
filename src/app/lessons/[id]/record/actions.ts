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
  if (parsed.status === "draft") redirect(`/lessons/${parsed.scheduleId}/record?saved=draft`);
  redirect("/lessons?tab=records");
}

export type CreateBlockTemplateFromRecordItemInput = {
  recordBlockId: string;
  name: string;
  categoryId: string | null;
  subcategoryId: string | null;
  durationMinutes: number;
  purpose: string;
  level: string;
  script: string;
  cautions: string;
  memo: string;
  tags: string[];
};

export async function createBlockTemplateFromRecordItemAction(input: CreateBlockTemplateFromRecordItemInput) {
  if (!input.recordBlockId || !input.name.trim()) return { error: "ブロック名を入力してください。" };
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < 1) return { error: "目安時間は1分以上で入力してください。" };

  try {
    const { supabase } = await createMutationContext();
    const { data, error } = await supabase.rpc("create_block_template_from_record_item", {
      p_record_block_id: input.recordBlockId,
      p_name: input.name.trim(),
      p_category_id: input.categoryId,
      p_subcategory_id: input.subcategoryId,
      p_duration_minutes: input.durationMinutes,
      p_purpose: input.purpose,
      p_level: input.level,
      p_script: input.script,
      p_cautions: input.cautions,
      p_memo: input.memo,
      p_tags: Array.from(new Set(input.tags.map((tag) => tag.trim()).filter(Boolean))),
    });

    if (error) return { error: formatRpcError(error, "ブロックテンプレートを保存できませんでした") };
    if (!data) return { error: "ブロックテンプレートを保存できませんでした。" };
    revalidatePath("/lessons");
    revalidatePath("/blocks");
    return { blockId: String(data) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "ブロックテンプレートを保存できませんでした。" };
  }
}
