import { requireUserId } from "@/lib/students";
import { measurePerformance } from "@/lib/performance";
import {
  buildLessonCoverage,
  emptyLessonCoverageReport,
  type LessonCoverageReport,
  type LessonCoverageSourceItem,
} from "@/lib/lesson-coverage";

export type ReportPeriodKey = "week" | "month" | "3months" | "half" | "year" | "custom";
export type ReportViewKey = "ai_review" | "overview" | "coverage" | "attendance" | "students" | "plans" | "blocks" | "execution" | "closures";

export type ReportQuery = {
  period: ReportPeriodKey;
  from?: string;
  to?: string;
  format?: string;
  plan?: string;
  place?: string;
  now?: Date;
  includeCoverage?: boolean;
};

export type ReportPeriod = {
  key: ReportPeriodKey;
  label: string;
  startDate: string;
  endDate: string;
  startIso: string;
  endExclusiveIso: string;
  previousStartDate: string;
  previousEndDate: string;
  previousStartIso: string;
  previousEndExclusiveIso: string;
};

export type RatioRow = { label: string; count: number; percent: number };
export type AttendanceBreakdownRow = { label: string; present: number; cancelled: number; noShow: number; total: number };
export type TrendRow = AttendanceBreakdownRow & { key: string };
export type ComparisonValue = { previous: number | null; delta: number | null; percentChange: number | null };

export type ReportSummary = {
  totalLessons: number;
  recordedLessons: number;
  recordRate: number;
  totalParticipants: number;
  uniqueStudents: number;
  cancelCount: number;
  cancelRate: number;
  noShowCount: number;
  noShowRate: number;
  changeRate: number | null;
  addedCount: number;
  comparisons: {
    totalLessons: ComparisonValue;
    totalParticipants: ComparisonValue;
    uniqueStudents: ComparisonValue;
    cancelRate: ComparisonValue;
    recordRate: ComparisonValue;
    changeRate: ComparisonValue;
  };
};

export type PlanReportRow = {
  id: string;
  name: string;
  lessonCount: number;
  participants: number;
  averageParticipants: number;
  cancelRate: number;
  averagePlannedMinutes: number | null;
  plannedMinutesSample: number;
  averageActualMinutes: number | null;
  actualMinutesSample: number;
  changeRate: number | null;
  frequentAddedBlock: string;
  latestDate: string;
};

export type BlockReportRow = {
  id: string;
  name: string;
  category: string;
  usedCount: number;
  evaluatedCount: number;
  goodRate: number | null;
  skippedCount: number;
  adjustedCount: number;
  replacedCount: number;
  improvementCount: number;
  latestDate: string;
};

export type RankedTextRow = { id?: string; label: string; count: number; detail?: string };

export type ExecutionSummary = {
  plannedItems: number;
  asPlanned: number;
  adjusted: number;
  skipped: number;
  replaced: number;
  libraryAdded: number;
  improvisedAdded: number;
  legacyUnclassified: number;
  plannedMinutes: number;
  actualMinutes: number;
  averageMinuteDifference: number | null;
  minuteDifferenceSamples: number;
  reasons: RankedTextRow[];
  changedPlans: RankedTextRow[];
  skippedItems: RankedTextRow[];
  libraryAdditions: RankedTextRow[];
  improvisedItems: RankedTextRow[];
  templatedImprovisedItems: RankedTextRow[];
};

export type ClosureReport = {
  closedCount: number;
  heldCount: number;
  closeRate: number | null;
  unclassifiedPastCount: number;
  futureClosedCount: number;
  comparisons: {
    closedCount: ComparisonValue;
    heldCount: ComparisonValue;
    closeRate: ComparisonValue;
    unclassifiedPastCount: ComparisonValue;
  };
  byReason: RankedTextRow[];
  byWeekday: RankedTextRow[];
  byTimeBand: RankedTextRow[];
  byPlace: RankedTextRow[];
  byPlan: RankedTextRow[];
  byFormat: RankedTextRow[];
  items: Array<{
    scheduleId: string;
    lessonName: string;
    startsAt: string;
    reason: string;
    place: string;
    planId: string | null;
    planName: string;
    format: string;
    isFuture: boolean;
  }>;
};

export type ReportData = {
  period: ReportPeriod;
  error?: string;
  hasAnyData: boolean;
  filters: {
    format: string;
    plan: string;
    place: string;
    plans: Array<{ id: string; name: string }>;
    places: string[];
  };
  summary: ReportSummary;
  attendance: {
    present: number;
    cancelled: number;
    noShow: number;
    cancelRate: number;
    noShowRate: number;
    trendGranularity: "day" | "week";
    trend: TrendRow[];
    byFormat: AttendanceBreakdownRow[];
    byPlace: AttendanceBreakdownRow[];
  };
  students: {
    all: { total: number; genderRows: RatioRow[]; ageRows: RatioRow[] };
    participants: { total: number; genderRows: RatioRow[]; ageRows: RatioRow[]; newEquivalentCount: number };
  };
  plans: PlanReportRow[];
  blocks: {
    mostUsed: BlockReportRow[];
    goodReaction: BlockReportRow[];
    mostSkipped: BlockReportRow[];
    mostAdjusted: BlockReportRow[];
    mostReplaced: BlockReportRow[];
    improvementHeavy: BlockReportRow[];
    unused: BlockReportRow[];
  };
  execution: ExecutionSummary;
  coverage: LessonCoverageReport;
  closures: ClosureReport;
  hints: string[];
  dataQuality: {
    lessons: number;
    recordedLessons: number;
    recordRate: number;
    unevaluatedBlocks: number;
    legacyUnclassifiedItems: number;
    missingActualMinutes: number;
  };
};

type AttendanceStatus = "present" | "cancelled" | "no_show";
type LessonFormat = "group" | "personal" | "online";
type ChangeType = "as_planned" | "adjusted" | "skipped" | "replaced" | "added";
type ItemSource = "planned" | "library" | "improvised";

