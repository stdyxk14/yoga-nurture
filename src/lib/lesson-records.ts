import type { AttendanceStatus, BlockUsageHistory, FollowUpStatus, StudentAttendanceStats, StudentLessonHistory, StudentObservation } from "@/components/yoga/records";
import { formatJapaneseDate } from "@/lib/date-format";
import { getScheduleById, type DbSchedule } from "@/lib/schedules";
import { requireUserId } from "@/lib/students";
import { mapBlock, type DbBlockTemplate } from "@/lib/blocks";
import type { RequestSupabaseClient } from "@/lib/supabase/server";

export type LessonRecordStatus = "draft" | "completed";
export type BlockExecutionStatus = "done" | "skipped" | "unconfirmed";
export type BlockReactionCode = "good" | "neutral" | "poor";
export type StudentAttendanceCode = "present" | "cancelled" | "no_show";
export type LessonRecordItemSource = "planned" | "library" | "improvised";

export type LessonRecordFormState = {
  error?: string;
};

export type LessonRecordBlockFormItem = DbBlockTemplate & {
  fieldId: string;
  planBlockId: string | null;
  schedulePlanItemId: string | null;
  blockTemplateId: string | null;
  itemSource: LessonRecordItemSource;
  recordBlockId?: string;
  sortOrder: number;
  plannedMinutes: number;
  done: boolean | null;
  actualMinutes: number | null;
  reaction: BlockReactionCode | null;
  teacherMemo: string;
  improvementMemo: string;
  useAgain: boolean | null;
  reviseScript: boolean;
  scriptRevision: string;
};

export type LessonRecordStudentFormItem = {
  id: string;
  name: string;
  caution: string;
  memo: string;
  recordStudentId?: string;
  pendingFollowUps: PendingFollowUp[];
  attendanceStatus: StudentAttendanceCode;
  todayNote: string;
  personalMemo: string;
  nextFollow: string;
};

