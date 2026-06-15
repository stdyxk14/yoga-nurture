import { formatJapaneseDate, formatJapaneseMonth } from "@/lib/date-format";
import { requireUserId } from "@/lib/students";

export type DashboardScheduleStatus = "scheduled" | "preparing" | "prepared" | "record_pending" | "recorded";

export type DashboardSchedule = {
  id: string;
  dateKey: string;
  day: number;
  startTime: string;
  endTime: string;
  lessonName: string;
  lessonPlanId: string | null;
  lessonPlanName: string;
  lessonPlanStatus: string | null;
  place: string;
  status: DashboardScheduleStatus;
  statusLabel: string;
  participantCount: number;
  participantIds: string[];
};

export type DashboardTask = {
  id: string;
  kind: "today" | "record_pending" | "prepare" | "follow";
  time: string;
  title: string;
  note: string;
  statusLabel: string;
  tone: "gray" | "beige" | "green" | "orange" | "pink";
  href: string;
  actionLabel: string;
};

export type DashboardAttentionStudent = {
  id: string;
  name: string;
  ageGroup: string;
  gender: string;
  caution: string;
  memo: string;
  nextFollow: string;
  followLessonName?: string;
  followDate?: string;
};

export type DashboardInsight = {
  id: string;
  dateKey: string;
  lessonName: string;
  studentName: string;
  todayNote: string;
  personalMemo: string;
  nextFollow: string;
  href: string;
};

export type DashboardData = {
  greeting: string;
  todayLabel: string;
  monthLabel: string;
  totals: {
    students: number;
    blocks: number;
    lessonPlans: number;
    schedules: number;
    records: number;
    knowledgeDocuments: number;
    aiSuggestions: number;
  };
  todayKey: string;
  calendarDays: Array<{
    key: string;
    day: number | null;
    inMonth: boolean;
    isToday: boolean;
    schedules: DashboardSchedule[];
  }>;
  schedulesByDate: Record<string, DashboardSchedule[]>;
  upcomingSchedules: DashboardSchedule[];
  recordPendingSchedules: DashboardSchedule[];
  tasks: DashboardTask[];
  suggestions: string[];
  attentionStudents: DashboardAttentionStudent[];
  recentInsights: DashboardInsight[];
  error?: string;
};

type RawSchedule = {
  id: string;
  lesson_plan_id: string | null;
  lesson_name: string;
  starts_at: string;
  ends_at: string;
  place: string | null;
  status: DashboardScheduleStatus;
  lesson_plan?: { id: string; name: string | null; status: string | null } | null;
  schedule_participants?: Array<{ id: string; student_id: string }>;
};

type RawRecord = {
  id: string;
  schedule_id: string | null;
  lesson_name: string;
  record_date: string;
  schedule?: { id: string; starts_at: string | null } | null;
  lesson_record_students?: Array<{
    id: string;
    student_id: string;
    attendance_status: "present" | "cancelled" | "no_show";
    condition: string | null;
    memo: string | null;
    next_follow: string | null;
    student?: RawStudent | null;
  }>;
};

type RawStudent = {
  id: string;
  name: string;
  age_group: string | null;
  gender: string | null;
  caution: string | null;
  memo: string | null;
};

const statusLabels: Record<DashboardScheduleStatus, string> = {
  scheduled: "予定",
  preparing: "準備中",
  prepared: "準備済み",
  record_pending: "記録待ち",
  recorded: "記録済み",
};

const genderLabels: Record<string, string> = {
  female: "女性",
  male: "男性",
  other: "その他",
  prefer_not_to_say: "回答しない",
};

