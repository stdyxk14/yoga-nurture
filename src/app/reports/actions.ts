"use server";

import { revalidatePath } from "next/cache";
import { preflightReviewRuntime, runTeachingReviewForUser } from "@/lib/ai-review/server";
import { requireFreshUser } from "@/lib/supabase/server";

export type ReviewActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
  preflight?: {
    model: string;
    responseModel: string | null;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
  };
};

export async function refreshTeachingReviewAction(_state: ReviewActionState, formData: FormData): Promise<ReviewActionState> {
  const periodDays = Number(formData.get("period_days"));
  if (periodDays !== 30 && periodDays !== 90) return { error: "分析期間を選び直してください。" };
  try {
    const { userId } = await requireFreshUser();
    const result = await runTeachingReviewForUser({ userId, periodDays, trigger: "manual" });
    revalidatePath("/reports");
    if (result.status === "failed") return { error: `AIレビューを更新できませんでした（${result.decision}）。前回の成功結果は保持されています。` };
    if (result.decision === "hard_budget" || result.decision === "soft_budget") return { error: "今月のAIレビュー予算に達したため生成を停止しました。前回結果を表示しています。" };
    if (result.decision === "running") return { message: "同じ期間の分析が進行中です。完了後も現在の結果を表示し続けます。" };
    if (result.decision === "unchanged") return { ok: true, message: "根拠データに変更がないため、前回のレビューを再利用しました。" };
    return { ok: true, message: `${periodDays}日レビューを更新しました。` };
  } catch {
    return { error: "AIレビューを更新できませんでした。前回の成功結果は保持されています。" };
  }
}

export async function preflightTeachingReviewAction(_state: ReviewActionState, _formData: FormData): Promise<ReviewActionState> {
  void _formData;
  try {
    await requireFreshUser();
    const result = await preflightReviewRuntime();
    if (!result.ok) return { error: `Reviewモデルの接続確認に失敗しました（${result.errorCode ?? "unknown"}）。` };
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
    return { error: "Reviewモデルの接続確認を実行できませんでした。" };
  }
}
