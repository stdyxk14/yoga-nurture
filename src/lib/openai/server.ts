import OpenAI from "openai";

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
}

export const studentSuggestionModel = process.env.OPENAI_STUDENT_SUGGESTION_MODEL ?? "gpt-4.1-mini";
