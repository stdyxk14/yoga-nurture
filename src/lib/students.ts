import { unstable_noStore as noStore } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GenderCode, StudentRecord } from "@/components/yoga/records";
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

  return { supabase, userId: user.id };
}

export async function getStudents() {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("students")
    .select("id,user_id,name,kana,age_group,gender,experience,caution,memo,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`生徒一覧を取得できませんでした: ${error.message}`);
  }

  return (data ?? []).map((row) => mapStudentRow(row as StudentRow));
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
