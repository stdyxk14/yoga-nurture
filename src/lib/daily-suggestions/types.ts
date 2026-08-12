import {
  emptyReferenceIndex,
  sourceFingerprint,
  type AiReviewReference,
  type AiReviewReferenceIndex,
} from "@/lib/ai-review/types";

export const dailySuggestionPromptVersion = "practical-daily-coach-v2";
export const dailySuggestionEvidenceVersion = "practical-daily-evidence-v2";

export const dailySuggestionTypes = [
  "new_plan",
  "plan_revision",
  "new_block",
  "block_revision",
  "improvised_template",
  "script_revision",
  "alternative_block",
  "next_schedule_adaptation",
  "observation_point",
  "recording_improvement",
] as const;

export type DailySuggestionType = (typeof dailySuggestionTypes)[number];
export type DailyConfidence = "high" | "medium" | "low";
export type DailyCoachSegment = "lesson_plan" | "new_block" | "student_support";

export type DailyDraftPayload = {
  kind: "block" | "plan" | "none";
  name?: string;
  theme?: string;
  format?: "personal" | "group" | "online" | null;
  memo?: string;
  target?: string;
  overall_goal?: string;
  intensity_flow?: string;
  suitable_lessons?: string;
  content?: string;
  category_id?: string | null;
  subcategory_id?: string | null;
  duration_minutes?: number;
  purpose?: string;
  level?: string;
  script?: string;
  cautions?: string;
  tags?: string[];
  blocks?: Array<{
    block_template_id: string;
    planned_duration_minutes: number;
    script_override?: string | null;
    cautions_override?: string | null;
  }>;
};

export type DailyCandidate = {
  id: string;
  segment: DailyCoachSegment;
  type: DailySuggestionType;
  priority: 1 | 2 | 3;
  confidence: DailyConfidence;
  evidenceCount: number;
  title: string;
  factualBasis: string;
  proposedAction: string;
  references: AiReviewReference[];
  baseDraft: DailyDraftPayload;
  sourcePlanId: string | null;
  sourceBlockTemplateId: string | null;
  sourceScheduleId: string | null;
  dedupeKey: string;
};

type ModelDailyDraft = {
  name: string | null;
  theme: string | null;
  format: "personal" | "group" | "online" | null;
  memo: string | null;
  target: string | null;
  overall_goal: string | null;
  intensity_flow: string | null;
  suitable_lessons: string | null;
  content: string | null;
  duration_minutes: number | null;
  purpose: string | null;
  level: string | null;
  script: string | null;
  cautions: string | null;
  tags: string[];
  blocks: Array<{
    block_template_id: string;
    planned_duration_minutes: number;
  }>;
};

export type ModelDailySuggestion = {
  candidate_id: string;
  title: string;
  summary: string;
  rationale: string;
  includes_inference: boolean;
  draft: ModelDailyDraft;
};

export type ModelDailyOutput = { suggestions: ModelDailySuggestion[] };

export type StoredDailySuggestion = {
  rank: number;
  suggestion_type: DailySuggestionType;
  candidate_key: string;
  dedupe_key: string;
  content_hash: string;
  title: string;
  summary: string;
  rationale: string;
  confidence: DailyConfidence;
  includes_inference: boolean;
  evidence_count: number;
  evidence_refs: AiReviewReference[];
  draft_payload: DailyDraftPayload;
  source_plan_id: string | null;
  source_block_template_id: string | null;
  source_schedule_id: string | null;
};

const nullableString = { type: ["string", "null"] } as const;

