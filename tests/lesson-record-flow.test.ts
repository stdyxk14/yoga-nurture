import assert from "node:assert/strict";
import test from "node:test";
import {
  markUnconfirmedItemsAsPlanned,
  moveLessonExecutionItem,
  summarizeLessonExecution,
  type LessonRecordFlowItem,
} from "../src/lib/lesson-record-flow";

function planned(fieldId: string, order: number): LessonRecordFlowItem {
  return {
    fieldId,
    schedulePlanItemId: `plan-${fieldId}`,
    itemSource: "planned",
    sortOrder: order,
    plannedSortOrder: order,
    plannedMinutes: 10,
    actualMinutes: null,
    done: null,
    changeType: null,
  };
}

test("adaptive lesson flow keeps each occurrence and summarizes the unsaved client state", () => {
  let items = markUnconfirmedItemsAsPlanned([planned("a", 0), planned("b", 1), planned("c", 2), planned("d", 3)]);
  items = items.map((item) => item.fieldId === "b" ? { ...item, changeType: "skipped", done: false, actualMinutes: null } : item);
  items = items.map((item) => item.fieldId === "c" ? { ...item, changeType: "adjusted", actualMinutes: 15 } : item);
  items = items.map((item) => item.fieldId === "d" ? { ...item, changeType: "replaced", done: false, actualMinutes: null } : item);
  items.push({ fieldId: "library-1", schedulePlanItemId: null, itemSource: "library", sortOrder: 4, plannedSortOrder: null, plannedMinutes: 8, actualMinutes: 8, done: true, changeType: "added" });
  items.push({ fieldId: "improvised-1", schedulePlanItemId: null, itemSource: "improvised", sortOrder: 5, plannedSortOrder: null, plannedMinutes: 0, actualMinutes: 5, done: true, changeType: "added" });
  items.push({ fieldId: "replacement-1", schedulePlanItemId: null, itemSource: "library", sortOrder: 6, plannedSortOrder: null, plannedMinutes: 6, actualMinutes: 6, done: true, changeType: "added" });

  const reordered = moveLessonExecutionItem(items, "c", 0);
  const summary = summarizeLessonExecution(reordered);

  assert.equal(reordered[0].fieldId, "c");
  assert.equal(reordered.find((item) => item.fieldId === "a")?.changeType, "adjusted");
  assert.deepEqual(reordered.map((item) => item.fieldId), ["c", "a", "b", "d", "library-1", "improvised-1", "replacement-1"]);
  assert.deepEqual(summary, {
    plannedCount: 4,
    asPlannedCount: 0,
    adjustedCount: 2,
    skippedCount: 1,
    replacedCount: 1,
    addedCount: 3,
    unconfirmedCount: 0,
    plannedMinutes: 40,
    actualMinutes: 44,
  });
});

test("bulk confirmation only changes unconfirmed planned items", () => {
  const adjusted = { ...planned("adjusted", 0), done: true, changeType: "adjusted" as const, actualMinutes: 13 };
  const extra: LessonRecordFlowItem = { fieldId: "extra", schedulePlanItemId: null, itemSource: "improvised", sortOrder: 2, plannedSortOrder: null, plannedMinutes: 0, actualMinutes: 4, done: true, changeType: "added" };
  const result = markUnconfirmedItemsAsPlanned([adjusted, planned("new", 1), extra]);

  assert.equal(result[0], adjusted);
  assert.equal(result[1].changeType, "as_planned");
  assert.equal(result[1].actualMinutes, 10);
  assert.equal(result[2], extra);
});
