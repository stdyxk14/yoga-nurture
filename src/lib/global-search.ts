import { parsePlanMeta } from "@/lib/lesson-plans";
import type { RequestSupabaseClient } from "@/lib/supabase/server";
import type {
  GlobalSearchGroup,
  GlobalSearchItem,
  GlobalSearchKind,
  GlobalSearchResponse,
} from "@/lib/global-search-types";

const DISPLAY_LIMIT = 5;
const QUERY_LIMIT = DISPLAY_LIMIT + 1;
const RELATED_MATCH_LIMIT = 40;

type StudentRow = {
  id: string;
  name: string;
  kana: string | null;
  age_group: string | null;
  caution: string | null;
  memo: string | null;
  archived: boolean;
};

type ScheduleRow = {
  id: string;
  lesson_name: string;
  starts_at: string;
  ends_at: string;
  place: string | null;
  status: string;
  lesson_plan_name_snapshot: string | null;
  lesson_plan?: { name: string | null } | Array<{ name: string | null }> | null;
  schedule_closures?: Array<{ revoked_at: string | null }>;
};

type LessonPlanRow = {
  id: string;
  name: string;
  theme: string | null;
  duration_minutes: number;
  memo: string | null;
  status: string;
};

type BlockRow = {
  id: string;
  name: string;
  duration_minutes: number;
  purpose: string | null;
  category?: { name: string | null } | Array<{ name: string | null }> | null;
  subcategory?: { name: string | null } | Array<{ name: string | null }> | null;
  block_template_tags?: Array<{
    tag?: { name: string | null } | Array<{ name: string | null }> | null;
  }>;
};

type LessonRecordRow = {
  id: string;
  schedule_id: string | null;
  lesson_plan_id: string | null;
  lesson_name: string;
  record_date: string;
  overall_memo: string | null;
  student_reaction: string | null;
  improvement: string | null;
  schedule?: {
    id: string;
    status: string | null;
    starts_at: string | null;
    lesson_plan_name_snapshot: string | null;
    lesson_plan?: { name: string | null } | Array<{ name: string | null }> | null;
  } | Array<{
    id: string;
    status: string | null;
    starts_at: string | null;
    lesson_plan_name_snapshot: string | null;
    lesson_plan?: { name: string | null } | Array<{ name: string | null }> | null;
  }> | null;
  lesson_plan?: { name: string | null } | Array<{ name: string | null }> | null;
};

export async function searchGlobal(
  supabase: RequestSupabaseClient,
  userId: string,
  input: string,
): Promise<GlobalSearchResponse> {
  const query = input.trim().slice(0, 80);
  const filterTerm = normalizeFilterTerm(query);
  const encodedQuery = encodeURIComponent(query);
  const fallbacks = {
    students: emptyGroup(`/students?q=${encodedQuery}`),
    schedules: emptyGroup(`/lessons?q=${encodedQuery}`),
    lessonPlans: emptyGroup(`/lessons?tab=plans&q=${encodedQuery}`),
    blocks: emptyGroup(`/lessons?tab=blocks&q=${encodedQuery}`),
    lessonRecords: emptyGroup(`/lessons?tab=records&q=${encodedQuery}`),
  };

  if (!filterTerm) {
    return { query, groups: fallbacks, unavailableGroups: [] };
  }

  const [students, schedules, lessonPlans, blocks, lessonRecords] = await Promise.allSettled([
    searchStudents(supabase, userId, query, filterTerm),
    searchSchedules(supabase, userId, query, filterTerm),
    searchLessonPlans(supabase, userId, query, filterTerm),
    searchBlocks(supabase, userId, query, filterTerm),
    searchLessonRecords(supabase, userId, query, filterTerm),
  ]);

  const unavailableGroups: GlobalSearchKind[] = [];
  if (students.status === "rejected") unavailableGroups.push("student");
  if (schedules.status === "rejected") unavailableGroups.push("schedule");
  if (lessonPlans.status === "rejected") unavailableGroups.push("lesson-plan");
  if (blocks.status === "rejected") unavailableGroups.push("block");
  if (lessonRecords.status === "rejected") unavailableGroups.push("lesson-record");

  if (unavailableGroups.length === 5) {
    throw new Error("横断検索の結果を取得できませんでした。");
  }

  return {
    query,
    groups: {
      students: students.status === "fulfilled" ? students.value : fallbacks.students,
      schedules: schedules.status === "fulfilled" ? schedules.value : fallbacks.schedules,
      lessonPlans: lessonPlans.status === "fulfilled" ? lessonPlans.value : fallbacks.lessonPlans,
      blocks: blocks.status === "fulfilled" ? blocks.value : fallbacks.blocks,
      lessonRecords: lessonRecords.status === "fulfilled" ? lessonRecords.value : fallbacks.lessonRecords,
    },
    unavailableGroups,
  };
}

