import { requireUserId } from "@/lib/students";

export type ReportPeriodKey = "week" | "month" | "3months" | "half" | "year" | "custom";

export type RatioRow = {
  label: string;
  count: number;
  percent: number;
};

export type ClassReportRow = {
  format: string;
  participants: number;
  femaleRate: number;
  maleRate: number;
  topAgeGroup: string;
  cancelRate: number;
};

export type PlanReportRow = {
  id: string;
  name: string;
  lessonCount: number;
  participants: number;
  cancelRate: number;
  averageParticipants: number;
  latestDate: string;
};

export type BlockReportRow = {
  id: string;
  name: string;
  majorCategory: string;
  minorCategory: string;
  doneCount: number;
  goodRate: number;
  improvementCount: number;
  latestDate: string;
};

export type ReportData = {
  period: {
    key: ReportPeriodKey;
    label: string;
    startDate: string;
    endDate: string;
  };
  hasAnyData: boolean;
  error?: string;
  summary: {
    totalLessons: number;
    totalParticipants: number;
    uniqueStudents: number;
    cancelCount: number;
    noShowCount: number;
    cancelRate: number;
    recordedLessons: number;
    plannedParticipants: number;
  };
  attributes: {
    genderRows: RatioRow[];
    ageRows: RatioRow[];
  };
  attendance: {
    present: number;
    cancelled: number;
    noShow: number;
    cancelRate: number;
    noShowRate: number;
  };
  classRows: ClassReportRow[];
  planRows: PlanReportRow[];
  blockAnalysis: {
    mostUsed: BlockReportRow[];
    goodReaction: BlockReportRow[];
    unused: BlockReportRow[];
    improvementHeavy: BlockReportRow[];
  };
  hints: string[];
};

type RawStudent = {
  id: string;
  age_group: string | null;
  gender: string | null;
};

type RawParticipant = {
  student_id: string;
  attendance_status: AttendanceStatus;
  student?: RawStudent | null;
};

type RawSchedule = {
  id: string;
  lesson_plan_id: string | null;
  lesson_name: string;
  starts_at: string;
  format: LessonFormat | null;
  status: string;
  lesson_plan?: { id: string; name: string | null } | null;
  schedule_participants?: RawParticipant[];
};

type RawRecordStudent = {
  student_id: string;
  attendance_status: AttendanceStatus;
  student?: RawStudent | null;
};

type RawRecordBlock = {
  block_template_id: string;
  done: boolean;
  reaction: "good" | "neutral" | "poor" | null;
  improvement_memo: string | null;
  actual_duration_minutes: number | null;
  block?: {
    id: string;
    name: string | null;
    category?: { name: string | null } | null;
    subcategory?: { name: string | null } | null;
  } | null;
};

type RawRecord = {
  id: string;
  schedule_id: string | null;
  lesson_plan_id: string | null;
  lesson_name: string;
  record_date: string;
  schedule?: {
    id: string;
    starts_at: string | null;
    format: LessonFormat | null;
    lesson_plan?: { id: string; name: string | null } | null;
  } | null;
  lesson_record_students?: RawRecordStudent[];
  lesson_record_blocks?: RawRecordBlock[];
};

type RawBlockTemplate = {
  id: string;
  name: string;
  category?: { name: string | null } | null;
  subcategory?: { name: string | null } | null;
};

type AttendanceStatus = "present" | "cancelled" | "no_show";
type LessonFormat = "group" | "personal" | "online";

type AttendanceEntry = {
  studentId: string;
  status: AttendanceStatus;
  gender: string;
  ageGroup: string;
  format: LessonFormat | "";
  lessonPlanId: string | null;
  lessonPlanName: string;
  lessonName: string;
  date: string;
};

type PlanAggregate = {
  id: string;
  name: string;
  lessonIds: Set<string>;
  participants: number;
  cancelled: number;
  planned: number;
  latestTime: number;
};

type BlockAggregate = {
  id: string;
  name: string;
  majorCategory: string;
  minorCategory: string;
  doneCount: number;
  reactionCount: number;
  goodCount: number;
  improvementCount: number;
  latestTime: number;
};

