import type { AttendanceStatus, BlockUsageHistory, StudentAttendanceStats, StudentLessonHistory, StudentObservation } from "@/components/yoga/records";
import { formatJapaneseDate } from "@/lib/date-format";
import { getScheduleById, type DbSchedule } from "@/lib/schedules";
import { requireUserId } from "@/lib/students";
import { mapBlock, type DbBlockTemplate } from "@/lib/blocks";

export type LessonRecordStatus = "draft" | "completed";
export type BlockExecutionStatus = "done" | "skipped";
export type BlockReactionCode = "good" | "neutral" | "poor";
export type StudentAttendanceCode = "present" | "cancelled" | "no_show";

export type LessonRecordFormState = {
  error?: string;
};

export type LessonRecordBlockFormItem = DbBlockTemplate & {
  planBlockId: string;
  recordBlockId?: string;
  sortOrder: number;
  plannedMinutes: number;
  done: boolean;
  actualMinutes: number;
  reaction: BlockReactionCode;
  teacherMemo: string;
  improvementMemo: string;
  useAgain: boolean;
  reviseScript: boolean;
  scriptRevision: string;
};

export type LessonRecordStudentFormItem = {
  id: string;
  name: string;
  caution: string;
  memo: string;
  recordStudentId?: string;
  attendanceStatus: StudentAttendanceCode;
  todayNote: string;
  personalMemo: string;
  nextFollow: string;
};

export type LessonRecordFormData = {
  schedule: DbSchedule | null;
  record: DbLessonRecord | null;
  blocks: LessonRecordBlockFormItem[];
  students: LessonRecordStudentFormItem[];
};

export type DbLessonRecord = {
  id: string;
  scheduleId: string | null;
  lessonPlanId: string | null;
  lessonName: string;
  recordDate: string;
  overallMemo: string;
  overallReaction: string;
  improvementPoints: string;
  status: LessonRecordStatus;
  statusLabel: string;
  participantCount: number;
  blockCount: number;
  studentCommentCount: number;
  lessonPlanName: string;
  createdAt: string;
  updatedAt: string;
};

type RawRecord = {
  id: string;
  schedule_id: string | null;
  lesson_plan_id: string | null;
  lesson_name: string;
  record_date: string;
  overall_memo: string | null;
  student_reaction: string | null;
  improvement: string | null;
  created_at: string;
  updated_at: string;
  schedule?: {
    id: string;
    status: string;
    starts_at: string | null;
    lesson_plan?: { id: string; name: string | null } | null;
  } | null;
  lesson_record_blocks?: Array<{ id: string }>;
  lesson_record_students?: Array<{ id: string }>;
};

type RawRecordBlock = {
  id: string;
  lesson_record_id: string;
  block_template_id: string;
  sort_order: number;
  done: boolean;
  actual_duration_minutes: number | null;
  reaction: BlockReactionCode | null;
  teacher_memo: string | null;
  improvement_memo: string | null;
  use_again: boolean;
  script_revision: string | null;
  record?: {
    id: string;
    schedule_id: string | null;
    lesson_name: string;
    record_date: string;
    lesson_plan_id: string | null;
    schedule?: {
      starts_at: string | null;
      lesson_plan?: { name: string | null } | null;
    } | null;
  } | null;
};

type RawStudentRecord = {
  id: string;
  lesson_record_id: string;
  student_id: string;
  attendance_status: StudentAttendanceCode;
  condition: string | null;
  memo: string | null;
  next_follow: string | null;
  record?: {
    id: string;
    schedule_id: string | null;
    lesson_name: string;
    record_date: string;
    lesson_plan_id: string | null;
    schedule?: {
      starts_at: string | null;
      lesson_plan?: { name: string | null } | null;
    } | null;
  } | null;
};

type RawPlanBlock = {
  id: string;
  sort_order: number;
  planned_duration_minutes: number | null;
  block?: Parameters<typeof mapBlock>[0] | null;
};

const reactionLabels: Record<BlockReactionCode, string> = {
  good: "良かった",
  neutral: "普通",
  poor: "いまいち",
};

const attendanceLabels: Record<StudentAttendanceCode, AttendanceStatus> = {
  present: "参加",
  cancelled: "キャンセル",
  no_show: "無断欠席",
};

export const recordStatusOptions = [
  { value: "draft", label: "下書き" },
  { value: "completed", label: "記録済み" },
] as const;

export const blockReactionOptions = [
  { value: "good", label: "良かった" },
  { value: "neutral", label: "普通" },
  { value: "poor", label: "いまいち" },
] as const;