type RawStudent = { id: string; age_group: string | null; gender: string | null; created_at: string };
type RawParticipant = { student_id: string; attendance_status: AttendanceStatus };
type RawClosure = { id: string; reason_code: string; revoked_at: string | null };
type RawSchedule = {
  id: string;
  lesson_plan_id: string | null;
  lesson_name: string;
  starts_at: string;
  ends_at: string;
  place: string | null;
  format: LessonFormat | null;
  status: string;
  lesson_plan_name_snapshot: string | null;
  lesson_plan_duration_minutes_snapshot: number | null;
  lesson_plan?: { id: string; name: string | null; duration_minutes?: number | null } | null;
  schedule_participants?: RawParticipant[];
  schedule_closures?: RawClosure[];
};
type RawRecordStudent = { student_id: string; attendance_status: AttendanceStatus };
type RawRecordItem = {
  id: string;
  block_template_id: string | null;
  schedule_plan_item_id: string | null;
  item_source: ItemSource;
  display_name_snapshot: string | null;
  category_name_snapshot: string | null;
  subcategory_name_snapshot?: string | null;
  purpose_snapshot?: string | null;
  tags_snapshot?: string[] | null;
  sort_order?: number;
  planned_duration_minutes: number | null;
  done: boolean | null;
  actual_duration_minutes: number | null;
  reaction: "good" | "neutral" | "poor" | null;
  improvement_memo: string | null;
  change_type: ChangeType | null;
  change_reason_codes: string[] | null;
  change_reason_note: string | null;
  actual_content_note: string | null;
  replaces_schedule_plan_item_id: string | null;
  block?: {
    id: string;
    name: string | null;
    purpose?: string | null;
    category?: { name: string | null } | null;
    subcategory?: { name: string | null } | null;
    block_template_tags?: Array<{ tag?: { name: string | null } | null }>;
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
    ends_at: string | null;
    status?: string | null;
    place: string | null;
    format: LessonFormat | null;
    lesson_plan_id: string | null;
    lesson_plan_name_snapshot: string | null;
    lesson_plan_duration_minutes_snapshot: number | null;
    lesson_plan?: { id: string; name: string | null; duration_minutes?: number | null } | null;
    schedule_closures?: RawClosure[];
  } | null;
  lesson_record_students?: RawRecordStudent[];
  lesson_record_blocks?: RawRecordItem[];
};
type RawPlan = { id: string; name: string; duration_minutes: number };
type RawBlock = { id: string; name: string; category?: { name: string | null } | null };

type AttendanceEntry = {
  lessonKey: string;
  studentId: string;
  status: AttendanceStatus;
  dateIso: string;
  format: LessonFormat | "";
  place: string;
  planId: string | null;
};

type PeriodDataset = {
  schedules: RawSchedule[];
  records: RawRecord[];
  lessons: Array<{ key: string; dateIso: string; planId: string | null; planName: string; format: LessonFormat | ""; place: string; plannedMinutes: number | null; record?: RawRecord }>;
  attendance: AttendanceEntry[];
  items: Array<RawRecordItem & { record: RawRecord; dateIso: string; planId: string | null; planName: string }>;
};

const periodLabels: Record<ReportPeriodKey, string> = { week: "今週", month: "今月", "3months": "3か月", half: "半年", year: "1年", custom: "カスタム" };
const formatLabels: Record<string, string> = { group: "グループ", personal: "パーソナル", online: "オンライン", "": "未設定" };
const genderLabels: Record<string, string> = { female: "女性", male: "男性", other: "その他", prefer_not_to_say: "回答しない" };
const reasonLabels: Record<string, string> = {
  student_reaction: "生徒の反応",
  pain_safety: "痛み・安全面",
  beginner_level: "初心者対応",
  advanced_level: "高レベル対応",
  fatigue_focus: "疲労・集中力",
  time_shortage: "時間不足",
  extra_time: "時間に余裕",
  student_request: "生徒の要望",
  space_equipment: "会場・設備",
  other: "その他",
};
const closureReasonLabels: Record<string, string> = {
  all_participants_cancelled: "参加者全員がキャンセル",
  minimum_participants_not_met: "最少開催人数に満たなかった",
  instructor_unavailable: "講師都合",
  weather_disaster_transport: "天候・災害・交通事情",
  venue_unavailable: "会場都合",
  operational: "運営上の都合",
  other: "その他",
};

const coverageRecordSelect = "id,schedule_id,lesson_plan_id,lesson_name,record_date,schedule:schedules(id,starts_at,ends_at,status,place,format,lesson_plan_id,lesson_plan_name_snapshot,lesson_plan_duration_minutes_snapshot,lesson_plan:lesson_plans(id,name,duration_minutes),schedule_closures(id,reason_code,revoked_at)),lesson_record_students(student_id,attendance_status),lesson_record_blocks(id,sort_order,block_template_id,schedule_plan_item_id,item_source,display_name_snapshot,category_name_snapshot,subcategory_name_snapshot,purpose_snapshot,tags_snapshot,planned_duration_minutes,done,actual_duration_minutes,reaction,improvement_memo,change_type,change_reason_codes,change_reason_note,actual_content_note,replaces_schedule_plan_item_id,block:block_templates(id,name,purpose,category:block_categories(name),subcategory:block_subcategories(name),block_template_tags(tag:block_tags(name))))";

export function normalizeReportPeriod(value?: string | null): ReportPeriodKey {
  return value === "week" || value === "month" || value === "3months" || value === "half" || value === "year" || value === "custom" ? value : "3months";
}

export function normalizeReportView(value?: string | null): ReportViewKey {
  return value === "ai_review" || value === "overview" || value === "coverage" || value === "attendance" || value === "students" || value === "plans" || value === "blocks" || value === "execution" || value === "closures" ? value : "overview";
}

export function resolveReportPeriod({ period, from, to, now = new Date() }: Pick<ReportQuery, "period" | "from" | "to" | "now">): { period: ReportPeriod | null; error?: string } {
  const today = tokyoDateString(now);
  let startDate = today;
  let endDate = today;

  if (period === "custom") {
    if (!from || !to) return { period: null, error: "カスタム期間の開始日と終了日を入力してください。" };
    if (!isValidDateString(from) || !isValidDateString(to)) return { period: null, error: "開始日と終了日を正しい日付で入力してください。" };
    if (from > to) return { period: null, error: "開始日は終了日以前の日付を指定してください。" };
    startDate = from;
    endDate = to;
  } else if (period === "week") {
    const day = new Date(`${today}T00:00:00Z`).getUTCDay();
    startDate = addDays(today, -(day === 0 ? 6 : day - 1));
  } else if (period === "month") {
    startDate = `${today.slice(0, 7)}-01`;
  } else if (period === "3months") {
    startDate = addMonthsClamped(today, -3);
  } else if (period === "half") {
    startDate = addMonthsClamped(today, -6);
  } else if (period === "year") {
    startDate = addMonthsClamped(today, -12);
  }

  const days = dateDiffDays(startDate, endDate) + 1;
  let previousEndDate = addDays(startDate, -1);
  let previousStartDate = addDays(previousEndDate, -(days - 1));
  if (period === "month") {
    previousStartDate = addMonthsClamped(startDate, -1);
    previousEndDate = lastDayOfMonth(previousStartDate);
  } else if (period === "3months") {
    previousStartDate = addMonthsClamped(startDate, -3);
  } else if (period === "half") {
    previousStartDate = addMonthsClamped(startDate, -6);
  } else if (period === "year") {
    previousStartDate = addMonthsClamped(startDate, -12);
  }
  return {
    period: {
      key: period,
      label: periodLabels[period],
      startDate,
      endDate,
      startIso: startOfTokyoDay(startDate),
      endExclusiveIso: startOfTokyoDay(addDays(endDate, 1)),
      previousStartDate,
      previousEndDate,
      previousStartIso: startOfTokyoDay(previousStartDate),
      previousEndExclusiveIso: startOfTokyoDay(addDays(previousEndDate, 1)),
    },
  };
}

export async function getReportData(query: ReportQuery): Promise<ReportData> {
  const resolved = resolveReportPeriod(query);
  if (!resolved.period) return emptyReport(query, resolved.error ?? "期間を確認してください。");
  try {
    return await measurePerformance(
      { operation: "data.reports-v3", route: "/reports" },
      () => fetchReportData(query, resolved.period!),
      (data) => data.summary.totalLessons,
    );
  } catch (error) {
    return emptyReport(query, error instanceof Error ? error.message : "レポートデータを取得できませんでした。", resolved.period);
  }
}