const periodLabels: Record<ReportPeriodKey, string> = {
  week: "今週",
  month: "今月",
  "3months": "3か月",
  half: "半年",
  year: "1年",
  custom: "カスタム",
};

const formatLabels: Record<string, string> = {
  group: "グループ",
  personal: "パーソナル",
  online: "オンライン",
  "": "未設定",
};

const genderLabels: Record<string, string> = {
  female: "女性",
  male: "男性",
  other: "その他",
  prefer_not_to_say: "回答しない",
};

export function normalizeReportPeriod(value?: string | null): ReportPeriodKey {
  if (value === "week" || value === "month" || value === "3months" || value === "half" || value === "year" || value === "custom") {
    return value;
  }
  return "3months";
}

export async function getReportData(periodKey: ReportPeriodKey): Promise<ReportData> {
  try {
    return await fetchReportData(periodKey);
  } catch (error) {
    const period = buildPeriod(periodKey);
    return {
      period,
      hasAnyData: false,
      error: error instanceof Error ? error.message : "レポートデータを取得できませんでした。",
      summary: emptySummary(),
      attributes: { genderRows: [], ageRows: [] },
      attendance: { present: 0, cancelled: 0, noShow: 0, cancelRate: 0, noShowRate: 0 },
      classRows: [],
      planRows: [],
      blockAnalysis: { mostUsed: [], goodReaction: [], unused: [], improvementHeavy: [] },
      hints: [],
    };
  }
}