export const attendanceOptions = [
  { value: "present", label: "参加" },
  { value: "cancelled", label: "キャンセル" },
  { value: "no_show", label: "無断欠席" },
] as const;

function formatDate(value: string | null | undefined) {
  if (!value) return "未記録";
  return formatJapaneseDate(new Date(value));
}

function statusFromSchedule(status?: string | null): LessonRecordStatus {
  return status === "recorded" ? "completed" : "draft";
}

function mapRecord(row: RawRecord): DbLessonRecord {
  const status = statusFromSchedule(row.schedule?.status);
  return {
    id: row.id,
    scheduleId: row.schedule_id,
    lessonPlanId: row.lesson_plan_id,
    lessonName: row.lesson_name,
    recordDate: formatDate(row.schedule?.starts_at ?? row.record_date),
    overallMemo: row.overall_memo ?? "",
    overallReaction: row.student_reaction ?? "",
    improvementPoints: row.improvement ?? "",
    status,
    statusLabel: recordStatusOptions.find((option) => option.value === status)?.label ?? "下書き",
    participantCount: row.lesson_record_students?.length ?? 0,
    blockCount: row.lesson_record_blocks?.length ?? 0,
    studentCommentCount: row.lesson_record_students?.length ?? 0,
    lessonPlanName: row.schedule?.lesson_plan?.name ?? "未設定",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getRecordBySchedule(scheduleId: string) {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("lesson_records")
    .select(`
      id,
      schedule_id,
      lesson_plan_id,
      lesson_name,
      record_date,
      overall_memo,
      student_reaction,
      improvement,
      created_at,
      updated_at,
      schedule:schedules(id,status,starts_at,lesson_plan:lesson_plans(id,name)),
      lesson_record_blocks(id),
      lesson_record_students(id)
    `)
    .eq("schedule_id", scheduleId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`実施後記録を取得できませんでした: ${error.message}`);
  return data ? mapRecord(data as unknown as RawRecord) : null;
}

async function getRecordBlockRows(recordId: string | undefined) {
  if (!recordId) return [] as RawRecordBlock[];
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("lesson_record_blocks")
    .select("id,lesson_record_id,block_template_id,sort_order,done,actual_duration_minutes,reaction,teacher_memo,improvement_memo,use_again,script_revision")
    .eq("lesson_record_id", recordId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`ブロック記録を取得できませんでした: ${error.message}`);
  return (data ?? []) as RawRecordBlock[];
}

async function getRecordStudentRows(recordId: string | undefined) {
  if (!recordId) return [] as RawStudentRecord[];
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("lesson_record_students")
    .select("id,lesson_record_id,student_id,attendance_status,condition,memo,next_follow")
    .eq("lesson_record_id", recordId);

  if (error) throw new Error(`生徒別記録を取得できませんでした: ${error.message}`);
  return (data ?? []) as RawStudentRecord[];
}

async function getPlanBlocksForSchedule(schedule: DbSchedule | null) {
  if (!schedule?.lessonPlanId) return [] as RawPlanBlock[];
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("lesson_plan_blocks")
    .select(`
      id,
      sort_order,
      planned_duration_minutes,
      block:block_templates(
        id,
        category_id,
        subcategory_id,
        name,
        duration_minutes,
        purpose,
        level,
        cautions,
        script,
        memo,
        favorite,
        archived,
        created_at,
        updated_at,
        category:block_categories(id,name),
        subcategory:block_subcategories(id,name),
        block_template_tags(tag:block_tags(id,name))
      )
    `)
    .eq("lesson_plan_id", schedule.lessonPlanId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`レッスンプランのブロックを取得できませんでした: ${error.message}`);
  return (data ?? []) as unknown as RawPlanBlock[];
}

export async function getLessonRecordFormData(scheduleId: string): Promise<LessonRecordFormData> {
  let schedule: DbSchedule | null = null;
  try {
    schedule = await getScheduleById(scheduleId);
  } catch {
    return { schedule: null, record: null, blocks: [], students: [] };
  }

  const record = await getRecordBySchedule(scheduleId);
  const [planBlocks, recordBlocks, recordStudents] = await Promise.all([
    getPlanBlocksForSchedule(schedule),
    getRecordBlockRows(record?.id),
    getRecordStudentRows(record?.id),
  ]);

  const recordBlockByTemplate = new Map(recordBlocks.map((item) => [item.block_template_id, item]));
  const blocks = planBlocks
    .filter((item) => item.block)
    .map((item) => {
      const block = mapBlock(item.block!);
      const existing = recordBlockByTemplate.get(block.id);
      return {
        ...block,
        planBlockId: item.id,
        recordBlockId: existing?.id,
        sortOrder: item.sort_order,
        plannedMinutes: item.planned_duration_minutes ?? block.durationMinutes,
        done: existing?.done ?? true,
        actualMinutes: existing?.actual_duration_minutes ?? (item.planned_duration_minutes ?? block.durationMinutes),
        reaction: existing?.reaction ?? "neutral",
        teacherMemo: existing?.teacher_memo ?? "",
        improvementMemo: existing?.improvement_memo ?? "",
        useAgain: existing?.use_again ?? true,
        reviseScript: Boolean(existing?.script_revision),
        scriptRevision: existing?.script_revision ?? "",
      };
    });

  const recordStudentByStudent = new Map(recordStudents.map((item) => [item.student_id, item]));
  const students = schedule.participants.map((student) => {
    const existing = recordStudentByStudent.get(student.id);
    return {
      id: student.id,
      name: student.name,
      caution: student.caution,
      memo: student.memo,
      recordStudentId: existing?.id,
      attendanceStatus: existing?.attendance_status ?? student.attendanceStatus,
      todayNote: existing?.condition ?? "",
      personalMemo: existing?.memo ?? "",
      nextFollow: existing?.next_follow ?? "",
    };
  });

  return { schedule, record, blocks, students };
}

export async function getLessonRecords() {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("lesson_records")
    .select(`
      id,
      schedule_id,
      lesson_plan_id,
      lesson_name,
      record_date,
      overall_memo,
      student_reaction,
      improvement,
      created_at,
      updated_at,
      schedule:schedules(id,status,starts_at,lesson_plan:lesson_plans(id,name)),
      lesson_record_blocks(id),
      lesson_record_students(id)
    `)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`実施後記録一覧を取得できませんでした: ${error.message}`);
  return ((data ?? []) as unknown as RawRecord[]).map(mapRecord);
}

export async function getStudentRecordInsights(studentId: string) {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("lesson_record_students")
    .select(`
      id,
      lesson_record_id,
      student_id,
      attendance_status,
      condition,
      memo,
      next_follow,
      record:lesson_records(
        id,
        schedule_id,
        lesson_name,
        record_date,
        lesson_plan_id,
        schedule:schedules(starts_at,lesson_plan:lesson_plans(name))
      )
    `)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`生徒の実施後記録を取得できませんでした: ${error.message}`);
  const rows = (data ?? []) as unknown as RawStudentRecord[];

  const observations: StudentObservation[] = rows.map((row) => ({
    date: formatDate(row.record?.schedule?.starts_at ?? row.record?.record_date),
    lessonTitle: row.record?.lesson_name ?? "レッスン",
    lessonId: row.record?.schedule_id ?? row.lesson_record_id,
    attendanceStatus: attendanceLabels[row.attendance_status],
    condition: row.condition ?? "",
    memo: row.memo ?? "",
    nextFollow: row.next_follow ?? "",
  }));

  const lessonHistory: StudentLessonHistory[] = rows.map((row) => ({
    date: formatDate(row.record?.schedule?.starts_at ?? row.record?.record_date),
    lessonTitle: row.record?.lesson_name ?? "レッスン",
    lessonId: row.record?.schedule_id ?? row.lesson_record_id,
    planName: row.record?.schedule?.lesson_plan?.name ?? "未設定",
    attendanceStatus: attendanceLabels[row.attendance_status],
    teacherMemo: "",
    observation: row.condition ?? "",
    memo: row.memo ?? "",
    nextFollow: row.next_follow ?? "",
  }));

  const total = rows.length;
  const cancelCount = rows.filter((row) => row.attendance_status === "cancelled").length;
  const noShowCount = rows.filter((row) => row.attendance_status === "no_show").length;
  const attended = rows.filter((row) => row.attendance_status === "present");
  const stats: StudentAttendanceStats = {
    attendedCount: attended.length,
    cancelCount,
    noShowCount,
    cancelRate: total ? Math.round((cancelCount / total) * 100) : 0,
    lastAttendedDate: attended[0]?.record ? formatDate(attended[0].record.schedule?.starts_at ?? attended[0].record.record_date) : "未記録",
    nextScheduledDate: "未定",
  };

  return { observations, lessonHistory, stats };
}

