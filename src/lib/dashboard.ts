import { formatJapaneseDate } from "@/lib/date-format";
import {
  buildTeachingInsights,
  dedupeRadarCandidates,
  extractAnonymizedSafetySignals,
  generateRadarTopics,
  type GeneratedRadarTopic,
  type RadarTopicSignal,
  type TeachingInsight,
} from "@/lib/discovery-home";
import { measurePerformance } from "@/lib/performance";
import { getReportData, type ReportData } from "@/lib/reports";
import { requireUserId } from "@/lib/students";

export type DiscoverySchedule = {
  id: string;
  lessonName: string;
  lessonPlanId: string | null;
  lessonPlanName: string;
  startsAt: string;
  endsAt: string;
  dateLabel: string;
  timeLabel: string;
  place: string;
  participantCount: number;
  safetyNotes: Array<{ id: string; label: string; detail: string; href: string }>;
};

export type DashboardCalendarEventState = "scheduled" | "record_pending" | "recorded" | "closed" | "unconfirmed";

export type DashboardCalendarEvent = {
  id: string;
  dateKey: string;
  timeLabel: string;
  lessonName: string;
  lessonPlanId: string | null;
  lessonPlanName: string;
  place: string;
  participantCount: number;
  state: DashboardCalendarEventState;
  stateLabel: string;
  safetyNotes: DiscoverySchedule["safetyNotes"];
};

export type DashboardCalendarDay = {
  dateKey: string;
  dateLabel: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: DashboardCalendarEvent[];
};

export type DashboardCalendar = {
  monthKey: string;
  monthLabel: string;
  previousMonthKey: string;
  nextMonthKey: string;
  todayMonthKey: string;
  todayDateKey: string;
  selectedDateKey: string;
  days: DashboardCalendarDay[];
};

export type BriefItem = {
  id: string;
  title: string;
  detail: string;
  meta: string;
  href: string;
  actionLabel: string;
};

export type RadarItem = {
  id: string;
  title: string;
  sourceName: string;
  author: string;
  publishedLabel: string;
  retrievedLabel: string;
  itemType: RadarItemType;
  itemTypeLabel: string;
  summary: string;
  relevanceReason: string;
  sourceUrl: string;
  isAiSummary: boolean;
  relevanceScore: number;
  trustLabel: string;
  topicKeys: string[];
  feedback: string[];
};

export type RadarItemType =
  | "public_research"
  | "medical_health"
  | "yoga_organization"
  | "yoga_expert"
  | "general_article"
  | "video"
  | "social_signal";

export type RadarStatus = "ready" | "setting_up" | "disabled" | "failed" | "budget" | "empty";

export type DashboardData = {
  greeting: string;
  todayLabel: string;
  calendar: DashboardCalendar;
  brief: {
    nextLesson: DiscoverySchedule | null;
    pendingFollowups: BriefItem[];
    unrecordedLessons: BriefItem[];
    pendingFollowupCount: number;
    unrecordedCount: number;
  };
  insights: TeachingInsight[];
  radar: {
    status: RadarStatus;
    message: string;
    lastUpdatedLabel: string;
    items: RadarItem[];
    topics: Array<{ key: string; labelJa: string; labelEn: string; sourceKind: string }>;
    monthlyEstimatedCostUsd: number;
  };
  nextActions: Array<{ id: string; title: string; detail: string; href: string; label: string }>;
  error?: string;
};

type RawSchedule = {
  id: string;
  lesson_plan_id: string | null;
  lesson_plan_name_snapshot?: string | null;
  lesson_name: string;
  starts_at: string;
  ends_at: string;
  place: string | null;
  schedule_caution: string | null;
  status: string;
  lesson_plan?: { id: string; name: string | null } | Array<{ id: string; name: string | null }> | null;
  schedule_participants?: Array<{
    id: string;
    student_id: string;
    attendance_status: string;
    student?: { id: string; name: string; caution: string | null } | Array<{ id: string; name: string; caution: string | null }> | null;
  }>;
  schedule_closures?: Array<{ revoked_at: string | null }>;
};

type RawFollowup = {
  id: string;
  student_id: string;
  next_follow: string | null;
  follow_up_status: string | null;
  student?: { id: string; name: string } | Array<{ id: string; name: string }> | null;
  record?: { id: string; schedule_id: string | null; lesson_name: string; record_date: string } | Array<{ id: string; schedule_id: string | null; lesson_name: string; record_date: string }> | null;
};

