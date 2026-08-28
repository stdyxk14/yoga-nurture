"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLessonPlanPayload, type LessonPlanFormState } from "@/lib/lesson-plans";
import { createMutationContext, type RequestSupabaseClient } from "@/lib/supabase/server";
import { formatRpcError } from "@/lib/supabase/rpc-errors";

type BlockDurationRow = {
  id: string;
  duration_minutes: number;
};

type ExistingPlanBlockRow = {
  id: string;
  block_template_id: string;
  planned_duration_minutes: number | null;
  script_override: string | null;
  cautions_override: string | null;
};

async function getBlockDurations(supabase: RequestSupabaseClient, blockIds: string[]) {
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

async function getExistingPlanBlocks(supabase: RequestSupabaseClient, planId: string, planBlockIds: string[]) {
  const ids = Array.from(new Set(planBlockIds.filter(Boolean)));
  if (!ids.length) return new Map<string, ExistingPlanBlockRow>();

  const { data, error } = await supabase
    .from("lesson_plan_blocks")
    .select("id,block_template_id,planned_duration_minutes,script_override,cautions_override")
    .eq("lesson_plan_id", planId)
    .in("id", ids);

  if (error) throw new Error(`既存のプラン構成を確認できませんでした: ${error.message}`);
  return new Map(((data ?? []) as ExistingPlanBlockRow[]).map((row) => [row.id, row]));
}

function buildPlanBlockPayload(
  blockIds: string[],
  durationById: Map<string, number>,
  planBlockIds: string[] = [],
  existingById = new Map<string, ExistingPlanBlockRow>(),
) {
  return blockIds.map((blockId, index) => {
    const existing = existingById.get(planBlockIds[index]);
    const retained = existing?.block_template_id === blockId ? existing : null;
    return {
      block_template_id: blockId,
      sort_order: index,
      planned_duration_minutes: retained?.planned_duration_minutes ?? durationById.get(blockId) ?? 0,
      script_override: retained?.script_override ?? null,
      cautions_override: retained?.cautions_override ?? null,
    };
  });
}

export async function createLessonPlanAction(
  _prevState: LessonPlanFormState,
  formData: FormData,
): Promise<LessonPlanFormState> {
  const parsed = getLessonPlanPayload(formData);
  if ("error" in parsed) return { error: parsed.error };

  let nextPath = "";

  try {
    const { supabase } = await createMutationContext();
    const durationById = await getBlockDurations(supabase, parsed.blockIds);
    const { data: planId, error } = await supabase.rpc("save_lesson_plan", {
      p_plan_id: null,
      p_name: parsed.payload.name,
      p_theme: parsed.payload.theme,
      p_format: parsed.payload.format,
      p_memo: parsed.payload.memo,
      p_status: parsed.payload.status,
      p_blocks: buildPlanBlockPayload(parsed.blockIds, durationById),
    });

    if (error || !planId) return { error: formatRpcError(error, "レッスンプランを保存できませんでした") };
    nextPath = `/lessons/${planId}`;
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
    const { supabase } = await createMutationContext();
    const durationById = await getBlockDurations(supabase, parsed.blockIds);
    const existingById = await getExistingPlanBlocks(supabase, planId, parsed.planBlockIds);
    const { error } = await supabase.rpc("save_lesson_plan", {
      p_plan_id: planId,
      p_name: parsed.payload.name,
      p_theme: parsed.payload.theme,
      p_format: parsed.payload.format,
      p_memo: parsed.payload.memo,
      p_status: parsed.payload.status,
      p_blocks: buildPlanBlockPayload(parsed.blockIds, durationById, parsed.planBlockIds, existingById),
    });

    if (error) return { error: formatRpcError(error, "レッスンプランを更新できませんでした") };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "レッスンプランを更新できませんでした。" };
  }

  revalidatePath("/lessons");
  revalidatePath(`/lessons/${planId}`);
  revalidatePath(`/lessons/${planId}/script`);
  revalidatePath("/schedules/[id]", "page");
  revalidatePath("/schedules/[id]/script", "page");
  revalidatePath("/schedules/[id]/script/print", "page");
  revalidatePath("/dashboard");
  redirect(`/lessons/${planId}`);
}

export async function deleteLessonPlanAction(planId: string, formData?: FormData): Promise<void> {
  void formData;
  const { supabase, userId } = await createMutationContext();
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
  const { supabase, userId } = await createMutationContext();

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

  const blocks = ((planBlocks ?? []) as LessonPlanBlockCopyRow[]).map((block) => ({
    block_template_id: block.block_template_id,
    sort_order: block.sort_order,
    planned_duration_minutes: block.planned_duration_minutes,
    script_override: block.script_override,
    cautions_override: block.cautions_override,
  }));

  const { data: copiedPlanId, error: copyError } = await supabase.rpc("save_lesson_plan", {
    p_plan_id: null,
    p_name: `${sourcePlan.name}（コピー）`,
    p_theme: sourcePlan.theme,
    p_format: sourcePlan.format,
    p_memo: sourcePlan.memo,
    p_status: "draft",
    p_blocks: blocks,
  });

  if (copyError || !copiedPlanId) {
    redirect(`/lessons?tab=plans&error=${encodeURIComponent(formatRpcError(copyError, "レッスンプランを複製できませんでした"))}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/lessons");
  redirect(`/lessons/${copiedPlanId}/edit`);
}
