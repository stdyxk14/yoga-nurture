import {
  emptyReferenceIndex,
  sourceFingerprint,
  type AiReviewReference,
  type AiReviewReferenceIndex,
} from "@/lib/ai-review/types";

export const dailySuggestionPromptVersion = "daily-coaching-v1";
export const dailySuggestionEvidenceVersion = "daily-evidence-v1";

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

export type DailyDraftPayload = {
  kind: "block" | "plan" | "none";
  name?: string;
  theme?: string;
  format?: "personal" | "group" | "online" | null;
  memo?: string;
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
  type: DailySuggestionType;
  priority: 1 | 2 | 3 | 4 | 5 | 6;
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
  duration_minutes: number | null;
  purpose: string | null;
  level: string | null;
  script: string | null;
  cautions: string | null;
  tags: string[];
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
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["candidate_id", "title", "summary", "rationale", "includes_inference", "draft"],
        properties: {
          candidate_id: { type: "string", minLength: 3, maxLength: 80 },
          title: { type: "string", minLength: 1, maxLength: 100 },
          summary: { type: "string", minLength: 1, maxLength: 600 },
          rationale: { type: "string", minLength: 1, maxLength: 800 },
          includes_inference: { type: "boolean" },
          draft: {
            type: "object",
            additionalProperties: false,
            required: ["name", "theme", "format", "memo", "duration_minutes", "purpose", "level", "script", "cautions", "tags"],
            properties: {
              name: nullableString,
              theme: nullableString,
              format: { type: ["string", "null"], enum: ["personal", "group", "online", null] },
              memo: nullableString,
              duration_minutes: { type: ["integer", "null"], minimum: 1, maximum: 480 },
              purpose: nullableString,
              level: nullableString,
              script: nullableString,
              cautions: nullableString,
              tags: { type: "array", maxItems: 12, items: { type: "string", maxLength: 60 } },
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

export function reserveDailyCost(model: DailyPricedModel, evidenceCharacters: number, maxOutputTokens = 2_200) {
  const estimatedInputTokens = Math.ceil(evidenceCharacters / 3.2) + 900;
  return Math.max(0.002, estimateDailyCost(model, { inputTokens: estimatedInputTokens, cachedInputTokens: 0, outputTokens: maxOutputTokens }));
}

export function candidateIdentity(value: unknown) {
  return sourceFingerprint(value);
}

export function candidateId(value: unknown) {
  return `candidate-${candidateIdentity(value).slice(0, 20)}`;
}

export function parseAndValidateDailyOutput(outputText: string, candidates: DailyCandidate[]): ModelDailyOutput {
  const parsed = JSON.parse(outputText) as ModelDailyOutput;
  if (!parsed || !Array.isArray(parsed.suggestions) || parsed.suggestions.length < 1 || parsed.suggestions.length > 3) {
    throw new Error("daily_output_invalid");
  }
  const candidatesById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const selectedIds = new Set<string>();
  for (const suggestion of parsed.suggestions) {
    if (!candidatesById.has(suggestion.candidate_id)) throw new Error("daily_candidate_not_allowed");
    if (selectedIds.has(suggestion.candidate_id)) throw new Error("daily_candidate_duplicate");
    if (!suggestion.title.trim() || !suggestion.summary.trim() || !suggestion.rationale.trim()) throw new Error("daily_output_invalid");
    selectedIds.add(suggestion.candidate_id);
  }
  const bestPriority = Math.min(...candidates.map((candidate) => candidate.priority));
  if (candidatesById.get(parsed.suggestions[0].candidate_id)?.priority !== bestPriority) {
    throw new Error("daily_primary_priority_invalid");
  }
  return parsed;
}

export function buildStoredDailySuggestions(output: ModelDailyOutput, candidates: DailyCandidate[]): StoredDailySuggestion[] {
  const candidatesById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  return output.suggestions.map((suggestion, index) => {
    const candidate = candidatesById.get(suggestion.candidate_id);
    if (!candidate) throw new Error("daily_candidate_not_allowed");
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
        source_plan_id: value.source_plan_id,
        source_block_template_id: value.source_block_template_id,
        source_schedule_id: value.source_schedule_id,
      }),
    };
  });
}

export function selectedReferenceIndex(suggestions: StoredDailySuggestion[], index: AiReviewReferenceIndex) {
  const stored = emptyReferenceIndex();
  for (const reference of suggestions.flatMap((item) => item.evidence_refs)) {
    const target = index[reference.type]?.[reference.ref];
    if (!target) throw new Error(`daily_reference_not_allowed:${reference.type}`);
    stored[reference.type][reference.ref] = target;
  }
  return stored;
}

export function emptyDailyReferenceIndex() {
  return emptyReferenceIndex();
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
      memo: nonEmpty(model.memo) ?? base.memo,
    };
  }
  return {
    ...base,
    kind: "block",
    name: nonEmpty(model.name) ?? base.name,
    duration_minutes: model.duration_minutes ?? base.duration_minutes,
    purpose: nonEmpty(model.purpose) ?? base.purpose,
    level: nonEmpty(model.level) ?? base.level,
    script: nonEmpty(model.script) ?? base.script,
    cautions: nonEmpty(model.cautions) ?? base.cautions,
    memo: nonEmpty(model.memo) ?? base.memo,
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

function roundUsd(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}