type RawBlock = {
  id: string;
  name: string;
  purpose: string | null;
  cautions: string | null;
  category?: { name: string | null } | Array<{ name: string | null }> | null;
  block_template_tags?: Array<{ tag?: { name: string } | Array<{ name: string }> | null }>;
};

type RawPlan = { id: string; name: string; theme: string | null };
type RawKnowledge = { id: string; title: string; tags: string[] | null; status: string };
type RawStudent = { id: string; name: string; caution: string | null };

type RawRadarItem = {
  id: string;
  source_url: string;
  original_title: string;
  source_name: string;
  author: string | null;
  published_on: string | null;
  retrieved_at: string;
  item_type: RadarItemType;
  topic_keys: string[] | null;
  ai_summary: string;
  relevance_reason: string;
  relevance_score: number;
  trust_score: number;
  is_ai_summary: boolean;
  source?: { status: string } | Array<{ status: string }> | null;
};

type RawRadarTopic = {
  topic_key: string;
  label_ja: string;
  label_en: string;
  source_kind: string;
  status: string;
  priority: number;
};

type RawRadarSettings = {
  radar_enabled: boolean;
  last_success_at: string | null;
  last_error_at: string | null;
  last_error_code: string | null;
  external_paused_reason: string | null;
  hard_budget_usd: number;
};

const radarTypeLabels: Record<RadarItemType, string> = {
  public_research: "公的・研究",
  medical_health: "医療・健康",
  yoga_organization: "ヨガ団体",
  yoga_expert: "専門家の解説",
  general_article: "一般記事",
  video: "動画",
  social_signal: "SNSの話題",
};

type CalendarFrame = {
  monthKey: string;
  monthLabel: string;
  previousMonthKey: string;
  nextMonthKey: string;
  todayMonthKey: string;
  todayDateKey: string;
  selectedDateKey: string;
  dateKeys: string[];
  rangeStart: string;
  rangeEnd: string;
};

export async function getDashboardData(requestedMonth?: string): Promise<DashboardData> {
  const now = new Date();
  const calendarFrame = buildCalendarFrame(now, requestedMonth);
  try {
    return await measurePerformance(
      { operation: "data.discovery-home", route: "/dashboard" },
      () => fetchDashboardData(now, calendarFrame),
      (data) => data.insights.length + data.radar.items.length,
    );
  } catch (error) {
    return emptyDashboard(now, calendarFrame, error instanceof Error ? error.message : "ホームのデータを取得できませんでした。");
  }
}

