import "server-only";

import { isOpenAIConfigured } from "@/lib/openai/server";
import type { AiReviewOutput, AiReviewReferenceIndex } from "@/lib/ai-review/types";
import { requireUserId } from "@/lib/students";

export type TeachingReviewSnapshot = {
  id: string;
  periodDays: 30 | 90;
  periodStart: string;
  periodEnd: string;
  sourceFingerprint: string;
  model: string;
  promptVersion: string;
  review: AiReviewOutput;
  references: AiReviewReferenceIndex;
  evidenceSummary: Record<string, unknown>;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningOutputTokens: number;
  estimatedCostUsd: number;
  generatedAt: string;
};

export type TeachingReviewState = {
  isConfigured: boolean;
  snapshot: TeachingReviewSnapshot | null;
  latestRun: {
    status: "running" | "succeeded" | "failed" | "skipped";
    errorCode: string | null;
    startedAt: string;
    completedAt: string | null;
  } | null;
};

export async function getTeachingReviewState(periodDays: 30 | 90): Promise<TeachingReviewState> {
  const { supabase, userId } = await requireUserId();
  const [snapshotResult, runResult] = await Promise.all([
    supabase
      .from("ai_review_snapshots")
      .select("id,period_days,period_start,period_end,source_fingerprint,model,prompt_version,review,reference_index,evidence_summary,input_tokens,cached_input_tokens,output_tokens,reasoning_output_tokens,estimated_cost_usd,generated_at")
      .eq("user_id", userId)
      .eq("period_days", periodDays)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("ai_review_runs")
      .select("status,error_code,started_at,completed_at")
      .eq("user_id", userId)
      .eq("period_days", periodDays)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (snapshotResult.error) throw new Error(`AI総合指導レビューを取得できませんでした: ${snapshotResult.error.message}`);
  if (runResult.error) throw new Error(`AIレビュー実行状態を取得できませんでした: ${runResult.error.message}`);
  const row = snapshotResult.data;
  const run = runResult.data;
  return {
    isConfigured: isOpenAIConfigured(),
    snapshot: row ? {
      id: row.id,
      periodDays: row.period_days as 30 | 90,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      sourceFingerprint: row.source_fingerprint,
      model: row.model,
      promptVersion: row.prompt_version,
      review: row.review as AiReviewOutput,
      references: row.reference_index as AiReviewReferenceIndex,
      evidenceSummary: row.evidence_summary as Record<string, unknown>,
      inputTokens: row.input_tokens,
      cachedInputTokens: row.cached_input_tokens,
      outputTokens: row.output_tokens,
      reasoningOutputTokens: row.reasoning_output_tokens,
      estimatedCostUsd: Number(row.estimated_cost_usd),
      generatedAt: row.generated_at,
    } : null,
    latestRun: run ? {
      status: run.status as "running" | "succeeded" | "failed" | "skipped",
      errorCode: run.error_code,
      startedAt: run.started_at,
      completedAt: run.completed_at,
    } : null,
  };
}
