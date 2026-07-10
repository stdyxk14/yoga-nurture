import { notFound } from "next/navigation";
import { formatJapaneseDate } from "@/lib/date-format";
import { requireUserId } from "@/lib/students";
import { getFormatLabel, type DbLessonPlan } from "@/lib/lesson-plans";
import { toGenderCode, toGenderLabel } from "@/lib/student-fields";
import type { StudentRecord } from "@/components/yoga/records";

export type ScheduleStatus = "scheduled" | "preparing" | "prepared" | "record_pending" | "recorded";

export type ScheduleParticipant = StudentRecord & {
  participantId: string;
  attendanceStatus: "present" | "cancelled" | "no_show";
  attendanceLabel: string;
  pendingFollowUps?: Array<{
    text: string;
    personalMemo: string;
    lessonName: string;
    date: string;
  }>;
};

export type DbSchedule = {
  id: string;
  lessonPlanId: string | null;
  lessonName: string;
  startsAt: string;
  endsAt: string;
  dateLabel: string;
  startTimeLabel: string;
  endTimeLabel: string;
  place: string;
  format: "personal" | "group" | "online" | "";
  formatLabel: string;
  scheduleCaution: string;
  scheduleMemo: string;
  status: ScheduleStatus;
  statusLabel: string;
  lessonPlanName: string;
  participantCount: number;
  participants: ScheduleParticipant[];
  createdAt: string;
  updatedAt: string;
};

export type ScheduleFormState = {
  error?: string;
};

type RawSchedule = {
  id: string;
  lesson_plan_id: string | null;
  lesson_name: string;
  starts_at: string;
  ends_at: string;
  place: string | null;
  format: "personal" | "group" | "online" | null;
  schedule_caution?: string | null;
  schedule_memo?: string | null;
  status: ScheduleStatus;
  created_at: string;
  updated_at: string;
  lesson_plan?: { id: string; name: string | null } | null;
  schedule_participants?: RawParticipant[];
};

type RawParticipant = {
  id: string;
  attendance_status: "present" | "cancelled" | "no_show";
  student?: {
    id: string;
    name: string;
    kana: string | null;
    age_group: string | null;
    gender: string | null;
    experience: string | null;
    caution: string | null;
    memo: string | null;
  } | null;
};

export const scheduleStatusOptions: Array<{ value: ScheduleStatus; label: string }> = [
  { value: "scheduled", label: "予定" },
  { value: "preparing", label: "事前準備中" },
  { value: "prepared", label: "事前準備済み" },
  { value: "record_pending", label: "記録待ち" },
  { value: "recorded", label: "記録済み" },
];

export function getScheduleStatusLabel(status: ScheduleStatus) {
  return scheduleStatusOptions.find((option) => option.value === status)?.label ?? "予定";
}

export function getAttendanceLabel(status: ScheduleParticipant["attendanceStatus"]) {
  if (status === "cancelled") return "キャンセル";
  if (status === "no_show") return "無断欠席";
  return "参加予定";
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return {
    dateLabel: formatJapaneseDate(date),
    timeLabel: new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tokyo" }).format(date),
  };
}

function mapParticipant(row: RawParticipant): ScheduleParticipant | null {
  if (!row.student) return null;
  const genderCode = toGenderCode(row.student.gender ?? "");
  return {
    id: row.student.id,
    name: row.student.name,
    kana: row.student.kana ?? "",
    ageGroup: row.student.age_group ?? "",
    gender: toGenderLabel(genderCode),
    genderCode,
    experience: row.student.experience ?? "",
    caution: row.student.caution ?? "",
    memo: row.student.memo ?? "",
    lastLessonDate: "未記録",
    linkedLessonCount: 0,
    status: row.student.caution ? "caution" : "recent",
    participantId: row.id,
    attendanceStatus: row.attendance_status,
    attendanceLabel: getAttendanceLabel(row.attendance_status),
    pendingFollowUps: [],
  };
}