async function fetchDashboardData(now: Date, calendarFrame: CalendarFrame): Promise<DashboardData> {
  const { supabase, userId } = await requireUserId();
  const threeMonthsAgo = new Date(now.getTime() - 93 * 86_400_000).toISOString();

  const [
    report,
    nextScheduleResult,
    recentSchedulesResult,
    calendarSchedulesResult,
    recordIdsResult,
    followupsResult,
    blocksResult,
    plansResult,
    knowledgeResult,
    studentsResult,
  ] = await Promise.all([
    getReportData({ period: "3months", format: "all", plan: "all", place: "all", now }),
    supabase
      .from("schedules")
      .select("id,lesson_plan_id,lesson_name,starts_at,ends_at,place,schedule_caution,status,lesson_plan:lesson_plans(id,name),schedule_participants(id,student_id,attendance_status,student:students(id,name,caution)),schedule_closures(revoked_at)")
      .gte("ends_at", now.toISOString())
      .order("starts_at", { ascending: true })
      .limit(20),
    supabase
      .from("schedules")
      .select("id,lesson_plan_id,lesson_name,starts_at,ends_at,place,schedule_caution,status,lesson_plan:lesson_plans(id,name),schedule_closures(revoked_at)")
      .gte("starts_at", threeMonthsAgo)
      .lt("starts_at", now.toISOString())
      .order("starts_at", { ascending: false })
      .limit(50),
    supabase
      .from("schedules")
      .select("id,lesson_plan_id,lesson_plan_name_snapshot,lesson_name,starts_at,ends_at,place,schedule_caution,status,lesson_plan:lesson_plans(id,name),schedule_participants(id,student_id,attendance_status,student:students(id,name,caution)),schedule_closures(revoked_at)")
      .gte("starts_at", calendarFrame.rangeStart)
      .lt("starts_at", calendarFrame.rangeEnd)
      .order("starts_at", { ascending: true }),
    supabase.from("lesson_records").select("schedule_id").not("schedule_id", "is", null),
    supabase
      .from("lesson_record_students")
      .select("id,student_id,next_follow,follow_up_status,student:students(id,name),record:lesson_records(id,schedule_id,lesson_name,record_date)")
      .eq("follow_up_status", "pending")
      .not("next_follow", "is", null)
      .order("follow_up_updated_at", { ascending: false })
      .limit(20),
    supabase
      .from("block_templates")
      .select("id,name,purpose,cautions,category:block_categories(name),block_template_tags(tag:block_tags(name))")
      .eq("archived", false)
      .eq("is_draft", false),
    supabase.from("lesson_plans").select("id,name,theme").neq("status", "archived"),
    supabase.from("knowledge_documents").select("id,title,tags,status").neq("status", "archived"),
    supabase.from("students").select("id,name,caution").eq("archived", false),
  ]);

  assertQuery(nextScheduleResult.error, "次回予定");
  assertQuery(recentSchedulesResult.error, "未記録レッスン");
  assertQuery(calendarSchedulesResult.error, "月間予定");
  assertQuery(recordIdsResult.error, "実施後記録");
  assertQuery(followupsResult.error, "フォロー");
  assertQuery(blocksResult.error, "ブロック");
  assertQuery(plansResult.error, "プラン");
  assertQuery(knowledgeResult.error, "Knowledge");
  assertQuery(studentsResult.error, "生徒");

  const nextSchedule = ((nextScheduleResult.data ?? []) as unknown as RawSchedule[]).find((schedule) => !hasActiveScheduleClosure(schedule)) ?? null;
  const recentSchedules = (recentSchedulesResult.data ?? []) as unknown as RawSchedule[];
  const calendarSchedules = (calendarSchedulesResult.data ?? []) as unknown as RawSchedule[];
  const recordedScheduleIds = new Set((recordIdsResult.data ?? []).map((row) => row.schedule_id).filter((id): id is string => Boolean(id)));
  const followups = (followupsResult.data ?? []) as unknown as RawFollowup[];
  const blocks = (blocksResult.data ?? []) as unknown as RawBlock[];
  const plans = (plansResult.data ?? []) as RawPlan[];
  const knowledge = (knowledgeResult.data ?? []) as RawKnowledge[];
  const students = (studentsResult.data ?? []) as RawStudent[];

  const generatedTopics = buildTopics({ blocks, plans, knowledge, students, report });
  const radar = await loadRadar({ supabase, userId, generatedTopics, now });
  const brief = buildBrief({ nextSchedule, recentSchedules, recordedScheduleIds, followups });
  const insights = buildInsights(report, generatedTopics, knowledge.length);

  return {
    greeting: greeting(now),
    todayLabel: formatJapaneseDate(now),
    calendar: buildCalendar(calendarFrame, calendarSchedules, recordedScheduleIds, now),
    brief,
    insights,
    radar,
    nextActions: buildNextActions({ brief, insights, report }),
  };
}

function buildBrief({
  nextSchedule,
  recentSchedules,
  recordedScheduleIds,
  followups,
}: {
  nextSchedule: RawSchedule | null;
  recentSchedules: RawSchedule[];
  recordedScheduleIds: Set<string>;
  followups: RawFollowup[];
}): DashboardData["brief"] {
  const unrecorded = recentSchedules.filter((schedule) => !hasActiveScheduleClosure(schedule) && !recordedScheduleIds.has(schedule.id));
  return {
    nextLesson: nextSchedule ? mapDiscoverySchedule(nextSchedule) : null,
    pendingFollowups: followups.slice(0, 3).map((row) => {
      const student = firstRelation(row.student);
      const record = firstRelation(row.record);
      return {
        id: row.id,
        title: `${student?.name ?? "生徒"}さんへのフォロー`,
        detail: row.next_follow?.trim() || "次回フォローを確認してください。",
        meta: record ? `${formatDateValue(record.record_date)}・${record.lesson_name}` : "実施後記録から",
        href: student?.id ? `/students/${student.id}#next-follow` : "/students?filter=followup",
        actionLabel: "生徒カルテを開く",
      };
    }),
    unrecordedLessons: unrecorded.slice(0, 3).map((schedule) => ({
      id: schedule.id,
      title: schedule.lesson_name,
      detail: "実施後の気づきを、分かる範囲だけ残せます。",
      meta: `${formatDateTime(schedule.starts_at)}・${schedule.place?.trim() || "場所未設定"}`,
      href: `/lessons/${schedule.id}/record`,
      actionLabel: "実施後記録を書く",
    })),
    pendingFollowupCount: followups.length,
    unrecordedCount: unrecorded.length,
  };
}

