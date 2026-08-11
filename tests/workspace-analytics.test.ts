import assert from "node:assert/strict";
import test from "node:test";
import { calculateGoodRate } from "../src/lib/blocks";
import { summarizeLessonRecordDiff } from "../src/lib/lesson-records";
import { calculateClosureMetrics, calculatePlannedChangeRate, resolveReportPeriod } from "../src/lib/reports";
import { getStudentPayload, matchesStudentFilter } from "../src/lib/students";

test("custom report periods use inclusive Tokyo dates and an equally long previous period", () => {
  const result = resolveReportPeriod({
    period: "custom",
    from: "2026-07-01",
    to: "2026-07-03",
    now: new Date("2026-08-11T03:00:00Z"),
  });

  assert.equal(result.error, undefined);
  assert.deepEqual(result.period && {
    startDate: result.period.startDate,
    endDate: result.period.endDate,
    startIso: result.period.startIso,
    endExclusiveIso: result.period.endExclusiveIso,
    previousStartDate: result.period.previousStartDate,
    previousEndDate: result.period.previousEndDate,
  }, {
    startDate: "2026-07-01",
    endDate: "2026-07-03",
    startIso: "2026-07-01T00:00:00+09:00",
    endExclusiveIso: "2026-07-04T00:00:00+09:00",
    previousStartDate: "2026-06-28",
    previousEndDate: "2026-06-30",
  });
});

test("invalid custom periods return a user-facing validation error", () => {
  assert.match(resolveReportPeriod({ period: "custom", from: "2026-08-12", to: "2026-08-11" }).error ?? "", /開始日/);
  assert.match(resolveReportPeriod({ period: "custom", from: "", to: "2026-08-11" }).error ?? "", /入力/);
});

test("month comparison uses the full previous calendar month", () => {
  const result = resolveReportPeriod({ period: "month", now: new Date("2026-08-11T03:00:00Z") });
  assert.equal(result.period?.startDate, "2026-08-01");
  assert.equal(result.period?.endDate, "2026-08-11");
  assert.equal(result.period?.previousStartDate, "2026-07-01");
  assert.equal(result.period?.previousEndDate, "2026-07-31");
});

test("planned change rate excludes unconfirmed and legacy unclassified items", () => {
  const result = calculatePlannedChangeRate([
    { item_source: "planned", change_type: "as_planned", done: true },
    { item_source: "planned", change_type: "adjusted", done: true },
    { item_source: "planned", change_type: "skipped", done: false },
    { item_source: "planned", change_type: "replaced", done: false },
    { item_source: "planned", change_type: null, done: true },
    { item_source: "planned", change_type: null, done: null },
    { item_source: "library", change_type: "added", done: true },
  ]);

  assert.deepEqual(result, { numerator: 3, denominator: 4, rate: 75 });
});

test("closure rate uses only held and closed past schedules", () => {
  const now = new Date("2026-08-12T12:00:00+09:00");
  const result = calculateClosureMetrics([
    { startsAt: "2026-08-10T10:00:00+09:00", status: "recorded", closed: false },
    { startsAt: "2026-08-09T10:00:00+09:00", status: "record_pending", closed: true },
    { startsAt: "2026-08-08T10:00:00+09:00", status: "record_pending", closed: false },
    { startsAt: "2026-08-20T10:00:00+09:00", status: "scheduled", closed: true },
  ], now);

  assert.deepEqual(result, {
    closedCount: 1,
    heldCount: 1,
    closeRate: 50,
    unclassifiedPastCount: 1,
    futureClosedCount: 1,
  });
});

test("a closed lesson is a lesson-level state and does not convert participant cancellations", () => {
  const result = calculateClosureMetrics([
    { startsAt: "2026-08-10T10:00:00+09:00", status: "record_pending", closed: true },
  ], new Date("2026-08-12T12:00:00+09:00"));
  assert.equal(result.closedCount, 1);
  assert.equal(result.heldCount, 0);
  assert.equal(result.closeRate, 100);
});

test("unconfirmed planned items are not also counted as skipped or adjusted", () => {
  const summary = summarizeLessonRecordDiff([
    { item_source: "planned", change_type: "skipped", done: null },
    { item_source: "planned", change_type: null, done: true },
    { item_source: "library", change_type: "added", done: null },
  ]);
  assert.equal(summary.unconfirmed, 1);
  assert.equal(summary.skipped, 0);
  assert.equal(summary.added, 0);
  assert.equal(summary.legacy, 1);
});

test("good rate excludes unevaluated reactions instead of treating them as zero", () => {
  assert.equal(calculateGoodRate(1, 1), 100);
  assert.equal(calculateGoodRate(1, 2), 50);
  assert.equal(calculateGoodRate(0, 0), null);
});

test("student filters distinguish follow-up, caution, recent, no-attendance and archive", () => {
  const now = Date.parse("2026-08-11T12:00:00+09:00");
  const base = { archived: false, pendingFollowUpCount: 0, caution: "", attendedCount: 2, lastAttendedAt: "2026-08-01T10:00:00+09:00", nextScheduledAt: null };

  assert.equal(matchesStudentFilter(base, "recent", now), true);
  assert.equal(matchesStudentFilter({ ...base, pendingFollowUpCount: 1 }, "followup", now), true);
  assert.equal(matchesStudentFilter({ ...base, caution: "膝に注意" }, "caution", now), true);
  assert.equal(matchesStudentFilter({ ...base, nextScheduledAt: "2026-08-18T10:00:00+09:00" }, "scheduled", now), true);
  assert.equal(matchesStudentFilter({ ...base, attendedCount: 0, lastAttendedAt: null }, "no-attendance", now), true);
  assert.equal(matchesStudentFilter({ ...base, archived: true }, "all", now), false);
  assert.equal(matchesStudentFilter({ ...base, archived: true }, "archived", now), true);
});

test("new students default to unknown age instead of a fabricated age band", () => {
  const formData = new FormData();
  formData.set("name", "テスト生徒");
  const result = getStudentPayload(formData);
  if (!("payload" in result) || !result.payload) assert.fail("student payload was not created");
  assert.equal(result.payload.age_group, "年齢不明");
});