export const dailySuggestionOutputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["suggestions"],
  properties: {
    suggestions: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["candidate_id", "title", "summary", "rationale", "includes_inference", "draft"],
        properties: {
          candidate_id: { type: "string", minLength: 3, maxLength: 100 },
          title: { type: "string", minLength: 1, maxLength: 120 },
          summary: { type: "string", minLength: 1, maxLength: 700 },
          rationale: { type: "string", minLength: 1, maxLength: 1_000 },
          includes_inference: { type: "boolean" },
          draft: {
            type: "object",
            additionalProperties: false,
            required: [
              "name",
              "theme",
              "format",
              "memo",
              "target",
              "overall_goal",
              "intensity_flow",
              "suitable_lessons",
              "content",
              "duration_minutes",
              "purpose",
              "level",
              "script",
              "cautions",
              "tags",
              "blocks",
            ],
            properties: {
              name: nullableString,
              theme: nullableString,
              format: { type: ["string", "null"], enum: ["personal", "group", "online", null] },
              memo: nullableString,
              target: nullableString,
              overall_goal: nullableString,
              intensity_flow: nullableString,
              suitable_lessons: nullableString,
              content: nullableString,
              duration_minutes: { type: ["integer", "null"], minimum: 1, maximum: 480 },
              purpose: nullableString,
              level: nullableString,
              script: nullableString,
              cautions: nullableString,
              tags: { type: "array", maxItems: 12, items: { type: "string", maxLength: 60 } },
              blocks: {
                type: "array",
                maxItems: 14,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["block_template_id", "planned_duration_minutes"],
                  properties: {
                    block_template_id: { type: "string" },
                    planned_duration_minutes: { type: "integer", minimum: 1, maximum: 180 },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

export const dailyModelPrices = {
  "gpt-5.6-luna": { input: 1, cachedInput: 0.1, output: 6 },
  "gpt-5.4-mini": { input: 0.75, cachedInput: 0.075, output: 4.5 },
} as const;

export type DailyPricedModel = keyof typeof dailyModelPrices;

export function getConfiguredDailyModel(value = process.env.OPENAI_DAILY_SUGGESTION_MODEL): DailyPricedModel {
  const model = value?.trim() || "gpt-5.6-luna";
  if (!(model in dailyModelPrices)) throw new Error("daily_model_not_in_price_allowlist");
  return model as DailyPricedModel;
}

export function estimateDailyCost(model: DailyPricedModel, usage: { inputTokens: number; cachedInputTokens: number; outputTokens: number }) {
  const price = dailyModelPrices[model];
  const uncachedInput = Math.max(0, usage.inputTokens - usage.cachedInputTokens);
  return roundUsd((uncachedInput * price.input + usage.cachedInputTokens * price.cachedInput + usage.outputTokens * price.output) / 1_000_000);
}

export function reserveDailyCost(model: DailyPricedModel, evidenceCharacters: number, maxOutputTokens = 4_500) {
  const estimatedInputTokens = Math.ceil(evidenceCharacters / 3.2) + 1_200;
  return Math.max(0.002, estimateDailyCost(model, { inputTokens: estimatedInputTokens, cachedInputTokens: 0, outputTokens: maxOutputTokens }));
}

export function candidateIdentity(value: unknown) {
  return sourceFingerprint(value);
}

export function candidateId(value: unknown) {
  return `candidate-${candidateIdentity(value).slice(0, 20)}`;
}

export function dailyRunSourceFingerprint({
  suggestionDate,
  reviewFingerprint,
  candidates,
  priorFeedback,
}: {
  suggestionDate: string;
  reviewFingerprint: string;
  candidates: DailyCandidate[];
  priorFeedback: Array<{ dedupeKey: string; status: string }>;
}) {
  return sourceFingerprint({
    suggestion_date: suggestionDate,
    review_fingerprint: reviewFingerprint,
    candidate_pool: candidates.map((candidate) => ({
      candidate_id: candidate.id,
      segment: candidate.segment,
      dedupe_key: candidate.dedupeKey,
      confidence: candidate.confidence,
      evidence_count: candidate.evidenceCount,
    })),
    prior_feedback: priorFeedback
      .filter((item) => item.status !== "pending")
      .map((item) => ({ dedupe_key: item.dedupeKey, status: item.status }))
      .sort((a, b) => a.dedupe_key.localeCompare(b.dedupe_key) || a.status.localeCompare(b.status)),
  });
}

export function parseAndValidateDailyOutput(
  outputText: string,
  candidates: DailyCandidate[],
  context: { allowedBlockIds?: Set<string>; existingBlockNames?: Set<string>; existingPlanSignatures?: Set<string> } = {},
): ModelDailyOutput {
  const parsed = JSON.parse(outputText) as ModelDailyOutput;
  if (!parsed || !Array.isArray(parsed.suggestions) || parsed.suggestions.length !== 3 || candidates.length !== 3) throw new Error("daily_output_invalid");
  const expectedSegments: DailyCoachSegment[] = ["lesson_plan", "new_block", "student_support"];
  for (let index = 0; index < parsed.suggestions.length; index += 1) {
    const suggestion = parsed.suggestions[index];
    const candidate = candidates[index];
    if (!candidate || candidate.segment !== expectedSegments[index] || suggestion.candidate_id !== candidate.id) throw new Error("daily_candidate_order_invalid");
    if (!suggestion.title.trim() || !suggestion.summary.trim() || !suggestion.rationale.trim()) throw new Error("daily_output_invalid");
    if (candidate.segment === "lesson_plan") validatePlanDraft(suggestion.draft, context.allowedBlockIds ?? new Set(), context.existingPlanSignatures ?? new Set());
    if (candidate.segment === "new_block") validateNewBlockDraft(suggestion.draft, context.existingBlockNames ?? new Set());
    if (candidate.segment === "student_support" && suggestion.draft.blocks.length) throw new Error("daily_student_draft_invalid");
  }
  return parsed;
}

export function buildStoredDailySuggestions(output: ModelDailyOutput, candidates: DailyCandidate[]): StoredDailySuggestion[] {
  return output.suggestions.map((suggestion, index) => {
    const candidate = candidates[index];
    if (!candidate || candidate.id !== suggestion.candidate_id) throw new Error("daily_candidate_not_allowed");
    const draft = mergeDraft(candidate.baseDraft, suggestion.draft);
    const value = {
      rank: index + 1,
      suggestion_type: candidate.type,
      candidate_key: candidate.id,
      dedupe_key: candidate.dedupeKey,
      title: suggestion.title.trim(),
      summary: suggestion.summary.trim(),
      rationale: suggestion.rationale.trim(),
      confidence: candidate.confidence,
      includes_inference: suggestion.includes_inference,
      evidence_count: candidate.evidenceCount,
      evidence_refs: candidate.references,
      draft_payload: draft,
      source_plan_id: candidate.sourcePlanId,
      source_block_template_id: candidate.sourceBlockTemplateId,
      source_schedule_id: candidate.sourceScheduleId,
    };
    return {
      ...value,
      content_hash: sourceFingerprint({
        suggestion_type: value.suggestion_type,
        title: value.title,
        summary: value.summary,
        rationale: value.rationale,
        draft_payload: value.draft_payload,
        source_schedule_id: value.source_schedule_id,
      }),
    };
  });
}

export function selectedReferenceIndex(suggestions: StoredDailySuggestion[], index: AiReviewReferenceIndex) {
  const stored = emptyReferenceIndex();
  const references = [
    ...suggestions.flatMap((item) => item.evidence_refs),
    ...suggestions.flatMap((item) => item.draft_payload.blocks ?? []).map((block) => ({ type: "block" as const, ref: block.block_template_id })),
  ];
  for (const reference of references) {
    const target = index[reference.type]?.[reference.ref];
    if (!target) throw new Error(`daily_reference_not_allowed:${reference.type}`);
    stored[reference.type][reference.ref] = target;
  }
  return stored;
}

export function emptyDailyReferenceIndex() {
  return emptyReferenceIndex();
}

function validatePlanDraft(draft: ModelDailyDraft, allowedBlockIds: Set<string>, existingPlanSignatures: Set<string>) {
  if (!draft.name?.trim() || !draft.theme?.trim() || !draft.target?.trim() || !draft.overall_goal?.trim() || !draft.intensity_flow?.trim()) throw new Error("daily_plan_draft_invalid");
  if (draft.blocks.length < 3 || draft.blocks.length > 14) throw new Error("daily_plan_blocks_invalid");
  for (const block of draft.blocks) {
    if (!allowedBlockIds.has(block.block_template_id) || !Number.isInteger(block.planned_duration_minutes) || block.planned_duration_minutes <= 0) throw new Error("daily_plan_block_not_allowed");
  }
  if (existingPlanSignatures.has(draft.blocks.map((block) => block.block_template_id).join(">"))) throw new Error("daily_plan_not_novel");
}

function validateNewBlockDraft(draft: ModelDailyDraft, existingBlockNames: Set<string>) {
  const name = draft.name?.trim() ?? "";
  if (!name || existingBlockNames.has(normalizeName(name))) throw new Error("daily_new_block_not_novel");
  if ((draft.purpose?.trim().length ?? 0) < 8 || (draft.content?.trim().length ?? 0) < 20 || (draft.script?.trim().length ?? 0) < 20 || (draft.cautions?.trim().length ?? 0) < 8 || !draft.duration_minutes || !draft.level?.trim()) {
    throw new Error("daily_new_block_incomplete");
  }
  if (draft.blocks.length) throw new Error("daily_block_draft_blocks_invalid");
}

function mergeDraft(base: DailyDraftPayload, model: ModelDailyDraft): DailyDraftPayload {
  if (base.kind === "none") return { kind: "none" };
  const tags = Array.from(new Set((model.tags.length ? model.tags : base.tags ?? []).map(normalizeTag).filter(Boolean)));
  if (base.kind === "plan") {
    return {
      ...base,
      kind: "plan",
      name: nonEmpty(model.name) ?? base.name,
      theme: nonEmpty(model.theme) ?? base.theme,
      format: model.format ?? base.format ?? null,
      memo: nonEmpty(model.memo) ?? nonEmpty(model.overall_goal) ?? base.memo,
      target: nonEmpty(model.target),
      overall_goal: nonEmpty(model.overall_goal),
      intensity_flow: nonEmpty(model.intensity_flow),
      blocks: model.blocks.map((block) => ({ ...block, script_override: null, cautions_override: null })),
    };
  }
  return {
    ...base,
    kind: "block",
    name: nonEmpty(model.name) ?? base.name,
    duration_minutes: model.duration_minutes ?? base.duration_minutes,
    purpose: nonEmpty(model.purpose) ?? base.purpose,
    level: nonEmpty(model.level) ?? base.level,
    content: nonEmpty(model.content),
    script: nonEmpty(model.script) ?? base.script,
    cautions: nonEmpty(model.cautions) ?? base.cautions,
    memo: nonEmpty(model.memo) ?? nonEmpty(model.content) ?? base.memo,
    target: nonEmpty(model.target),
    suitable_lessons: nonEmpty(model.suitable_lessons),
    tags,
  };
}

function nonEmpty(value: string | null) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function normalizeTag(value: string) {
  const normalized = value.trim();
  if (!normalized) return "";
  return normalized.startsWith("#") ? normalized : `#${normalized}`;
}

function normalizeName(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[\s　・･()（）「」『』]/g, "");
}

function roundUsd(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}
