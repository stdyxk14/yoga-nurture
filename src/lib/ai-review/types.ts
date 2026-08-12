import { createHash } from "node:crypto";

export const aiReviewPromptVersion = "practical-teaching-review-v3";
export const aiReviewEvidenceVersion = "flexible-teaching-evidence-v2";

export type ReviewScopeSelection =
  | { mode: "lesson"; recordId?: string }
  | { mode: "period"; range: "recent3" | "recent5" | "month" | "custom"; from?: string; to?: string };

export type ResolvedReviewScope = {
  mode: "lesson" | "period";
  scopeType: "lesson" | "recent" | "month" | "custom";
  scopeKey: string;
  scopeLabel: string;
  targetRecordIds: string[];
  lessonRecordId: string | null;
  periodStart: string;
  periodEnd: string;
  selection: ReviewScopeSelection;
};

export type ReviewRecordOption = {
  id: string;
  scheduleId: string;
  label: string;
  date: string;
  startsAt: string;
  updatedAt: string;
};

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

export type AiReviewSection = {
  summary: string;
  details: string[];
  references: AiReviewReference[];
};

export type AiStudentReview = {
  student_ref: string;
  student_name: string;
  at_the_time: string;
  recorded_reaction: string;
  instructor_response: string;
  good_response: string;
  concerns: string;
  next_care: string;
  cue_idea: string;
  follow_up_idea: string;
  experience_idea: string;
  references: AiReviewReference[];
};

export type SingleLessonReview = {
  good_points: AiReviewSection;
  improvement_points: AiReviewSection;
  lesson_structure_and_flow: AiReviewSection;
  block_pose_selection: AiReviewSection;
  sequence_connections: AiReviewSection;
  intensity_flow: AiReviewSection;
  time_allocation: AiReviewSection;
  cueing_and_voice: AiReviewSection;
  field_adaptation: AiReviewSection;
  student_reviews: AiStudentReview[];
  customer_communication: AiReviewSection;
  next_improvements: AiReviewSection;
  new_experiments: AiReviewSection;
};

export type PeriodLessonReview = {
  stable_structure: AiReviewSection;
  variable_structure: AiReviewSection;
  recent_improvements: AiReviewSection;
  repeated_challenges: AiReviewSection;
  frequently_used_blocks: AiReviewSection;
  retired_content: AiReviewSection;
  timing_trends: AiReviewSection;
  cueing_changes: AiReviewSection;
  student_response_changes: AiReviewSection;
  repeated_student_care: AiReviewSection;
  student_reviews: AiStudentReview[];
  customer_followup_strengths: AiReviewSection;
  retention_experience: AiReviewSection;
  next_few_lessons: AiReviewSection;
};

export type AiReviewOutput = {
  review_kind: "lesson" | "period";
  overall_assessment: string;
  key_strength: AiReviewFinding;
  priority_improvement: AiReviewFinding;
  single_lesson: SingleLessonReview | null;
  period_review: PeriodLessonReview | null;
  data_notes: string[];
  next_actions: Array<{
    title: string;
    detail: string;
    priority: "high" | "medium" | "low";
    references: AiReviewReference[];
  }>;
  contradictions: Array<{
    description: string;
    references: AiReviewReference[];
  }>;
  lesson_plan_analysis?: AiReviewFinding[];
  block_analysis?: AiReviewFinding[];
  student_safety_analysis?: AiReviewFinding[];
  data_quality?: { summary: string; limitations: string[]; completeness_notes: string[] };
  axes?: unknown[];
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

const referenceArraySchema = { type: "array", maxItems: 16, items: referenceSchema } as const;

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
    references: referenceArraySchema,
    next_action: { type: "string" },
  },
} as const;

const sectionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "details", "references"],
  properties: {
    summary: { type: "string" },
    details: { type: "array", maxItems: 8, items: { type: "string" } },
    references: referenceArraySchema,
  },
} as const;

const studentReviewSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "student_ref",
    "student_name",
    "at_the_time",
    "recorded_reaction",
    "instructor_response",
    "good_response",
    "concerns",
    "next_care",
    "cue_idea",
    "follow_up_idea",
    "experience_idea",
    "references",
  ],
  properties: {
    student_ref: { type: "string" },
    student_name: { type: "string" },
    at_the_time: { type: "string" },
    recorded_reaction: { type: "string" },
    instructor_response: { type: "string" },
    good_response: { type: "string" },
    concerns: { type: "string" },
    next_care: { type: "string" },
    cue_idea: { type: "string" },
    follow_up_idea: { type: "string" },
    experience_idea: { type: "string" },
    references: referenceArraySchema,
  },
} as const;

const singleLessonSchema = {
  type: ["object", "null"],
  additionalProperties: false,
  required: [
    "good_points",
    "improvement_points",
    "lesson_structure_and_flow",
    "block_pose_selection",
    "sequence_connections",
    "intensity_flow",
    "time_allocation",
    "cueing_and_voice",
    "field_adaptation",
    "student_reviews",
    "customer_communication",
    "next_improvements",
    "new_experiments",
  ],
  properties: {
    good_points: sectionSchema,
    improvement_points: sectionSchema,
    lesson_structure_and_flow: sectionSchema,
    block_pose_selection: sectionSchema,
    sequence_connections: sectionSchema,
    intensity_flow: sectionSchema,
    time_allocation: sectionSchema,
    cueing_and_voice: sectionSchema,
    field_adaptation: sectionSchema,
    student_reviews: { type: "array", maxItems: 24, items: studentReviewSchema },
    customer_communication: sectionSchema,
    next_improvements: sectionSchema,
    new_experiments: sectionSchema,
  },
} as const;

