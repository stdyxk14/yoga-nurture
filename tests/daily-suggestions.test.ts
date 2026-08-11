import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { emptyReferenceIndex } from "../src/lib/ai-review/types";
import {
  buildStoredDailySuggestions,
  dailySuggestionOutputSchema,
  estimateDailyCost,
  getConfiguredDailyModel,
  parseAndValidateDailyOutput,
  selectedReferenceIndex,
  type DailyCandidate,
  type ModelDailyOutput,
} from "../src/lib/daily-suggestions/types";

function candidate(id: string, priority: 1 | 2 | 3, kind: "none" | "plan" = "none"): DailyCandidate {
  return {
    id,
    type: kind === "plan" ? "plan_revision" : "observation_point",
    priority,
    confidence: priority === 1 ? "high" : "medium",
    evidenceCount: 2,
    title: id,
    factualBasis: "fixture facts",
    proposedAction: "fixture action",
    references: [{ type: "record", ref: "record-1" }],
    baseDraft: kind === "plan" ? {
      kind: "plan",
      name: "元プラン（AI改訂案）",
      theme: "呼吸",
      format: "group",
      memo: "",
      blocks: [
        { block_template_id: "block-1", planned_duration_minutes: 5 },
        { block_template_id: "block-1", planned_duration_minutes: 7 },
      ],
    } : { kind: "none" },
    sourcePlanId: kind === "plan" ? "plan-1" : null,
    sourceBlockTemplateId: null,
    sourceScheduleId: null,
    dedupeKey: "a".repeat(64 - id.length) + Buffer.from(id).toString("hex").slice(0, id.length),
  };
}

function output(ids: string[]): ModelDailyOutput {
  return {
    suggestions: ids.map((id) => ({
      candidate_id: id,
      title: `提案 ${id}`,
      summary: "具体的な提案",
      rationale: "fixture factsに基づく",
      includes_inference: false,
      draft: { name: null, theme: null, format: null, memo: null, duration_minutes: null, purpose: null, level: null, script: null, cautions: null, tags: [] },
    })),
  };
}

test("daily structured output only accepts allowlisted candidates and the highest-priority primary", () => {
  const candidates = [candidate("safety", 1), candidate("recording", 3)];
  assert.equal(parseAndValidateDailyOutput(JSON.stringify(output(["safety", "recording"])), candidates).suggestions.length, 2);
  assert.throws(() => parseAndValidateDailyOutput(JSON.stringify(output(["recording"])), candidates), /primary_priority/);
  assert.throws(() => parseAndValidateDailyOutput(JSON.stringify(output(["invented"])), candidates), /candidate_not_allowed/);
});

test("daily plan draft preserves repeated occurrences of the same block", () => {
  const stored = buildStoredDailySuggestions(output(["plan"]), [candidate("plan", 2, "plan")]);
  assert.deepEqual(stored[0].draft_payload.blocks?.map((item) => item.block_template_id), ["block-1", "block-1"]);
  assert.equal(stored[0].source_plan_id, "plan-1");
  assert.match(stored[0].content_hash, /^[0-9a-f]{64}$/);
});

test("daily content hash is independent from display rank and evidence bookkeeping", () => {
  const first = candidate("first", 1);
  const second = { ...candidate("second", 2), type: first.type, title: first.title, dedupeKey: "b".repeat(64) };
  const firstStored = buildStoredDailySuggestions(output(["first"]), [first])[0];
  const secondOutput = output(["second"]);
  secondOutput.suggestions[0] = { ...secondOutput.suggestions[0], title: firstStored.title, summary: firstStored.summary, rationale: firstStored.rationale };
  const secondStored = buildStoredDailySuggestions(secondOutput, [second])[0];
  assert.equal(firstStored.content_hash, secondStored.content_hash);
});

test("daily reference index rejects any reference outside the server allowlist", () => {
  const index = emptyReferenceIndex();
  index.record["record-1"] = { id: "record-1", label: "記録", href: "/lessons/example/record" };
  const stored = buildStoredDailySuggestions(output(["safe"]), [candidate("safe", 1)]);
  assert.equal(selectedReferenceIndex(stored, index).record["record-1"].href, "/lessons/example/record");
  stored[0].evidence_refs = [{ type: "record", ref: "invented" }];
  assert.throws(() => selectedReferenceIndex(stored, index), /reference_not_allowed/);
});

test("daily model selection and cost use only the explicit price allowlist", () => {
  assert.equal(getConfiguredDailyModel("gpt-5.6-luna"), "gpt-5.6-luna");
  assert.throws(() => getConfiguredDailyModel("expensive-unknown"), /price_allowlist/);
  assert.equal(estimateDailyCost("gpt-5.6-luna", { inputTokens: 10_000, cachedInputTokens: 0, outputTokens: 2_000 }), 0.022);
  assert.equal(dailySuggestionOutputSchema.additionalProperties, false);
  assert.equal(dailySuggestionOutputSchema.properties.suggestions.maxItems, 3);
});

test("daily migration locks suggestions and atomically records one saved draft", () => {
  const sql = readFileSync("supabase/migrations/20260811185420_ai_daily_coaching_suggestions.sql", "utf8");
  const blockRpc = sql.slice(sql.indexOf("create function public.save_ai_daily_suggestion_as_block_draft"), sql.indexOf("create function public.save_ai_daily_suggestion_as_plan_draft"));
  assert.match(blockRpc, /for update;/i);
  assert.match(blockRpc, /is_draft, source_ai_daily_suggestion_id/i);
  assert.match(blockRpc, /status = 'saved'/i);
  assert.match(sql, /unique \(user_id, dedupe_key\)/i);
  assert.match(sql, /lesson_plan_blocks_reject_draft_template/i);
  assert.match(sql, /lesson_record_blocks_reject_draft_template/i);
});