async function fetchReportData(periodKey: ReportPeriodKey): Promise<ReportData> {
  const period = buildPeriod(periodKey);
  const { supabase } = await requireUserId();

  const [studentsResult, schedulesResult, recordsResult, blocksResult] = await Promise.all([
    supabase.from("students").select("id,age_group,gender").eq("archived", false),
    supabase
      .from("schedules")
      .select(`
        id,
        lesson_plan_id,
        lesson_name,
        starts_at,
        format,
        status,
        lesson_plan:lesson_plans(id,name),
        schedule_participants(
          student_id,
          attendance_status,
          student:students(id,age_group,gender)
        )
      `)
      .gte("starts_at", period.startDate)
      .lte("starts_at", period.endDate)
      .order("starts_at", { ascending: true }),
    supabase
      .from("lesson_records")
      .select(`
        id,
        schedule_id,
        lesson_plan_id,
        lesson_name,
        record_date,
        schedule:schedules(id,starts_at,format,lesson_plan:lesson_plans(id,name)),
        lesson_record_students(
          student_id,
          attendance_status,
          student:students(id,age_group,gender)
        ),
        lesson_record_blocks(
          block_template_id,
          done,
          reaction,
          improvement_memo,
          actual_duration_minutes,
          block:block_templates(
            id,
            name,
            category:block_categories(name),
            subcategory:block_subcategories(name)
          )
        )
      `)
      .gte("record_date", period.startDate.slice(0, 10))
      .lte("record_date", period.endDate.slice(0, 10))
      .order("record_date", { ascending: true }),
    supabase
      .from("block_templates")
      .select("id,name,category:block_categories(name),subcategory:block_subcategories(name)")
      .eq("archived", false)
      .order("updated_at", { ascending: false }),
  ]);

  if (studentsResult.error) throw new Error(`生徒データを取得できませんでした: ${studentsResult.error.message}`);
  if (schedulesResult.error) throw new Error(`予定データを取得できませんでした: ${schedulesResult.error.message}`);
  if (recordsResult.error) throw new Error(`実施後記録を取得できませんでした: ${recordsResult.error.message}`);
  if (blocksResult.error) throw new Error(`ブロックデータを取得できませんでした: ${blocksResult.error.message}`);

  const students = (studentsResult.data ?? []) as RawStudent[];
  const schedules = (schedulesResult.data ?? []) as unknown as RawSchedule[];
  const records = (recordsResult.data ?? []) as unknown as RawRecord[];
  const allBlocks = (blocksResult.data ?? []) as unknown as RawBlockTemplate[];

  const recordedScheduleIds = new Set(records.map((record) => record.schedule_id).filter((id): id is string => Boolean(id)));
  const attendanceEntries = buildAttendanceEntries(records, schedules, recordedScheduleIds);
  const plannedParticipantCount = attendanceEntries.length;
  const presentEntries = attendanceEntries.filter((entry) => entry.status === "present");
  const cancelCount = attendanceEntries.filter((entry) => entry.status === "cancelled").length;
  const noShowCount = attendanceEntries.filter((entry) => entry.status === "no_show").length;
  const uniqueStudents = new Set(presentEntries.map((entry) => entry.studentId)).size;

  const blockRows = buildBlockRows(records, allBlocks);
  const summary = {
    totalLessons: schedules.length,
    totalParticipants: presentEntries.length,
    uniqueStudents,
    cancelCount,
    noShowCount,
    cancelRate: percent(cancelCount, plannedParticipantCount),
    recordedLessons: records.length,
    plannedParticipants: plannedParticipantCount,
  };

  const data: ReportData = {
    period,
    hasAnyData: Boolean(students.length || schedules.length || records.length || allBlocks.length),
    summary,
    attributes: {
      genderRows: buildRatioRows(students.map((student) => normalizeGender(student.gender))),
      ageRows: buildRatioRows(students.map((student) => normalizeAgeGroup(student.age_group))),
    },
    attendance: {
      present: presentEntries.length,
      cancelled: cancelCount,
      noShow: noShowCount,
      cancelRate: percent(cancelCount, plannedParticipantCount),
      noShowRate: percent(noShowCount, plannedParticipantCount),
    },
    classRows: buildClassRows(attendanceEntries),
    planRows: buildPlanRows(schedules, records, attendanceEntries),
    blockAnalysis: {
      mostUsed: blockRows.filter((row) => row.doneCount > 0).sort((a, b) => b.doneCount - a.doneCount).slice(0, 5),
      goodReaction: blockRows.filter((row) => row.doneCount > 0).sort((a, b) => b.goodRate - a.goodRate || b.doneCount - a.doneCount).slice(0, 5),
      unused: blockRows.filter((row) => row.doneCount === 0 || row.latestDate === "未使用").slice(0, 5),
      improvementHeavy: blockRows.filter((row) => row.improvementCount > 0).sort((a, b) => b.improvementCount - a.improvementCount).slice(0, 5),
    },
    hints: [],
  };

  data.hints = buildHints(data);
  return data;
}

function buildPeriod(key: ReportPeriodKey) {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);

  if (key === "week") {
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
  } else if (key === "month") {
    start.setDate(1);
  } else if (key === "half") {
    start.setMonth(start.getMonth() - 5, 1);
  } else if (key === "year") {
    start.setFullYear(start.getFullYear() - 1);
  } else {
    start.setMonth(start.getMonth() - 3);
  }

  start.setHours(0, 0, 0, 0);
  return {
    key,
    label: periodLabels[key],
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

function emptySummary() {
  return {
    totalLessons: 0,
    totalParticipants: 0,
    uniqueStudents: 0,
    cancelCount: 0,
    noShowCount: 0,
    cancelRate: 0,
    recordedLessons: 0,
    plannedParticipants: 0,
  };
}

function normalizeGender(value: string | null) {
  if (!value) return "未設定";
  return genderLabels[value] ?? value;
}

function normalizeAgeGroup(value: string | null) {
  return value?.trim() || "未設定";
}

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "未記録";
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "numeric", day: "numeric", timeZone: "Asia/Tokyo" }).format(new Date(value));
}

function buildRatioRows(values: string[]): RatioRow[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count, percent: percent(count, values.length) }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ja"));
}