export type PendingFollowUp = {
  id: string;
  text: string;
  lessonName: string;
  date: string;
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
  schedule_plan_item_id: string | null;
  block_template_id: string | null;
  sort_order: number;
  item_source: LessonRecordItemSource;
  display_name_snapshot: string;
  category_name_snapshot: string | null;
  subcategory_name_snapshot: string | null;
  planned_duration_minutes: number | null;
  purpose_snapshot: string | null;
  level_snapshot: string | null;
  script_snapshot: string | null;
  cautions_snapshot: string | null;
  done: boolean | null;
  actual_duration_minutes: number | null;
  reaction: BlockReactionCode | null;
  teacher_memo: string | null;
  improvement_memo: string | null;
  use_again: boolean | null;
  script_revision: string | null;
  record?: {
    id: string;
    schedule_id: string | null;
    lesson_name: string;
    record_date: string;
    lesson_plan_id: string | null;
    schedule?: {
      starts_at: string | null;
      lesson_plan?: { id?: string | null; name: string | null } | null;
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
  follow_up_status?: FollowUpStatus | null;
  follow_up_completed_at?: string | null;
  follow_up_completed_note?: string | null;
  follow_up_updated_at?: string | null;
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

type RawSchedulePlanItem = {
  id: string;
  lesson_plan_block_id: string | null;
  block_template_id: string | null;
  sort_order: number;
  planned_duration_minutes: number | null;
  block_name_snapshot: string;
  category_name_snapshot: string | null;
  subcategory_name_snapshot: string | null;
  purpose_snapshot: string | null;
  level_snapshot: string | null;
  script_snapshot: string | null;
  cautions_snapshot: string | null;
  memo_snapshot: string | null;
  tags_snapshot: string[] | null;
  created_at: string;
  updated_at: string;
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

function normalizeFollowUpStatus(row: Pick<RawStudentRecord, "next_follow" | "follow_up_status">): FollowUpStatus {
  if (row.follow_up_status) return row.follow_up_status;
  return row.next_follow?.trim() ? "pending" : "none";
}

function isMissingFollowUpColumn(error: { message?: string; code?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "42703" || message.includes("follow_up_status") || message.includes("follow_up_completed");
}

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

async function getRecordBySchedule(supabase: RequestSupabaseClient, scheduleId: string) {
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

async function getRecordBlockRows(supabase: RequestSupabaseClient, recordId: string | undefined) {
  if (!recordId) return [] as RawRecordBlock[];
  const { data, error } = await supabase
    .from("lesson_record_blocks")
    .select("id,lesson_record_id,schedule_plan_item_id,block_template_id,sort_order,item_source,display_name_snapshot,category_name_snapshot,subcategory_name_snapshot,planned_duration_minutes,purpose_snapshot,level_snapshot,script_snapshot,cautions_snapshot,done,actual_duration_minutes,reaction,teacher_memo,improvement_memo,use_again,script_revision")
    .eq("lesson_record_id", recordId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`ブロック記録を取得できませんでした: ${error.message}`);
  return (data ?? []) as RawRecordBlock[];
}

async function getRecordStudentRows(supabase: RequestSupabaseClient, recordId: string | undefined) {
  if (!recordId) return [] as RawStudentRecord[];
  const { data, error } = await supabase
    .from("lesson_record_students")
    .select("id,lesson_record_id,student_id,attendance_status,condition,memo,next_follow,follow_up_status,follow_up_completed_at,follow_up_completed_note,follow_up_updated_at")
    .eq("lesson_record_id", recordId);

  if (isMissingFollowUpColumn(error)) {
    const fallback = await supabase
      .from("lesson_record_students")
      .select("id,lesson_record_id,student_id,attendance_status,condition,memo,next_follow")
      .eq("lesson_record_id", recordId);
    if (fallback.error) throw new Error(fallback.error.message);
    return (fallback.data ?? []) as RawStudentRecord[];
  }

  if (error) throw new Error(`生徒別記録を取得できませんでした: ${error.message}`);
  return (data ?? []) as RawStudentRecord[];
}

async function getPendingFollowUpsForStudents(
  supabase: RequestSupabaseClient,
  studentIds: string[],
  currentRecordId?: string,
) {
  if (!studentIds.length) return new Map<string, PendingFollowUp[]>();
  const extendedResult = await supabase
    .from("lesson_record_students")
    .select(`
      id,
      lesson_record_id,
      student_id,
      attendance_status,
      condition,
      memo,
      next_follow,
      follow_up_status,
      follow_up_completed_at,
      follow_up_completed_note,
      follow_up_updated_at,
      record:lesson_records(
        id,
        schedule_id,
        lesson_name,
        record_date,
        lesson_plan_id,
        schedule:schedules(starts_at,lesson_plan:lesson_plans(id,name))
      )
    `)
    .in("student_id", studentIds)
    .not("next_follow", "is", null)
    .order("created_at", { ascending: false });

  let rows: RawStudentRecord[] = [];
  if (isMissingFollowUpColumn(extendedResult.error)) {
    const fallbackResult = await supabase
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
      .in("student_id", studentIds)
      .not("next_follow", "is", null)
      .order("created_at", { ascending: false });
    if (fallbackResult.error) return new Map<string, PendingFollowUp[]>();
    rows = (fallbackResult.data ?? []) as unknown as RawStudentRecord[];
  } else {
    if (extendedResult.error) return new Map<string, PendingFollowUp[]>();
    rows = (extendedResult.data ?? []) as unknown as RawStudentRecord[];
  }

  const pending = new Map<string, PendingFollowUp[]>();

  for (const row of rows) {
    if (!row.next_follow?.trim()) continue;
    if (row.lesson_record_id === currentRecordId) continue;
    if (normalizeFollowUpStatus(row) !== "pending") continue;

    const items = pending.get(row.student_id) ?? [];
    items.push({
      id: row.id,
      text: row.next_follow,
      lessonName: row.record?.lesson_name ?? "レッスン",
      date: formatDate(row.record?.schedule?.starts_at ?? row.record?.record_date),
    });
    pending.set(row.student_id, items);
  }

  return pending;
}

async function getPlanBlocksForSchedule(supabase: RequestSupabaseClient, schedule: DbSchedule | null) {
  if (!schedule?.lessonPlanId) return [] as RawPlanBlock[];
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

async function getSchedulePlanItems(supabase: RequestSupabaseClient, scheduleId: string) {
  const { data, error } = await supabase
    .from("schedule_plan_items")
    .select("id,lesson_plan_block_id,block_template_id,sort_order,planned_duration_minutes,block_name_snapshot,category_name_snapshot,subcategory_name_snapshot,purpose_snapshot,level_snapshot,script_snapshot,cautions_snapshot,memo_snapshot,tags_snapshot,created_at,updated_at")
    .eq("schedule_id", scheduleId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`予定スナップショットを取得できませんでした: ${error.message}`);
  return (data ?? []) as RawSchedulePlanItem[];
}

function mapSchedulePlanItem(item: RawSchedulePlanItem): DbBlockTemplate {
  const durationMinutes = item.planned_duration_minutes ?? 0;
  return {
    id: item.block_template_id ?? item.id,
    name: item.block_name_snapshot,
    categoryId: null,
    subcategoryId: null,
    majorCategory: item.category_name_snapshot ?? "未分類",
    minorCategory: item.subcategory_name_snapshot ?? "未分類",
    duration: `${durationMinutes}分`,
    durationMinutes,
    purpose: item.purpose_snapshot ?? "",
    level: item.level_snapshot ?? "",
    cautions: item.cautions_snapshot ?? "",
    script: item.script_snapshot ?? "",
    tags: item.tags_snapshot ?? [],
    memo: item.memo_snapshot ?? "",
    usageCount: 0,
    averageRating: 0,
    goodRate: null,
    improvementCount: 0,
    skipCount: 0,
    lastUsed: "未使用",
    lastUsedAt: "",
    archived: false,
    favorite: false,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function mapStoredRecordBlock(item: RawRecordBlock): DbBlockTemplate {
  const durationMinutes = item.planned_duration_minutes ?? 0;
  return {
    id: item.block_template_id ?? item.id,
    name: item.display_name_snapshot || "名称未設定",
    categoryId: null,
    subcategoryId: null,
    majorCategory: item.category_name_snapshot ?? "未分類",
    minorCategory: item.subcategory_name_snapshot ?? "未分類",
    duration: `${durationMinutes}分`,
    durationMinutes,
    purpose: item.purpose_snapshot ?? "",
    level: item.level_snapshot ?? "",
    cautions: item.cautions_snapshot ?? "",
    script: item.script_snapshot ?? "",
    tags: [],
    memo: "",
    usageCount: 0,
    averageRating: 0,
    goodRate: null,
    improvementCount: 0,
    skipCount: 0,
    lastUsed: "未使用",
    lastUsedAt: "",
    archived: false,
    favorite: false,
    createdAt: "",
    updatedAt: "",
  };
}

export async function getLessonRecordFormData(scheduleId: string): Promise<LessonRecordFormData> {
  const { supabase } = await requireUserId();
  let schedule: DbSchedule | null = null;
  try {
    schedule = await getScheduleById(scheduleId, supabase);
  } catch {
    return { schedule: null, record: null, blocks: [], students: [] };
  }

  const record = await getRecordBySchedule(supabase, scheduleId);
  const [schedulePlanItems, recordBlocks, recordStudents] = await Promise.all([
    getSchedulePlanItems(supabase, scheduleId),
    getRecordBlockRows(supabase, record?.id),
    getRecordStudentRows(supabase, record?.id),
  ]);

  const fallbackPlanBlocks = schedulePlanItems.length ? [] : await getPlanBlocksForSchedule(supabase, schedule);
  const plannedItems = schedulePlanItems.length
    ? schedulePlanItems.map((item) => ({
        block: mapSchedulePlanItem(item),
        fieldId: item.id,
        planBlockId: item.lesson_plan_block_id,
        schedulePlanItemId: item.id,
        blockTemplateId: item.block_template_id,
        sortOrder: item.sort_order,
        plannedMinutes: item.planned_duration_minutes ?? 0,
      }))
    : fallbackPlanBlocks.flatMap((item) => {
        if (!item.block) return [];
        const block = mapBlock(item.block);
        return [{
          block,
          fieldId: item.id,
          planBlockId: item.id,
          schedulePlanItemId: null,
          blockTemplateId: block.id,
          sortOrder: item.sort_order,
          plannedMinutes: item.planned_duration_minutes ?? block.durationMinutes,
        }];
      });

  const recordBlockByPlanItem = new Map<string, RawRecordBlock>(
    recordBlocks.flatMap((item) => item.schedule_plan_item_id ? [[item.schedule_plan_item_id, item]] : []),
  );
  const claimedLegacyRecordIds = new Set<string>();
  const plannedBlocks = plannedItems.map((item) => {
    let existing = item.schedulePlanItemId ? recordBlockByPlanItem.get(item.schedulePlanItemId) : undefined;
    if (!existing) {
      existing = recordBlocks.find((row) =>
        !row.schedule_plan_item_id
        && !claimedLegacyRecordIds.has(row.id)
        && row.block_template_id === item.blockTemplateId
        && row.sort_order === item.sortOrder,
      );
    }
    if (existing) claimedLegacyRecordIds.add(existing.id);

    return {
      ...item.block,
      fieldId: item.fieldId,
      planBlockId: item.planBlockId,
      schedulePlanItemId: item.schedulePlanItemId,
      blockTemplateId: item.blockTemplateId,
      itemSource: "planned" as const,
      recordBlockId: existing?.id,
      sortOrder: item.sortOrder,
      plannedMinutes: item.plannedMinutes,
      done: existing?.done ?? null,
      actualMinutes: existing?.actual_duration_minutes ?? null,
      reaction: existing?.reaction ?? null,
      teacherMemo: existing?.teacher_memo ?? "",
      improvementMemo: existing?.improvement_memo ?? "",
      useAgain: existing?.use_again ?? null,
      reviseScript: Boolean(existing?.script_revision),
      scriptRevision: existing?.script_revision ?? "",
    };
  });
  const storedOnlyBlocks: LessonRecordBlockFormItem[] = recordBlocks
    .filter((item) => !claimedLegacyRecordIds.has(item.id))
    .map((item) => ({
      ...mapStoredRecordBlock(item),
      fieldId: item.schedule_plan_item_id ?? item.id,
      planBlockId: null,
      schedulePlanItemId: item.schedule_plan_item_id,
      blockTemplateId: item.block_template_id,
      itemSource: item.item_source,
      recordBlockId: item.id,
      sortOrder: item.sort_order,
      plannedMinutes: item.planned_duration_minutes ?? 0,
      done: item.done,
      actualMinutes: item.actual_duration_minutes,
      reaction: item.reaction,
      teacherMemo: item.teacher_memo ?? "",
      improvementMemo: item.improvement_memo ?? "",
      useAgain: item.use_again,
      reviseScript: Boolean(item.script_revision),
      scriptRevision: item.script_revision ?? "",
    }));
  const blocks = [...plannedBlocks, ...storedOnlyBlocks].sort((a, b) => a.sortOrder - b.sortOrder);

  const recordStudentByStudent = new Map(recordStudents.map((item) => [item.student_id, item]));
  const pendingFollowUpsByStudent = await getPendingFollowUpsForStudents(
    supabase,
    schedule.participants.map((student) => student.id),
    record?.id,
  );
  const students = schedule.participants.map((student) => {
    const existing = recordStudentByStudent.get(student.id);
    return {
      id: student.id,
      name: student.name,
      caution: student.caution,
      memo: student.memo,
      recordStudentId: existing?.id,
      pendingFollowUps: pendingFollowUpsByStudent.get(student.id) ?? [],
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
  const extendedResult = await supabase
    .from("lesson_record_students")
    .select(`
      id,
      lesson_record_id,
      student_id,
      attendance_status,
      condition,
      memo,
      next_follow,
      follow_up_status,
      follow_up_completed_at,
      follow_up_completed_note,
      follow_up_updated_at,
      record:lesson_records(
        id,
        schedule_id,
        lesson_name,
        record_date,
        lesson_plan_id,
        schedule:schedules(starts_at,lesson_plan:lesson_plans(id,name))
      )
    `)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  let rows: RawStudentRecord[] = [];
  let queryError = extendedResult.error;
  if (isMissingFollowUpColumn(extendedResult.error)) {
    const fallbackResult = await supabase
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
          schedule:schedules(starts_at,lesson_plan:lesson_plans(id,name))
        )
      `)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });
    queryError = fallbackResult.error;
    rows = (fallbackResult.data ?? []) as unknown as RawStudentRecord[];
  } else {
    rows = (extendedResult.data ?? []) as unknown as RawStudentRecord[];
  }

  if (queryError) throw new Error(`生徒の実施後記録を取得できませんでした: ${queryError.message}`);

  const observations: StudentObservation[] = rows.map((row) => ({
    date: formatDate(row.record?.schedule?.starts_at ?? row.record?.record_date),
    lessonTitle: row.record?.lesson_name ?? "レッスン",
    lessonId: row.record?.schedule_id ?? row.lesson_record_id,
    scheduleId: row.record?.schedule_id ?? null,
    lessonRecordId: row.lesson_record_id,
    lessonPlanId: row.record?.lesson_plan_id ?? null,
    followUpId: row.id,
    followUpStatus: normalizeFollowUpStatus(row),
    followUpCompletedAt: row.follow_up_completed_at ?? null,
    followUpCompletedNote: row.follow_up_completed_note ?? null,
    attendanceStatus: attendanceLabels[row.attendance_status],
    condition: row.condition ?? "",
    memo: row.memo ?? "",
    nextFollow: row.next_follow ?? "",
  }));

  const lessonHistory: StudentLessonHistory[] = rows.map((row) => ({
    date: formatDate(row.record?.schedule?.starts_at ?? row.record?.record_date),
    lessonTitle: row.record?.lesson_name ?? "レッスン",
    lessonId: row.record?.schedule_id ?? row.lesson_record_id,
    scheduleId: row.record?.schedule_id ?? null,
    lessonRecordId: row.lesson_record_id,
    lessonPlanId: row.record?.lesson_plan_id ?? null,
    followUpId: row.id,
    followUpStatus: normalizeFollowUpStatus(row),
    followUpCompletedAt: row.follow_up_completed_at ?? null,
    followUpCompletedNote: row.follow_up_completed_note ?? null,
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
    recordBlockId: row.id,
    blockId: row.block_template_id ?? blockId,
    lessonId: row.record?.schedule_id ?? row.lesson_record_id,
    lessonDate: formatDate(row.record?.schedule?.starts_at ?? row.record?.record_date),
    planName: row.record?.schedule?.lesson_plan?.name ?? "未設定",
    lessonName: row.record?.lesson_name ?? "レッスン",
    done: row.done,
    actualDuration: row.actual_duration_minutes === null ? "未入力" : `${row.actual_duration_minutes}分`,
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

  const blockItemIds = formData.getAll("block_item_ids").map(String).filter(Boolean);
  if (new Set(blockItemIds).size !== blockItemIds.length) return { error: "実施項目の識別情報が重複しています。画面を更新してください。" };

  const blocks = blockItemIds.map((itemId) => {
    const executionValue = String(formData.get(`block_${itemId}_done`) ?? "");
    const done = executionValue === "done" ? true : executionValue === "skipped" ? false : null;
    const actualMinutesValue = String(formData.get(`block_${itemId}_actual_minutes`) ?? "").trim();
    const actualMinutes = actualMinutesValue ? Number.parseInt(actualMinutesValue, 10) : null;
    const reactionValue = String(formData.get(`block_${itemId}_reaction`) ?? "") as BlockReactionCode | "";
    const reaction = blockReactionOptions.some((option) => option.value === reactionValue) ? reactionValue as BlockReactionCode : null;
    const useAgainValue = String(formData.get(`block_${itemId}_use_again`) ?? "");
    const useAgain = useAgainValue === "true" ? true : useAgainValue === "false" ? false : null;
    const reviseScript = formData.get(`block_${itemId}_revise_script`) === "on";
    const scriptRevision = String(formData.get(`block_${itemId}_script_revision`) ?? "").trim();
    const itemSourceValue = String(formData.get(`block_${itemId}_item_source`) ?? "planned") as LessonRecordItemSource;

    return {
      schedule_plan_item_id: String(formData.get(`block_${itemId}_schedule_plan_item_id`) ?? "").trim() || null,
      block_template_id: String(formData.get(`block_${itemId}_block_template_id`) ?? "").trim() || null,
      lesson_plan_block_id: String(formData.get(`block_${itemId}_plan_block_id`) ?? "").trim() || null,
      item_source: (["planned", "library", "improvised"] as const).includes(itemSourceValue) ? itemSourceValue : "planned",
      sort_order: Number.parseInt(String(formData.get(`block_${itemId}_sort_order`) ?? "0"), 10),
      display_name_snapshot: String(formData.get(`block_${itemId}_display_name_snapshot`) ?? "").trim(),
      category_name_snapshot: String(formData.get(`block_${itemId}_category_name_snapshot`) ?? "").trim(),
      subcategory_name_snapshot: String(formData.get(`block_${itemId}_subcategory_name_snapshot`) ?? "").trim(),
      planned_duration_minutes: Number.parseInt(String(formData.get(`block_${itemId}_planned_duration_minutes`) ?? "0"), 10),
      purpose_snapshot: String(formData.get(`block_${itemId}_purpose_snapshot`) ?? "").trim(),
      level_snapshot: String(formData.get(`block_${itemId}_level_snapshot`) ?? "").trim(),
      script_snapshot: String(formData.get(`block_${itemId}_script_snapshot`) ?? ""),
      cautions_snapshot: String(formData.get(`block_${itemId}_cautions_snapshot`) ?? ""),
      done,
      actual_duration_minutes: actualMinutes !== null && Number.isFinite(actualMinutes) && actualMinutes >= 0 ? actualMinutes : null,
      reaction,
      teacher_memo: String(formData.get(`block_${itemId}_teacher_memo`) ?? "").trim(),
      improvement_memo: String(formData.get(`block_${itemId}_improvement_memo`) ?? "").trim(),
      use_again: useAgain,
      script_revision: reviseScript ? scriptRevision || "セリフ見直しあり" : null,
    };
  });

  const studentIds = formData.getAll("student_ids").map(String);
  const previousFollowUps = studentIds.flatMap((studentId) =>
    formData.getAll(`student_${studentId}_pending_follow_up_ids`).map((followUpId) => ({
      id: String(followUpId),
      status: String(formData.get(`follow_up_${followUpId}_status`) ?? "pending") as FollowUpStatus,
      note: String(formData.get(`follow_up_${followUpId}_note`) ?? "").trim(),
    })),
  );
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
    previousFollowUps,
  };
}
