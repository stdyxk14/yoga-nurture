export type LessonRecordChangeType = "as_planned" | "adjusted" | "skipped" | "replaced" | "added";

export type LessonRecordChangeReasonCode =
  | "student_reaction"
  | "pain_safety"
  | "beginner_level"
  | "advanced_level"
  | "fatigue_focus"
  | "time_shortage"
  | "extra_time"
  | "student_request"
  | "space_equipment"
  | "other";

export const lessonRecordChangeReasons: Array<{ code: LessonRecordChangeReasonCode; label: string }> = [
  { code: "student_reaction", label: "生徒の反応" },
  { code: "pain_safety", label: "痛み・安全面" },
  { code: "beginner_level", label: "初心者が多い" },
  { code: "advanced_level", label: "レベルが高い" },
  { code: "fatigue_focus", label: "疲労・集中力" },
  { code: "time_shortage", label: "時間不足" },
  { code: "extra_time", label: "時間に余裕" },
  { code: "student_request", label: "生徒からの要望" },
  { code: "space_equipment", label: "会場・設備" },
  { code: "other", label: "その他" },
];

export type LessonRecordFlowItem = {
  fieldId: string;
  schedulePlanItemId: string | null;
  itemSource: "planned" | "library" | "improvised";
  sortOrder: number;
  plannedSortOrder: number | null;
  plannedMinutes: number;
  actualMinutes: number | null;
  done: boolean | null;
  changeType: LessonRecordChangeType | null;
};

export type LessonExecutionSummary = {
  plannedCount: number;
  asPlannedCount: number;
  adjustedCount: number;
  skippedCount: number;
  replacedCount: number;
  addedCount: number;
  unconfirmedCount: number;
  plannedMinutes: number;
  actualMinutes: number;
};

export function markItemAsPlanned<T extends LessonRecordFlowItem>(item: T): T {
  if (item.itemSource !== "planned") return item;
  return {
    ...item,
    changeType: "as_planned",
    done: true,
    actualMinutes: item.plannedMinutes,
  };
}

export function markUnconfirmedItemsAsPlanned<T extends LessonRecordFlowItem>(items: T[]): T[] {
  return items.map((item) => item.itemSource === "planned" && item.done === null ? markItemAsPlanned(item) : item);
}

export function summarizeLessonExecution(items: LessonRecordFlowItem[]): LessonExecutionSummary {
  const summary: LessonExecutionSummary = {
    plannedCount: 0,
    asPlannedCount: 0,
    adjustedCount: 0,
    skippedCount: 0,
    replacedCount: 0,
    addedCount: 0,
    unconfirmedCount: 0,
    plannedMinutes: 0,
    actualMinutes: 0,
  };

  for (const item of items) {
    if (item.itemSource === "planned") {
      summary.plannedCount += 1;
      summary.plannedMinutes += item.plannedMinutes;
      if (item.done === null) summary.unconfirmedCount += 1;
      if (item.changeType === "as_planned") summary.asPlannedCount += 1;
      if (item.changeType === "adjusted") summary.adjustedCount += 1;
      if (item.changeType === "skipped") summary.skippedCount += 1;
      if (item.changeType === "replaced") summary.replacedCount += 1;
    } else {
      summary.addedCount += 1;
    }
    if (item.done === true && item.actualMinutes !== null) summary.actualMinutes += item.actualMinutes;
  }

  return summary;
}

export function moveLessonExecutionItem<T extends LessonRecordFlowItem>(items: T[], fieldId: string, targetIndex: number): T[] {
  const currentIndex = items.findIndex((item) => item.fieldId === fieldId);
  if (currentIndex < 0) return items;
  const boundedTarget = Math.max(0, Math.min(targetIndex, items.length - 1));
  if (currentIndex === boundedTarget) return items;

  const next = [...items];
  const [moved] = next.splice(currentIndex, 1);
  next.splice(boundedTarget, 0, moved);

  const originalPlannedOrder = items
    .filter((item) => item.itemSource === "planned")
    .toSorted((a, b) => (a.plannedSortOrder ?? 0) - (b.plannedSortOrder ?? 0))
    .map((item) => item.schedulePlanItemId ?? item.fieldId);
  const actualPlannedOrder = next
    .filter((item) => item.itemSource === "planned")
    .map((item) => item.schedulePlanItemId ?? item.fieldId);

  return next.map((item, index) => {
    if (item.itemSource !== "planned" || item.changeType === "skipped" || item.changeType === "replaced") {
      return { ...item, sortOrder: index };
    }
    const plannedIndex = actualPlannedOrder.indexOf(item.schedulePlanItemId ?? item.fieldId);
    const orderChanged = originalPlannedOrder[plannedIndex] !== actualPlannedOrder[plannedIndex];
    if (!orderChanged) return { ...item, sortOrder: index };
    return {
      ...item,
      sortOrder: index,
      changeType: "adjusted",
      done: true,
      actualMinutes: item.actualMinutes ?? item.plannedMinutes,
    };
  });
}