function buildAttendanceEntries(records: RawRecord[], schedules: RawSchedule[], recordedScheduleIds: Set<string>) {
  const entries: AttendanceEntry[] = [];

  for (const record of records) {
    const lessonPlanId = record.lesson_plan_id ?? record.schedule?.lesson_plan?.id ?? null;
    const lessonPlanName = record.schedule?.lesson_plan?.name ?? "未設定";
    const format = record.schedule?.format ?? "";
    const date = record.schedule?.starts_at ?? record.record_date;

    for (const studentRow of record.lesson_record_students ?? []) {
      entries.push({
        studentId: studentRow.student_id,
        status: studentRow.attendance_status,
        gender: normalizeGender(studentRow.student?.gender ?? null),
        ageGroup: normalizeAgeGroup(studentRow.student?.age_group ?? null),
        format,
        lessonPlanId,
        lessonPlanName,
        lessonName: record.lesson_name,
        date,
      });
    }
  }

  for (const schedule of schedules) {
    if (recordedScheduleIds.has(schedule.id)) continue;
    for (const participant of schedule.schedule_participants ?? []) {
      entries.push({
        studentId: participant.student_id,
        status: participant.attendance_status,
        gender: normalizeGender(participant.student?.gender ?? null),
        ageGroup: normalizeAgeGroup(participant.student?.age_group ?? null),
        format: schedule.format ?? "",
        lessonPlanId: schedule.lesson_plan_id,
        lessonPlanName: schedule.lesson_plan?.name ?? "未設定",
        lessonName: schedule.lesson_name,
        date: schedule.starts_at,
      });
    }
  }

  return entries;
}

function buildClassRows(entries: AttendanceEntry[]): ClassReportRow[] {
  const formats: Array<LessonFormat | ""> = ["group", "personal", "online", ""];
  return formats
    .map((format) => {
      const rows = entries.filter((entry) => entry.format === format);
      if (!rows.length) return null;
      const present = rows.filter((row) => row.status === "present");
      const genderRows = buildRatioRows(present.map((row) => row.gender));
      const ageRows = buildRatioRows(present.map((row) => row.ageGroup));
      return {
        format: formatLabels[format],
        participants: present.length,
        femaleRate: genderRows.find((row) => row.label === "女性")?.percent ?? 0,
        maleRate: genderRows.find((row) => row.label === "男性")?.percent ?? 0,
        topAgeGroup: ageRows[0]?.label ?? "未設定",
        cancelRate: percent(rows.filter((row) => row.status === "cancelled").length, rows.length),
      };
    })
    .filter((row): row is ClassReportRow => Boolean(row));
}

function buildPlanRows(schedules: RawSchedule[], records: RawRecord[], entries: AttendanceEntry[]): PlanReportRow[] {
  const aggregates = new Map<string, PlanAggregate>();
  const scheduleById = new Map(schedules.map((schedule) => [schedule.id, schedule]));

  for (const schedule of schedules) {
    const id = schedule.lesson_plan_id ?? `schedule:${schedule.id}`;
    const aggregate = ensurePlanAggregate(aggregates, id, schedule.lesson_plan?.name ?? schedule.lesson_name);
    aggregate.lessonIds.add(schedule.id);
    aggregate.latestTime = Math.max(aggregate.latestTime, new Date(schedule.starts_at).getTime());
  }

  for (const record of records) {
    const schedule = record.schedule_id ? scheduleById.get(record.schedule_id) : undefined;
    const id = record.lesson_plan_id ?? record.schedule?.lesson_plan?.id ?? `record:${record.id}`;
    const aggregate = ensurePlanAggregate(aggregates, id, record.schedule?.lesson_plan?.name ?? schedule?.lesson_plan?.name ?? record.lesson_name);
    aggregate.lessonIds.add(record.schedule_id ?? record.id);
    aggregate.latestTime = Math.max(aggregate.latestTime, new Date(record.schedule?.starts_at ?? record.record_date).getTime());
  }

  for (const entry of entries) {
    const id = entry.lessonPlanId ?? `${entry.lessonName}:${entry.date}`;
    const aggregate = ensurePlanAggregate(aggregates, id, entry.lessonPlanName || entry.lessonName);
    aggregate.planned += 1;
    if (entry.status === "present") aggregate.participants += 1;
    if (entry.status === "cancelled") aggregate.cancelled += 1;
  }

  return Array.from(aggregates.values())
    .map((row) => ({
      id: row.id,
      name: row.name,
      lessonCount: row.lessonIds.size,
      participants: row.participants,
      cancelRate: percent(row.cancelled, row.planned),
      averageParticipants: row.lessonIds.size ? Math.round((row.participants / row.lessonIds.size) * 10) / 10 : 0,
      latestDate: row.latestTime ? formatDate(new Date(row.latestTime).toISOString()) : "未実施",
    }))
    .sort((a, b) => b.lessonCount - a.lessonCount || a.name.localeCompare(b.name, "ja"));
}