function hasActiveScheduleClosure(schedule: RawSchedule) {
  return Boolean(schedule.schedule_closures?.some((closure) => closure.revoked_at === null));
}

function buildCalendar(
  frame: CalendarFrame,
  schedules: RawSchedule[],
  recordedScheduleIds: Set<string>,
  now: Date,
): DashboardCalendar {
  const eventsByDate = new Map<string, DashboardCalendarEvent[]>();
  for (const schedule of schedules) {
    const dateKey = tokyoDateKey(new Date(schedule.starts_at));
    const participants = (schedule.schedule_participants ?? []).filter((row) => row.attendance_status === "present");
    const state = calendarEventState(schedule, recordedScheduleIds, now);
    const plan = firstRelation(schedule.lesson_plan);
    const event: DashboardCalendarEvent = {
      id: schedule.id,
      dateKey,
      timeLabel: formatTimeRange(schedule.starts_at, schedule.ends_at),
      lessonName: schedule.lesson_name,
      lessonPlanId: schedule.lesson_plan_id,
      lessonPlanName: schedule.lesson_plan_id
        ? schedule.lesson_plan_name_snapshot?.trim() || plan?.name?.trim() || "名称未設定"
        : "プラン未確定",
      place: schedule.place?.trim() || "場所未設定",
      participantCount: participants.length,
      state,
      stateLabel: calendarStateLabel(state),
      safetyNotes: scheduleSafetyNotes(schedule, participants),
    };
    eventsByDate.set(dateKey, [...(eventsByDate.get(dateKey) ?? []), event]);
  }

  return {
    monthKey: frame.monthKey,
    monthLabel: frame.monthLabel,
    previousMonthKey: frame.previousMonthKey,
    nextMonthKey: frame.nextMonthKey,
    todayMonthKey: frame.todayMonthKey,
    todayDateKey: frame.todayDateKey,
    selectedDateKey: frame.selectedDateKey,
    days: frame.dateKeys.map((dateKey) => ({
      dateKey,
      dateLabel: formatCalendarDateLabel(dateKey),
      dayNumber: Number(dateKey.slice(8, 10)),
      isCurrentMonth: dateKey.startsWith(frame.monthKey),
      isToday: dateKey === frame.todayDateKey,
      events: eventsByDate.get(dateKey) ?? [],
    })),
  };
}

function calendarEventState(schedule: RawSchedule, recordedScheduleIds: Set<string>, now: Date): DashboardCalendarEventState {
  if (hasActiveScheduleClosure(schedule)) return "closed";
  if (!schedule.lesson_plan_id) return "unconfirmed";
  if (schedule.status === "recorded" || recordedScheduleIds.has(schedule.id)) return "recorded";
  if (schedule.status === "record_pending" || Date.parse(schedule.ends_at) < now.getTime()) return "record_pending";
  return "scheduled";
}

function calendarStateLabel(state: DashboardCalendarEventState) {
  if (state === "record_pending") return "記録待ち";
  if (state === "recorded") return "記録済み";
  if (state === "closed") return "クローズ";
  if (state === "unconfirmed") return "未確定";
  return "予定";
}

function mapDiscoverySchedule(schedule: RawSchedule): DiscoverySchedule {
  const plan = firstRelation(schedule.lesson_plan);
  const participants = (schedule.schedule_participants ?? []).filter((row) => row.attendance_status === "present");
  const notes = scheduleSafetyNotes(schedule, participants);
  return {
    id: schedule.id,
    lessonName: schedule.lesson_name,
    lessonPlanId: schedule.lesson_plan_id,
    lessonPlanName: schedule.lesson_plan_id ? plan?.name?.trim() || "名称未設定" : "プラン未確定",
    startsAt: schedule.starts_at,
    endsAt: schedule.ends_at,
    dateLabel: formatDateValue(schedule.starts_at),
    timeLabel: formatTimeRange(schedule.starts_at, schedule.ends_at),
    place: schedule.place?.trim() || "場所未設定",
    participantCount: participants.length,
    safetyNotes: notes.slice(0, 5),
  };
}

