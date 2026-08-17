import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLessonCoverage,
  classifyLessonCoverage,
  summarizeRecentLessonCoverage,
  type LessonCoverageSourceItem,
  type LessonCoverageSourceLesson,
} from "../src/lib/lesson-coverage.ts";

function coverageItem(id: string, overrides: Partial<LessonCoverageSourceItem> = {}): LessonCoverageSourceItem {
  return {
    id,
    blockTemplateId: `block-${id}`,
    itemSource: "planned",
    changeType: "as_planned",
    done: true,
    actualDurationMinutes: null,
    displayNameSnapshot: "事前準備",
    categoryNameSnapshot: null,
    subcategoryNameSnapshot: null,
    purposeSnapshot: null,
    tagsSnapshot: [],
    block: null,
    ...overrides,
  };
}

function coverageLesson(id: string, date: string, items: LessonCoverageSourceItem[], overrides: Partial<LessonCoverageSourceLesson> = {}): LessonCoverageSourceLesson {
  return {
    lessonRecordId: `record-${id}`,
    scheduleId: `schedule-${id}`,
    lessonName: `レッスン${id}`,
    dateIso: `${date}T10:00:00+09:00`,
    scheduleStatus: "recorded",
    closed: false,
    items,
    ...overrides,
  };
}

test("coverage classification supports multiple matches and observed Japanese variants", () => {
  assert.deepEqual(classifyLessonCoverage({
    displayNameSnapshot: "肩甲骨と胸郭をひらく",
    purposeSnapshot: "呼吸へ集中する",
  }), ["breath_focus", "neck_shoulders", "chest_back"]);

  assert.deepEqual(classifyLessonCoverage({
    displayNameSnapshot: "正座でCAT＆COW",
    purposeSnapshot: "胸椎の伸展",
  }), ["chest_back", "spine_core"]);

  assert.deepEqual(classifyLessonCoverage({ displayNameSnapshot: "シャヴァ―サナ", categoryNameSnapshot: "クールダウン" }), ["relax_recovery"]);
  assert.deepEqual(classifyLessonCoverage({ displayNameSnapshot: "スーリャナマスカーラA" }), ["whole_body_flow"]);
  assert.deepEqual(classifyLessonCoverage({ displayNameSnapshot: "足首のストレッチ" }), ["legs_feet"]);
  assert.deepEqual(classifyLessonCoverage({ displayNameSnapshot: "事前準備" }), ["unclassified"]);
});

test("coverage aggregation keeps only completed, open, explicitly executed occurrences", () => {
  const repeated = coverageItem("hip-1", { displayNameSnapshot: "股関節ストレッチ", blockTemplateId: "hip-block", actualDurationMinutes: 6 });
  const report = buildLessonCoverage([
    coverageLesson("included", "2026-08-10", [
      coverageItem("legacy-done", { displayNameSnapshot: "完全呼吸法", changeType: null, done: true, actualDurationMinutes: 5 }),
      coverageItem("skipped", { displayNameSnapshot: "首のストレッチ", changeType: "skipped", done: false }),
      coverageItem("unconfirmed", { displayNameSnapshot: "肩まわり", changeType: null, done: null }),
      coverageItem("replacement-source", { displayNameSnapshot: "プランク", changeType: "replaced", done: true }),
      coverageItem("replacement-target", { displayNameSnapshot: "肩甲骨ほぐし", itemSource: "library", changeType: "added", done: true, actualDurationMinutes: 4 }),
      coverageItem("improvised", { displayNameSnapshot: "独自シークエンス", blockTemplateId: null, itemSource: "improvised", changeType: "added", done: true }),
      repeated,
      { ...repeated, id: "hip-2" },
    ]),
    coverageLesson("empty-completed", "2026-08-11", []),
    coverageLesson("draft", "2026-08-12", [coverageItem("draft-item", { displayNameSnapshot: "呼吸法" })], { scheduleStatus: "record_pending" }),
    coverageLesson("closed", "2026-08-13", [coverageItem("closed-item", { displayNameSnapshot: "呼吸法" })], { closed: true }),
  ]);

  assert.equal(report.totalLessons, 2);
  assert.equal(report.totalExecutedItems, 5);
  assert.deepEqual(report.occurrences.map((item) => item.id), ["legacy-done", "replacement-target", "improvised", "hip-1", "hip-2"]);
  assert.equal(report.summary.find((row) => row.key === "breath_focus")?.occurrenceCount, 1);
  assert.deepEqual(report.summary.find((row) => row.key === "hips_pelvis") && {
    occurrenceCount: report.summary.find((row) => row.key === "hips_pelvis")!.occurrenceCount,
    lessonCount: report.summary.find((row) => row.key === "hips_pelvis")!.lessonCount,
    lessonRate: report.summary.find((row) => row.key === "hips_pelvis")!.lessonRate,
  }, { occurrenceCount: 2, lessonCount: 1, lessonRate: 50 });
  assert.equal(report.summary.at(-1)?.key, "unclassified");
  assert.deepEqual(report.unclassifiedBlocks.map((block) => ({ name: block.blockName, count: block.useCount })), [{ name: "独自シークエンス", count: 1 }]);
});

test("coverage heatmaps keep the latest twelve lessons and aggregate months without losing duplicate blocks", () => {
  const lessons = Array.from({ length: 13 }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return coverageLesson(String(index + 1), `2026-08-${day}`, [coverageItem(`item-${index + 1}`, { displayNameSnapshot: "首のストレッチ", blockTemplateId: "same-block" })]);
  });
  const report = buildLessonCoverage(lessons);

  assert.equal(report.lessons.length, 12);
  assert.equal(report.lessons[0].date, "2026-08-02");
  assert.equal(report.lessons.at(-1)?.date, "2026-08-13");
  assert.equal(report.months.length, 1);
  assert.equal(report.months[0].counts.neck_shoulders, 13);
  assert.equal(report.occurrences.filter((item) => item.blockTemplateId === "same-block").length, 13);
  assert.equal(report.trends.consecutive.find((row) => row.key === "neck_shoulders")?.lessonCount, 13);
});

test("recent coverage summary uses the latest five lessons and keeps unclassified occurrences", () => {
  const report = buildLessonCoverage([
    coverageLesson("1", "2026-08-01", [coverageItem("breath-1", { displayNameSnapshot: "呼吸法" })]),
    coverageLesson("2", "2026-08-02", [coverageItem("breath-2", { displayNameSnapshot: "呼吸法" })]),
    coverageLesson("3", "2026-08-03", [coverageItem("shoulder-3", { displayNameSnapshot: "肩まわり" })]),
    coverageLesson("4", "2026-08-04", [coverageItem("shoulder-4", { displayNameSnapshot: "肩まわり" })]),
    coverageLesson("5", "2026-08-05", [
      coverageItem("shoulder-5", { displayNameSnapshot: "肩まわり" }),
      coverageItem("unclassified-5", { displayNameSnapshot: "独自シークエンス" }),
    ]),
    coverageLesson("6", "2026-08-06", [coverageItem("shoulder-6", { displayNameSnapshot: "肩まわり" })]),
  ]);
  const recent = summarizeRecentLessonCoverage(report);

  assert.equal(recent.lessonCount, 5);
  assert.deepEqual(recent.mostUsed.map((row) => [row.key, row.occurrenceCount]), [["neck_shoulders", 4]]);
  assert.equal(recent.absent.some((row) => row.key === "balance"), true);
  assert.equal(recent.consecutive.find((row) => row.key === "neck_shoulders")?.lessonCount, 4);
  assert.equal(recent.unclassifiedCount, 1);
});
