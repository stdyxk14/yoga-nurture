import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  aiReviewOutputSchema,
  emptyReferenceIndex,
  estimateReviewCost,
  parseAndValidateAiReview,
  aiReviewPromptVersion,
  sourceFingerprint,
  type AiReviewOutput,
  type AiReviewSection,
} from "../src/lib/ai-review/types";
import { isAuthorizedInternalAiCronRequest } from "../src/lib/internal-ai/guards";

const refs = [{ type: "record" as const, ref: "record-1" }];

function section(summary: string): AiReviewSection {
  return { summary, details: ["具体例"], references: refs };
}

function reviewFixture(): AiReviewOutput {
  const finding = {
    title: "根拠のある所見",
    detail: "具体的な記録に基づく",
    reason: "1件の記録",
    evidence_count: 1,
    confidence: 0.7,
    includes_inference: false,
    references: refs,
    next_action: "次回確認する",
  };
  return {
    review_kind: "lesson",
    overall_assessment: "総評",
    key_strength: finding,
    priority_improvement: finding,
    single_lesson: {
      good_points: section("良かった点"),
      improvement_points: section("改善点"),
      lesson_structure_and_flow: section("流れ"),
      block_pose_selection: section("選択"),
      sequence_connections: section("つながり"),
      intensity_flow: section("強度"),
      time_allocation: section("時間"),
      cueing_and_voice: section("誘導"),
      field_adaptation: section("現場対応"),
      student_reviews: [{
        student_ref: "student-1",
        student_name: "みどりさん",
        at_the_time: "疲れを申告",
        recorded_reaction: "記録あり",
        instructor_response: "椅子を案内",
        good_response: "選択肢を示した",
        concerns: "次回確認",
        next_care: "強度を確認",
        cue_idea: "選べる声かけ",
        follow_up_idea: "終了後に確認",
        experience_idea: "安心して選べる体験",
        references: [{ type: "student", ref: "student-1" }, ...refs],
      }],
      customer_communication: section("接客"),
      next_improvements: section("次回"),
      new_experiments: section("新しい案"),
    },
    period_review: null,
    data_notes: ["1件の記録なので参考"],
    next_actions: [{ title: "確認", detail: "記録を見る", priority: "high", references: refs }],
    contradictions: [],
  };
}

test("review fingerprint is key-order stable but selected occurrence-order sensitive", () => {
  assert.equal(sourceFingerprint({ b: 2, a: 1 }), sourceFingerprint({ a: 1, b: 2 }));
  assert.notEqual(sourceFingerprint({ record_ids: ["first", "second"] }), sourceFingerprint({ record_ids: ["second", "first"] }));
});

test("flexible review accepts only allowlisted references and normalizes registered display names", () => {
  const index = emptyReferenceIndex();
  index.record["record-1"] = { id: "record-1", label: "記録", href: "/lessons/example/record" };
  index.student["student-1"] = { id: "student-1", label: "みどりさん", href: "/students/student-1" };
  const fixture = reviewFixture();
  assert.equal(parseAndValidateAiReview(JSON.stringify(fixture), index, "lesson").review_kind, "lesson");
  fixture.single_lesson!.student_reviews[0].student_name = "S-xxxx";
  assert.equal(parseAndValidateAiReview(JSON.stringify(fixture), index, "lesson").single_lesson?.student_reviews[0].student_name, "みどりさん");
  fixture.single_lesson!.student_reviews[0].student_name = "みどりさん";
  fixture.key_strength.references = [{ type: "record", ref: "invented" }];
  assert.throws(() => parseAndValidateAiReview(JSON.stringify(fixture), index, "lesson"), /reference_not_allowed/);
});

test("review strict schema exposes one-lesson and period professional structures", () => {
  assert.equal(aiReviewOutputSchema.additionalProperties, false);
  assert.deepEqual(aiReviewOutputSchema.properties.review_kind.enum, ["lesson", "period"]);
  assert.ok("cueing_and_voice" in aiReviewOutputSchema.properties.single_lesson.properties);
  assert.ok("retention_experience" in aiReviewOutputSchema.properties.period_review.properties);
});

test("review cost uses the explicit model price allowlist", () => {
  assert.equal(estimateReviewCost("gpt-5.6-terra", { inputTokens: 10_000, cachedInputTokens: 0, outputTokens: 2_000 }), 0.055);
  assert.equal(estimateReviewCost("gpt-5.4-mini", { inputTokens: 10_000, cachedInputTokens: 0, outputTokens: 2_000 }), 0.0165);
});

test("flexible review migration keeps legacy rows and claims exact record scopes", () => {
  const sql = readFileSync("supabase/migrations/20260812025706_flexible_ai_reviews.sql", "utf8");
  assert.match(sql, /scope_type.*legacy_period/is);
  assert.match(sql, /target_record_ids uuid\[\]/i);
  assert.match(sql, /create function public\.claim_ai_review_scope_run/i);
  assert.match(sql, /s\.status <> 'recorded'/i);
  assert.match(sql, /revoke all on function public\.claim_ai_review_scope_run[\s\S]*from public, anon, authenticated/i);
});

test("internal AI authentication remains exact and the fixed review cron is disabled", () => {
  assert.equal(isAuthorizedInternalAiCronRequest("Bearer exact-secret", "exact-secret"), true);
  assert.equal(isAuthorizedInternalAiCronRequest("Bearer wrong", "exact-secret"), false);
  const route = readFileSync("src/app/api/cron/ai-review/route.ts", "utf8");
  const vercel = readFileSync("vercel.json", "utf8");
  assert.match(route, /scheduled_review_disabled/);
  assert.doesNotMatch(vercel, /\/api\/cron\/ai-review/);
  assert.match(vercel, /\/api\/cron\/ai-daily-suggestions/);
});

test("review prompt treats closure only as a structured schedule state", () => {
  const server = readFileSync("src/lib/ai-review/server.ts", "utf8");
  assert.equal(aiReviewPromptVersion, "practical-teaching-review-v3");
  assert.match(server, /Never infer that a lesson was closed or cancelled from overall_memo/);
  assert.match(server, /Only an explicit active structured schedule_closures row can establish closure/);
  assert.match(server, /p_input_tokens: accounting\?\.inputTokens \?\? 0/);
  assert.match(server, /p_estimated_cost_usd: accounting\?\.estimatedCostUsd \?\? 0/);
});

test("billable failed AI responses remain inside the atomic monthly budget ledger", () => {
  const sql = readFileSync("supabase/migrations/20260812041901_account_failed_ai_usage.sql", "utf8");
  assert.equal((sql.match(/status = 'failed' and estimated_cost_usd > 0/g) ?? []).length, 4);
  assert.equal((sql.match(/security invoker/g) ?? []).length, 2);
  assert.equal((sql.match(/set search_path = ''/g) ?? []).length, 2);
  assert.match(sql, /revoke all on function public\.claim_ai_review_scope_run[\s\S]*from public, anon, authenticated/i);
  assert.match(sql, /revoke all on function public\.claim_ai_daily_run[\s\S]*from public, anon, authenticated/i);
});