async function searchStudents(
  supabase: RequestSupabaseClient,
  userId: string,
  query: string,
  filterTerm: string,
): Promise<GlobalSearchGroup> {
  const { data, error } = await supabase
    .from("students")
    .select("id,name,kana,age_group,caution,memo,archived,updated_at")
    .eq("user_id", userId)
    .or(buildIlikeOr(["name", "kana", "age_group", "caution", "memo"], filterTerm))
    .order("archived", { ascending: true })
    .order("updated_at", { ascending: false })
    .limit(QUERY_LIMIT);

  if (error) throw error;
  const rows = (data ?? []) as StudentRow[];
  const pendingStudentIds = await getPendingFollowUpStudentIds(supabase, rows.map((row) => row.id));
  const items = rows.slice(0, DISPLAY_LIMIT).map((row): GlobalSearchItem => {
    const flags: string[] = [];
    if (pendingStudentIds.has(row.id)) flags.push("要フォロー");
    if (row.caution?.trim()) flags.push("注意点あり");
    if (row.archived) flags.push("アーカイブ");
    return {
      id: row.id,
      kind: "student",
      href: `/students/${row.id}`,
      title: row.name,
      description: [row.kana, row.age_group].filter(Boolean).join(" ・ ") || "プロフィール",
      meta: [],
      flags,
      matchContext: findMatchContext(query, [
        ["ふりがな", row.kana],
        ["年代", row.age_group],
        ["注意点", row.caution],
        ["メモ", row.memo],
      ]),
    };
  });

  return {
    items,
    hasMore: rows.length > DISPLAY_LIMIT,
    seeAllHref: `/students?q=${encodeURIComponent(query)}`,
  };
}

async function getPendingFollowUpStudentIds(supabase: RequestSupabaseClient, studentIds: string[]) {
  const ids = new Set<string>();
  if (!studentIds.length) return ids;

  const extended = await supabase
    .from("lesson_record_students")
    .select("student_id,next_follow,follow_up_status")
    .in("student_id", studentIds)
    .eq("follow_up_status", "pending")
    .not("next_follow", "is", null)
    .limit(RELATED_MATCH_LIMIT);

  if (!extended.error) {
    for (const row of extended.data ?? []) if (row.next_follow?.trim()) ids.add(row.student_id);
    return ids;
  }

  const fallback = await supabase
    .from("lesson_record_students")
    .select("student_id,next_follow")
    .in("student_id", studentIds)
    .not("next_follow", "is", null)
    .limit(RELATED_MATCH_LIMIT);
  if (fallback.error) return ids;
  for (const row of fallback.data ?? []) if (row.next_follow?.trim()) ids.add(row.student_id);
  return ids;
}

