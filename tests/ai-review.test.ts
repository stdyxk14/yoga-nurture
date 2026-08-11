import assert from "node:assert/strict";
import test from "node:test";
import {
  aiReviewAxes,
  aiReviewOutputSchema,
  emptyReferenceIndex,
  estimateReviewCost,
  parseAndValidateAiReview,
  sourceFingerprint,
  type AiReviewOutput,
} from "../src/lib/ai-review/types";
import { isAuthorizedInternalAiCronRequest } from "../src/lib/internal-ai/guards";

function reviewFixture(): AiReviewOutput {
  const finding = {
    title: "根拠のある所見",
    detail: "具体的な記録に基づく",
    reason: "1件の記録",
    evidence_count: 1,
    confidence: 0.7,
    includes_inference: false,
    references: [{ type: "record" as const, ref: "record-1" }],
    next_action: "次回確認する",
  };
  return {
    overall_assessment: "総合所見",
    key_strength: finding,
    priority_improvement: finding,
    lesson_plan_analysis: [finding],
    block_analysis: [finding],
    student_safety_analysis: [finding],
    data_quality: { summary: "記録あり", limitations: [], completeness_notes: [] },
    next_actions: [{ title: "確認", detail: "記録を見る", priority: "high", references: finding.references }],
    axes: aiReviewAxes.map((axis) => ({ axis, status: "stable", summary: "安定", reason: "根拠あり", evidence_count: 1, confidence: 0.7, includes_inference: false, references: finding.references, next_action: "継続" })),
    contradictions: [],
  };
}

test("review evidence fingerprint is key-order stable but occurrence-order sensitive", () => {
  assert.equal(sourceFingerprint({ b: 2, a: 1 }), sourceFingerprint({ a: 1, b: 2 }));
  assert.notEqual(sourceFingerprint({ occurrences: ["first", "second"] }), sourceFingerprint({ occurrences: ["second", "first"] }));
});

test("review output accepts only allowlisted source references", () => {
  const index = emptyReferenceIndex();
  index.record["record-1"] = { id: "record-1", label: "記録", href: "/lessons/example/record" };
  const fixture = reviewFixture();
  assert.equal(parseAndValidateAiReview(JSON.stringify(fixture), index).axes.length, 7);
  fixture.key_strength.references = [{ type: "record", ref: "invented" }];
  assert.throws(() => parseAndValidateAiReview(JSON.stringify(fixture), index), /reference_not_allowed/);
});

test("review schema requires strict structured output and seven axes", () => {
  assert.equal(aiReviewOutputSchema.additionalProperties, false);
  assert.equal(aiReviewOutputSchema.properties.axes.minItems, 7);
  assert.equal(aiReviewOutputSchema.properties.axes.maxItems, 7);
});

test("review cost uses the explicit model price allowlist", () => {
  assert.equal(estimateReviewCost("gpt-5.6-terra", { inputTokens: 10_000, cachedInputTokens: 0, outputTokens: 2_000 }), 0.055);
  assert.equal(estimateReviewCost("gpt-5.4-mini", { inputTokens: 10_000, cachedInputTokens: 0, outputTokens: 2_000 }), 0.0165);
});

test("internal AI cron authentication requires an exact bearer secret", () => {
  assert.equal(isAuthorizedInternalAiCronRequest("Bearer exact-secret", "exact-secret"), true);
  assert.equal(isAuthorizedInternalAiCronRequest("Bearer wrong", "exact-secret"), false);
  assert.equal(isAuthorizedInternalAiCronRequest(null, "exact-secret"), false);
  assert.equal(isAuthorizedInternalAiCronRequest("Bearer exact-secret", undefined), false);
});