export async function getLessonCoverageForSchedules(scheduleIds: string[]): Promise<LessonCoverageReport> {
  const uniqueScheduleIds = Array.from(new Set(scheduleIds)).slice(0, 8);
  if (!uniqueScheduleIds.length) return emptyLessonCoverageReport();

  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("lesson_records")
    .select(coverageRecordSelect)
    .in("schedule_id", uniqueScheduleIds);

  if (error) throw new Error(`カバレッジデータを取得できませんでした: ${error.message}`);
  return buildLessonCoverage(((data ?? []) as unknown as RawRecord[]).map(toCoverageSourceLesson));
}

async function fetchReportData(query: ReportQuery, period: ReportPeriod): Promise<ReportData> {
  const { supabase } = await requireUserId();
  const recordSelect = query.includeCoverage
    ? coverageRecordSelect
    : "id,schedule_id,lesson_plan_id,lesson_name,record_date,schedule:schedules(id,starts_at,ends_at,place,format,lesson_plan_id,lesson_plan_name_snapshot,lesson_plan_duration_minutes_snapshot,lesson_plan:lesson_plans(id,name,duration_minutes),schedule_closures(id,reason_code,revoked_at)),lesson_record_students(student_id,attendance_status),lesson_record_blocks(id,block_template_id,schedule_plan_item_id,item_source,display_name_snapshot,category_name_snapshot,planned_duration_minutes,done,actual_duration_minutes,reaction,improvement_memo,change_type,change_reason_codes,change_reason_note,actual_content_note,replaces_schedule_plan_item_id,block:block_templates(id,name,category:block_categories(name)))";
  const [studentsResult, schedulesResult, recordsResult, plansResult, blocksResult, optionsResult] = await Promise.all([
    supabase.from("students").select("id,age_group,gender,created_at").eq("archived", false),
    supabase
      .from("schedules")
      .select("id,lesson_plan_id,lesson_name,starts_at,ends_at,place,format,status,lesson_plan_name_snapshot,lesson_plan_duration_minutes_snapshot,lesson_plan:lesson_plans(id,name,duration_minutes),schedule_participants(student_id,attendance_status),schedule_closures(id,reason_code,revoked_at)")
      .gte("starts_at", period.previousStartIso)
      .lt("starts_at", period.endExclusiveIso)
      .order("starts_at", { ascending: true }),
    supabase
      .from("lesson_records")
      .select(recordSelect)
      .gte("record_date", period.previousStartDate)
      .lte("record_date", period.endDate)
      .order("record_date", { ascending: true }),
    supabase.from("lesson_plans").select("id,name,duration_minutes").neq("status", "archived").order("name", { ascending: true }),
    supabase.from("block_templates").select("id,name,category:block_categories(name)").eq("archived", false).eq("is_draft", false).order("name", { ascending: true }),
    supabase.from("schedules").select("lesson_plan_id,place,format,lesson_plan:lesson_plans(id,name)").order("starts_at", { ascending: false }),
  ]);

  if (studentsResult.error) throw new Error(`生徒データを取得できませんでした: ${studentsResult.error.message}`);
  if (schedulesResult.error) throw new Error(`予定データを取得できませんでした: ${schedulesResult.error.message}`);
  if (recordsResult.error) throw new Error(`実施後記録を取得できませんでした: ${recordsResult.error.message}`);
  if (plansResult.error) throw new Error(`プランデータを取得できませんでした: ${plansResult.error.message}`);
  if (blocksResult.error) throw new Error(`ブロックデータを取得できませんでした: ${blocksResult.error.message}`);
  if (optionsResult.error) throw new Error(`フィルター候補を取得できませんでした: ${optionsResult.error.message}`);

  const students = (studentsResult.data ?? []) as RawStudent[];
  const allSchedules = (schedulesResult.data ?? []) as unknown as RawSchedule[];
  const allRecords = (recordsResult.data ?? []) as unknown as RawRecord[];
  const plans = (plansResult.data ?? []) as RawPlan[];
  const blocks = (blocksResult.data ?? []) as unknown as RawBlock[];
  const commonFilter = (item: { format: string; planId: string | null; place: string }) =>
    (!query.format || query.format === "all" || item.format === query.format) &&
    (!query.plan || query.plan === "all" || item.planId === query.plan) &&
    (!query.place || query.place === "all" || item.place === query.place);

  const current = buildPeriodDataset(allSchedules, allRecords, period.startIso, period.endExclusiveIso, commonFilter);
  const previous = buildPeriodDataset(allSchedules, allRecords, period.previousStartIso, period.previousEndExclusiveIso, commonFilter);
  const currentCore = aggregateCore(current);
  const previousCore = aggregateCore(previous);
  const summary = buildSummary(currentCore, previousCore);
  const studentById = new Map(students.map((student) => [student.id, student]));
  const presentStudentIds = Array.from(new Set(current.records.flatMap((record) => record.lesson_record_students ?? []).filter((entry) => entry.attendance_status === "present").map((entry) => entry.student_id)));
  const periodStudents = presentStudentIds.map((id) => studentById.get(id)).filter((student): student is RawStudent => Boolean(student));
  const blockRows = buildBlockRows(current.items, blocks);
  const execution = buildExecutionSummary(current);
  const coverage = query.includeCoverage
    ? buildLessonCoverage(current.records.map(toCoverageSourceLesson))
    : emptyLessonCoverageReport();
  const planRows = buildPlanRows(current, plans);
  const attendance = buildAttendanceReport(current.attendance, period);
  const closures = buildClosureReport(allSchedules, period, commonFilter, query.now ?? new Date());
  const allGender = buildRatioRows(students.map((student) => normalizeGender(student.gender)));
  const allAge = buildRatioRows(students.map((student) => normalizeAge(student.age_group)));
  const participantGender = buildRatioRows(periodStudents.map((student) => normalizeGender(student.gender)));
  const participantAge = buildRatioRows(periodStudents.map((student) => normalizeAge(student.age_group)));
  const options = (optionsResult.data ?? []) as unknown as Array<{ lesson_plan_id: string | null; place: string | null; lesson_plan?: { id: string; name: string | null } | null }>;
  const optionPlans = uniqueBy([
    ...plans.map((plan) => ({ id: plan.id, name: plan.name })),
    ...options.filter((row) => row.lesson_plan_id).map((row) => ({ id: row.lesson_plan_id!, name: row.lesson_plan?.name ?? "名称未設定" })),
  ], (row) => row.id).sort((a, b) => a.name.localeCompare(b.name, "ja"));
  const places = Array.from(new Set(options.map((row) => row.place?.trim()).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b, "ja"));
  const dataQuality = {
    lessons: summary.totalLessons,
    recordedLessons: summary.recordedLessons,
    recordRate: summary.recordRate,
    unevaluatedBlocks: current.items.filter((item) => isExecutedItem(item) && item.reaction == null).length,
    legacyUnclassifiedItems: current.items.filter((item) => item.change_type == null).length,
    missingActualMinutes: current.items.filter((item) => isExecutedItem(item) && item.actual_duration_minutes == null).length,
  };

  const data: ReportData = {
    period,
    hasAnyData: Boolean(current.lessons.length || current.records.length || students.length),
    filters: { format: query.format ?? "all", plan: query.plan ?? "all", place: query.place ?? "all", plans: optionPlans, places },
    summary,
    attendance,
    students: {
      all: { total: students.length, genderRows: allGender, ageRows: allAge },
      participants: {
        total: periodStudents.length,
        genderRows: participantGender,
        ageRows: participantAge,
        newEquivalentCount: periodStudents.filter((student) => {
          const createdAt = Date.parse(student.created_at);
          return createdAt >= Date.parse(period.startIso) && createdAt < Date.parse(period.endExclusiveIso);
        }).length,
      },
    },
    plans: planRows,
    blocks: {
      mostUsed: rankBlocks(blockRows, (row) => row.usedCount),
      goodReaction: [...blockRows].filter((row) => row.evaluatedCount > 0).sort((a, b) => (b.goodRate ?? -1) - (a.goodRate ?? -1) || b.evaluatedCount - a.evaluatedCount).slice(0, 10),
      mostSkipped: rankBlocks(blockRows, (row) => row.skippedCount),
      mostAdjusted: rankBlocks(blockRows, (row) => row.adjustedCount),
      mostReplaced: rankBlocks(blockRows, (row) => row.replacedCount),
      improvementHeavy: rankBlocks(blockRows, (row) => row.improvementCount),
      unused: [...blockRows].filter((row) => row.usedCount === 0).sort((a, b) => a.latestDate.localeCompare(b.latestDate)).slice(0, 10),
    },
    execution,
    coverage,
    closures,
    hints: [],
    dataQuality,
  };
  data.hints = buildHints(data);
  return data;
}

