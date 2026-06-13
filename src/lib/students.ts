import { unstable_noStore as noStore } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GenderCode, StudentRecord } from "@/components/yoga/records";
import { formatJapaneseDate } from "@/lib/date-format";
import { toGenderCode, toGenderLabel } from "@/lib/student-fields";

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
  created_at: string;
  updated_at: string;
};

export type StudentFormState = {
  error?: string;
};

type StudentListStats = {
  attendedCount: number;
  cancelCount: number;
  lastLessonDate: string;
  nextLessonDate: string;
};

export function mapStudentRow(row: StudentRow): StudentRecord {
  return {
    id: row.id,
    name: row.name,
    kana: row.kana ?? "",
    ageGroup: row.age_group ?? "",
    gender: toGenderLabel(row.gender),
    genderCode: toGenderCode(row.gender),
    experience: row.experience ?? "",
    caution: row.caution ?? "",
    memo: row.memo ?? "",
    lastLessonDate: "未記録",
    linkedLessonCount: 0,
    cancelCount: 0,
    nextLessonDate: "未定",
    status: row.caution ? "caution" : "recent",
  };
}

export async function requireUserId() {
  noStore();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return { supabase, userId: user.id, user };
}

export async function getStudents(search = "") {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("students")
    .select("id,user_id,name,kana,age_group,gender,experience,caution,memo,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`生徒一覧を取得できませんでした: ${error.message}`);
  }

  const students = (data ?? []).map((row) => mapStudentRow(row as StudentRow));
  const statsByStudent = await getStudentListStats(students.map((student) => student.id));
  const q = search.trim().toLowerCase();

  return students
    .map((student) => {
      const stats = statsByStudent.get(student.id);
      return {
        ...student,
        lastLessonDate: stats?.lastLessonDate ?? "未記録",
        linkedLessonCount: stats?.attendedCount ?? 0,
        cancelCount: stats?.cancelCount ?? 0,
        nextLessonDate: stats?.nextLessonDate ?? "未定",
        status: stats?.cancelCount || student.caution ? "caution" : stats?.attendedCount ? "recent" : student.status,
      } satisfies StudentRecord;
    })
    .filter((student) => {
      if (!q) return true;
      return [
        student.name,
        student.kana,
        student.ageGroup,
        student.gender,
        student.experience,
        student.caution,
        student.memo,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
}

async function getStudentListStats(studentIds: string[]) {
  const stats = new Map<string, StudentListStats>();
  for (const studentId of studentIds) {
    stats.set(studentId, { attendedCount: 0, cancelCount: 0, lastLessonDate: "未記録", nextLessonDate: "未定" });
  }
  if (!studentIds.length) return stats;

  const { supabase } = await requireUserId();
  const [{ data: recordRows, error: recordError }, { data: participantRows, error: participantError }] = await Promise.all([
    supabase
      .from("lesson_record_students")
      .select("student_id,attendance_status,record:lesson_records(record_date,schedule:schedules(starts_at))")
      .in("student_id", studentIds),
    supabase
      .from("schedule_participants")
      .select("student_id,schedule:schedules(starts_at,status)")
      .in("student_id", studentIds),
  ]);

  if (recordError) throw new Error(`生徒の受講集計を取得できませんでした: ${recordError.message}`);
  if (participantError) throw new Error(`生徒の予定集計を取得できませんでした: ${participantError.message}`);

  const lastAttended = new Map<string, string>();
  for (const row of (recordRows ?? []) as Array<{
    student_id: string;
    attendance_status: "present" | "cancelled" | "no_show";
    record?: { record_date: string | null; schedule?: { starts_at: string | null } | Array<{ starts_at: string | null }> | null } | Array<{ record_date: string | null; schedule?: { starts_at: string | null } | Array<{ starts_at: string | null }> | null }> | null;
  }>) {
    const record = firstRelation(row.record);
    const schedule = firstRelation(record?.schedule);
    const current = stats.get(row.student_id);
    if (!current) continue;
    if (row.attendance_status === "present") {
      current.attendedCount += 1;
      const dateValue = schedule?.starts_at ?? record?.record_date ?? "";
      if (dateValue && (!lastAttended.has(row.student_id) || dateValue > lastAttended.get(row.student_id)!)) {
        lastAttended.set(row.student_id, dateValue);
        current.lastLessonDate = formatJapaneseDate(new Date(dateValue));
      }
    }
    if (row.attendance_status === "cancelled") current.cancelCount += 1;
  }

  const now = new Date().toISOString();
  const nextScheduled = new Map<string, string>();
  for (const row of (participantRows ?? []) as Array<{
    student_id: string;
    schedule?: { starts_at: string | null; status: string | null } | Array<{ starts_at: string | null; status: string | null }> | null;
  }>) {
    const schedule = firstRelation(row.schedule);
    const startsAt = schedule?.starts_at;
    if (!startsAt || startsAt < now || schedule?.status === "recorded") continue;
    const current = stats.get(row.student_id);
    if (!current) continue;
    if (!nextScheduled.has(row.student_id) || startsAt < nextScheduled.get(row.student_id)!) {
      nextScheduled.set(row.student_id, startsAt);
      current.nextLessonDate = formatJapaneseDate(new Date(startsAt));
    }
  }

  return stats;
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getStudentById(id: string) {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("students")
    .select("id,user_id,name,kana,age_group,gender,experience,caution,memo,created_at,updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`生徒情報を取得できませんでした: ${error.message}`);
  }

  if (!data) notFound();

  return mapStudentRow(data as StudentRow);
}

export function getStudentPayload(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const kana = String(formData.get("kana") ?? "").trim();
  const ageGroup = String(formData.get("age_group") ?? "").trim();
  const gender = toGenderCode(String(formData.get("gender") ?? ""));
  const experience = String(formData.get("experience") ?? "").trim();
  const caution = String(formData.get("caution") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim();

  if (!name) {
    return { error: "名前を入力してください。" };
  }

  return {
    payload: {
      name,
      kana,
      age_group: ageGroup,
      gender,
      experience,
      caution,
      memo,
    },
  };
}