export async function getBlockUsageHistory(blockId: string) {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("lesson_record_blocks")
    .select(`
      id,
      lesson_record_id,
      block_template_id,
      sort_order,
      done,
      actual_duration_minutes,
      reaction,
      teacher_memo,
      improvement_memo,
      use_again,
      script_revision,
      record:lesson_records(
        id,
        schedule_id,
        lesson_name,
        record_date,
        lesson_plan_id,
        schedule:schedules(starts_at,lesson_plan:lesson_plans(name))
      )
    `)
    .eq("block_template_id", blockId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`ブロックの使用履歴を取得できませんでした: ${error.message}`);

  return ((data ?? []) as unknown as RawRecordBlock[]).map((row): BlockUsageHistory => ({
    blockId: row.block_template_id,
    lessonId: row.record?.schedule_id ?? row.lesson_record_id,
    lessonDate: formatDate(row.record?.schedule?.starts_at ?? row.record?.record_date),
    planName: row.record?.schedule?.lesson_plan?.name ?? "未設定",
    lessonName: row.record?.lesson_name ?? "レッスン",
    done: row.done,
    actualDuration: `${row.actual_duration_minutes ?? 0}分`,
    reaction: row.reaction ? reactionLabels[row.reaction] : "未評価",
    teacherMemo: row.teacher_memo ?? "",
    improvementMemo: row.improvement_memo ?? "",
    useAgain: row.use_again,
    scriptRevision: row.script_revision ?? "",
    scriptReviewRequired: Boolean(row.script_revision),
  }));
}