function buildPeriodDataset(
  schedules: RawSchedule[],
  records: RawRecord[],
  startIso: string,
  endExclusiveIso: string,
  filter: (item: { format: string; planId: string | null; place: string }) => boolean,
): PeriodDataset {
  const startTime = Date.parse(startIso);
  const endExclusiveTime = Date.parse(endExclusiveIso);
  const isWithinPeriod = (value: string) => {
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) && timestamp >= startTime && timestamp < endExclusiveTime;
  };
  const scheduleRows = schedules.filter((schedule) => !hasActiveClosure(schedule) && isWithinPeriod(schedule.starts_at) && filter({ format: schedule.format ?? "", planId: schedule.lesson_plan_id, place: schedule.place ?? "" }));
  const scheduleById = new Map(scheduleRows.map((schedule) => [schedule.id, schedule]));
  const recordRows = records.filter((record) => {
    const dateIso = recordDateIso(record);
    const planId = record.lesson_plan_id ?? record.schedule?.lesson_plan_id ?? null;
    return !hasActiveClosure(record.schedule) && isWithinPeriod(dateIso) && filter({ format: record.schedule?.format ?? "", planId, place: record.schedule?.place ?? "" });
  });
  const recordBySchedule = new Map(recordRows.filter((record) => record.schedule_id).map((record) => [record.schedule_id!, record]));
  const lessons: PeriodDataset["lessons"] = scheduleRows.map((schedule) => {
    const record = recordBySchedule.get(schedule.id);
    return {
      key: schedule.id,
      dateIso: schedule.starts_at,
      planId: schedule.lesson_plan_id,
      planName: schedule.lesson_plan_name_snapshot || schedule.lesson_plan?.name || "未設定",
      format: schedule.format ?? "",
      place: schedule.place ?? "未設定",
      plannedMinutes: schedule.lesson_plan_duration_minutes_snapshot ?? schedule.lesson_plan?.duration_minutes ?? minutesBetween(schedule.starts_at, schedule.ends_at),
      record,
    };
  });
  for (const record of recordRows) {
    if (record.schedule_id && scheduleById.has(record.schedule_id)) continue;
    lessons.push({
      key: `record:${record.id}`,
      dateIso: recordDateIso(record),
      planId: record.lesson_plan_id ?? record.schedule?.lesson_plan_id ?? null,
      planName: record.schedule?.lesson_plan_name_snapshot || record.schedule?.lesson_plan?.name || "未設定",
      format: record.schedule?.format ?? "",
      place: record.schedule?.place ?? "未設定",
      plannedMinutes: record.schedule?.lesson_plan_duration_minutes_snapshot ?? record.schedule?.lesson_plan?.duration_minutes ?? (record.schedule?.starts_at && record.schedule.ends_at ? minutesBetween(record.schedule.starts_at, record.schedule.ends_at) : null),
      record,
    });
  }

  const attendance: AttendanceEntry[] = [];
  for (const lesson of lessons) {
    const schedule = scheduleById.get(lesson.key);
    const source = lesson.record?.lesson_record_students ?? schedule?.schedule_participants ?? [];
    const seen = new Set<string>();
    for (const student of source) {
      if (seen.has(student.student_id)) continue;
      seen.add(student.student_id);
      attendance.push({ lessonKey: lesson.key, studentId: student.student_id, status: student.attendance_status, dateIso: lesson.dateIso, format: lesson.format, place: lesson.place, planId: lesson.planId });
    }
  }
  const items = recordRows.flatMap((record) => (record.lesson_record_blocks ?? []).map((item) => ({ ...item, record, dateIso: recordDateIso(record), planId: record.lesson_plan_id ?? record.schedule?.lesson_plan_id ?? null, planName: record.schedule?.lesson_plan_name_snapshot || record.schedule?.lesson_plan?.name || "未設定" })));
  return { schedules: scheduleRows, records: recordRows, lessons, attendance, items };
}

function aggregateCore(dataset: PeriodDataset) {
  const present = dataset.attendance.filter((entry) => entry.status === "present");
  const cancelled = dataset.attendance.filter((entry) => entry.status === "cancelled").length;
  const noShow = dataset.attendance.filter((entry) => entry.status === "no_show").length;
  const attendanceTotal = dataset.attendance.length;
  const plannedChanges = calculatePlannedChangeRate(dataset.items);
  return {
    totalLessons: dataset.lessons.length,
    recordedLessons: dataset.lessons.filter((lesson) => Boolean(lesson.record)).length,
    totalParticipants: present.length,
    uniqueStudents: new Set(present.map((entry) => entry.studentId)).size,
    cancelCount: cancelled,
    noShowCount: noShow,
    attendanceTotal,
    confirmedPlanned: plannedChanges.denominator,
    changed: plannedChanges.numerator,
    added: dataset.items.filter(isExecutedAdded).length,
  };
}

export function calculateClosureMetrics(rows: Array<{ startsAt: string; status: string; closed: boolean }>, now: Date) {
  const nowTime = now.getTime();
  const past = rows.filter((row) => Date.parse(row.startsAt) < nowTime);
  const closedCount = past.filter((row) => row.closed).length;
  const heldCount = past.filter((row) => !row.closed && row.status === "recorded").length;
  const unclassifiedPastCount = past.filter((row) => !row.closed && row.status !== "recorded").length;
  const denominator = closedCount + heldCount;
  return {
    closedCount,
    heldCount,
    closeRate: denominator ? percent(closedCount, denominator) : null,
    unclassifiedPastCount,
    futureClosedCount: rows.filter((row) => Date.parse(row.startsAt) >= nowTime && row.closed).length,
  };
}

