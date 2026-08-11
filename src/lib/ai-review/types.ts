import { createHash } from "node:crypto";

export const aiReviewPromptVersion = "teaching-review-v1";
export const aiReviewEvidenceVersion = "teaching-evidence-v1";

export const aiReviewAxes = [
  "lesson_structure",
  "block_quality",
  "field_adaptation",
  "student_support",
  "safety_consideration",
  "continuous_improvement",
  "data_reliability",
] as const;

export type AiReviewAxis = (typeof aiReviewAxes)[number];
export type AiReviewAxisStatus = "strength" | "stable" | "observe" | "review" | "insufficient";
export type AiReviewReferenceType = "plan" | "block" | "student" | "record" | "schedule";
export type AiReviewReference = { type: AiReviewReferenceType; ref: string };

export type AiReviewFinding = {
  title: string;
  detail: string;
  reason: string;
  evidence_count: number;
  confidence: number;
  includes_inference: boolean;
  references: AiReviewReference[];
  next_action: string;
};

export type AiReviewOutput = {
  overall_assessment: string;
  key_strength: AiReviewFinding;
  priority_improvement: AiReviewFinding;
  lesson_plan_analysis: AiReviewFinding[];
  block_analysis: AiReviewFinding[];
  student_safety_analysis: AiReviewFinding[];
  data_quality: {
    summary: string;
    limitations: string[];
    completeness_notes: string[];
  };
  next_actions: Array<{
    title: string;
    detail: string;
    priority: "high" | "medium" | "low";
    references: AiReviewReference[];
  }>;
  axes: Array<{
    axis: AiReviewAxis;
    status: AiReviewAxisStatus;
    summary: string;
    reason: string;
    evidence_count: number;
    confidence: number;
    includes_inference: boolean;
    references: AiReviewReference[];
    next_action: string;
  }>;
  contradictions: Array<{
    description: string;
    references: AiReviewReference[];
  }>;
};

export type AiReviewReferenceIndex = Record<AiReviewReferenceType, Record<string, { id: string; label: string; href: string }>>;

const referenceSchema = {
  type: "object",
  additionalProperties: false,
  required: ["type", "ref"],
  properties: {
    type: { type: "string", enum: ["plan", "block", "student", "record", "schedule"] },
    ref: { type: "string" },
  },
} as const;

const findingSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "detail", "reason", "evidence_count", "confidence", "includes_inference", "references", "next_action"],
  properties: {
    title: { type: "string" },
    detail: { type: "string" },
    reason: { type: "string" },
    evidence_count: { type: "integer", minimum: 0 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    includes_inference: { type: "boolean" },
    references: { type: "array", maxItems: 12, items: referenceSchema },
    next_action: { type: "string" },
  },
} as const;

export const aiReviewOutputSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "overall_assessment",
    "key_strength",
    "priority_improvement",
    "lesson_plan_analysis",
    "block_analysis",
    "student_safety_analysis",
    "data_quality",
    "next_actions",
    "axes",
    "contradictions",
  ],
  properties: {
    overall_assessment: { type: "string" },
    key_strength: findingSchema,
    priority_improvement: findingSchema,
    lesson_plan_analysis: { type: "array", minItems: 1, maxItems: 5, items: findingSchema },
    block_analysis: { type: "array", minItems: 1, maxItems: 5, items: findingSchema },
    student_safety_analysis: { type: "array", minItems: 1, maxItems: 5, items: findingSchema },
    data_quality: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "limitations", "completeness_notes"],
      properties: {
        summary: { type: "string" },
        limitations: { type: "array", maxItems: 10, items: { type: "string" } },
        completeness_notes: { type: "array", maxItems: 10, items: { type: "string" } },
      },
    },
    next_actions: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "detail", "priority", "references"],
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          references: { type: "array", maxItems: 12, items: referenceSchema },
        },
      },
    },
    axes: {
      type: "array",
      minItems: 7,
      maxItems: 7,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["axis", "status", "summary", "reason", "evidence_count", "confidence", "includes_inference", "references", "next_action"],
        properties: {
          axis: { type: "string", enum: aiReviewAxes },
          status: { type: "string", enum: ["strength", "stable", "observe", "review", "insufficient"] },
          summary: { type: "string" },
          reason: { type: "string" },
          evidence_count: { type: "integer", minimum: 0 },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          includes_inference: { type: "boolean" },
          references: { type: "array", maxItems: 12, items: referenceSchema },
          next_action: { type: "string" },
        },
      },
    },
    contradictions: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["description", "references"],
        properties: {
          description: { type: "string" },
          references: { type: "array", maxItems: 12, items: referenceSchema },
        },
      },
    },
  },
} as const;

