export const radarSourceTypes = [
  "public_research",
  "medical_health",
  "yoga_organization",
  "yoga_expert",
  "general_article",
  "video",
  "social_signal",
] as const;

export type RadarSourceType = (typeof radarSourceTypes)[number];

export type StructuredRadarSearchItem = {
  source_url: string;
  title: string;
  source_name: string;
  author: string;
  published_on: string;
  language: "ja" | "en" | "other";
  item_type: RadarSourceType;
  summary: string;
  relevance_score: number;
  trust_score: number;
};

export type RadarFailure = {
  code: string;
  safeMessage: string;
  retryable: boolean;
};

export function classifyRadarFailure(error: unknown): RadarFailure {
  const status = typeof error === "object" && error && "status" in error
    ? Number((error as { status?: unknown }).status)
    : 0;
  const code = typeof error === "object" && error && "code" in error
    ? String((error as { code?: unknown }).code)
    : "";
  const message = error instanceof Error ? error.message : "";

  if (status === 429 || code === "rate_limit_exceeded") {
    return { code: "openai_429", safeMessage: "OpenAI Web Search rate limit reached.", retryable: true };
  }
  if (message.includes("RADAR_STRUCTURED_OUTPUT_INVALID")) {
    return { code: "invalid_ai_output", safeMessage: "The structured radar response was invalid.", retryable: true };
  }
  if (message.includes("RADAR_NO_CITED_SOURCES")) {
    return { code: "missing_citations", safeMessage: "The radar response contained no verifiable cited sources.", retryable: true };
  }
  if (code === "ETIMEDOUT" || code === "ECONNABORTED" || /timeout|timed out|abort/i.test(message)) {
    return { code: "openai_timeout", safeMessage: "OpenAI Web Search timed out.", retryable: true };
  }
  return {
    code: status ? `openai_${status}` : "radar_error",
    safeMessage: "The radar refresh could not be completed.",
    retryable: false,
  };
}

export function parseRadarStructuredResponse(outputText: string): { items: StructuredRadarSearchItem[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new Error("RADAR_STRUCTURED_OUTPUT_INVALID");
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { items?: unknown }).items)) {
    throw new Error("RADAR_STRUCTURED_OUTPUT_INVALID");
  }
  const rawItems = (parsed as { items: unknown[] }).items;
  const items = rawItems.filter(isStructuredRadarSearchItem);
  if (items.length !== rawItems.length || items.length > 3) throw new Error("RADAR_STRUCTURED_OUTPUT_INVALID");
  return { items };
}

function isStructuredRadarSearchItem(value: unknown): value is StructuredRadarSearchItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.source_url === "string"
    && typeof item.title === "string"
    && typeof item.source_name === "string"
    && typeof item.author === "string"
    && typeof item.published_on === "string"
    && (item.language === "ja" || item.language === "en" || item.language === "other")
    && radarSourceTypes.includes(item.item_type as RadarSourceType)
    && typeof item.summary === "string"
    && typeof item.relevance_score === "number"
    && item.relevance_score >= 0
    && item.relevance_score <= 1
    && typeof item.trust_score === "number"
    && item.trust_score >= 0
    && item.trust_score <= 1;
}