function buildClosureReport(
  schedules: RawSchedule[],
  period: ReportPeriod,
  filter: (item: { format: string; planId: string | null; place: string }) => boolean,
  now: Date,
): ClosureReport {
  const rowsFor = (startIso: string, endExclusiveIso: string) => schedules.filter((schedule) => {
    const timestamp = Date.parse(schedule.starts_at);
    return timestamp >= Date.parse(startIso)
      && timestamp < Date.parse(endExclusiveIso)
      && filter({ format: schedule.format ?? "", planId: schedule.lesson_plan_id, place: schedule.place ?? "" });
  });
  const currentRows = rowsFor(period.startIso, period.endExclusiveIso);
  const previousRows = rowsFor(period.previousStartIso, period.previousEndExclusiveIso);
  const currentMetrics = calculateClosureMetrics(currentRows.map(toClosureMetricRow), now);
  const previousMetrics = calculateClosureMetrics(previousRows.map(toClosureMetricRow), now);
  const activeClosed = currentRows.filter((schedule) => Boolean(activeClosure(schedule)));
  const eligibleClosed = activeClosed.filter((schedule) => Date.parse(schedule.starts_at) < now.getTime());

  return {
    ...currentMetrics,
    comparisons: {
      closedCount: compare(currentMetrics.closedCount, previousMetrics.closedCount, true),
      heldCount: compare(currentMetrics.heldCount, previousMetrics.heldCount, true),
      closeRate: compare(currentMetrics.closeRate, previousMetrics.closeRate, true),
      unclassifiedPastCount: compare(currentMetrics.unclassifiedPastCount, previousMetrics.unclassifiedPastCount, true),
    },
    byReason: countClosureRows(eligibleClosed, (schedule) => closureReasonLabels[activeClosure(schedule)?.reason_code ?? "other"] ?? "その他"),
    byWeekday: countClosureRows(eligibleClosed, (schedule) => new Intl.DateTimeFormat("ja-JP", { weekday: "short", timeZone: "Asia/Tokyo" }).format(new Date(schedule.starts_at))),
    byTimeBand: countClosureRows(eligibleClosed, (schedule) => scheduleTimeBand(schedule.starts_at)),
    byPlace: countClosureRows(eligibleClosed, (schedule) => schedule.place?.trim() || "未設定"),
    byPlan: countClosureRows(eligibleClosed, (schedule) => schedule.lesson_plan_name_snapshot || schedule.lesson_plan?.name || "未設定", (schedule) => schedule.lesson_plan_id ?? undefined),
    byFormat: countClosureRows(eligibleClosed, (schedule) => formatLabels[schedule.format ?? ""] ?? "未設定"),
    items: activeClosed
      .sort((a, b) => b.starts_at.localeCompare(a.starts_at))
      .map((schedule) => ({
        scheduleId: schedule.id,
        lessonName: schedule.lesson_name,
        startsAt: schedule.starts_at,
        reason: closureReasonLabels[activeClosure(schedule)!.reason_code] ?? "その他",
        place: schedule.place?.trim() || "未設定",
        planId: schedule.lesson_plan_id,
        planName: schedule.lesson_plan_name_snapshot || schedule.lesson_plan?.name || "未設定",
        format: formatLabels[schedule.format ?? ""] ?? "未設定",
        isFuture: Date.parse(schedule.starts_at) >= now.getTime(),
      })),
  };
}

function toClosureMetricRow(schedule: RawSchedule) {
  return { startsAt: schedule.starts_at, status: schedule.status, closed: Boolean(activeClosure(schedule)) };
}

function activeClosure(value: { schedule_closures?: RawClosure[] } | null | undefined) {
  return value?.schedule_closures?.find((closure) => closure.revoked_at === null) ?? null;
}

function hasActiveClosure(value: { schedule_closures?: RawClosure[] } | null | undefined) {
  return Boolean(activeClosure(value));
}