export const reviewModelPrices = {
  "gpt-5.6-terra": { input: 2.5, cachedInput: 0.25, output: 15 },
  "gpt-5.6-luna": { input: 1, cachedInput: 0.1, output: 6 },
  "gpt-5.4": { input: 2.5, cachedInput: 0.25, output: 15 },
  "gpt-5.4-mini": { input: 0.75, cachedInput: 0.075, output: 4.5 },
} as const;

export type ReviewPricedModel = keyof typeof reviewModelPrices;

export function getConfiguredReviewModel(value = process.env.OPENAI_REVIEW_MODEL): ReviewPricedModel {
  const model = value?.trim() || "gpt-5.6-terra";
  if (!(model in reviewModelPrices)) throw new Error("review_model_not_in_price_allowlist");
  return model as ReviewPricedModel;
}

export function estimateReviewCost(model: ReviewPricedModel, usage: { inputTokens: number; cachedInputTokens: number; outputTokens: number }) {
  const price = reviewModelPrices[model];
  const uncachedInput = Math.max(0, usage.inputTokens - usage.cachedInputTokens);
  return roundUsd((uncachedInput * price.input + usage.cachedInputTokens * price.cachedInput + usage.outputTokens * price.output) / 1_000_000);
}

export function reserveReviewCost(model: ReviewPricedModel, evidenceCharacters: number, maxOutputTokens = 8_000) {
  const estimatedInputTokens = Math.ceil(evidenceCharacters / 3.2) + 2_000;
  return Math.max(0.01, estimateReviewCost(model, { inputTokens: estimatedInputTokens, cachedInputTokens: 0, outputTokens: maxOutputTokens }));
}

export function sourceFingerprint(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

export function parseAndValidateAiReview(outputText: string, index: AiReviewReferenceIndex): AiReviewOutput {
  const value = JSON.parse(outputText) as AiReviewOutput;
  if (!value || typeof value !== "object" || !Array.isArray(value.axes)) throw new Error("review_output_invalid");
  const axes = new Set(value.axes.map((axis) => axis.axis));
  if (value.axes.length !== aiReviewAxes.length || aiReviewAxes.some((axis) => !axes.has(axis))) throw new Error("review_axes_invalid");
  for (const axis of value.axes) {
    if (axis.confidence < 0 || axis.confidence > 1 || axis.evidence_count < 0) throw new Error("review_axis_value_invalid");
  }
  validateReviewReferences(value, index);
  return value;
}

export function validateReviewReferences(review: AiReviewOutput, index: AiReviewReferenceIndex) {
  for (const reference of collectReviewReferences(review)) {
    if (!index[reference.type]?.[reference.ref]) throw new Error(`review_reference_not_allowed:${reference.type}`);
  }
}

export function buildStoredReferenceIndex(review: AiReviewOutput, index: AiReviewReferenceIndex): AiReviewReferenceIndex {
  const stored = emptyReferenceIndex();
  for (const reference of collectReviewReferences(review)) {
    stored[reference.type][reference.ref] = index[reference.type][reference.ref];
  }
  return stored;
}

export function emptyReferenceIndex(): AiReviewReferenceIndex {
  return { plan: {}, block: {}, student: {}, record: {}, schedule: {} };
}

function collectReviewReferences(review: AiReviewOutput) {
  const references: AiReviewReference[] = [];
  const add = (items: AiReviewReference[]) => references.push(...items);
  add(review.key_strength.references);
  add(review.priority_improvement.references);
  review.lesson_plan_analysis.forEach((finding) => add(finding.references));
  review.block_analysis.forEach((finding) => add(finding.references));
  review.student_safety_analysis.forEach((finding) => add(finding.references));
  review.next_actions.forEach((action) => add(action.references));
  review.axes.forEach((axis) => add(axis.references));
  review.contradictions.forEach((item) => add(item.references));
  return references;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function roundUsd(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}
