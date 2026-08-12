"use server";

import { revalidatePath } from "next/cache";
import { preflightReviewRuntime, runTeachingReviewForUser } from "@/lib/ai-review/server";
import type { ReviewScopeSelection } from "@/lib/ai-review/types";
import { isUuid } from "@/lib/ids";
import { requireFreshUser } from "@/lib/supabase/server";

export type ReviewActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
};

export async function refreshTeachingReviewAction(_state: ReviewActionState, formData: FormData): Promise<ReviewActionState> {
  const selection = reviewSelection(formData);
  if (!selection) return { error: "分析するレッスンまたは期間を選び直してください。" };
  try {
    const { userId } = await requireFreshUser();
    const result = await runTeachingReviewForUser({ userId, selection, trigger: "manual" });
    revalidatePath("/reports");
    if (result.status === "failed") return { error: "AIレビューを更新できませんでした。前回の成功結果は保持されています。" };
    if (result.decision === "hard_budget" || result.decision === "soft_budget") return { error: "今月のAIレビュー予算に達したため生成を停止しました。前回結果を表示しています。" };
    if (result.decision === "running") return { message: "同じ対象の分析が進行中です。完了まで保存済みの結果を表示します。" };
    if (result.decision === "unchanged") return { ok: true, message: "根拠データに変更がないため、前回のレビューを再利用しました。" };
    return { ok: true, message: `${result.scopeLabel}のレビューを作成しました。` };
  } catch {
    return { error: "AIレビューを更新できませんでした。前回の成功結果は保持されています。" };
  }
}

function reviewSelection(formData: FormData): ReviewScopeSelection | null {
  const mode = String(formData.get("review_mode") ?? "");
  if (mode === "lesson") {
    const recordId = String(formData.get("record_id") ?? "");
    return isUuid(recordId) ? { mode: "lesson", recordId } : null;
  }
  if (mode !== "period") return null;
  const range = String(formData.get("review_range") ?? "");
  if (range === "recent3" || range === "recent5" || range === "month") return { mode: "period", range };
  if (range !== "custom") return null;
  const from = String(formData.get("from") ?? "");
  const to = String(formData.get("to") ?? "");
  if (!validDate(from) || !validDate(to) || from > to) return null;
  return { mode: "period", range: "custom", from, to };
}

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`));
}

export async function preflightTeachingReviewAction(_state: ReviewActionState, _formData: FormData): Promise<ReviewActionState> {
  void _formData;
  try {
    await requireFreshUser();
    const result = await preflightReviewRuntime();
    if (!result.ok) return { error: "レビュー生成の接続確認に失敗しました。" };
    return { ok: true, message: "レビュー生成の接続を確認しました。" };
  } catch {
    return { error: "レビュー生成の接続確認を実行できませんでした。" };
  }
}
