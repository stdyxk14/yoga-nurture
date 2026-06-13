export type AiFeatureSettings = {
  enabled: boolean;
  student: boolean;
  lessonPlan: boolean;
  block: boolean;
  lessonRecord: boolean;
};

const defaultAiSettings: AiFeatureSettings = {
  enabled: true,
  student: true,
  lessonPlan: true,
  block: true,
  lessonRecord: true,
};

export function getAiSettings(value: unknown): AiFeatureSettings {
  if (!value || typeof value !== "object") return defaultAiSettings;
  const settings = value as Partial<Record<keyof AiFeatureSettings, unknown>>;

  return {
    enabled: toBoolean(settings.enabled, defaultAiSettings.enabled),
    student: toBoolean(settings.student, defaultAiSettings.student),
    lessonPlan: toBoolean(settings.lessonPlan, defaultAiSettings.lessonPlan),
    block: toBoolean(settings.block, defaultAiSettings.block),
    lessonRecord: toBoolean(settings.lessonRecord, defaultAiSettings.lessonRecord),
  };
}

export function isAiFeatureEnabled(settings: AiFeatureSettings, targetType: "student" | "lesson_plan" | "block" | "lesson_record") {
  if (!settings.enabled) return false;
  if (targetType === "student") return settings.student;
  if (targetType === "lesson_plan") return settings.lessonPlan;
  if (targetType === "block") return settings.block;
  return settings.lessonRecord;
}

function toBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}
