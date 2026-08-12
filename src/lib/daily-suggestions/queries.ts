import "server-only";

import { isOpenAIConfigured } from "@/lib/openai/server";
import type { AiReviewReference, AiReviewReferenceIndex } from "@/lib/ai-review/types";
import type { MaintenanceCandidate } from "@/lib/daily-suggestions/evidence";
import {
  dailySuggestionPromptVersion,
  type DailyCoachSegment,
  type DailyConfidence,
  type DailyDraftPayload,
  type DailySuggestionType,
} from "@/lib/daily-suggestions/types";
import { requireUserId } from "@/lib/students";

export type DailySuggestionItem = {
  id: string;
  rank: number;
  segment: DailyCoachSegment;
  suggestionDate: string;
  type: DailySuggestionType;
  title: string;
  summary: string;
  rationale: string;
  confidence: DailyConfidence;
  includesInference: boolean;
  evidenceCount: number;
  evidenceRefs: AiReviewReference[];
  draftPayload: DailyDraftPayload;
  status: "pending" | "accepted" | "held" | "dismissed" | "saved";
  savedPlanId: string | null;
  savedBlockTemplateId: string | null;
  savedAt: string | null;
  createdAt: string;
};

export type DailySuggestionState = {
  isConfigured: boolean;
  run: {
    id: string;
    suggestionDate: string;
    generatedAt: string;
    references: AiReviewReferenceIndex;
    maintenanceCandidates: MaintenanceCandidate[];
  } | null;
  suggestions: DailySuggestionItem[];
  history: DailySuggestionItem[];
  latestRun: {
    status: "running" | "succeeded" | "failed" | "skipped";
    errorCode: string | null;
    startedAt: string;
    completedAt: string | null;
  } | null;
};

export async function getDailySuggestionState(): Promise<DailySuggestionState> {
  const { supabase, userId } = await requireUserId();
  const [successfulRunResult, latestRunResult, historyResult] = await Promise.all([
    supabase
      .from("ai_daily_runs")
      .select("id,suggestion_date,reference_index,evidence_summary,completed_at")
      .eq("user_id", userId)
      .eq("status", "succeeded")
      .eq("prompt_version", dailySuggestionPromptVersion)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("ai_daily_runs")
      .select("status,error_code,started_at,completed_at")
      .eq("user_id", userId)
      .eq("prompt_version", dailySuggestionPromptVersion)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("ai_daily_suggestions")
      .select("id,run_id,suggestion_date,rank,suggestion_type,title,summary,rationale,confidence,includes_inference,evidence_count,evidence_refs,draft_payload,status,saved_plan_id,saved_block_template_id,saved_at,created_at,run:ai_daily_runs!inner(prompt_version)")
      .eq("user_id", userId)
      .eq("run.prompt_version", dailySuggestionPromptVersion)
      .order("created_at", { ascending: false })
      .order("rank", { ascending: true })
      .limit(60),
  ]);
  if (successfulRunResult.error) throw new Error(`今日のAIコーチを取得できませんでした: ${successfulRunResult.error.message}`);
  if (latestRunResult.error) throw new Error(`AIコーチの実行状態を取得できませんでした: ${latestRunResult.error.message}`);
  if (historyResult.error) throw new Error(`AIコーチ履歴を取得できませんでした: ${historyResult.error.message}`);

  const run = successfulRunResult.data;
  const historyRows = (historyResult.data ?? []) as unknown as SuggestionRow[];
  const currentRows = run ? historyRows.filter((row) => row.run_id === run.id) : [];
  const latestRun = latestRunResult.data;
  const evidenceSummary = run?.evidence_summary as Record<string, unknown> | null;
  return {
    isConfigured: isOpenAIConfigured(),
    run: run ? {
      id: run.id,
      suggestionDate: run.suggestion_date,
      generatedAt: run.completed_at ?? `${run.suggestion_date}T00:00:00Z`,
      references: run.reference_index as AiReviewReferenceIndex,
      maintenanceCandidates: maintenanceCandidates(evidenceSummary?.maintenance_candidates),
    } : null,
    suggestions: currentRows.sort((a, b) => a.rank - b.rank).map(mapSuggestion),
    history: historyRows.map(mapSuggestion),
    latestRun: latestRun ? {
      status: latestRun.status as "running" | "succeeded" | "failed" | "skipped",
      errorCode: latestRun.error_code,
      startedAt: latestRun.started_at,
      completedAt: latestRun.completed_at,
    } : null,
  };
}

type SuggestionRow = {
  id: string;
  run_id: string;
  suggestion_date: string;
  rank: number;
  suggestion_type: DailySuggestionType;
  title: string;
  summary: string;
  rationale: string;
  confidence: DailyConfidence;
  includes_inference: boolean;
  evidence_count: number;
  evidence_refs: AiReviewReference[];
  draft_payload: DailyDraftPayload;
  status: DailySuggestionItem["status"];
  saved_plan_id: string | null;
  saved_block_template_id: string | null;
  saved_at: string | null;
  created_at: string;
};

function mapSuggestion(row: SuggestionRow): DailySuggestionItem {
  return {
    id: row.id,
    rank: row.rank,
    segment: row.rank === 1 ? "lesson_plan" : row.rank === 2 ? "new_block" : "student_support",
    suggestionDate: row.suggestion_date,
    type: row.suggestion_type,
    title: row.title,
    summary: row.summary,
    rationale: row.rationale,
    confidence: row.confidence,
    includesInference: row.includes_inference,
    evidenceCount: row.evidence_count,
    evidenceRefs: row.evidence_refs ?? [],
    draftPayload: row.draft_payload ?? { kind: "none" },
    status: row.status,
    savedPlanId: row.saved_plan_id,
    savedBlockTemplateId: row.saved_block_template_id,
    savedAt: row.saved_at,
    createdAt: row.created_at,
  };
}

function maintenanceCandidates(value: unknown): MaintenanceCandidate[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is MaintenanceCandidate => Boolean(item) && typeof item === "object" && typeof item.title === "string" && typeof item.reason === "string" && typeof item.href === "string").slice(0, 2);
}
