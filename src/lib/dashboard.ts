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
};

export type DashboardData = {
  todayLabel: string;
  monthLabel: string;
  todayKey: string;
  calendarDays: Array<{
    key: string;
    day: number | null;
    inMonth: boolean;
    isToday: boolean;
    schedules: DashboardSchedule[];
  }>;
  schedulesByDate: Record<string, DashboardSchedule[]>;
  tasks: DashboardTask[];
  suggestions: string[];
  attentionStudents: DashboardAttentionStudent[];
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
      todayLabel: formatDateJa(now),
      monthLabel: formatMonthJa(now),
      todayKey,
      calendarDays: buildCalendarDays(now, {}),
      schedulesByDate: {},
      tasks: [],
      suggestions: [],
      attentionStudents: [],
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

  const [schedulesResult, recordsResult, studentsResult] = await Promise.all([
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
  ]);

  if (schedulesResult.error) throw new Error(`予定を取得できませんでした: ${schedulesResult.error.message}`);
  if (recordsResult.error) throw new Error(`実施後記録を取得できませんでした: ${recordsResult.error.message}`);
  if (studentsResult.error) throw new Error(`生徒情報を取得できませんでした: ${studentsResult.error.message}`);

  const schedules = ((schedulesResult.data ?? []) as unknown as RawSchedule[]).map(mapSchedule);
  const records = (recordsResult.data ?? []) as unknown as RawRecord[];
  const students = (studentsResult.data ?? []) as RawStudent[];
  const schedulesByDate = groupSchedulesByDate(schedules.filter((schedule) => isWithinMonth(schedule.dateKey, monthStart)));
  const completedScheduleIds = new Set(records.filter((record) => record.schedule_id).map((record) => record.schedule_id as string));
  const tasks = buildTasks({ schedules, records, students, todayKey, completedScheduleIds });
  const suggestions = buildSuggestions({ tasks, todaySchedules: schedules.filter((schedule) => schedule.dateKey === todayKey), records, schedules });
  const attentionStudents = buildAttentionStudents(students, records, schedules, todayKey);

  return {
    todayLabel: formatDateJa(now),
    monthLabel: formatMonthJa(now),
    todayKey,
    calendarDays: buildCalendarDays(now, schedulesByDate),
    schedulesByDate,
    tasks,
    suggestions,
    attentionStudents,
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
      title: schedule.lessonPlanName !== "未設定" ? schedule.lessonPlanName : schedule.lessonName,
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
      title: schedule.lessonPlanName !== "未設定" ? schedule.lessonPlanName : schedule.lessonName,
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
  for (const follow of getFollowRows(records).slice(0, 3)) {
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
      href: `/students/${student.id}`,
      actionLabel: "生徒カルテを見る",
    });
  }

  return tasks.slice(0, 6);
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
  const followCount = getFollowRows(records).length;
  const todayParticipantCount = todaySchedules.reduce((sum, schedule) => sum + schedule.participantCount, 0);
  const planCount = new Set(schedules.map((schedule) => schedule.lessonPlanId).filter(Boolean)).size;

  if (pendingCount > 0) suggestions.push(`記録待ちのレッスンが${pendingCount}件あります。記憶が新しいうちに記録しましょう。`);
  if (todaySchedules.length > 0) suggestions.push(`今日の予定は${todaySchedules.length}件、参加予定生徒は${todayParticipantCount}名です。注意点を事前に確認しましょう。`);
  if (followCount > 0) suggestions.push(`次回フォローが残っている生徒が${followCount}名います。生徒カルテで確認しましょう。`);
  if (planCount < 3) suggestions.push("レッスンプランがまだ少なめです。ブロックテンプレートを組み合わせて準備を増やしましょう。");

  return suggestions.slice(0, 4);
}

function buildAttentionStudents(students: RawStudent[], records: RawRecord[], schedules: DashboardSchedule[], todayKey: string) {
  const followRows = getFollowRows(records);
  const followByStudent = new Map<string, string>();
  for (const row of followRows) {
    if (!followByStudent.has(row.student_id) && row.next_follow) followByStudent.set(row.student_id, row.next_follow);
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
      nextFollow: followByStudent.get(student.id) ?? "",
    }))
    .slice(0, 4);
}

function getFollowRows(records: RawRecord[]) {
  return records.flatMap((record) => record.lesson_record_students ?? []).filter((row) => Boolean(row.next_follow?.trim()));
}

function buildCalendarDays(date: Date, schedulesByDate: Record<string, DashboardSchedule[]>) {
  const monthStart = getTokyoMonthStart(date);
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const startOffset = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const gridStart = new Date(year, month, 1 - startOffset);
  const todayKey = dateKeyInTokyo(date);

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + index);
    const key = dateKeyInTokyo(current);
    const inMonth = current.getMonth() === month;
    return {
      key,
      day: inMonth ? current.getDate() : null,
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
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" }).format(date);
}

function formatMonthJa(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", timeZone: "Asia/Tokyo" }).format(date);
}