export async function getDashboardData(): Promise<DashboardData> {
  try {
    return await fetchDashboardData();
  } catch (error) {
    const now = new Date();
    const todayKey = dateKeyInTokyo(now);
    return {
      greeting: getGreetingJa(now),
      todayLabel: formatDateJa(now),
      monthLabel: formatMonthJa(now),
      totals: { students: 0, blocks: 0, lessonPlans: 0, schedules: 0, records: 0, knowledgeDocuments: 0, aiSuggestions: 0 },
      todayKey,
      calendarDays: buildCalendarDays(now, {}),
      schedulesByDate: {},
      upcomingSchedules: [],
      recordPendingSchedules: [],
      tasks: [],
      suggestions: [],
      attentionStudents: [],
      recentInsights: [],
      error: error instanceof Error ? error.message : "ダッシュボードデータを取得できませんでした。",
    };
  }
}

async function fetchDashboardData(): Promise<DashboardData> {
  const { supabase } = await requireUserId();
  const now = new Date();
  const todayKey = dateKeyInTokyo(now);
  const monthStart = getTokyoMonthStart(now);
  const monthEnd = getTokyoMonthEnd(now);
  const queryStart = addDays(monthStart, -30).toISOString();
  const queryEnd = addDays(monthEnd, 30).toISOString();

  const [schedulesResult, recordsResult, studentsResult, blocksCountResult, plansCountResult, schedulesCountResult, recordsCountResult, knowledgeCountResult, aiSuggestionsCountResult] = await Promise.all([
    supabase
      .from("schedules")
      .select(`
        id,
        lesson_plan_id,
        lesson_name,
        starts_at,
        ends_at,
        place,
        status,
        lesson_plan:lesson_plans(id,name,status),
        schedule_participants(id,student_id)
      `)
      .gte("starts_at", queryStart)
      .lte("starts_at", queryEnd)
      .order("starts_at", { ascending: true }),
    supabase
      .from("lesson_records")
      .select(`
        id,
        schedule_id,
        lesson_name,
        record_date,
        schedule:schedules(id,starts_at),
        lesson_record_students(
          id,
          student_id,
          attendance_status,
          condition,
          memo,
          next_follow,
          student:students(id,name,age_group,gender,caution,memo)
        )
      `)
      .order("updated_at", { ascending: false })
      .limit(80),
    supabase
      .from("students")
      .select("id,name,age_group,gender,caution,memo")
      .eq("archived", false)
      .order("updated_at", { ascending: false })
      .limit(80),
    supabase.from("block_templates").select("id", { count: "exact", head: true }).eq("archived", false),
    supabase.from("lesson_plans").select("id", { count: "exact", head: true }).neq("status", "archived"),
    supabase.from("schedules").select("id", { count: "exact", head: true }),
    supabase.from("lesson_records").select("id", { count: "exact", head: true }),
    supabase.from("knowledge_documents").select("id", { count: "exact", head: true }).neq("status", "archived"),
    supabase.from("ai_suggestions").select("id", { count: "exact", head: true }),
  ]);

  if (schedulesResult.error) throw new Error(`予定を取得できませんでした: ${schedulesResult.error.message}`);
  if (recordsResult.error) throw new Error(`実施後記録を取得できませんでした: ${recordsResult.error.message}`);
  if (studentsResult.error) throw new Error(`生徒情報を取得できませんでした: ${studentsResult.error.message}`);
  if (blocksCountResult.error) throw new Error(`ブロック数を取得できませんでした: ${blocksCountResult.error.message}`);
  if (plansCountResult.error) throw new Error(`レッスンプラン数を取得できませんでした: ${plansCountResult.error.message}`);

  const schedules = ((schedulesResult.data ?? []) as unknown as RawSchedule[]).map(mapSchedule);
  const records = (recordsResult.data ?? []) as unknown as RawRecord[];
  const students = (studentsResult.data ?? []) as RawStudent[];
  const schedulesByDate = groupSchedulesByDate(schedules.filter((schedule) => isWithinMonth(schedule.dateKey, monthStart)));
  const completedScheduleIds = new Set(records.filter((record) => record.schedule_id).map((record) => record.schedule_id as string));
  const recordPendingSchedules = buildRecordPendingSchedules(schedules, todayKey, completedScheduleIds);
  const upcomingSchedules = schedules.filter((schedule) => schedule.dateKey >= todayKey).slice(0, 8);
  const tasks = buildTasks({ schedules, records, students, todayKey, completedScheduleIds });
  const suggestions = buildSuggestions({ tasks, todaySchedules: schedules.filter((schedule) => schedule.dateKey === todayKey), records, schedules });
  const attentionStudents = buildAttentionStudents(students, records, schedules, todayKey);
  const recentInsights = buildRecentInsights(records);

  return {
    greeting: getGreetingJa(now),
    todayLabel: formatDateJa(now),
    monthLabel: formatMonthJa(now),
    totals: {
      students: students.length,
      blocks: blocksCountResult.count ?? 0,
      lessonPlans: plansCountResult.count ?? 0,
      schedules: schedulesCountResult.error ? 0 : schedulesCountResult.count ?? 0,
      records: recordsCountResult.error ? 0 : recordsCountResult.count ?? 0,
      knowledgeDocuments: knowledgeCountResult.error ? 0 : knowledgeCountResult.count ?? 0,
      aiSuggestions: aiSuggestionsCountResult.error ? 0 : aiSuggestionsCountResult.count ?? 0,
    },
    todayKey,
    calendarDays: buildCalendarDays(now, schedulesByDate),
    schedulesByDate,
    upcomingSchedules,
    recordPendingSchedules,
    tasks,
    suggestions,
    attentionStudents,
    recentInsights,
  };
}