function ensurePlanAggregate(map: Map<string, PlanAggregate>, id: string, name: string) {
  const existing = map.get(id);
  if (existing) return existing;
  const next: PlanAggregate = { id, name, lessonIds: new Set<string>(), participants: 0, cancelled: 0, planned: 0, latestTime: 0 };
  map.set(id, next);
  return next;
}

function buildBlockRows(records: RawRecord[], allBlocks: RawBlockTemplate[]): BlockReportRow[] {
  const aggregates = new Map<string, BlockAggregate>();
  for (const block of allBlocks) {
    aggregates.set(block.id, {
      id: block.id,
      name: block.name,
      majorCategory: block.category?.name ?? "未分類",
      minorCategory: block.subcategory?.name ?? "未分類",
      doneCount: 0,
      reactionCount: 0,
      goodCount: 0,
      improvementCount: 0,
      latestTime: 0,
    });
  }

  for (const record of records) {
    const usedAt = new Date(record.schedule?.starts_at ?? record.record_date).getTime();
    for (const item of record.lesson_record_blocks ?? []) {
      const block = item.block;
      const id = item.block_template_id;
      const aggregate = aggregates.get(id) ?? {
        id,
        name: block?.name ?? "削除済みブロック",
        majorCategory: block?.category?.name ?? "未分類",
        minorCategory: block?.subcategory?.name ?? "未分類",
        doneCount: 0,
        reactionCount: 0,
        goodCount: 0,
        improvementCount: 0,
        latestTime: 0,
      };

      if (item.done) aggregate.doneCount += 1;
      if (item.reaction) aggregate.reactionCount += 1;
      if (item.reaction === "good") aggregate.goodCount += 1;
      if (item.improvement_memo?.trim()) aggregate.improvementCount += 1;
      aggregate.latestTime = Math.max(aggregate.latestTime, usedAt);
      aggregates.set(id, aggregate);
    }
  }

  return Array.from(aggregates.values()).map((row) => ({
    id: row.id,
    name: row.name,
    majorCategory: row.majorCategory,
    minorCategory: row.minorCategory,
    doneCount: row.doneCount,
    goodRate: percent(row.goodCount, row.reactionCount),
    improvementCount: row.improvementCount,
    latestDate: row.latestTime ? formatDate(new Date(row.latestTime).toISOString()) : "未使用",
  }));
}

function buildHints(data: ReportData) {
  const hints: string[] = [];
  if (data.summary.recordedLessons < 3) {
    hints.push("まだ記録数が少ないため、レッスン後記録を増やすと分析精度が上がります。");
  }
  if (data.attendance.cancelRate >= 20) {
    hints.push("キャンセル率が高めです。予定登録後のリマインドや時間帯を見直す余地があります。");
  }
  const improvement = data.blockAnalysis.improvementHeavy[0];
  if (improvement) {
    hints.push(`${improvement.name} は改善メモが多めです。誘導セリフや注意点を見直す候補です。`);
  }
  const goodBlock = data.blockAnalysis.goodReaction[0];
  if (goodBlock && goodBlock.goodRate >= 70) {
    hints.push(`${goodBlock.name} は反応が良い傾向です。次回プランでも活用しやすいブロックです。`);
  }
  if (!hints.length) {
    hints.push("実データが蓄積されています。記録を続けると、ブロックやクラス種別の傾向がより見えやすくなります。");
  }
  return hints;
}
