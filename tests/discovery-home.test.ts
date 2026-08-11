import assert from "node:assert/strict";
import test from "node:test";
import {
  buildStructuredRelevanceReason,
  buildTeachingInsights,
  dedupeRadarCandidates,
  estimateRadarCost,
  extractAnonymizedSafetySignals,
  generateRadarTopics,
  isSafePublicUrl,
  normalizeRadarUrl,
  sanitizeForExternalPrompt,
} from "../src/lib/discovery-home.ts";
import { isAuthorizedRadarCronRequest } from "../src/lib/radar/guards.ts";
import { rotateRadarTopics } from "../src/lib/radar/rotation.ts";
import { classifyRadarFailure, parseRadarStructuredResponse } from "../src/lib/radar/validation.ts";

test("topic generation anonymizes safety notes and never emits names or contact details", () => {
  const caution = "山田花子さん 腰痛に配慮 090-1234-5678 hanako@example.com";
  const topics = generateRadarTopics(extractAnonymizedSafetySignals([caution]));
  const serialized = JSON.stringify(topics);
  assert.equal(topics[0]?.topicKey, "lower_back");
  assert.equal(topics[0]?.sourceKind, "safety");
  assert.doesNotMatch(serialized, /山田|花子|090-1234|example\.com/);
  assert.match(topics[0]?.searchQueries.join(" ") ?? "", /腰|lower back/);
});

test("external prompt sanitization removes provided names, email, phone, URL, and control characters", () => {
  const value = sanitizeForExternalPrompt("田中さん\n090-1111-2222 tanaka@example.com https://private.example", ["田中"]);
  assert.doesNotMatch(value, /田中|090-1111|tanaka@example|private\.example|\n/);
  assert.match(value, /非公開/);
});

test("teaching insights do not infer null change classifications or unevaluated reactions", () => {
  const insights = buildTeachingInsights({
    topBlocks: [{ id: "b1", name: "呼吸", usedCount: 4 }],
    topPlans: [],
    duration: { averageDifferenceMinutes: null, samples: 0 },
    evaluatedBlocks: [{ id: "b1", name: "呼吸", evaluatedCount: 0, goodRate: null }],
    unusedBlocks: [],
    dataQuality: { recordedLessons: 2, totalLessons: 2, unevaluatedBlocks: 4, missingActualMinutes: 0, legacyUnclassifiedItems: 9 },
    changes: { confirmedPlanned: 0, adjusted: 0, skipped: 0, replaced: 0, added: 0 },
  });
  assert.equal(insights.some((item) => item.kind === "adaptation"), false);
  assert.equal(insights.some((item) => item.kind === "reaction"), false);
  assert.equal(insights.find((item) => item.kind === "usage")?.metric, "4回");
  assert.equal(insights.some((item) => item.kind === "quality"), true);
});

test("URL normalization removes trackers, canonicalizes YouTube, deduplicates, and rejects SSRF targets", () => {
  assert.equal(
    normalizeRadarUrl("https://Example.com/article/?utm_source=newsletter&b=2&a=1#section"),
    "https://example.com/article?a=1&b=2",
  );
  assert.equal(normalizeRadarUrl("https://youtu.be/abc123?feature=share"), "https://www.youtube.com/watch?v=abc123");
  assert.equal(isSafePublicUrl("http://127.0.0.1/admin"), false);
  assert.equal(isSafePublicUrl("http://169.254.169.254/latest/meta-data"), false);
  assert.equal(isSafePublicUrl("http://192.168.1.10/internal"), false);
  assert.equal(isSafePublicUrl("https://example.org/yoga"), true);
  const deduped = dedupeRadarCandidates([
    { sourceUrl: "https://example.com/article?utm_medium=social", title: "Yoga Teaching Guide" },
    { sourceUrl: "https://example.com/article", title: "Yoga Teaching Guide" },
  ]);
  assert.equal(deduped.length, 1);
});