async function searchSchedules(
  supabase: RequestSupabaseClient,
  userId: string,
  query: string,
  filterTerm: string,
): Promise<GlobalSearchGroup> {
  const select = "id,lesson_name,starts_at,ends_at,place,status,lesson_plan_name_snapshot,lesson_plan:lesson_plans(name),schedule_closures(revoked_at)";
  const range = parseDateRange(query);
  const textRequest = supabase
    .from("schedules")
    .select(select)
    .eq("user_id", userId)
    .or(buildIlikeOr(["lesson_name", "lesson_plan_name_snapshot", "place"], filterTerm))
    .order("starts_at", { ascending: false })
    .limit(QUERY_LIMIT);
  const dateRequest = range
    ? supabase
        .from("schedules")
        .select(select)
        .eq("user_id", userId)
        .gte("starts_at", range.start)
        .lt("starts_at", range.end)
        .order("starts_at", { ascending: false })
        .limit(QUERY_LIMIT)
    : Promise.resolve({ data: [] as unknown[], error: null });

  const [textResult, dateResult] = await Promise.all([textRequest, dateRequest]);
  if (textResult.error) throw textResult.error;
  if (dateResult.error) throw dateResult.error;

  const dateMatchIds = new Set(((dateResult.data ?? []) as unknown as ScheduleRow[]).map((row) => row.id));
  const rows = uniqueById([
    ...((textResult.data ?? []) as unknown as ScheduleRow[]),
    ...((dateResult.data ?? []) as unknown as ScheduleRow[]),
  ]).sort((a, b) => b.starts_at.localeCompare(a.starts_at));

  return {
    items: rows.slice(0, DISPLAY_LIMIT).map((row): GlobalSearchItem => {
      const lessonPlan = firstRelation(row.lesson_plan);
      const planName = row.lesson_plan_name_snapshot?.trim() || lessonPlan?.name?.trim() || "プラン未設定";
      const dateTime = formatDateTime(row.starts_at);
      return {
        id: row.id,
        kind: "schedule",
        href: `/schedules/${row.id}`,
        title: row.lesson_name,
        description: planName,
        meta: [dateTime, row.place?.trim() || "場所未設定"],
        status: row.schedule_closures?.some((closure) => closure.revoked_at === null) ? "クローズ済み" : scheduleStatusLabel(row.status),
        matchContext: dateMatchIds.has(row.id)
          ? `日付: ${dateTime}`
          : findMatchContext(query, [
              ["使用プラン", planName],
              ["場所", row.place],
            ]),
      };
    }),
    hasMore:
      rows.length > DISPLAY_LIMIT ||
      (textResult.data?.length ?? 0) >= QUERY_LIMIT ||
      (dateResult.data?.length ?? 0) >= QUERY_LIMIT,
    seeAllHref: `/lessons?q=${encodeURIComponent(query)}`,
  };
}

async function searchLessonPlans(
  supabase: RequestSupabaseClient,
  userId: string,
  query: string,
  filterTerm: string,
): Promise<GlobalSearchGroup> {
  const { data, error } = await supabase
    .from("lesson_plans")
    .select("id,name,theme,duration_minutes,memo,status,updated_at")
    .eq("user_id", userId)
    .neq("status", "archived")
    .or(buildIlikeOr(["name", "theme", "memo"], filterTerm))
    .order("updated_at", { ascending: false })
    .limit(QUERY_LIMIT);

  if (error) throw error;
  const rows = (data ?? []) as LessonPlanRow[];
  return {
    items: rows.slice(0, DISPLAY_LIMIT).map((row): GlobalSearchItem => {
      const meta = parsePlanMeta(row.memo);
      const tags = meta.tags ?? [];
      return {
        id: row.id,
        kind: "lesson-plan",
        href: `/lessons/${row.id}`,
        title: row.name,
        description: row.theme?.trim() || tags.join(" ") || "テーマ未設定",
        meta: [`合計 ${row.duration_minutes}分`],
        status: lessonPlanStatusLabel(row.status),
        matchContext: findMatchContext(query, [
          ["テーマ", row.theme],
          ["タグ", tags.join(" ")],
        ]),
      };
    }),
    hasMore: rows.length > DISPLAY_LIMIT,
    seeAllHref: `/lessons?tab=plans&q=${encodeURIComponent(query)}`,
  };
}