function mapSchedule(row: RawSchedule): DashboardSchedule {
  const start = new Date(row.starts_at);
  return {
    id: row.id,
    dateKey: dateKeyInTokyo(start),
    day: Number(dateKeyInTokyo(start).slice(-2)),
    startTime: formatTimeJa(row.starts_at),
    endTime: formatTimeJa(row.ends_at),
    lessonName: row.lesson_name,
    lessonPlanId: row.lesson_plan_id,
    lessonPlanName: row.lesson_plan?.name ?? "未設定",
    lessonPlanStatus: row.lesson_plan?.status ?? null,
    place: row.place ?? "未設定",
    status: row.status,
    statusLabel: statusLabels[row.status] ?? "予定",
    participantCount: row.schedule_participants?.length ?? 0,
    participantIds: (row.schedule_participants ?? []).map((participant) => participant.student_id),
  };
}

function buildTasks({
  schedules,
  records,
  students,
  todayKey,
  completedScheduleIds,
}: {
  schedules: DashboardSchedule[];
  records: RawRecord[];
  students: RawStudent[];
  todayKey: string;
  completedScheduleIds: Set<string>;
}) {
  const tasks: DashboardTask[] = [];
  const todaySchedules = schedules.filter((schedule) => schedule.dateKey === todayKey);

  for (const schedule of todaySchedules) {
    tasks.push({
      id: `today-${schedule.id}`,
      kind: "today",
      time: schedule.startTime,
      title: displayScheduleName(schedule),
      note: `${schedule.place} / 参加予定 ${schedule.participantCount}名`,
      statusLabel: schedule.statusLabel,
      tone: schedule.status === "prepared" || schedule.status === "recorded" ? "green" : "gray",
      href: schedule.lessonPlanId ? `/lessons/${schedule.lessonPlanId}` : `/schedules/${schedule.id}`,
      actionLabel: schedule.lessonPlanId ? "プランを見る" : "予定を見る",
    });
  }

  const pending = schedules
    .filter((schedule) => schedule.dateKey < todayKey && schedule.status !== "recorded" && !completedScheduleIds.has(schedule.id))
    .slice(0, 3);
  for (const schedule of pending) {
    tasks.push({
      id: `pending-${schedule.id}`,
      kind: "record_pending",
      time: schedule.dateKey,
      title: displayScheduleName(schedule),
      note: "レッスン後の記録がまだ保存されていません。",
      statusLabel: "記録待ち",
      tone: "orange",
      href: `/lessons/${schedule.id}/record`,
      actionLabel: "記録を書く",
    });
  }

  const prepare = schedules
    .filter((schedule) => schedule.dateKey >= todayKey && (!schedule.lessonPlanId || schedule.lessonPlanStatus === "draft"))
    .slice(0, 3);
  for (const schedule of prepare) {
    tasks.push({
      id: `prepare-${schedule.id}`,
      kind: "prepare",
      time: schedule.dateKey,
      title: schedule.lessonName,
      note: schedule.lessonPlanId ? "レッスンプランが下書きです。" : "レッスンプランが未設定です。",
      statusLabel: "準備が必要",
      tone: "beige",
      href: schedule.lessonPlanId ? `/lessons/${schedule.lessonPlanId}/edit` : "/lessons/new",
      actionLabel: "プランを準備",
    });
  }

  const studentById = new Map(students.map((student) => [student.id, student]));
  for (const follow of getFollowItems(records).slice(0, 3)) {
    const student = follow.student ?? studentById.get(follow.student_id);
    if (!student) continue;
    tasks.push({
      id: `follow-${follow.id}`,
      kind: "follow",
      time: "フォロー",
      title: student.name,
      note: follow.next_follow ?? "",
      statusLabel: "要フォロー",
      tone: "pink",
      href: `/students/${student.id}#next-follow`,
      actionLabel: "生徒カルテを見る",
    });
  }

  return tasks.slice(0, 6);
}

