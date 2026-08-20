export type LessonScriptAttendanceStatus = "present" | "cancelled" | "no_show";

export type LessonScriptAttendanceRow = {
  studentId: string;
  attendanceStatus: LessonScriptAttendanceStatus | null;
  record: {
    id: string;
    scheduleId: string | null;
    recordDate: string | null;
    schedule: {
      id: string;
      startsAt: string | null;
      status: string | null;
      hasActiveClosure: boolean;
    } | null;
  } | null;
};

export type LessonScriptTargetSchedule = {
  id: string;
  startsAt: string;
};

export type PastLessonAttendanceEntry<T extends LessonScriptAttendanceRow = LessonScriptAttendanceRow> = {
  row: T;
  lessonKey: string;
  dateIso: string;
};

export function getPastLessonAttendanceEntries<T extends LessonScriptAttendanceRow>(
  rows: readonly T[],
  target: LessonScriptTargetSchedule,
): PastLessonAttendanceEntry<T>[] {
  const targetStartsAt = Date.parse(target.startsAt);
  const targetDate = tokyoDateKey(target.startsAt);
  if (!Number.isFinite(targetStartsAt) || !targetDate) return [];

  const entries: PastLessonAttendanceEntry<T>[] = [];

  for (const row of rows) {
    if (row.attendanceStatus !== "present" || !row.studentId || !row.record?.id) continue;

    const { record } = row;
    if (record.scheduleId) {
      const schedule = record.schedule;
      if (
        !schedule
        || schedule.id !== record.scheduleId
        || schedule.id === target.id
        || schedule.status !== "recorded"
        || schedule.hasActiveClosure
        || !schedule.startsAt
      ) {
        continue;
      }

      const startsAt = Date.parse(schedule.startsAt);
      if (!Number.isFinite(startsAt) || startsAt >= targetStartsAt) continue;
      entries.push({ row, lessonKey: `schedule:${schedule.id}`, dateIso: schedule.startsAt });
      continue;
    }

    const recordDate = record.recordDate?.slice(0, 10) ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(recordDate) || recordDate >= targetDate) continue;
    entries.push({ row, lessonKey: `legacy:${record.id}`, dateIso: `${recordDate}T00:00:00+09:00` });
  }

  return entries;
}

export function calculatePastAttendanceCounts(
  rows: readonly LessonScriptAttendanceRow[],
  target: LessonScriptTargetSchedule,
) {
  const lessonsByStudent = new Map<string, Set<string>>();

  for (const { row, lessonKey } of getPastLessonAttendanceEntries(rows, target)) {
    const lessons = lessonsByStudent.get(row.studentId) ?? new Set<string>();
    lessons.add(lessonKey);
    lessonsByStudent.set(row.studentId, lessons);
  }

  return new Map(Array.from(lessonsByStudent, ([studentId, lessons]) => [studentId, lessons.size]));
}

export function filterPresentScriptParticipants<
  T extends { attendanceStatus: LessonScriptAttendanceStatus },
>(participants: readonly T[]) {
  return participants.filter((participant) => participant.attendanceStatus === "present");
}

function tokyoDateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