test("relevance explanation comes from structured evidence", () => {
  const topic = generateRadarTopics([{ text: "肩 胸", kind: "practice", recentUseCount: 5 }])[0];
  const reason = buildStructuredRelevanceReason(topic);
  assert.match(reason.text, /最近のブロックやプラン/);
  assert.equal(reason.evidence.topicKey, "shoulders_chest");
  assert.equal(reason.evidence.recentUseCount, 5);
});

test("cost estimate includes bounded web search calls and model token rates", () => {
  assert.equal(estimateRadarCost({ model: "gpt-5.4-nano", searchCalls: 2, inputTokens: 10_000, outputTokens: 2_000 }), 0.0245);
  assert.equal(estimateRadarCost({ model: "gpt-5.4-nano", searchCalls: -1, inputTokens: -1, outputTokens: -1 }), 0);
});

test("daily topic rotation changes the leading themes without dropping any theme", () => {
  const topics = ["shoulders", "backbend", "hips", "breath"];
  const first = rotateRadarTopics(topics, "2026-08-11");
  const second = rotateRadarTopics(topics, "2026-08-12");
  assert.notEqual(first[0], second[0]);
  assert.deepEqual([...first].sort(), [...topics].sort());
  assert.deepEqual([...second].sort(), [...topics].sort());
});

test("cron authentication requires an exact bearer secret", () => {
  assert.equal(isAuthorizedRadarCronRequest("Bearer safe-secret", "safe-secret"), true);
  assert.equal(isAuthorizedRadarCronRequest("Bearer wrong", "safe-secret"), false);
  assert.equal(isAuthorizedRadarCronRequest(null, "safe-secret"), false);
  assert.equal(isAuthorizedRadarCronRequest("Bearer safe-secret", undefined), false);
});

test("invalid AI structured output is rejected", () => {
  assert.throws(() => parseRadarStructuredResponse("not-json"), /RADAR_STRUCTURED_OUTPUT_INVALID/);
  assert.throws(() => parseRadarStructuredResponse(JSON.stringify({ items: [{ source_url: "https://example.com" }] })), /RADAR_STRUCTURED_OUTPUT_INVALID/);
  const parsed = parseRadarStructuredResponse(JSON.stringify({
    items: [{
      source_url: "https://example.com/yoga",
      title: "Yoga",
      source_name: "Example",
      author: "",
      published_on: "",
      language: "en",
      item_type: "general_article",
      summary: "Short summary",
      relevance_score: 0.8,
      trust_score: 0.6,
    }],
  }));
  assert.equal(parsed.items.length, 1);
});

test("replenishment structured output accepts three items but rejects a fourth", () => {
  const item = {
    source_url: "https://example.com/yoga",
    title: "Yoga",
    source_name: "Example",
    author: "",
    published_on: "",
    language: "en",
    item_type: "general_article",
    summary: "Short summary",
    relevance_score: 0.8,
    trust_score: 0.6,
  } as const;
  assert.equal(parseRadarStructuredResponse(JSON.stringify({ items: [item, item, item] })).items.length, 3);
  assert.throws(
    () => parseRadarStructuredResponse(JSON.stringify({ items: [item, item, item, item] })),
    /RADAR_STRUCTURED_OUTPUT_INVALID/,
  );
});

test("OpenAI rate limits, timeouts, and malformed output are safe and retryable", () => {
  assert.deepEqual(classifyRadarFailure({ status: 429 }), {
    code: "openai_429",
    safeMessage: "OpenAI Web Search rate limit reached.",
    retryable: true,
  });
  assert.equal(classifyRadarFailure(Object.assign(new Error("request timed out"), { code: "ETIMEDOUT" })).code, "openai_timeout");
  assert.equal(classifyRadarFailure(new Error("RADAR_STRUCTURED_OUTPUT_INVALID")).code, "invalid_ai_output");
  assert.equal(classifyRadarFailure({ status: 500 }).retryable, false);
});