function scheduleSafetyNotes(
  schedule: RawSchedule,
  participants: NonNullable<RawSchedule["schedule_participants"]>,
): DiscoverySchedule["safetyNotes"] {
  const notes: DiscoverySchedule["safetyNotes"] = [];
  if (schedule.schedule_caution?.trim()) {
    notes.push({
      id: `schedule-${schedule.id}`,
      label: "クラス全体の注意",
      detail: schedule.schedule_caution.trim(),
      href: `/schedules/${schedule.id}`,
    });
  }
  for (const participant of participants) {
    const student = firstRelation(participant.student);
    if (!student?.caution?.trim()) continue;
    notes.push({
      id: participant.id,
      label: `${student.name}さん`,
      detail: student.caution.trim(),
      href: `/students/${student.id}`,
    });
  }
  return notes.slice(0, 5);
}

function buildTopics({
  blocks,
  plans,
  knowledge,
  students,
  report,
}: {
  blocks: RawBlock[];
  plans: RawPlan[];
  knowledge: RawKnowledge[];
  students: RawStudent[];
  report: ReportData;
}): GeneratedRadarTopic[] {
  const usageByBlock = new Map(report.blocks.mostUsed.map((row) => [row.id, row.usedCount]));
  const signals: RadarTopicSignal[] = [];
  for (const block of blocks) {
    const category = firstRelation(block.category)?.name ?? "";
    const tags = (block.block_template_tags ?? []).map((entry) => firstRelation(entry.tag)?.name ?? "").filter(Boolean);
    signals.push({
      text: [block.name, category, block.purpose ?? "", ...tags].join(" "),
      kind: "practice",
      weight: usageByBlock.has(block.id) ? 1.8 : 0.7,
      recentUseCount: usageByBlock.get(block.id) ?? 0,
    });
  }
  for (const plan of plans) {
    const recent = report.plans.find((row) => row.id === plan.id)?.lessonCount ?? 0;
    signals.push({ text: `${plan.name} ${plan.theme ?? ""}`, kind: "practice", weight: recent ? 1.6 : 0.6, recentUseCount: recent });
  }
  for (const document of knowledge) {
    signals.push({ text: [document.title, ...(document.tags ?? [])].join(" "), kind: "knowledge", weight: 1.2 });
  }
  for (const reason of report.execution.reasons) {
    signals.push({ text: reason.label, kind: "practice", weight: Math.min(2, 0.5 + reason.count * 0.2) });
  }
  signals.push(...extractAnonymizedSafetySignals(students.map((student) => student.caution ?? "").filter(Boolean)));
  return generateRadarTopics(signals, 4);
}

function buildInsights(report: ReportData, topics: GeneratedRadarTopic[], knowledgeCount: number): TeachingInsight[] {
  const confirmedPlanned = report.execution.asPlanned + report.execution.adjusted + report.execution.skipped + report.execution.replaced;
  return buildTeachingInsights({
    topBlocks: report.blocks.mostUsed.map((row) => ({ id: row.id, name: row.name, usedCount: row.usedCount })),
    topPlans: report.plans.map((row) => ({ id: row.id, name: row.name, lessonCount: row.lessonCount })),
    duration: {
      averageDifferenceMinutes: report.execution.averageMinuteDifference,
      samples: report.execution.minuteDifferenceSamples,
    },
    evaluatedBlocks: report.blocks.goodReaction.map((row) => ({ id: row.id, name: row.name, evaluatedCount: row.evaluatedCount, goodRate: row.goodRate })),
    unusedBlocks: report.blocks.unused.map((row) => ({ id: row.id, name: row.name })),
    dataQuality: {
      recordedLessons: report.dataQuality.recordedLessons,
      totalLessons: report.dataQuality.lessons,
      unevaluatedBlocks: report.dataQuality.unevaluatedBlocks,
      missingActualMinutes: report.dataQuality.missingActualMinutes,
      legacyUnclassifiedItems: report.dataQuality.legacyUnclassifiedItems,
    },
    changes: {
      confirmedPlanned,
      adjusted: report.execution.adjusted,
      skipped: report.execution.skipped,
      replaced: report.execution.replaced,
      added: report.execution.libraryAdded + report.execution.improvisedAdded,
    },
    knowledgeTopic: topics.find((topic) => topic.evidence.knowledgeSignals > 0)
      ? { label: topics.find((topic) => topic.evidence.knowledgeSignals > 0)!.labelJa, documentCount: knowledgeCount }
      : null,
  });
}

