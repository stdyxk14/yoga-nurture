"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLessonPlanPayload, type LessonPlanFormState } from "@/lib/lesson-plans";
import { requireUserId } from "@/lib/students";

type BlockDurationRow = {
  id: string;
  duration_minutes: number;
};

async function getBlockDurations(blockIds: string[]) {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("block_templates")
    .select("id,duration_minutes")
    .in("id", Array.from(new Set(blockIds)))
    .eq("archived", false);

  if (error) throw new Error(`ブロック情報を確認できませんでした: ${error.message}`);

  const rows = (data ?? []) as BlockDurationRow[];
  const durationById = new Map(rows.map((row) => [row.id, row.duration_minutes]));
  const missing = blockIds.find((id) => !durationById.has(id));
  if (missing) throw new Error("選択したブロックの一部を確認できませんでした。ブロック一覧を更新してから再度お試しください。");

  return durationById;
}

function buildPlanBlockRows(planId: string, blockIds: string[], durationById: Map<string, number>) {
  return blockIds.map((blockId, index) => ({
    lesson_plan_id: planId,
    block_template_id: blockId,
    sort_order: index,
    planned_duration_minutes: durationById.get(blockId) ?? 0,
  }));
}

export async function createLessonPlanAction(
  _prevState: LessonPlanFormState,
  formData: FormData,
): Promise<LessonPlanFormState> {
  const parsed = getLessonPlanPayload(formData);
  if ("error" in parsed) return { error: parsed.error };

  let nextPath = "";

  try {
    const { supabase, userId } = await requireUserId();
    const durationById = await getBlockDurations(parsed.blockIds);
    const totalMinutes = parsed.blockIds.reduce((sum, blockId) => sum + (durationById.get(blockId) ?? 0), 0);

    const { data: plan, error: planError } = await supabase
      .from("lesson_plans")
      .insert({
        user_id: userId,
        ...parsed.payload,
        duration_minutes: totalMinutes,
      })
      .select("id")
      .single();

    if (planError || !plan) {
      return { error: `レッスンプランを保存できませんでした: ${planError?.message ?? "保存結果を確認できませんでした。"}` };
    }

    const { error: blockError } = await supabase
      .from("lesson_plan_blocks")
      .insert(buildPlanBlockRows(plan.id, parsed.blockIds, durationById));

    if (blockError) {
      await supabase.from("lesson_plans").delete().eq("id", plan.id).eq("user_id", userId);
      return { error: `使用ブロックを保存できませんでした: ${blockError.message}` };
    }

    nextPath = `/lessons/${plan.id}`;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "レッスンプランを保存できませんでした。" };
  }

  revalidatePath("/lessons");
  redirect(nextPath);
}

export async function updateLessonPlanAction(
  planId: string,
  _prevState: LessonPlanFormState,
  formData: FormData,
): Promise<LessonPlanFormState> {
  const parsed = getLessonPlanPayload(formData);
  if ("error" in parsed) return { error: parsed.error };

  try {
    const { supabase, userId } = await requireUserId();
    const durationById = await getBlockDurations(parsed.blockIds);
    const totalMinutes = parsed.blockIds.reduce((sum, blockId) => sum + (durationById.get(blockId) ?? 0), 0);

    const { error: planError } = await supabase
      .from("lesson_plans")
      .update({
        ...parsed.payload,
        duration_minutes: totalMinutes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId)
      .eq("user_id", userId);

    if (planError) {
      return { error: `レッスンプランを更新できませんでした: ${planError.message}` };
    }

    const { error: deleteError } = await supabase.from("lesson_plan_blocks").delete().eq("lesson_plan_id", planId);
    if (deleteError) {
      return { error: `既存ブロックを更新できませんでした: ${deleteError.message}` };
    }

    const { error: blockError } = await supabase
      .from("lesson_plan_blocks")
      .insert(buildPlanBlockRows(planId, parsed.blockIds, durationById));

    if (blockError) {
      return { error: `使用ブロックを保存できませんでした: ${blockError.message}` };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "レッスンプランを更新できませんでした。" };
  }

  revalidatePath("/lessons");
  revalidatePath(`/lessons/${planId}`);
  redirect(`/lessons/${planId}`);
}

export async function deleteLessonPlanAction(planId: string, formData?: FormData): Promise<void> {
  void formData;
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("lesson_plans")
    .delete()
    .eq("id", planId)
    .eq("user_id", userId);

  if (error) {
    redirect(`/lessons/${planId}/edit?error=${encodeURIComponent(`レッスンプランを削除できませんでした: ${error.message}`)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/lessons");
  redirect("/lessons?tab=plans");
}

type LessonPlanCopyRow = {
  id: string;
  name: string;
  theme: string | null;
  duration_minutes: number;
  format: "personal" | "group" | "online" | null;
  memo: string | null;
};

type LessonPlanBlockCopyRow = {
  block_template_id: string;
  sort_order: number;
  planned_duration_minutes: number | null;
  script_override: string | null;
  cautions_override: string | null;
};

export async function duplicateLessonPlanAction(planId: string, formData?: FormData): Promise<void> {
  void formData;
  const { supabase, userId } = await requireUserId();

  const { data: plan, error: planError } = await supabase
    .from("lesson_plans")
    .select("id,name,theme,duration_minutes,format,memo")
    .eq("id", planId)
    .eq("user_id", userId)
    .maybeSingle();

  if (planError || !plan) {
    redirect(`/lessons?tab=plans&error=${encodeURIComponent(`レッスンプランを複製できませんでした: ${planError?.message ?? "元のプランが見つかりません。"}`)}`);
  }

  const sourcePlan = plan as LessonPlanCopyRow;
  const { data: planBlocks, error: blockFetchError } = await supabase
    .from("lesson_plan_blocks")
    .select("block_template_id,sort_order,planned_duration_minutes,script_override,cautions_override")
    .eq("lesson_plan_id", planId)
    .order("sort_order", { ascending: true });

  if (blockFetchError) {
    redirect(`/lessons?tab=plans&error=${encodeURIComponent(`使用ブロックを確認できず、複製できませんでした: ${blockFetchError.message}`)}`);
  }

  const { data: copiedPlan, error: insertError } = await supabase
    .from("lesson_plans")
    .insert({
      user_id: userId,
      name: `${sourcePlan.name}（コピー）`,
      theme: sourcePlan.theme,
      duration_minutes: sourcePlan.duration_minutes,
      format: sourcePlan.format,
      memo: sourcePlan.memo,
      status: "draft",
    })
    .select("id")
    .single();

  if (insertError || !copiedPlan) {
    redirect(`/lessons?tab=plans&error=${encodeURIComponent(`レッスンプランを複製できませんでした: ${insertError?.message ?? "保存結果を確認できませんでした。"}`)}`);
  }

  const rows = ((planBlocks ?? []) as LessonPlanBlockCopyRow[]).map((block) => ({
    lesson_plan_id: copiedPlan.id,
    block_template_id: block.block_template_id,
    sort_order: block.sort_order,
    planned_duration_minutes: block.planned_duration_minutes,
    script_override: block.script_override,
    cautions_override: block.cautions_override,
  }));

  if (rows.length) {
    const { error: blockInsertError } = await supabase.from("lesson_plan_blocks").insert(rows);
    if (blockInsertError) {
      await supabase.from("lesson_plans").delete().eq("id", copiedPlan.id).eq("user_id", userId);
      redirect(`/lessons?tab=plans&error=${encodeURIComponent(`複製したプランにブロックを保存できませんでした: ${blockInsertError.message}`)}`);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/lessons");
  redirect(`/lessons/${copiedPlan.id}/edit`);
}
