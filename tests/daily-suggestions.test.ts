import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { emptyReferenceIndex } from "../src/lib/ai-review/types";
import {
  buildStoredDailySuggestions,
  dailyRunSourceFingerprint,
  dailySuggestionOutputSchema,
  estimateDailyCost,
  getConfiguredDailyModel,
  parseAndValidateDailyOutput,
  selectedReferenceIndex,
  type DailyCandidate,
  type ModelDailyOutput,
} from "../src/lib/daily-suggestions/types";

function candidates(): DailyCandidate[] {
  const common = { confidence: "high" as const, evidenceCount: 3, references: [{ type: "record" as const, ref: "record-1" }], sourcePlanId: null, sourceBlockTemplateId: null, sourceScheduleId: null };
  return [
    { ...common, id: "plan", segment: "lesson_plan", type: "new_plan", priority: 1, title: "plan", factualBasis: "facts", proposedAction: "new plan", baseDraft: { kind: "plan", format: "group", blocks: [] }, dedupeKey: "a".repeat(64) },
    { ...common, id: "block", segment: "new_block", type: "new_block", priority: 2, title: "block", factualBasis: "facts", proposedAction: "new block", baseDraft: { kind: "block", duration_minutes: 8, tags: [] }, dedupeKey: "b".repeat(64) },
    { ...common, id: "student", segment: "student_support", type: "observation_point", priority: 3, title: "student", factualBasis: "facts", proposedAction: "support", baseDraft: { kind: "none" }, dedupeKey: "c".repeat(64) },
  ];
}

function emptyDraft() {
  return { name: null, theme: null, format: null, memo: null, target: null, overall_goal: null, intensity_flow: null, suitable_lessons: null, content: null, duration_minutes: null, purpose: null, level: null, script: null, cautions: null, tags: [], blocks: [] };
}

function output(): ModelDailyOutput {
  return {
    suggestions: [
      { candidate_id: "plan", title: "新しい60分フロー", summary: "新しい構成", rationale: "直近3回を根拠", includes_inference: true, draft: { ...emptyDraft(), name: "呼吸から安定へ", theme: "足裏と呼吸", format: "group", target: "初級〜中級", overall_goal: "安心して強度を上げる", intensity_flow: "低→中→高→低", blocks: [{ block_template_id: "block-1", planned_duration_minutes: 8 }, { block_template_id: "block-1", planned_duration_minutes: 6 }, { block_template_id: "block-2", planned_duration_minutes: 10 }] } },
      { candidate_id: "block", title: "新しい足裏ブロック", summary: "新規内容", rationale: "最近の立位導入を根拠", includes_inference: true, draft: { ...emptyDraft(), name: "足裏コンパス", target: "立位前", duration_minutes: 8, purpose: "足裏感覚と重心移動を安全につなぐ", level: "初級", content: "足指・踵・母趾球の三点を順に確認し、ゆっくり重心を移す。", script: "足裏の三点を床へ預け、呼吸に合わせて重心の移動を小さく試します。", cautions: "ふらつく場合は壁や椅子を使い、痛みのない範囲にする。", suitable_lessons: "立位を含むクラス", tags: ["足裏", "立位"] } },
      { candidate_id: "student", title: "みどりさんへの声かけ", summary: "開始前に強度確認", rationale: "記録された状態を根拠", includes_inference: false, draft: emptyDraft() },
    ],
  };
}

test("daily structured output requires exactly plan, new block, and student support in order", () => {
  const value = output();
  const context = { allowedBlockIds: new Set(["block-1", "block-2"]), existingBlockNames: new Set(["既存"]), existingPlanSignatures: new Set(["block-2>block-1>block-2"]) };
  assert.equal(parseAndValidateDailyOutput(JSON.stringify(value), candidates(), context).suggestions.length, 3);
  [value.suggestions[0], value.suggestions[1]] = [value.suggestions[1], value.suggestions[0]];
  assert.throws(() => parseAndValidateDailyOutput(JSON.stringify(value), candidates(), context), /candidate_order/);
});