async function loadRadar({
  supabase,
  userId,
  generatedTopics,
  now,
}: {
  supabase: Awaited<ReturnType<typeof requireUserId>>["supabase"];
  userId: string;
  generatedTopics: GeneratedRadarTopic[];
  now: Date;
}): Promise<DashboardData["radar"]> {
  try {
    const existingTopicsResult = await supabase
      .from("radar_topics")
      .select("topic_key,label_ja,label_en,source_kind,status,priority");
    if (existingTopicsResult.error) throw existingTopicsResult.error;
    const existingTopics = (existingTopicsResult.data ?? []) as RawRadarTopic[];

    const settingsUpsert = await supabase
      .from("radar_settings")
      .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
    if (settingsUpsert.error) throw settingsUpsert.error;

    if (generatedTopics.length) {
      const topicUpsert = await supabase.from("radar_topics").upsert(
        generatedTopics.map((topic) => ({
          user_id: userId,
          topic_key: topic.topicKey,
          label_ja: topic.labelJa,
          label_en: topic.labelEn,
          search_queries: topic.searchQueries,
          source_kind: topic.sourceKind,
          evidence: topic.evidence,
          priority: Math.max(topic.priority, existingTopics.find((row) => row.topic_key === topic.topicKey)?.priority ?? 0),
          status: "active",
          last_generated_at: now.toISOString(),
        })),
        { onConflict: "user_id,topic_key" },
      );
      if (topicUpsert.error) throw topicUpsert.error;
    }

    const selectedKeys = new Set(generatedTopics.map((topic) => topic.topicKey));
    const staleKeys = existingTopics.filter((topic) => topic.status === "active" && !selectedKeys.has(topic.topic_key)).map((topic) => topic.topic_key);
    if (staleKeys.length) {
      const staleResult = await supabase.from("radar_topics").update({ status: "blocked" }).in("topic_key", staleKeys);
      if (staleResult.error) throw staleResult.error;
    }

    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const [settingsResult, topicsResult, itemsResult, runsResult] = await Promise.all([
      supabase.from("radar_settings").select("radar_enabled,last_success_at,last_error_at,last_error_code,external_paused_reason,hard_budget_usd").maybeSingle(),
      supabase.from("radar_topics").select("topic_key,label_ja,label_en,source_kind,status,priority").eq("status", "active").order("priority", { ascending: false }).limit(4),
      supabase
        .from("radar_items")
        .select("id,source_url,original_title,source_name,author,published_on,retrieved_at,item_type,topic_keys,ai_summary,relevance_reason,relevance_score,trust_score,is_ai_summary,source:radar_sources(status)")
        .eq("processing_status", "ready")
        .eq("visibility_status", "visible")
        .order("relevance_score", { ascending: false })
        .order("retrieved_at", { ascending: false })
        .limit(30),
      supabase.from("radar_runs").select("estimated_cost_usd").gte("started_at", monthStart),
    ]);
    if (settingsResult.error) throw settingsResult.error;
    if (topicsResult.error) throw topicsResult.error;
    if (itemsResult.error) throw itemsResult.error;
    if (runsResult.error) throw runsResult.error;

    const settings = settingsResult.data as RawRadarSettings | null;
    const rawItems = dedupeRadarCandidates(
      ((itemsResult.data ?? []) as unknown as RawRadarItem[])
        .filter((item) => firstRelation(item.source)?.status !== "blocked")
        .map((item) => ({ item, sourceUrl: item.source_url, title: item.original_title })),
    ).map(({ item }) => item);
    const itemIds = rawItems.map((item) => item.id);
    const feedbackResult = itemIds.length
      ? await supabase.from("radar_feedback").select("item_id,action").in("item_id", itemIds)
      : { data: [], error: null };
    if (feedbackResult.error) throw feedbackResult.error;
    const feedbackByItem = new Map<string, string[]>();
    for (const row of feedbackResult.data ?? []) feedbackByItem.set(row.item_id, [...(feedbackByItem.get(row.item_id) ?? []), row.action]);

    const monthlyEstimatedCostUsd = Math.round((runsResult.data ?? []).reduce((sum, row) => sum + Number(row.estimated_cost_usd ?? 0), 0) * 1_000_000) / 1_000_000;
    const globalEnabled = process.env.RADAR_EXTERNAL_FETCH_ENABLED === "true";
    const status = resolveRadarStatus({ globalEnabled, settings, itemCount: rawItems.length, monthlyEstimatedCostUsd });
    const lastUpdated = settings?.last_success_at ?? rawItems[0]?.retrieved_at ?? null;

    return {
      status,
      message: radarStatusMessage(status, Boolean(rawItems.length)),
      lastUpdatedLabel: lastUpdated ? formatDateTime(lastUpdated) : "まだ取得していません",
      items: rawItems.map((item) => ({
        id: item.id,
        title: item.original_title,
        sourceName: item.source_name,
        author: item.author?.trim() || "著者情報なし",
        publishedLabel: item.published_on
          ? `公開 ${formatDateValue(item.published_on)}`
          : `取得 ${formatDateTime(item.retrieved_at)}`,
        retrievedLabel: formatDateTime(item.retrieved_at),
        itemType: item.item_type,
        itemTypeLabel: radarTypeLabels[item.item_type],
        summary: item.ai_summary,
        relevanceReason: item.relevance_reason,
        sourceUrl: item.source_url,
        isAiSummary: item.is_ai_summary,
        relevanceScore: Number(item.relevance_score),
        trustLabel: trustLabel(item.item_type, Number(item.trust_score)),
        topicKeys: item.topic_keys ?? [],
        feedback: feedbackByItem.get(item.id) ?? [],
      })),
      topics: ((topicsResult.data ?? []) as RawRadarTopic[]).map((topic) => ({ key: topic.topic_key, labelJa: topic.label_ja, labelEn: topic.label_en, sourceKind: topic.source_kind })),
      monthlyEstimatedCostUsd,
    };
  } catch (error) {
    const missingTable = typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "42P01";
    return {
      status: process.env.RADAR_EXTERNAL_FETCH_ENABLED === "true" && !missingTable ? "failed" : "setting_up",
      message: missingTable ? "ナレッジレーダーを準備しています。今日のブリーフと自分の発見は利用できます。" : "外部情報の読み込みに失敗しました。前回の情報があれば、そのまま維持されます。",
      lastUpdatedLabel: "未取得",
      items: [],
      topics: generatedTopics.map((topic) => ({ key: topic.topicKey, labelJa: topic.labelJa, labelEn: topic.labelEn, sourceKind: topic.sourceKind })),
      monthlyEstimatedCostUsd: 0,
    };
  }
}