function countClosureRows(
  schedules: RawSchedule[],
  label: (schedule: RawSchedule) => string,
  id: (schedule: RawSchedule) => string | undefined = () => undefined,
) {
  const counts = new Map<string, { id?: string; count: number }>();
  for (const schedule of schedules) {
    const key = label(schedule);
    const current = counts.get(key);
    counts.set(key, { id: current?.id ?? id(schedule), count: (current?.count ?? 0) + 1 });
  }
  return Array.from(counts, ([labelValue, value]) => ({ label: labelValue, count: value.count, id: value.id }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ja"));
}

function scheduleTimeBand(startsAt: string) {
  const parts = new Intl.DateTimeFormat("en-US", { hour: "2-digit", hour12: false, hourCycle: "h23", timeZone: "Asia/Tokyo" }).formatToParts(new Date(startsAt));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  if (hour < 12) return "午前";
  if (hour < 17) return "午後";
  return "夜";
}

export function calculatePlannedChangeRate(items: Array<{ item_source: string; change_type: string | null; done: boolean | null }>) {
  const denominator = items.filter((item) => item.item_source === "planned" && item.done !== null && (item.change_type === "as_planned" || item.change_type === "adjusted" || item.change_type === "skipped" || item.change_type === "replaced")).length;
  const numerator = items.filter((item) => item.item_source === "planned" && item.done !== null && (item.change_type === "adjusted" || item.change_type === "skipped" || item.change_type === "replaced")).length;
  return { numerator, denominator, rate: denominator ? percent(numerator, denominator) : null };
}

function buildSummary(current: ReturnType<typeof aggregateCore>, previous: ReturnType<typeof aggregateCore>): ReportSummary {
  const recordRate = percent(current.recordedLessons, current.totalLessons);
  const previousRecordRate = previous.totalLessons ? percent(previous.recordedLessons, previous.totalLessons) : null;
  const cancelRate = percent(current.cancelCount, current.attendanceTotal);
  const previousCancelRate = previous.attendanceTotal ? percent(previous.cancelCount, previous.attendanceTotal) : null;
  const changeRate = current.confirmedPlanned ? percent(current.changed, current.confirmedPlanned) : null;
  const previousChangeRate = previous.confirmedPlanned ? percent(previous.changed, previous.confirmedPlanned) : null;
  return {
    totalLessons: current.totalLessons,
    recordedLessons: current.recordedLessons,
    recordRate,
    totalParticipants: current.totalParticipants,
    uniqueStudents: current.uniqueStudents,
    cancelCount: current.cancelCount,
    cancelRate,
    noShowCount: current.noShowCount,
    noShowRate: percent(current.noShowCount, current.attendanceTotal),
    changeRate,
    addedCount: current.added,
    comparisons: {
      totalLessons: compare(current.totalLessons, previous.totalLessons, previous.totalLessons > 0),
      totalParticipants: compare(current.totalParticipants, previous.totalParticipants, previous.attendanceTotal > 0),
      uniqueStudents: compare(current.uniqueStudents, previous.uniqueStudents, previous.attendanceTotal > 0),
      cancelRate: compare(cancelRate, previousCancelRate, previousCancelRate !== null),
      recordRate: compare(recordRate, previousRecordRate, previousRecordRate !== null),
      changeRate: compare(changeRate, previousChangeRate, previousChangeRate !== null),
    },
  };
}

function buildAttendanceReport(entries: AttendanceEntry[], period: ReportPeriod) {
  const present = entries.filter((entry) => entry.status === "present").length;
  const cancelled = entries.filter((entry) => entry.status === "cancelled").length;
  const noShow = entries.filter((entry) => entry.status === "no_show").length;
  const days = dateDiffDays(period.startDate, period.endDate) + 1;
  const granularity: "day" | "week" = days <= 45 ? "day" : "week";
  const trend = buildBreakdown(entries, (entry) => granularity === "day" ? tokyoDateString(new Date(entry.dateIso)) : startOfWeekDate(tokyoDateString(new Date(entry.dateIso))))
    .map((row) => ({ ...row, key: row.label, label: formatCompactDate(row.label) }));
  return {
    present,
    cancelled,
    noShow,
    cancelRate: percent(cancelled, entries.length),
    noShowRate: percent(noShow, entries.length),
    trendGranularity: granularity,
    trend,
    byFormat: buildBreakdown(entries, (entry) => formatLabels[entry.format]),
    byPlace: buildBreakdown(entries, (entry) => entry.place || "未設定"),
  };
}

function buildPlanRows(dataset: PeriodDataset, plans: RawPlan[]): PlanReportRow[] {
  const planNameById = new Map(plans.map((plan) => [plan.id, plan.name]));
  const grouped = groupBy(dataset.lessons, (lesson) => lesson.planId ?? `unlinked:${lesson.key}`);
  return Array.from(grouped.entries()).map(([id, lessons]) => {
    const lessonKeys = new Set(lessons.map((lesson) => lesson.key));
    const attendance = dataset.attendance.filter((entry) => lessonKeys.has(entry.lessonKey));
    const items = dataset.items.filter((item) => lessons.some((lesson) => lesson.record?.id === item.record.id));
    const confirmed = items.filter(isConfirmedPlanned);
    const changed = confirmed.filter((item) => item.change_type === "adjusted" || item.change_type === "skipped" || item.change_type === "replaced").length;
    const plannedMinutes = lessons.map((lesson) => lessonPlannedMinutes(lesson)).filter((value): value is number => value !== null);
    const actualByRecord = new Map<string, number[]>();
    for (const item of items.filter(isActualItem)) actualByRecord.set(item.record.id, [...(actualByRecord.get(item.record.id) ?? []), item.actual_duration_minutes!]);
    const actualMinutes = Array.from(actualByRecord.values()).filter((values) => values.length).map((values) => values.reduce((sum, value) => sum + value, 0));
    const additions = countBy(items.filter((item) => isExecutedAdded(item) && item.item_source === "library"), (item) => itemName(item));
    const frequentAdded = Array.from(additions.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "なし";
    const presentCount = attendance.filter((entry) => entry.status === "present").length;
    return {
      id: id.startsWith("unlinked:") ? "" : id,
      name: (lessons[0]?.planName && lessons[0].planName !== "未設定" ? lessons[0].planName : planNameById.get(id)) || "未設定",
      lessonCount: lessons.length,
      participants: presentCount,
      averageParticipants: lessons.length ? round1(presentCount / lessons.length) : 0,
      cancelRate: percent(attendance.filter((entry) => entry.status === "cancelled").length, attendance.length),
      averagePlannedMinutes: plannedMinutes.length ? round1(average(plannedMinutes)) : null,
      plannedMinutesSample: plannedMinutes.length,
      averageActualMinutes: actualMinutes.length ? round1(average(actualMinutes)) : null,
      actualMinutesSample: actualMinutes.length,
      changeRate: confirmed.length ? percent(changed, confirmed.length) : null,
      frequentAddedBlock: frequentAdded,
      latestDate: lessons.map((lesson) => lesson.dateIso).sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1) ?? "",
    };
  }).sort((a, b) => b.lessonCount - a.lessonCount || a.name.localeCompare(b.name, "ja"));
}

function buildBlockRows(items: PeriodDataset["items"], blocks: RawBlock[]): BlockReportRow[] {
  const map = new Map<string, BlockReportRow>();
  for (const block of blocks) map.set(block.id, { id: block.id, name: block.name, category: block.category?.name ?? "未分類", usedCount: 0, evaluatedCount: 0, goodRate: null, skippedCount: 0, adjustedCount: 0, replacedCount: 0, improvementCount: 0, latestDate: "未使用" });
  const goodCounts = new Map<string, number>();
  for (const item of items) {
    if (!item.block_template_id) continue;
    if (item.item_source === "improvised" && !item.block_template_id) continue;
    const current = map.get(item.block_template_id) ?? { id: item.block_template_id, name: itemName(item), category: item.category_name_snapshot || item.block?.category?.name || "未分類", usedCount: 0, evaluatedCount: 0, goodRate: null, skippedCount: 0, adjustedCount: 0, replacedCount: 0, improvementCount: 0, latestDate: "未使用" };
    if (isExecutedItem(item)) {
      current.usedCount += 1;
      current.latestDate = current.latestDate === "未使用" || Date.parse(item.dateIso) > Date.parse(current.latestDate) ? item.dateIso : current.latestDate;
      if (item.reaction != null) {
        current.evaluatedCount += 1;
        if (item.reaction === "good") goodCounts.set(current.id, (goodCounts.get(current.id) ?? 0) + 1);
      }
    }
    if (isConfirmedPlanned(item) && item.change_type === "skipped") current.skippedCount += 1;
    if (isConfirmedPlanned(item) && item.change_type === "adjusted") current.adjustedCount += 1;
    if (isConfirmedPlanned(item) && item.change_type === "replaced") current.replacedCount += 1;
    if (item.improvement_memo?.trim()) current.improvementCount += 1;
    map.set(current.id, current);
  }
  return Array.from(map.values()).map((row) => ({ ...row, goodRate: row.evaluatedCount ? percent(goodCounts.get(row.id) ?? 0, row.evaluatedCount) : null }));
}

function buildExecutionSummary(dataset: PeriodDataset): ExecutionSummary {
  const planned = dataset.items.filter((item) => item.item_source === "planned");
  const confirmedPlanned = planned.filter(isConfirmedPlanned);
  const executedAdditions = dataset.items.filter(isExecutedAdded);
  const recordDifferences: number[] = [];
  for (const record of dataset.records) {
    const items = dataset.items.filter((item) => item.record.id === record.id);
    const plannedValues = items.filter((item) => item.item_source === "planned" && item.planned_duration_minutes != null).map((item) => item.planned_duration_minutes!);
    const actualValues = items.filter(isActualItem).map((item) => item.actual_duration_minutes!);
    if (plannedValues.length && actualValues.length) recordDifferences.push(actualValues.reduce(sum, 0) - plannedValues.reduce(sum, 0));
  }
  const changedItems = [...confirmedPlanned.filter((item) => item.change_type !== "as_planned"), ...executedAdditions];
  const reasons = countBy(changedItems.flatMap((item) => item.change_reason_codes ?? []), (reason) => reasonLabels[reason] ?? reason);
  const changedPlanCounts = new Map<string, { changed: number; confirmed: number; id: string }>();
  for (const item of dataset.items.filter(isConfirmedPlanned)) {
    const key = item.planName || "未設定";
    const current = changedPlanCounts.get(key) ?? { changed: 0, confirmed: 0, id: item.planId ?? "" };
    current.confirmed += 1;
    if (item.change_type === "adjusted" || item.change_type === "skipped" || item.change_type === "replaced") current.changed += 1;
    changedPlanCounts.set(key, current);
  }
  return {
    plannedItems: planned.length,
    asPlanned: confirmedPlanned.filter((item) => item.change_type === "as_planned").length,
    adjusted: confirmedPlanned.filter((item) => item.change_type === "adjusted").length,
    skipped: confirmedPlanned.filter((item) => item.change_type === "skipped").length,
    replaced: confirmedPlanned.filter((item) => item.change_type === "replaced").length,
    libraryAdded: executedAdditions.filter((item) => item.item_source === "library").length,
    improvisedAdded: executedAdditions.filter((item) => item.item_source === "improvised").length,
    legacyUnclassified: dataset.items.filter((item) => item.change_type == null).length,
    plannedMinutes: planned.filter((item) => item.planned_duration_minutes != null).map((item) => item.planned_duration_minutes!).reduce(sum, 0),
    actualMinutes: dataset.items.filter(isActualItem).map((item) => item.actual_duration_minutes!).reduce(sum, 0),
    averageMinuteDifference: recordDifferences.length ? round1(average(recordDifferences)) : null,
    minuteDifferenceSamples: recordDifferences.length,
    reasons: rankedCounts(reasons),
    changedPlans: Array.from(changedPlanCounts.entries()).map(([label, value]) => ({ id: value.id, label, count: value.changed, detail: value.confirmed ? `${percent(value.changed, value.confirmed)}%（判定${value.confirmed}件）` : "データ不足" })).filter((row) => row.count > 0).sort((a, b) => b.count - a.count),
    skippedItems: rankedCounts(countBy(confirmedPlanned.filter((item) => item.change_type === "skipped"), itemName)),
    libraryAdditions: rankedCounts(countBy(executedAdditions.filter((item) => item.item_source === "library"), itemName), dataset.items),
    improvisedItems: rankedCounts(countBy(executedAdditions.filter((item) => item.item_source === "improvised"), (item) => item.actual_content_note?.trim() || itemName(item))),
    templatedImprovisedItems: rankedCounts(countBy(executedAdditions.filter((item) => item.item_source === "improvised" && Boolean(item.block_template_id)), itemName), dataset.items),
  };
}

function buildHints(data: ReportData) {
  const hints: string[] = [];
  const skipped = data.blocks.mostSkipped[0];
  if (skipped?.skippedCount) hints.push(`${skipped.name} は期間内に ${skipped.skippedCount}回スキップされています。`);
  const longPlan = data.plans.find((plan) => plan.averagePlannedMinutes != null && plan.averageActualMinutes != null && plan.averageActualMinutes > plan.averagePlannedMinutes + 5);
  if (longPlan) hints.push(`${longPlan.name} は実施時間が予定より長くなりやすい傾向です。`);
  const cancelComparison = data.summary.comparisons.cancelRate.delta;
  if (cancelComparison != null && cancelComparison > 0) hints.push(`キャンセル率が前期間より ${cancelComparison}ポイント増えています。`);
  if (data.execution.improvisedAdded >= 3) hints.push(`即興追加が ${data.execution.improvisedAdded}件あります。再利用できる内容はテンプレート化を検討できます。`);
  if (data.dataQuality.unevaluatedBlocks > 0) hints.push(`未評価ブロックが ${data.dataQuality.unevaluatedBlocks}件あります。反応ランキングの母数に含めていません。`);
  if (data.dataQuality.legacyUnclassifiedItems > 0) hints.push(`旧形式の差分未分類項目が ${data.dataQuality.legacyUnclassifiedItems}件あります。予定どおりへ推測分類していません。`);
  if (!hints.length) hints.push("期間内の大きな偏りは見つかりませんでした。記録を続けると比較精度が高まります。");
  return hints.slice(0, 5);
}

function buildBreakdown(entries: AttendanceEntry[], label: (entry: AttendanceEntry) => string): AttendanceBreakdownRow[] {
  const groups = groupBy(entries, label);
  return Array.from(groups.entries()).map(([name, rows]) => ({ label: name, present: rows.filter((row) => row.status === "present").length, cancelled: rows.filter((row) => row.status === "cancelled").length, noShow: rows.filter((row) => row.status === "no_show").length, total: rows.length })).sort((a, b) => a.label.localeCompare(b.label, "ja"));
}

function buildRatioRows(values: string[]) {
  const counts = countBy(values, (value) => value);
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count, percent: percent(count, values.length) })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ja"));
}