const periodReviewSchema = {
  type: ["object", "null"],
  additionalProperties: false,
  required: [
    "stable_structure",
    "variable_structure",
    "recent_improvements",
    "repeated_challenges",
    "frequently_used_blocks",
    "retired_content",
    "timing_trends",
    "cueing_changes",
    "student_response_changes",
    "repeated_student_care",
    "student_reviews",
    "customer_followup_strengths",
    "retention_experience",
    "next_few_lessons",
  ],
  properties: {
    stable_structure: sectionSchema,
    variable_structure: sectionSchema,
    recent_improvements: sectionSchema,
    repeated_challenges: sectionSchema,
    frequently_used_blocks: sectionSchema,
    retired_content: sectionSchema,
    timing_trends: sectionSchema,
    cueing_changes: sectionSchema,
    student_response_changes: sectionSchema,
    repeated_student_care: sectionSchema,
    student_reviews: { type: "array", maxItems: 24, items: studentReviewSchema },
    customer_followup_strengths: sectionSchema,
    retention_experience: sectionSchema,
    next_few_lessons: sectionSchema,
  },
} as const;

export const aiReviewOutputSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "review_kind",
    "overall_assessment",
    "key_strength",
    "priority_improvement",
    "single_lesson",
    "period_review",
    "data_notes",
    "next_actions",
    "contradictions",
  ],
  properties: {
    review_kind: { type: "string", enum: ["lesson", "period"] },
    overall_assessment: { type: "string" },
    key_strength: findingSchema,
    priority_improvement: findingSchema,
    single_lesson: singleLessonSchema,
    period_review: periodReviewSchema,
    data_notes: { type: "array", maxItems: 8, items: { type: "string" } },
    next_actions: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "detail", "priority", "references"],
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          references: referenceArraySchema,
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
          references: referenceArraySchema,
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

export function reserveReviewCost(model: ReviewPricedModel, evidenceCharacters: number, maxOutputTokens = 12_000) {
  const estimatedInputTokens = Math.ceil(evidenceCharacters / 3.2) + 2_500;
  return Math.max(0.01, estimateReviewCost(model, { inputTokens: estimatedInputTokens, cachedInputTokens: 0, outputTokens: maxOutputTokens }));
}

export function sourceFingerprint(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

export function parseAndValidateAiReview(outputText: string, index: AiReviewReferenceIndex, expectedKind?: "lesson" | "period"): AiReviewOutput {
  const value = JSON.parse(outputText) as AiReviewOutput;
  if (!value || typeof value !== "object" || !["lesson", "period"].includes(value.review_kind)) throw new Error("review_output_invalid");
  if (expectedKind && value.review_kind !== expectedKind) throw new Error("review_kind_invalid");
  if (value.review_kind === "lesson" && (!value.single_lesson || value.period_review !== null)) throw new Error("review_scope_output_invalid");
  if (value.review_kind === "period" && (!value.period_review || value.single_lesson !== null)) throw new Error("review_scope_output_invalid");
  if (!Array.isArray(value.next_actions) || !Array.isArray(value.contradictions) || !Array.isArray(value.data_notes)) throw new Error("review_output_invalid");
  validateReviewReferences(value, index);
  for (const student of reviewStudents(value)) {
    const target = index.student[student.student_ref];
    if (!target) throw new Error("review_student_reference_not_allowed");
    student.student_name = target.label;
  }
  return value;
}

export function buildReviewForStorage(review: AiReviewOutput) {
  return {
    ...review,
    lesson_plan_analysis: [],
    block_analysis: [],
    student_safety_analysis: [],
    data_quality: {
      summary: review.data_notes[0] ?? "今回の判断に必要な範囲で記録を確認しました。",
      limitations: review.data_notes,
      completeness_notes: [],
    },
    axes: [],
  };
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

function collectReviewReferences(value: unknown) {
  const references: AiReviewReference[] = [];
  const visit = (entry: unknown) => {
    if (Array.isArray(entry)) {
      entry.forEach(visit);
      return;
    }
    if (!entry || typeof entry !== "object") return;
    const row = entry as Record<string, unknown>;
    if (typeof row.type === "string" && typeof row.ref === "string" && ["plan", "block", "student", "record", "schedule"].includes(row.type)) {
      references.push({ type: row.type as AiReviewReferenceType, ref: row.ref });
      return;
    }
    Object.values(row).forEach(visit);
  };
  visit(value);
  const seen = new Set<string>();
  return references.filter((reference) => {
    const key = `${reference.type}:${reference.ref}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function reviewStudents(review: AiReviewOutput) {
  return review.single_lesson?.student_reviews ?? review.period_review?.student_reviews ?? [];
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