function resolveRadarStatus({
  globalEnabled,
  settings,
  itemCount,
  monthlyEstimatedCostUsd,
}: {
  globalEnabled: boolean;
  settings: RawRadarSettings | null;
  itemCount: number;
  monthlyEstimatedCostUsd: number;
}): RadarStatus {
  if (!globalEnabled || settings?.radar_enabled === false) return "disabled";
  if (settings?.external_paused_reason === "hard_budget" || (settings && monthlyEstimatedCostUsd >= Number(settings.hard_budget_usd))) return "budget";
  if (itemCount > 0) return "ready";
  if (settings?.last_error_at) return "failed";
  if (!settings?.last_success_at) return "setting_up";
  return "empty";
}

function radarStatusMessage(status: RadarStatus, hasItems: boolean): string {
  if (status === "ready") return hasItems ? "更新済み" : "更新準備中";
  if (status === "failed" || status === "budget" || (status === "disabled" && hasItems)) return "前回情報を表示中";
  if (status === "empty") return "次回更新を待っています";
  return "更新準備中";
}

function buildNextActions({
  brief,
  insights,
  report,
}: {
  brief: DashboardData["brief"];
  insights: TeachingInsight[];
  report: ReportData;
}): DashboardData["nextActions"] {
  const actions: DashboardData["nextActions"] = [];
  if (!brief.nextLesson) {
    actions.push({ id: "schedule", title: "次のレッスンを置く", detail: "予定をひとつ登録すると、安全確認と準備の導線がホームに現れます。", href: "/schedules/new", label: "予定を登録" });
  } else if (brief.nextLesson.lessonPlanId) {
    actions.push({ id: "review-plan", title: "次回プランを30秒だけ見直す", detail: "最近の発見をひとつ選び、必要なら代替ブロックを準備できます。", href: `/lessons/${brief.nextLesson.lessonPlanId}`, label: "プランを見る" });
  }
  if (brief.unrecordedCount > 0) {
    actions.push({ id: "record", title: "新しい記録から気づきを残す", detail: `${brief.unrecordedCount}件の未記録レッスンがあります。分かる項目だけで構いません。`, href: brief.unrecordedLessons[0]?.href ?? "/lessons?tab=records", label: "記録を書く" });
  }
  if (report.dataQuality.unevaluatedBlocks > 0 || report.dataQuality.missingActualMinutes > 0) {
    actions.push({ id: "quality", title: "次の1件だけ評価を足す", detail: "未入力を推測せず、入力された分だけで発見の精度を育てます。", href: "/lessons?tab=records", label: "記録を確認" });
  }
  if (actions.length < 3) {
    const reusable = insights.find((insight) => insight.kind === "reuse");
    if (reusable) actions.push({ id: "reuse", title: "久しぶりのブロックを候補に戻す", detail: reusable.title, href: reusable.href, label: "内容を見る" });
  }
  return actions.slice(0, 3);
}