async function searchBlocks(
  supabase: RequestSupabaseClient,
  userId: string,
  query: string,
  filterTerm: string,
): Promise<GlobalSearchGroup> {
  const pattern = `%${filterTerm}%`;
  const [categories, subcategories, tags] = await Promise.all([
    supabase.from("block_categories").select("id").eq("user_id", userId).ilike("name", pattern).limit(12),
    supabase.from("block_subcategories").select("id").eq("user_id", userId).ilike("name", pattern).limit(12),
    supabase.from("block_tags").select("id").eq("user_id", userId).ilike("name", pattern).limit(12),
  ]);
  if (categories.error) throw categories.error;
  if (subcategories.error) throw subcategories.error;
  if (tags.error) throw tags.error;

  const tagIds = (tags.data ?? []).map((row) => row.id);
  const blockTagResult = tagIds.length
    ? await supabase
        .from("block_template_tags")
        .select("block_template_id")
        .in("tag_id", tagIds)
        .limit(RELATED_MATCH_LIMIT)
    : { data: [] as Array<{ block_template_id: string }>, error: null };
  if (blockTagResult.error) throw blockTagResult.error;

  const filters = [
    buildIlikeOr(["name", "purpose"], filterTerm),
    buildInFilter("category_id", (categories.data ?? []).map((row) => row.id)),
    buildInFilter("subcategory_id", (subcategories.data ?? []).map((row) => row.id)),
    buildInFilter("id", (blockTagResult.data ?? []).map((row) => row.block_template_id)),
  ].filter(Boolean);

  const { data, error } = await supabase
    .from("block_templates")
    .select(`
      id,
      name,
      duration_minutes,
      purpose,
      updated_at,
      category:block_categories(name),
      subcategory:block_subcategories(name),
      block_template_tags(tag:block_tags(name))
    `)
    .eq("user_id", userId)
    .eq("archived", false)
    .or(filters.join(","))
    .order("updated_at", { ascending: false })
    .limit(QUERY_LIMIT);

  if (error) throw error;
  const rows = (data ?? []) as unknown as BlockRow[];
  return {
    items: rows.slice(0, DISPLAY_LIMIT).map((row): GlobalSearchItem => {
      const category = firstRelation(row.category)?.name?.trim() || "未分類";
      const subcategory = firstRelation(row.subcategory)?.name?.trim() || "未分類";
      const blockTags = (row.block_template_tags ?? [])
        .map((item) => firstRelation(item.tag)?.name?.trim())
        .filter((tag): tag is string => Boolean(tag));
      return {
        id: row.id,
        kind: "block",
        href: `/blocks/${row.id}`,
        title: row.name,
        description: `${category} / ${subcategory}`,
        meta: [`目安 ${row.duration_minutes}分`, ...(blockTags.length ? [blockTags.join(" ")] : [])],
        matchContext: findMatchContext(query, [
          ["カテゴリー", `${category} ${subcategory}`],
          ["タグ", blockTags.join(" ")],
          ["目的", row.purpose],
        ]),
      };
    }),
    hasMore: rows.length > DISPLAY_LIMIT,
    seeAllHref: `/lessons?tab=blocks&q=${encodeURIComponent(query)}`,
  };
}