test("new plan preserves repeated block occurrences and rejects a copied plan signature", () => {
  const value = output();
  const context = { allowedBlockIds: new Set(["block-1", "block-2"]), existingBlockNames: new Set<string>(), existingPlanSignatures: new Set<string>() };
  const parsed = parseAndValidateDailyOutput(JSON.stringify(value), candidates(), context);
  const stored = buildStoredDailySuggestions(parsed, candidates());
  assert.deepEqual(stored[0].draft_payload.blocks?.map((item) => item.block_template_id), ["block-1", "block-1", "block-2"]);
  assert.throws(() => parseAndValidateDailyOutput(JSON.stringify(value), candidates(), { ...context, existingPlanSignatures: new Set(["block-1>block-1>block-2"]) }), /plan_not_novel/);
});

test("new block must be complete and not reuse an existing normalized name", () => {
  const value = output();
  const context = { allowedBlockIds: new Set(["block-1", "block-2"]), existingBlockNames: new Set(["足裏コンパス"]), existingPlanSignatures: new Set<string>() };
  assert.throws(() => parseAndValidateDailyOutput(JSON.stringify(value), candidates(), context), /block_not_novel/);
});

test("daily reference index includes evidence and selected plan blocks", () => {
  const index = emptyReferenceIndex();
  index.record["record-1"] = { id: "record-1", label: "記録", href: "/lessons/example/record" };
  index.block["block-1"] = { id: "block-1", label: "呼吸", href: "/blocks/1" };
  index.block["block-2"] = { id: "block-2", label: "立位", href: "/blocks/2" };
  const parsed = parseAndValidateDailyOutput(JSON.stringify(output()), candidates(), { allowedBlockIds: new Set(["block-1", "block-2"]), existingBlockNames: new Set(), existingPlanSignatures: new Set() });
  const selected = selectedReferenceIndex(buildStoredDailySuggestions(parsed, candidates()), index);
  assert.equal(selected.block["block-2"].href, "/blocks/2");
});

test("daily model and source fingerprint remain explicitly allowlisted and feedback-sensitive", () => {
  assert.equal(getConfiguredDailyModel("gpt-5.6-luna"), "gpt-5.6-luna");
  assert.throws(() => getConfiguredDailyModel("expensive-unknown"), /price_allowlist/);
  assert.equal(estimateDailyCost("gpt-5.6-luna", { inputTokens: 10_000, cachedInputTokens: 0, outputTokens: 2_000 }), 0.022);
  assert.equal(dailySuggestionOutputSchema.properties.suggestions.minItems, 3);
  assert.equal(dailySuggestionOutputSchema.properties.suggestions.maxItems, 3);
  const base = { suggestionDate: "2026-08-12", reviewFingerprint: "f".repeat(64), candidates: candidates() };
  const before = dailyRunSourceFingerprint({ ...base, priorFeedback: [] });
  const pending = dailyRunSourceFingerprint({ ...base, priorFeedback: [{ dedupeKey: "a".repeat(64), status: "pending" }] });
  const dismissed = dailyRunSourceFingerprint({ ...base, priorFeedback: [{ dedupeKey: "a".repeat(64), status: "dismissed" }] });
  assert.equal(before, pending);
  assert.notEqual(before, dismissed);
});

test("existing atomic draft RPCs and duplicate guards remain unchanged", () => {
  const sql = readFileSync("supabase/migrations/20260811185420_ai_daily_coaching_suggestions.sql", "utf8");
  const blockRpc = sql.slice(sql.indexOf("create function public.save_ai_daily_suggestion_as_block_draft"), sql.indexOf("create function public.save_ai_daily_suggestion_as_plan_draft"));
  assert.match(blockRpc, /for update;/i);
  assert.match(blockRpc, /is_draft, source_ai_daily_suggestion_id/i);
  assert.match(blockRpc, /status = 'saved'/i);
  assert.match(sql, /unique \(user_id, dedupe_key\)/i);
});

test("daily generation records safe validation categories without logging model output", () => {
  const server = readFileSync("src/lib/daily-suggestions/server.ts", "utf8");
  assert.match(server, /candidate_order_invalid/);
  assert.match(server, /plan_draft_invalid/);
  assert.match(server, /block_draft_invalid/);
  assert.match(server, /student_draft_invalid/);
  assert.doesNotMatch(server, /output_text[),}\]]*\s*\)/);
});