function trustLabel(type: RadarItemType, score: number): string {
  if (type === "social_signal") return "話題のシグナル（根拠用途外）";
  if (type === "public_research") return "公的・研究情報";
  if (type === "medical_health") return "医療・健康専門情報";
  if (score >= 0.75) return "出典を確認して活用";
  return "経験知・一般情報として参照";
}

function buildCalendarFrame(now: Date, requestedMonth?: string): CalendarFrame {
  const todayDateKey = tokyoDateKey(now);
  const todayMonthKey = todayDateKey.slice(0, 7);
  const monthKey = normalizeMonthKey(requestedMonth) ?? todayMonthKey;
  const [year, month] = monthKey.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const gridStart = new Date(Date.UTC(year, month - 1, 1 - firstWeekday));
  const dateKeys = Array.from({ length: 42 }, (_, index) => utcDateKey(new Date(gridStart.getTime() + index * 86_400_000)));
  const rangeEndKey = utcDateKey(new Date(gridStart.getTime() + 42 * 86_400_000));
  return {
    monthKey,
    monthLabel: `${year}年${month}月`,
    previousMonthKey: shiftMonthKey(monthKey, -1),
    nextMonthKey: shiftMonthKey(monthKey, 1),
    todayMonthKey,
    todayDateKey,
    selectedDateKey: monthKey === todayMonthKey ? todayDateKey : `${monthKey}-01`,
    dateKeys,
    rangeStart: `${dateKeys[0]}T00:00:00+09:00`,
    rangeEnd: `${rangeEndKey}T00:00:00+09:00`,
  };
}

function normalizeMonthKey(value?: string) {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null;
  const [year, month] = value.split("-").map(Number);
  const normalized = new Date(Date.UTC(year, month - 1, 1));
  return normalized.getUTCFullYear() === year && normalized.getUTCMonth() === month - 1 ? value : null;
}

function shiftMonthKey(monthKey: string, offset: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function tokyoDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";
  return `${year}-${month}-${day}`;
}

function utcDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function formatCalendarDateLabel(dateKey: string) {
  return new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" }).format(new Date(`${dateKey}T00:00:00+09:00`));
}

function greeting(now: Date): string {
  const hour = Number(new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", hour12: false, timeZone: "Asia/Tokyo" }).format(now));
  if (hour < 11) return "おはようございます";
  if (hour < 17) return "こんにちは";
  return "こんばんは";
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "日時不明";
  return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" }).format(date);
}

function formatDateValue(value: string): string {
  const date = value.length === 10 ? new Date(`${value}T00:00:00+09:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return "日付不明";
  return new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" }).format(date);
}

function formatTimeRange(start: string, end: string): string {
  const formatter = new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" });
  return `${formatter.format(new Date(start))}–${formatter.format(new Date(end))}`;
}

function assertQuery(error: { message: string } | null, label: string): void {
  if (error) throw new Error(`${label}を取得できませんでした: ${error.message}`);
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function emptyDashboard(now: Date, calendarFrame: CalendarFrame, error: string): DashboardData {
  return {
    greeting: greeting(now),
    todayLabel: formatJapaneseDate(now),
    calendar: buildCalendar(calendarFrame, [], new Set<string>(), now),
    brief: { nextLesson: null, pendingFollowups: [], unrecordedLessons: [], pendingFollowupCount: 0, unrecordedCount: 0 },
    insights: buildTeachingInsights({
      topBlocks: [],
      topPlans: [],
      duration: { averageDifferenceMinutes: null, samples: 0 },
      evaluatedBlocks: [],
      unusedBlocks: [],
      dataQuality: { recordedLessons: 0, totalLessons: 0, unevaluatedBlocks: 0, missingActualMinutes: 0, legacyUnclassifiedItems: 0 },
      changes: { confirmedPlanned: 0, adjusted: 0, skipped: 0, replaced: 0, added: 0 },
    }),
    radar: { status: "failed", message: "ホームの一部を読み込めませんでした。主要機能への操作は利用できます。", lastUpdatedLabel: "未取得", items: [], topics: [], monthlyEstimatedCostUsd: 0 },
    nextActions: [{ id: "schedule", title: "次のレッスンを置く", detail: "予定を登録して準備を始められます。", href: "/schedules/new", label: "予定を登録" }],
    error,
  };
}
