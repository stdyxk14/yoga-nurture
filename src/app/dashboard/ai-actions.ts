"use server";

import { revalidatePath } from "next/cache";
import { preflightDailyRuntime, runDailySuggestionForUser } from "@/lib/daily-suggestions/server";
import type { DailyDraftPayload } from "@/lib/daily-suggestions/types";
import { isUuid } from "@/lib/ids";
import { createMutationContext, requireFreshUser } from "@/lib/supabase/server";
import { formatRpcError } from "@/lib/supabase/rpc-errors";

export type DailyActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
  createdId?: string;
  createdHref?: string;
  preflight?: {
    model: string;
    responseModel: string | null;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
  };
};

export async function refreshDailySuggestionAction(_state: DailyActionState, _formData: FormData): Promise<DailyActionState> {
  void _formData;
  try {
    const { userId } = await requireFreshUser();
    const result = await runDailySuggestionForUser({ userId, trigger: "manual" });
    revalidatePath("/dashboard");
    if (result.status === "failed") return { error: `今日のAI提案を更新できませんでした（${result.decision}）。前回の成功結果は保持されています。` };
    if (result.decision === "review_snapshot_missing") return { error: "先にAI総合指導レビューを生成してください。" };
    if (result.decision === "hard_budget" || result.decision === "soft_budget") return { error: "今月の内部AI予算に達したため生成を停止しました。前回結果を表示しています。" };
    if (result.decision === "running") return { message: "今日の提案を生成中です。現在の結果を表示し続けます。" };
    if (result.decision === "unchanged") return { ok: true, message: "新しい根拠がないため、今日の既存提案を再利用しました。" };
    return { ok: true, message: `今日のAI提案を${result.suggestionCount}件生成しました。` };
  } catch {
    return { error: "今日のAI提案を更新できませんでした。前回の成功結果は保持されています。" };
  }
}
export async function preflightDailySuggestionAction(_state: DailyActionState, _formData: FormData): Promise<DailyActionState> {
  void _formData;
  try {
    await requireFreshUser();
    const result = await preflightDailyRuntime();
    if (!result.ok) return { error: `Dailyモデルの接続確認に失敗しました（${result.errorCode ?? "unknown"}）。` };
    return {
      ok: true,
      message: "Responses API・strict Structured Outputs・reasoning・usage取得を確認しました。",
      preflight: {
        model: result.requestedModel,
        responseModel: result.responseModel,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        estimatedCostUsd: result.estimatedCostUsd,
      },
    };
  } catch {
    return { error: "Dailyモデルの接続確認を実行できませんでした。" };
  }
}

export async function setDailySuggestionStatusAction(_state: DailyActionState, formData: FormData): Promise<DailyActionState> {
  const suggestionId = String(formData.get("suggestion_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!isUuid(suggestionId) || !["accepted", "held", "dismissed"].includes(status)) return { error: "提案の操作を確認できませんでした。" };
  const { supabase } = await createMutationContext();
  const { error } = await supabase.rpc("set_ai_daily_suggestion_status", { p_suggestion_id: suggestionId, p_status: status });
  if (error) return { error: formatRpcError(error, "提案の状態を更新できませんでした") };
  revalidatePath("/dashboard");
  return { ok: true, message: status === "accepted" ? "採用として記録しました。" : status === "held" ? "保留しました。" : "今回は不要として記録しました。" };
}

export async function saveDailySuggestionAsBlockDraftAction(_state: DailyActionState, formData: FormData): Promise<DailyActionState> {
  const suggestionId = String(formData.get("suggestion_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const duration = Number.parseInt(String(formData.get("duration_minutes") ?? ""), 10);
  if (!isUuid(suggestionId) || !name || !Number.isFinite(duration) || duration <= 0) return { error: "ブロック名と目安時間を確認してください。" };
  const categoryId = optionalUuid(formData.get("category_id"));
  const subcategoryId = optionalUuid(formData.get("subcategory_id"));
  if (categoryId === undefined || subcategoryId === undefined) return { error: "カテゴリーを確認してください。" };
  const { supabase } = await createMutationContext();
  const { data: blockId, error } = await supabase.rpc("save_ai_daily_suggestion_as_block_draft", {
    p_suggestion_id: suggestionId,
    p_name: name,
    p_category_id: categoryId,
    p_subcategory_id: subcategoryId,
    p_duration_minutes: duration,
    p_purpose: String(formData.get("purpose") ?? "").trim(),
    p_level: String(formData.get("level") ?? "").trim(),
    p_script: String(formData.get("script") ?? "").trim(),
    p_cautions: String(formData.get("cautions") ?? "").trim(),
    p_memo: String(formData.get("memo") ?? "").trim(),
    p_tags: Array.from(new Set(String(formData.get("tags") ?? "").split(/[\s,、]+/).map((tag) => tag.trim()).filter(Boolean))),
  });
  if (error || !blockId) return { error: formatRpcError(error, "ブロック下書きを保存できませんでした") };
  revalidatePath("/dashboard");
  revalidatePath("/lessons");
  return { ok: true, message: "AI提案をブロック下書きとして保存しました。確定するまでプランや実施後記録では選べません。", createdId: String(blockId), createdHref: `/blocks/${blockId}` };
}

export async function saveDailySuggestionAsPlanDraftAction(_state: DailyActionState, formData: FormData): Promise<DailyActionState> {
  const suggestionId = String(formData.get("suggestion_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!isUuid(suggestionId) || !name) return { error: "プラン名を確認してください。" };
  const { supabase, userId } = await createMutationContext();
  const { data: suggestion, error: suggestionError } = await supabase
    .from("ai_daily_suggestions")
    .select("draft_payload")
    .eq("id", suggestionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (suggestionError || !suggestion) return { error: "提案の下書き内容を確認できませんでした。" };
  const payload = suggestion.draft_payload as DailyDraftPayload;
  if (payload.kind !== "plan" || !Array.isArray(payload.blocks) || payload.blocks.length === 0) return { error: "この提案には保存できるプラン構成がありません。" };
  const { data: planId, error } = await supabase.rpc("save_ai_daily_suggestion_as_plan_draft", {
    p_suggestion_id: suggestionId,
    p_name: name,
    p_theme: String(formData.get("theme") ?? "").trim(),
    p_format: normalizeFormat(formData.get("format"), payload.format),
    p_memo: String(formData.get("memo") ?? "").trim(),
    p_blocks: payload.blocks,
  });
  if (error || !planId) return { error: formatRpcError(error, "プラン下書きを保存できませんでした") };
  revalidatePath("/dashboard");
  revalidatePath("/lessons");
  return { ok: true, message: "元プランを変更せず、新しいプラン下書きを保存しました。", createdId: String(planId), createdHref: `/lessons/${planId}/edit` };
}

function optionalUuid(value: FormDataEntryValue | null): string | null | undefined {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  return isUuid(normalized) ? normalized : undefined;
}

function normalizeFormat(value: FormDataEntryValue | null, fallback: DailyDraftPayload["format"]) {
  const normalized = String(value ?? "");
  return normalized === "personal" || normalized === "group" || normalized === "online" ? normalized : fallback ?? null;
}
