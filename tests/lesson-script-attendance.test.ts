import assert from "node:assert/strict";
import test from "node:test";
import {
  calculatePastAttendanceCounts,
  filterPresentScriptParticipants,
  type LessonScriptAttendanceRow,
} from "../src/lib/lesson-script-attendance.ts";

const target = { id: "schedule-0815", startsAt: "2026-08-15T10:00:00+09:00" };

function row({
  studentId = "student-a",
  attendanceStatus = "present",
  recordId,
  scheduleId,
  startsAt,
  status = "recorded",
  closed = false,
  recordDate = startsAt?.slice(0, 10) ?? null,
}: {
  studentId?: string;
  attendanceStatus?: LessonScriptAttendanceRow["attendanceStatus"];
  recordId: string;
  scheduleId: string | null;
  startsAt?: string;
  status?: string;
  closed?: boolean;
  recordDate?: string | null;
}): LessonScriptAttendanceRow {
  return {
    studentId,
    attendanceStatus,
    record: {
      id: recordId,
      scheduleId,
      recordDate,
      schedule: scheduleId
        ? { id: scheduleId, startsAt: startsAt ?? null, status, hasActiveClosure: closed }
        : null,
    },
  };
}

test("lesson scripts count only unique, completed attendance before the target schedule", () => {
  const rows: LessonScriptAttendanceRow[] = [
    row({ recordId: "record-current", scheduleId: target.id, startsAt: target.startsAt }),
    row({ recordId: "record-prior", scheduleId: "schedule-0810", startsAt: "2026-08-10T10:00:00+09:00" }),
    row({ recordId: "record-prior-duplicate", scheduleId: "schedule-0810", startsAt: "2026-08-10T10:00:00+09:00" }),
    row({ recordId: "record-draft", scheduleId: "schedule-0811", startsAt: "2026-08-11T10:00:00+09:00", status: "record_pending" }),
    row({ recordId: "record-closed", scheduleId: "schedule-0812", startsAt: "2026-08-12T10:00:00+09:00", closed: true }),
    row({ recordId: "record-cancelled", scheduleId: "schedule-0813", startsAt: "2026-08-13T10:00:00+09:00", attendanceStatus: "cancelled" }),
    row({ recordId: "record-no-show", scheduleId: "schedule-0814", startsAt: "2026-08-14T10:00:00+09:00", attendanceStatus: "no_show" }),
    row({ recordId: "record-future", scheduleId: "schedule-0820", startsAt: "2026-08-20T10:00:00+09:00" }),
    row({ recordId: "legacy-prior", scheduleId: null, recordDate: "2026-08-14" }),
    row({ recordId: "legacy-prior", scheduleId: null, recordDate: "2026-08-14" }),
    row({ recordId: "legacy-same-day", scheduleId: null, recordDate: "2026-08-15" }),
    row({ studentId: "student-b", recordId: "record-b-prior", scheduleId: "schedule-0808", startsAt: "2026-08-08T10:00:00+09:00" }),
  ];

  const counts = calculatePastAttendanceCounts(rows, target);
  assert.equal(counts.get("student-a"), 2);
  assert.equal(counts.get("student-b"), 1);
});

test("a completed target lesson is excluded from its own script and included in a later script", () => {
  const rows = [row({ recordId: "record-current", scheduleId: target.id, startsAt: target.startsAt })];
  const draftRows = [row({ recordId: "record-current-draft", scheduleId: target.id, startsAt: target.startsAt, status: "record_pending" })];

  assert.equal(calculatePastAttendanceCounts(rows, target).get("student-a") ?? 0, 0);
  assert.equal(calculatePastAttendanceCounts(draftRows, target).get("student-a") ?? 0, 0);
  assert.equal(
    calculatePastAttendanceCounts(rows, { id: "schedule-0820", startsAt: "2026-08-20T10:00:00+09:00" }).get("student-a"),
    1,
  );
});

test("lesson scripts show only participants whose current schedule status is present", () => {
  const participants = [
    { id: "a", attendanceStatus: "present" as const },
    { id: "b", attendanceStatus: "cancelled" as const },
    { id: "c", attendanceStatus: "no_show" as const },
  ];

  assert.deepEqual(filterPresentScriptParticipants(participants).map((participant) => participant.id), ["a"]);
});
