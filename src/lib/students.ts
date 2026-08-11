import { notFound } from "next/navigation";
import type { GenderCode, StudentRecord } from "@/components/yoga/records";
import { formatJapaneseDate } from "@/lib/date-format";
import { measurePerformance } from "@/lib/performance";
import { toGenderCode, toGenderLabel } from "@/lib/student-fields";
import { requireAuthClaims } from "@/lib/supabase/server";

export type StudentFilterKey = "all" | "recent" | "followup" | "caution" | "scheduled" | "no-attendance" | "archived";

export type StudentRow = {
  id: string;
  user_id: string;
  name: string;
  kana: string | null;
  age_group: string | null;
  gender: GenderCode | null;
  experience: string | null;
  caution: string | null;
  memo: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type StudentFormState = { error?: string };

export type StudentRecentEntry = {
  recordId: string;
  scheduleId: string | null;
  date: string;
  dateIso: string;
  lessonName: string;
  attendanceStatus: "present" | "cancelled" | "no_show";
  condition: string;
  memo: string;
  nextFollow: string;
  followUpStatus: "none" | "pending" | "completed" | "dismissed";
};

export type StudentWorkspaceRow = StudentRecord & {
  archived: boolean;
  attendedCount: number;
  cancelCount: number;
  noShowCount: number;
  cancelRate: number;
  pendingFollowUpCount: number;
  pendingFollowUps: StudentRecentEntry[];
  lastAttendedAt: string | null;
  nextScheduledAt: string | null;
  lastObservation: string;
  recentEntries: StudentRecentEntry[];
};

export type StudentWorkspaceSummary = {
  activeStudents: number;
  followUpStudents: number;
  cautionStudents: number;
  recentStudents: number;
  nextScheduledStudents: number;
};

type RawRecordStudent = {
  id: string;
  student_id: string;
  attendance_status: "present" | "cancelled" | "no_show";
  condition: string | null;
  memo: string | null;
  next_follow: string | null;
  follow_up_status: "none" | "pending" | "completed" | "dismissed" | null;
  record?: {
    id: string;
    schedule_id: string | null;
    lesson_name: string | null;
    record_date: string | null;
    schedule?: { starts_at: string | null } | Array<{ starts_at: string | null }> | null;
  } | Array<{
    id: string;
    schedule_id: string | null;
    lesson_name: string | null;
    record_date: string | null;
    schedule?: { starts_at: string | null } | Array<{ starts_at: string | null }> | null;
  }> | null;
};

type RawScheduleParticipant = {
  student_id: string;
  attendance_status: "present" | "cancelled" | "no_show";
  schedule?: {
    id: string;
    starts_at: string | null;
    status: string | null;
    schedule_closures?: Array<{ revoked_at: string | null }>;
  } | Array<{
    id: string;
    starts_at: string | null;
    status: string | null;
    schedule_closures?: Array<{ revoked_at: string | null }>;
  }> | null;
};

export function mapStudentRow(row: StudentRow): StudentRecord {
  return {
    id: row.id,
    name: row.name,
    kana: row.kana ?? "",
    ageGroup: row.age_group?.trim() || "年齢不明",
    gender: toGenderLabel(row.gender),
    genderCode: toGenderCode(row.gender),
    experience: row.experience ?? "",
    caution: row.caution ?? "",
    memo: row.memo ?? "",
    lastLessonDate: "未記録",
    linkedLessonCount: 0,
    cancelCount: 0,
    nextLessonDate: "未定",
    status: row.caution?.trim() ? "caution" : "recent",
  };
}

export async function requireUserId() {
  return requireAuthClaims();
}

export async function getStudents(search = "") {
  const workspace = await getStudentWorkspace({ search, filter: "all" });
  return workspace.students;
}

export async function getStudentWorkspace({
  search = "",
  filter = "all",
  selectedId,
  now = new Date(),
}: {
  search?: string;
  filter?: StudentFilterKey;
  selectedId?: string;
  now?: Date;
}) {
  return measurePerformance(
    { operation: "data.student-workspace", route: "/students" },
    async () => {
      const { supabase } = await requireUserId();
      const { data, error } = await supabase
        .from("students")
        .select("id,user_id,name,kana,age_group,gender,experience,caution,memo,archived,created_at,updated_at")
        .order("created_at", { ascending: false });

      if (error) throw new Error(`生徒一覧を取得できませんでした: ${error.message}`);
      const studentRows = (data ?? []) as StudentRow[];
      const studentIds = studentRows.map((student) => student.id);

      const [recordResult, participantResult] = studentIds.length
        ? await Promise.all([
            supabase
              .from("lesson_record_students")
              .select("id,student_id,attendance_status,condition,memo,next_follow,follow_up_status,record:lesson_records(id,schedule_id,lesson_name,record_date,schedule:schedules(starts_at))")
              .in("student_id", studentIds),
            supabase
              .from("schedule_participants")
              .select("student_id,attendance_status,schedule:schedules(id,starts_at,status,schedule_closures(revoked_at))")
              .in("student_id", studentIds),
          ])
        : [{ data: [], error: null }, { data: [], error: null }];

      if (recordResult.error) throw new Error(`生徒の受講・フォロー情報を取得できませんでした: ${recordResult.error.message}`);
      if (participantResult.error) throw new Error(`生徒の予定情報を取得できませんでした: ${participantResult.error.message}`);

      const recordsByStudent = groupBy((recordResult.data ?? []) as unknown as RawRecordStudent[], (row) => row.student_id);
      const schedulesByStudent = groupBy((participantResult.data ?? []) as unknown as RawScheduleParticipant[], (row) => row.student_id);
      const nowTime = now.getTime();

      const allRows = studentRows.map((studentRow) => buildWorkspaceRow(studentRow, recordsByStudent.get(studentRow.id) ?? [], schedulesByStudent.get(studentRow.id) ?? [], nowTime));
      const activeRows = allRows.filter((student) => !student.archived);
      const summary: StudentWorkspaceSummary = {
        activeStudents: activeRows.length,
        followUpStudents: activeRows.filter((student) => student.pendingFollowUpCount > 0).length,
        cautionStudents: activeRows.filter((student) => student.caution.trim()).length,
        recentStudents: activeRows.filter((student) => isWithinDays(student.lastAttendedAt, nowTime, 30)).length,
        nextScheduledStudents: activeRows.filter((student) => Boolean(student.nextScheduledAt)).length,
      };

      const q = search.trim().toLowerCase();
      const students = allRows
        .filter((student) => matchesStudentFilter(student, filter, nowTime))
        .filter((student) => !q || [student.name, student.kana, student.ageGroup, student.gender, student.experience, student.caution, student.memo].join(" ").toLowerCase().includes(q));
      const selected = students.find((student) => student.id === selectedId) ?? students[0] ?? null;

      return { students, selected, summary, resultCount: students.length, filter };
    },
    (result) => result.students.length,
  );
}

function buildWorkspaceRow(studentRow: StudentRow, recordRows: RawRecordStudent[], participantRows: RawScheduleParticipant[], nowTime: number): StudentWorkspaceRow {
  const entries = recordRows
    .map((row): StudentRecentEntry => {
      const record = firstRelation(row.record);
      const schedule = firstRelation(record?.schedule);
      const dateIso = schedule?.starts_at ?? (record?.record_date ? `${record.record_date}T00:00:00+09:00` : "");
      return {
        recordId: record?.id ?? row.id,
        scheduleId: record?.schedule_id ?? null,
        date: dateIso ? formatJapaneseDate(new Date(dateIso)) : "未記録",
        dateIso,
        lessonName: record?.lesson_name ?? "レッスン",
        attendanceStatus: row.attendance_status,
        condition: row.condition ?? "",
        memo: row.memo ?? "",
        nextFollow: row.next_follow ?? "",
        followUpStatus: row.follow_up_status ?? "none",
      };
    })
    .sort((a, b) => b.dateIso.localeCompare(a.dateIso));
  const attended = entries.filter((entry) => entry.attendanceStatus === "present");
  const cancelCount = entries.filter((entry) => entry.attendanceStatus === "cancelled").length;
  const noShowCount = entries.filter((entry) => entry.attendanceStatus === "no_show").length;
  const pendingFollowUps = entries.filter((entry) => entry.followUpStatus === "pending" && entry.nextFollow.trim());
  const nextScheduledAt = participantRows
    .filter((row) => row.attendance_status === "present")
    .map((row) => firstRelation(row.schedule))
    .filter((schedule): schedule is NonNullable<typeof schedule> => Boolean(schedule?.starts_at) && schedule!.status !== "recorded" && !schedule!.schedule_closures?.some((closure) => closure.revoked_at === null) && Date.parse(schedule!.starts_at!) >= nowTime)
    .map((schedule) => schedule.starts_at!)
    .sort()[0] ?? null;
  const base = mapStudentRow(studentRow);
  const lastAttendedAt = attended[0]?.dateIso || null;
  const totalAttendanceRows = entries.length;

  return {
    ...base,
    archived: studentRow.archived,
    attendedCount: attended.length,
    linkedLessonCount: attended.length,
    cancelCount,
    noShowCount,
    cancelRate: totalAttendanceRows ? Math.round((cancelCount / totalAttendanceRows) * 100) : 0,
    pendingFollowUpCount: pendingFollowUps.length,
    pendingFollowUps,
    lastAttendedAt,
    lastLessonDate: lastAttendedAt ? formatJapaneseDate(new Date(lastAttendedAt)) : "記録なし",
    nextScheduledAt,
    nextLessonDate: nextScheduledAt ? formatJapaneseDate(new Date(nextScheduledAt)) : "未定",
    lastObservation: entries.find((entry) => entry.condition.trim() || entry.memo.trim())?.condition || entries.find((entry) => entry.memo.trim())?.memo || "記録なし",
    recentEntries: entries,
    status: pendingFollowUps.length ? "follow" : base.caution.trim() ? "caution" : isWithinDays(lastAttendedAt, nowTime, 30) ? "recent" : base.status,
  };
}

export function matchesStudentFilter(student: Pick<StudentWorkspaceRow, "archived" | "pendingFollowUpCount" | "caution" | "attendedCount" | "lastAttendedAt" | "nextScheduledAt">, filter: StudentFilterKey, nowTime = Date.now()) {
  if (filter === "archived") return student.archived;
  if (student.archived) return false;
  if (filter === "recent") return isWithinDays(student.lastAttendedAt, nowTime, 30);
  if (filter === "followup") return student.pendingFollowUpCount > 0;
  if (filter === "caution") return Boolean(student.caution.trim());
  if (filter === "scheduled") return Boolean(student.nextScheduledAt);
  if (filter === "no-attendance") return student.attendedCount === 0;
  return true;
}

export function normalizeStudentFilter(value?: string | null): StudentFilterKey {
  return value === "recent" || value === "followup" || value === "caution" || value === "scheduled" || value === "no-attendance" || value === "archived" ? value : "all";
}

function isWithinDays(value: string | null, nowTime: number, days: number) {
  if (!value) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp <= nowTime && timestamp >= nowTime - days * 86_400_000;
}

function groupBy<T>(rows: T[], key: (row: T) => string) {
  const result = new Map<string, T[]>();
  for (const row of rows) {
    const id = key(row);
    result.set(id, [...(result.get(id) ?? []), row]);
  }
  return result;
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getStudentById(id: string) {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("students")
    .select("id,user_id,name,kana,age_group,gender,experience,caution,memo,archived,created_at,updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`生徒情報を取得できませんでした: ${error.message}`);
  if (!data) notFound();
  return mapStudentRow(data as StudentRow);
}

export function getStudentPayload(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const kana = String(formData.get("kana") ?? "").trim();
  const ageGroup = String(formData.get("age_group") ?? "年齢不明").trim() || "年齢不明";
  const gender = toGenderCode(String(formData.get("gender") ?? ""));
  const experience = String(formData.get("experience") ?? "").trim();
  const caution = String(formData.get("caution") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim();

  if (!name) return { error: "名前を入力してください。" };
  return { payload: { name, kana, age_group: ageGroup, gender, experience, caution, memo } };
}