function rankBlocks(rows: BlockReportRow[], metric: (row: BlockReportRow) => number) { return [...rows].filter((row) => metric(row) > 0).sort((a, b) => metric(b) - metric(a) || a.name.localeCompare(b.name, "ja")).slice(0, 10); }
function isConfirmedPlanned(item: Pick<RawRecordItem, "item_source" | "change_type" | "done">) { return item.item_source === "planned" && item.done !== null && (item.change_type === "as_planned" || item.change_type === "adjusted" || item.change_type === "skipped" || item.change_type === "replaced"); }
function isExecutedAdded(item: Pick<RawRecordItem, "change_type" | "done">) { return item.change_type === "added" && item.done === true; }
function isExecutedItem(item: Pick<RawRecordItem, "item_source" | "change_type" | "done">) { return item.done === true && !(item.item_source === "planned" && item.change_type === "replaced"); }
function isActualItem(item: Pick<RawRecordItem, "item_source" | "change_type" | "done" | "actual_duration_minutes">) { return isExecutedItem(item) && item.actual_duration_minutes != null; }
function toCoverageSourceLesson(record: RawRecord) {
  return {
    lessonRecordId: record.id,
    scheduleId: record.schedule_id,
    lessonName: record.lesson_name,
    dateIso: recordDateIso(record),
    scheduleStatus: record.schedule?.status ?? null,
    closed: hasActiveClosure(record.schedule),
    items: (record.lesson_record_blocks ?? []).map(toCoverageSourceItem),
  };
}
function toCoverageSourceItem(item: RawRecordItem): LessonCoverageSourceItem {
  return {
    id: item.id,
    blockTemplateId: item.block_template_id,
    itemSource: item.item_source,
    changeType: item.change_type,
    done: item.done,
    actualDurationMinutes: item.actual_duration_minutes,
    displayNameSnapshot: item.display_name_snapshot,
    categoryNameSnapshot: item.category_name_snapshot,
    subcategoryNameSnapshot: item.subcategory_name_snapshot,
    purposeSnapshot: item.purpose_snapshot,
    tagsSnapshot: item.tags_snapshot,
    block: item.block ? {
      name: item.block.name,
      purpose: item.block.purpose,
      category: item.block.category,
      subcategory: item.block.subcategory,
      blockTemplateTags: item.block.block_template_tags,
    } : null,
  };
}
function lessonPlannedMinutes(lesson: PeriodDataset["lessons"][number]) { const itemMinutes = (lesson.record?.lesson_record_blocks ?? []).filter((item) => item.item_source === "planned" && item.planned_duration_minutes != null).map((item) => item.planned_duration_minutes!); return itemMinutes.length ? itemMinutes.reduce(sum, 0) : lesson.plannedMinutes; }
function itemName(item: Pick<RawRecordItem, "display_name_snapshot" | "block">) { return item.display_name_snapshot?.trim() || item.block?.name?.trim() || "名称未設定"; }
function recordDateIso(record: RawRecord) { return record.schedule?.starts_at ?? `${record.record_date}T00:00:00+09:00`; }
function normalizeGender(value: string | null) { return value ? genderLabels[value] ?? value : "未設定"; }
function normalizeAge(value: string | null) { return value?.trim() || "年齢不明"; }
function percent(part: number, total: number) { return total > 0 ? Math.round((part / total) * 100) : 0; }
function round1(value: number) { return Math.round(value * 10) / 10; }
function average(values: number[]) { return values.reduce(sum, 0) / values.length; }
function sum(total: number, value: number) { return total + value; }
function minutesBetween(start: string, end: string) { const minutes = Math.round((Date.parse(end) - Date.parse(start)) / 60_000); return Number.isFinite(minutes) && minutes >= 0 ? minutes : null; }
function compare(current: number | null, previous: number | null, hasPrevious: boolean): ComparisonValue { if (!hasPrevious || current == null || previous == null) return { previous: null, delta: null, percentChange: null }; const delta = round1(current - previous); return { previous, delta, percentChange: previous === 0 ? null : Math.round(((current - previous) / previous) * 100) }; }
function countBy<T>(values: T[], key: (value: T) => string) { const map = new Map<string, number>(); for (const value of values) { const label = key(value); if (label) map.set(label, (map.get(label) ?? 0) + 1); } return map; }
function rankedCounts(counts: Map<string, number>, items: PeriodDataset["items"] = []) { return Array.from(counts.entries()).map(([label, count]) => ({ label, count, id: items.find((item) => itemName(item) === label)?.block_template_id ?? undefined })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ja")); }
function groupBy<T>(values: T[], key: (value: T) => string) { const map = new Map<string, T[]>(); for (const value of values) { const label = key(value); map.set(label, [...(map.get(label) ?? []), value]); } return map; }
function uniqueBy<T>(values: T[], key: (value: T) => string) { const map = new Map<string, T>(); for (const value of values) if (!map.has(key(value))) map.set(key(value), value); return Array.from(map.values()); }

function emptyReport(query: ReportQuery, error: string, resolved?: ReportPeriod): ReportData {
  const fallbackDate = tokyoDateString(query.now ?? new Date());
  const period = resolved ?? { key: query.period, label: periodLabels[query.period], startDate: query.from ?? "", endDate: query.to ?? "", startIso: "", endExclusiveIso: "", previousStartDate: "", previousEndDate: "", previousStartIso: "", previousEndExclusiveIso: "" };
  const emptyComparison = { previous: null, delta: null, percentChange: null };
  return {
    period: { ...period, startDate: period.startDate || fallbackDate, endDate: period.endDate || fallbackDate },
    error,
    hasAnyData: false,
    filters: { format: query.format ?? "all", plan: query.plan ?? "all", place: query.place ?? "all", plans: [], places: [] },
    summary: { totalLessons: 0, recordedLessons: 0, recordRate: 0, totalParticipants: 0, uniqueStudents: 0, cancelCount: 0, cancelRate: 0, noShowCount: 0, noShowRate: 0, changeRate: null, addedCount: 0, comparisons: { totalLessons: emptyComparison, totalParticipants: emptyComparison, uniqueStudents: emptyComparison, cancelRate: emptyComparison, recordRate: emptyComparison, changeRate: emptyComparison } },
    attendance: { present: 0, cancelled: 0, noShow: 0, cancelRate: 0, noShowRate: 0, trendGranularity: "day", trend: [], byFormat: [], byPlace: [] },
    students: { all: { total: 0, genderRows: [], ageRows: [] }, participants: { total: 0, genderRows: [], ageRows: [], newEquivalentCount: 0 } },
    plans: [],
    blocks: { mostUsed: [], goodReaction: [], mostSkipped: [], mostAdjusted: [], mostReplaced: [], improvementHeavy: [], unused: [] },
    execution: { plannedItems: 0, asPlanned: 0, adjusted: 0, skipped: 0, replaced: 0, libraryAdded: 0, improvisedAdded: 0, legacyUnclassified: 0, plannedMinutes: 0, actualMinutes: 0, averageMinuteDifference: null, minuteDifferenceSamples: 0, reasons: [], changedPlans: [], skippedItems: [], libraryAdditions: [], improvisedItems: [], templatedImprovisedItems: [] },
    coverage: emptyLessonCoverageReport(),
    closures: {
      closedCount: 0,
      heldCount: 0,
      closeRate: null,
      unclassifiedPastCount: 0,
      futureClosedCount: 0,
      comparisons: { closedCount: emptyComparison, heldCount: emptyComparison, closeRate: emptyComparison, unclassifiedPastCount: emptyComparison },
      byReason: [],
      byWeekday: [],
      byTimeBand: [],
      byPlace: [],
      byPlan: [],
      byFormat: [],
      items: [],
    },
    hints: [],
    dataQuality: { lessons: 0, recordedLessons: 0, recordRate: 0, unevaluatedBlocks: 0, legacyUnclassifiedItems: 0, missingActualMinutes: 0 },
  };
}

function tokyoDateString(date: Date) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date); }
function startOfTokyoDay(date: string) { return `${date}T00:00:00+09:00`; }
function isValidDateString(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const [year, month, day] = value.split("-").map(Number); const date = new Date(Date.UTC(year, month - 1, day)); return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day; }
function addDays(value: string, amount: number) { const [year, month, day] = value.split("-").map(Number); const date = new Date(Date.UTC(year, month - 1, day + amount)); return date.toISOString().slice(0, 10); }
function addMonthsClamped(value: string, amount: number) { const [year, month, day] = value.split("-").map(Number); const target = new Date(Date.UTC(year, month - 1 + amount, 1)); const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate(); target.setUTCDate(Math.min(day, lastDay)); return target.toISOString().slice(0, 10); }
function lastDayOfMonth(value: string) { const [year, month] = value.split("-").map(Number); return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10); }
function dateDiffDays(from: string, to: string) { return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000); }
function startOfWeekDate(value: string) { const day = new Date(`${value}T00:00:00Z`).getUTCDay(); return addDays(value, -(day === 0 ? 6 : day - 1)); }
function formatCompactDate(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value; const [, month, day] = value.split("-"); return `${Number(month)}/${Number(day)}`; }