async function searchLessonRecords(
  supabase: RequestSupabaseClient,
  userId: string,
  query: string,
  filterTerm: string,
): Promise<GlobalSearchGroup> {
  const pattern = `%${filterTerm}%`;
  const [matchingSchedules, matchingPlans, matchingStudentNotes] = await Promise.all([
    supabase
      .from("schedules")
      .select("id,lesson_plan_name_snapshot")
      .eq("user_id", userId)
      .ilike("lesson_plan_name_snapshot", pattern)
      .limit(RELATED_MATCH_LIMIT),
    supabase
      .from("lesson_plans")
      .select("id,name")
      .eq("user_id", userId)
      .ilike("name", pattern)
      .limit(RELATED_MATCH_LIMIT),
    supabase
      .from("lesson_record_students")
      .select("lesson_record_id,condition,memo")
      .or(buildIlikeOr(["condition", "memo"], filterTerm))
      .order("updated_at", { ascending: false })
      .limit(RELATED_MATCH_LIMIT),
  ]);
  if (matchingSchedules.error) throw matchingSchedules.error;
  if (matchingPlans.error) throw matchingPlans.error;
  if (matchingStudentNotes.error) throw matchingStudentNotes.error;

  const filters = [
    buildIlikeOr(["lesson_name", "overall_memo", "student_reaction", "improvement"], filterTerm),
    buildInFilter("schedule_id", (matchingSchedules.data ?? []).map((row) => row.id)),
    buildInFilter("lesson_plan_id", (matchingPlans.data ?? []).map((row) => row.id)),
    buildInFilter("id", (matchingStudentNotes.data ?? []).map((row) => row.lesson_record_id)),
  ].filter(Boolean);

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
      updated_at,
      schedule:schedules(id,status,starts_at,lesson_plan_name_snapshot,lesson_plan:lesson_plans(name)),
      lesson_plan:lesson_plans(name)
    `)
    .eq("user_id", userId)
    .or(filters.join(","))
    .order("updated_at", { ascending: false })
    .limit(QUERY_LIMIT);

  if (error) throw error;
  const rows = (data ?? []) as unknown as LessonRecordRow[];
  const studentContextByRecord = new Map<string, string>();
  for (const note of matchingStudentNotes.data ?? []) {
    if (studentContextByRecord.has(note.lesson_record_id)) continue;
    const context = findMatchContext(query, [
      ["生徒の観察", note.condition],
      ["生徒メモ", note.memo],
    ]);
    if (context) studentContextByRecord.set(note.lesson_record_id, context);
  }

  return {
    items: rows.slice(0, DISPLAY_LIMIT).map((row): GlobalSearchItem => {
      const schedule = firstRelation(row.schedule);
      const scheduledPlan = firstRelation(schedule?.lesson_plan);
      const directPlan = firstRelation(row.lesson_plan);
      const planName =
        schedule?.lesson_plan_name_snapshot?.trim() ||
        scheduledPlan?.name?.trim() ||
        directPlan?.name?.trim() ||
        "プラン未設定";
      const dateValue = schedule?.starts_at || `${row.record_date}T00:00:00+09:00`;
      return {
        id: row.id,
        kind: "lesson-record",
        href: row.schedule_id
          ? `/lessons/${row.schedule_id}/record`
          : `/lessons?tab=records&q=${encodeURIComponent(query)}`,
        title: row.lesson_name,
        description: planName,
        meta: [`実施 ${formatDate(dateValue)}`],
        status: schedule?.status === "recorded" ? "記録済み" : "下書き",
        matchContext:
          findMatchContext(query, [
            ["使用プラン", planName],
            ["全体メモ", row.overall_memo],
            ["生徒の反応", row.student_reaction],
            ["改善ポイント", row.improvement],
          ]) ?? studentContextByRecord.get(row.id),
      };
    }),
    hasMore: rows.length > DISPLAY_LIMIT,
    seeAllHref: `/lessons?tab=records&q=${encodeURIComponent(query)}`,
  };
}

function emptyGroup(seeAllHref: string): GlobalSearchGroup {
  return { items: [], hasMore: false, seeAllHref };
}

function normalizeFilterTerm(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\p{M}\s#ー々〆ヵヶ/・-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

// This is PostgREST filter syntax, not SQL. The user term is normalized above
// so it cannot introduce OR delimiters or operators into the filter expression.
function buildIlikeOr(columns: readonly string[], filterTerm: string) {
  return columns.map((column) => `${column}.ilike.%${filterTerm}%`).join(",");
}

function buildInFilter(column: string, ids: string[]) {
  const uniqueIds = Array.from(new Set(ids)).slice(0, RELATED_MATCH_LIMIT);
  return uniqueIds.length ? `${column}.in.(${uniqueIds.join(",")})` : "";
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function uniqueById<T extends { id: string }>(rows: T[]) {
  const unique = new Map<string, T>();
  for (const row of rows) if (!unique.has(row.id)) unique.set(row.id, row);
  return Array.from(unique.values());
}

function findMatchContext(query: string, entries: Array<[string, string | null | undefined]>) {
  const needle = normalizeForMatch(query);
  if (!needle) return undefined;
  for (const [label, value] of entries) {
    const text = value?.trim();
    if (text && normalizeForMatch(text).includes(needle)) return `${label}: ${truncate(text, 96)}`;
  }
  return undefined;
}

function normalizeForMatch(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("ja").trim();
}

function truncate(value: string, limit: number) {
  const text = value.replace(/\s+/g, " ").trim();
  return Array.from(text).length > limit ? `${Array.from(text).slice(0, limit).join("")}…` : text;
}

function scheduleStatusLabel(status: string) {
  const labels: Record<string, string> = {
    scheduled: "予定",
    preparing: "事前準備中",
    prepared: "事前準備済み",
    record_pending: "記録待ち",
    recorded: "記録済み",
  };
  return labels[status] ?? "予定";
}

function lessonPlanStatusLabel(status: string) {
  if (status === "ready") return "準備済み";
  if (status === "archived") return "アーカイブ";
  return "下書き";
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(new Date(value));
}

function parseDateRange(value: string) {
  const normalized = value.normalize("NFKC").trim();
  let year: number | undefined;
  let month: number | undefined;
  let day: number | undefined;
  const full = normalized.match(/^(\d{4})[年\/-](\d{1,2})[月\/-](\d{1,2})日?$/);
  const short = normalized.match(/^(\d{1,2})[月\/](\d{1,2})日?$/);
  if (full) {
    year = Number(full[1]);
    month = Number(full[2]);
    day = Number(full[3]);
  } else if (short) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
    }).formatToParts(new Date());
    year = Number(parts.find((part) => part.type === "year")?.value);
    month = Number(short[1]);
    day = Number(short[2]);
  }
  if (!year || !month || !day) return null;
  const validityCheck = new Date(Date.UTC(year, month - 1, day));
  if (
    validityCheck.getUTCFullYear() !== year ||
    validityCheck.getUTCMonth() !== month - 1 ||
    validityCheck.getUTCDate() !== day
  ) {
    return null;
  }
  const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const start = new Date(`${dateKey}T00:00:00+09:00`);
  const end = new Date(start.getTime() + 86_400_000);
  return { start: start.toISOString(), end: end.toISOString() };
}