function buildRecordPendingSchedules(schedules: DashboardSchedule[], todayKey: string, completedScheduleIds: Set<string>) {
  return schedules
    .filter((schedule) => schedule.dateKey < todayKey && schedule.status !== "recorded" && !completedScheduleIds.has(schedule.id))
    .slice(0, 5);
}

function buildSuggestions({
  tasks,
  todaySchedules,
  records,
  schedules,
}: {
  tasks: DashboardTask[];
  todaySchedules: DashboardSchedule[];
  records: RawRecord[];
  schedules: DashboardSchedule[];
}) {
  const suggestions: string[] = [];
  const pendingCount = tasks.filter((task) => task.kind === "record_pending").length;
  const followCount = getFollowItems(records).length;
  const todayParticipantCount = todaySchedules.reduce((sum, schedule) => sum + schedule.participantCount, 0);
  const planCount = new Set(schedules.map((schedule) => schedule.lessonPlanId).filter(Boolean)).size;

  if (pendingCount > 0) suggestions.push(`記録待ちのレッスンが${pendingCount}件あります。記憶が新しいうちに記録しましょう。`);
  if (todaySchedules.length > 0) suggestions.push(`今日の予定は${todaySchedules.length}件、参加予定生徒は${todayParticipantCount}名です。注意点を事前に確認しましょう。`);
  if (followCount > 0) suggestions.push(`次回フォローが残っている生徒が${followCount}名います。生徒カルテで確認しましょう。`);
  if (planCount < 3) suggestions.push("レッスンプランがまだ少なめです。ブロックテンプレートを組み合わせて準備を増やしましょう。");

  return suggestions.slice(0, 4);
}

function buildAttentionStudents(students: RawStudent[], records: RawRecord[], schedules: DashboardSchedule[], todayKey: string) {
  const followRows = getFollowItems(records);
  const followByStudent = new Map<string, { text: string; lessonName: string; date: string }>();
  for (const row of followRows) {
    if (!followByStudent.has(row.student_id) && row.next_follow) {
      followByStudent.set(row.student_id, {
        text: row.next_follow,
        lessonName: row.record.lesson_name,
        date: row.record.record_date,
      });
    }
  }

  const upcomingParticipantIds = new Set<string>();
  const upcomingLimit = addDays(new Date(`${todayKey}T00:00:00+09:00`), 14);
  for (const schedule of schedules) {
    const scheduleDate = new Date(`${schedule.dateKey}T00:00:00+09:00`);
    if (scheduleDate <= upcomingLimit) {
      for (const studentId of schedule.participantIds) upcomingParticipantIds.add(studentId);
    }
  }

  return students
    .filter((student) => Boolean(student.caution?.trim() || student.memo?.trim() || followByStudent.get(student.id) || upcomingParticipantIds.has(student.id)))
    .map((student) => ({
      id: student.id,
      name: student.name,
      ageGroup: student.age_group || "未設定",
      gender: genderLabels[student.gender ?? ""] ?? "未設定",
      caution: student.caution ?? "",
      memo: student.memo ?? "",
      nextFollow: followByStudent.get(student.id)?.text ?? "",
      followLessonName: followByStudent.get(student.id)?.lessonName,
      followDate: followByStudent.get(student.id)?.date,
    }))
    .slice(0, 4);
}