function mapSchedule(row: RawSchedule): DbSchedule {
  const start = formatDateTime(row.starts_at);
  const end = formatDateTime(row.ends_at);
  const participants = (row.schedule_participants ?? []).map(mapParticipant).filter((item): item is ScheduleParticipant => Boolean(item));

  return {
    id: row.id,
    lessonPlanId: row.lesson_plan_id,
    lessonName: row.lesson_name,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    dateLabel: start.dateLabel,
    startTimeLabel: start.timeLabel,
    endTimeLabel: end.timeLabel,
    place: row.place ?? "",
    format: row.format ?? "",
    formatLabel: getFormatLabel(row.format ?? ""),
    scheduleCaution: row.schedule_caution ?? "",
    scheduleMemo: row.schedule_memo ?? "",
    status: row.status,
    statusLabel: getScheduleStatusLabel(row.status),
    lessonPlanName: row.lesson_plan?.name ?? "未設定",
    participantCount: participants.length,
    participants,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getSchedules() {
  const { supabase } = await requireUserId();
  const withNotes = await supabase
    .from("schedules")
    .select(scheduleSelect(true))
    .order("starts_at", { ascending: true });

  if (!withNotes.error) return enrichScheduleParticipants(((withNotes.data ?? []) as unknown as RawSchedule[]).map(mapSchedule));

  if (!isMissingScheduleNotesError(withNotes.error.message)) {
    throw new Error(`予定を取得できませんでした: ${withNotes.error.message}`);
  }

  const fallback = await supabase
    .from("schedules")
    .select(scheduleSelect(false))
    .order("starts_at", { ascending: true });

  if (fallback.error) throw new Error(`予定を取得できませんでした: ${fallback.error.message}`);
  return enrichScheduleParticipants(((fallback.data ?? []) as unknown as RawSchedule[]).map(mapSchedule));
}

type RawParticipantRecordInsight = {
  student_id: string;
  attendance_status: "present" | "cancelled" | "no_show" | null;
  memo: string | null;
  next_follow: string | null;
  follow_up_status?: "none" | "pending" | "completed" | "dismissed" | null;
  record?: {
    lesson_name: string | null;
    record_date: string | null;
    schedule?: { starts_at: string | null } | null;
  } | null;
};

async function enrichScheduleParticipants(schedules: DbSchedule[]) {
  const studentIds = Array.from(new Set(schedules.flatMap((schedule) => schedule.participants.map((student) => student.id))));
  if (!studentIds.length) return schedules;

  const { supabase } = await requireUserId();
  const result = await supabase
    .from("lesson_record_students")
    .select(`
      student_id,
      attendance_status,
      memo,
      next_follow,
      follow_up_status,
      record:lesson_records(
        lesson_name,
        record_date,
        schedule:schedules(starts_at)
      )
    `)
    .in("student_id", studentIds)
    .order("created_at", { ascending: false });

  let rows = (result.data ?? []) as unknown as RawParticipantRecordInsight[];
  if (result.error) {
    const fallback = await supabase
      .from("lesson_record_students")
      .select(`
        student_id,
        attendance_status,
        memo,
        next_follow,
        record:lesson_records(
          lesson_name,
          record_date,
          schedule:schedules(starts_at)
        )
      `)
      .in("student_id", studentIds)
      .order("created_at", { ascending: false });
    if (fallback.error) return schedules;
    rows = (fallback.data ?? []) as unknown as RawParticipantRecordInsight[];
  }

  const attendedCountByStudent = new Map<string, number>();
  const followUpsByStudent = new Map<string, ScheduleParticipant["pendingFollowUps"]>();

  for (const row of rows) {
    if (row.attendance_status === "present") {
      attendedCountByStudent.set(row.student_id, (attendedCountByStudent.get(row.student_id) ?? 0) + 1);
    }

    const followText = row.next_follow?.trim();
    const followStatus = row.follow_up_status ?? (followText ? "pending" : "none");
    if (followText && followStatus === "pending") {
      const items = followUpsByStudent.get(row.student_id) ?? [];
      items.push({
        text: followText,
        personalMemo: row.memo ?? "",
        lessonName: row.record?.lesson_name ?? "レッスン",
        date: formatJapaneseDate(new Date(row.record?.schedule?.starts_at ?? row.record?.record_date ?? new Date())),
      });
      followUpsByStudent.set(row.student_id, items);
    }
  }

  return schedules.map((schedule) => ({
    ...schedule,
    participants: schedule.participants.map((student) => ({
      ...student,
      linkedLessonCount: attendedCountByStudent.get(student.id) ?? 0,
      pendingFollowUps: (followUpsByStudent.get(student.id) ?? []).slice(0, 3),
    })),
  }));
}

function scheduleSelect(includeNotes: boolean) {
  return `
      id,
      lesson_plan_id,
      lesson_name,
      starts_at,
      ends_at,
      place,
      format,
      ${includeNotes ? "schedule_caution," : ""}
      ${includeNotes ? "schedule_memo," : ""}
      status,
      created_at,
      updated_at,
      lesson_plan:lesson_plans(id,name),
      schedule_participants(
        id,
        attendance_status,
        student:students(id,name,kana,age_group,gender,experience,caution,memo)
      )
    `;
}

function isMissingScheduleNotesError(message: string) {
  return message.includes("schedule_caution") || message.includes("schedule_memo");
}

export async function getScheduleById(id: string) {
  const schedules = await getSchedules();
  const schedule = schedules.find((item) => item.id === id);
  if (!schedule) notFound();
  return schedule;
}

export function getSchedulePayload(formData: FormData, plans: DbLessonPlan[]) {
  const lessonPlanId = String(formData.get("lesson_plan_id") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "").trim();
  const endTime = String(formData.get("end_time") ?? "").trim();
  const place = String(formData.get("place") ?? "").trim();
  const format = String(formData.get("format") ?? "") as DbSchedule["format"];
  const status = String(formData.get("status") ?? "scheduled") as ScheduleStatus;
  const scheduleCaution = String(formData.get("schedule_caution") ?? "").trim();
  const scheduleMemo = String(formData.get("schedule_memo") ?? "").trim();
  const participantIds = formData.getAll("student_ids").map((value) => String(value)).filter(Boolean);
  const plan = plans.find((item) => item.id === lessonPlanId);

  if (!plan) return { error: "使用するレッスンプランを選択してください。" };
  if (!date || !startTime || !endTime) return { error: "日付、開始時間、終了時間を入力してください。" };
  if (!place) return { error: "場所を入力してください。" };
  if (!["personal", "group", "online"].includes(format)) return { error: "形式を選択してください。" };
  if (!scheduleStatusOptions.some((option) => option.value === status)) return { error: "ステータスを選択してください。" };

  const startsAt = new Date(`${date}T${startTime}:00+09:00`);
  const endsAt = new Date(`${date}T${endTime}:00+09:00`);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return { error: "開始時間より後の終了時間を入力してください。" };
  }

  return {
    payload: {
      lesson_plan_id: lessonPlanId,
      lesson_name: plan.name,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      place,
      format,
      schedule_caution: scheduleCaution,
      schedule_memo: scheduleMemo,
      status,
    },
    participantIds,
  };
}