export function parseLessonRecordPayload(formData: FormData) {
  const scheduleId = String(formData.get("schedule_id") ?? "").trim();
  const recordId = String(formData.get("record_id") ?? "").trim();
  const statusValues = formData.getAll("status").map(String);
  const status = (statusValues.at(-1) ?? "draft") as LessonRecordStatus;
  const overallMemo = String(formData.get("overall_memo") ?? "").trim();
  const overallReaction = String(formData.get("overall_reaction") ?? "").trim();
  const improvementPoints = String(formData.get("improvement_points") ?? "").trim();

  if (!scheduleId) return { error: "予定が見つかりません。" };
  if (!recordStatusOptions.some((option) => option.value === status)) return { error: "記録ステータスを選択してください。" };

  const blockIds = Array.from(new Set(formData.getAll("block_template_ids").map(String)));
  const blocks = blockIds.map((blockId) => {
    const done = String(formData.get(`block_${blockId}_done`) ?? "done") === "done";
    const actualMinutes = Number.parseInt(String(formData.get(`block_${blockId}_actual_minutes`) ?? "0"), 10);
    const reaction = String(formData.get(`block_${blockId}_reaction`) ?? "neutral") as BlockReactionCode;
    const reviseScript = formData.get(`block_${blockId}_revise_script`) === "on";
    const scriptRevision = String(formData.get(`block_${blockId}_script_revision`) ?? "").trim();

    return {
      block_template_id: blockId,
      lesson_plan_block_id: String(formData.get(`block_${blockId}_plan_block_id`) ?? ""),
      sort_order: Number.parseInt(String(formData.get(`block_${blockId}_sort_order`) ?? "0"), 10),
      done,
      actual_duration_minutes: Number.isFinite(actualMinutes) ? actualMinutes : 0,
      reaction: blockReactionOptions.some((option) => option.value === reaction) ? reaction : "neutral",
      teacher_memo: String(formData.get(`block_${blockId}_teacher_memo`) ?? "").trim(),
      improvement_memo: String(formData.get(`block_${blockId}_improvement_memo`) ?? "").trim(),
      use_again: formData.get(`block_${blockId}_use_again`) === "on",
      script_revision: reviseScript ? scriptRevision || "セリフ見直しあり" : "",
    };
  });

  const studentIds = formData.getAll("student_ids").map(String);
  const students = studentIds.map((studentId) => {
    const attendanceStatus = String(formData.get(`student_${studentId}_attendance_status`) ?? "present") as StudentAttendanceCode;
    return {
      student_id: studentId,
      attendance_status: attendanceOptions.some((option) => option.value === attendanceStatus) ? attendanceStatus : "present",
      condition: String(formData.get(`student_${studentId}_today_note`) ?? "").trim(),
      memo: String(formData.get(`student_${studentId}_personal_memo`) ?? "").trim(),
      next_follow: String(formData.get(`student_${studentId}_next_follow`) ?? "").trim(),
    };
  });

  return {
    recordId,
    scheduleId,
    status,
    overallMemo,
    overallReaction,
    improvementPoints,
    blocks,
    students,
  };
}