function getFollowItems(records: RawRecord[]) {
  return records.flatMap((record) => (record.lesson_record_students ?? []).map((row) => ({ ...row, record }))).filter((row) => Boolean(row.next_follow?.trim()));
}

function buildRecentInsights(records: RawRecord[]): DashboardInsight[] {
  return records
    .flatMap((record) => (record.lesson_record_students ?? []).map((row) => ({ record, row })))
    .filter(({ row }) => Boolean(row.condition?.trim() || row.memo?.trim() || row.next_follow?.trim()))
    .slice(0, 4)
    .map(({ record, row }) => ({
      id: row.id,
      dateKey: record.record_date.slice(0, 10),
      lessonName: record.lesson_name,
      studentName: row.student?.name ?? "生徒",
      todayNote: row.condition ?? "",
      personalMemo: row.memo ?? "",
      nextFollow: row.next_follow ?? "",
      href: record.schedule_id ? `/lessons/${record.schedule_id}/record` : "/lessons?tab=records",
    }));
}

function buildCalendarDays(date: Date, schedulesByDate: Record<string, DashboardSchedule[]>) {
  const [year, month] = dateKeyInTokyo(date).split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekday = firstDay.getUTCDay();
  const startOffset = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const gridStart = new Date(Date.UTC(year, month - 1, 1 - startOffset));
  const todayKey = dateKeyInTokyo(date);

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(gridStart);
    current.setUTCDate(gridStart.getUTCDate() + index);
    const key = `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, "0")}-${String(current.getUTCDate()).padStart(2, "0")}`;
    const inMonth = current.getUTCMonth() === month - 1;
    return {
      key,
      day: inMonth ? current.getUTCDate() : null,
      inMonth,
      isToday: key === todayKey,
      schedules: schedulesByDate[key] ?? [],
    };
  });
}

function groupSchedulesByDate(schedules: DashboardSchedule[]) {
  return schedules.reduce<Record<string, DashboardSchedule[]>>((acc, schedule) => {
    acc[schedule.dateKey] ??= [];
    acc[schedule.dateKey].push(schedule);
    return acc;
  }, {});
}

function isWithinMonth(dateKey: string, monthStart: Date) {
  const month = dateKey.slice(0, 7);
  return month === dateKeyInTokyo(monthStart).slice(0, 7);
}

function getTokyoMonthStart(date: Date) {
  const [year, month] = dateKeyInTokyo(date).split("-").map(Number);
  return new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+09:00`);
}

function getTokyoMonthEnd(date: Date) {
  const start = getTokyoMonthStart(date);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setMilliseconds(end.getMilliseconds() - 1);
  return end;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dateKeyInTokyo(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function formatTimeJa(value: string) {
  return new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tokyo" }).format(new Date(value));
}

function formatDateJa(date: Date) {
  return formatJapaneseDate(date);
}

function formatMonthJa(date: Date) {
  return formatJapaneseMonth(date);
}

function getGreetingJa(date: Date) {
  const hourPart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone: "Asia/Tokyo",
  })
    .formatToParts(date)
    .find((part) => part.type === "hour")?.value;
  const hour = Number(hourPart ?? "0") % 24;

  if (hour >= 5 && hour <= 10) {
    return "おはようございます";
  }

  if (hour >= 11 && hour <= 16) {
    return "こんにちは";
  }

  return "こんばんは";
}

function displayScheduleName(schedule: DashboardSchedule) {
  return schedule.lessonPlanId ? schedule.lessonPlanName : schedule.lessonName;
}
