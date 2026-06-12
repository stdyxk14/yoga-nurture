import { revalidatePath } from "next/cache";
import type { StudentAttendanceStats, StudentLessonHistory, StudentObservation, StudentRecord } from "@/components/yoga/records";
import { getStudentRecordInsights } from "@/lib/lesson-records";
import { getLessonPlanById, type DbLessonPlan } from "@/lib/lesson-plans";
import { getOpenAIClient, isOpenAIConfigured, studentSuggestionModel } from "@/lib/openai/server";
import { getStudentById, requireUserId } from "@/lib/students";

export type MentorType = "body" | "communication" | "lesson_design" | "general";

export type AiSuggestion = {
  id: string;
  targetType: string;
  targetId: string;
  mentorType: MentorType;
  response: string;
  sourceSummary: string;
  createdAt: string;
};

export type StudentAiSuggestionState = {
  isConfigured: boolean;
  storageReady: boolean;
  storageError?: string;
  history: AiSuggestion[];
};

export type StudentAiActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
};

type AiSuggestionRow = {
  id: string;
  target_type: string;
  target_id: string;
  mentor_type: MentorType;
  response: string;
  source_summary: string | null;
  created_at: string;
};

export async function getStudentAiSuggestionState(studentId: string): Promise<StudentAiSuggestionState> {
  return getAiSuggestionState("student", studentId);
}

export async function getLessonPlanAiSuggestionState(planId: string): Promise<StudentAiSuggestionState> {
  return getAiSuggestionState("lesson_plan", planId);
}

async function getAiSuggestionState(targetType: "student" | "lesson_plan", targetId: string): Promise<StudentAiSuggestionState> {
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("ai_suggestions")
    .select("id,target_type,target_id,mentor_type,response,source_summary,created_at")
    .eq("user_id", userId)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return {
      isConfigured: isOpenAIConfigured(),
      storageReady: false,
      storageError: "AI提案履歴テーブルが未作成、または取得できません。supabase/migrations/002_ai_suggestions.sql を実行してください。",
      history: [],
    };
  }

  return {
    isConfigured: isOpenAIConfigured(),
    storageReady: true,
    history: ((data ?? []) as AiSuggestionRow[]).map(mapAiSuggestion),
  };
}

export async function generateStudentAiSuggestion(studentId: string): Promise<StudentAiActionState> {
  const openai = getOpenAIClient();

  if (!openai) {
    return { error: "AI連携は未設定です。Vercel に OPENAI_API_KEY を設定すると利用できます。" };
  }

  let student: StudentRecord;
  let observations: StudentObservation[];
  let lessonHistory: StudentLessonHistory[];
  let stats: StudentAttendanceStats;

  try {
    [student, { observations, lessonHistory, stats }] = await Promise.all([
      getStudentById(studentId),
      getStudentRecordInsights(studentId),
    ]);
  } catch (error) {
    return { error: `AI提案に必要な生徒データを取得できませんでした。${getErrorMessage(error)}` };
  }

  const { prompt, sourceSummary } = buildStudentSuggestionPrompt(student, observations, lessonHistory, stats);

  let response = "";

  try {
    const completion = await openai.chat.completions.create({
      model: studentSuggestionModel,
      messages: [
        {
          role: "system",
          content:
            "あなたはヨガインストラクターを支えるAIメンターです。医療診断や治療効果の断定はせず、痛みやケガがある場合は無理を避け、必要に応じて専門家への相談を促してください。実践的でやさしい日本語で、次回レッスン設計上の配慮として提案します。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 900,
    });

    response = completion.choices[0]?.message?.content?.trim() ?? "";
  } catch (error) {
    return { error: `AI提案を生成できませんでした。${getErrorMessage(error)}` };
  }

  if (!response) {
    return { error: "AI提案の生成結果が空でした。少し時間をおいて再実行してください。" };
  }

  try {
    const { supabase, userId } = await requireUserId();
    const { error } = await supabase.from("ai_suggestions").insert({
      user_id: userId,
      target_type: "student",
      target_id: studentId,
      mentor_type: "general",
      prompt,
      response,
      source_summary: sourceSummary,
    });

    if (error) {
      return { error: `AI提案は生成できましたが、履歴を保存できませんでした。${error.message}` };
    }
  } catch (error) {
    return { error: `AI提案は生成できましたが、履歴を保存できませんでした。${getErrorMessage(error)}` };
  }

  revalidatePath(`/students/${studentId}`);
  return { ok: true, message: "AIメンターの次回提案を更新しました。" };
}

export async function generateLessonPlanAiSuggestion(planId: string): Promise<StudentAiActionState> {
  const openai = getOpenAIClient();

  if (!openai) {
    return { error: "AI連携は未設定です。Vercel に OPENAI_API_KEY を設定すると利用できます。" };
  }

  let plan: DbLessonPlan;
  let context: LessonPlanAiContext;

  try {
    plan = await getLessonPlanById(planId);
    context = await getLessonPlanAiContext(planId);
  } catch (error) {
    return { error: `AI提案に必要なレッスンプランデータを取得できませんでした。${getErrorMessage(error)}` };
  }

  const { prompt, sourceSummary } = buildLessonPlanSuggestionPrompt(plan, context);
  let response = "";

  try {
    const completion = await openai.chat.completions.create({
      model: studentSuggestionModel,
      messages: [
        {
          role: "system",
          content:
            "あなたはヨガインストラクターを支えるレッスン設計メンターです。医療診断や治療効果の断定はせず、痛みやケガがある場合は無理を避け、必要に応じて専門家への相談を促してください。実践的でやさしい日本語で、レッスンプラン改善の提案をします。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.35,
      max_tokens: 1100,
    });

    response = completion.choices[0]?.message?.content?.trim() ?? "";
  } catch (error) {
    return { error: `AI提案を生成できませんでした。${getErrorMessage(error)}` };
  }

  if (!response) {
    return { error: "AI提案の生成結果が空でした。少し時間をおいて再実行してください。" };
  }

  try {
    const { supabase, userId } = await requireUserId();
    const { error } = await supabase.from("ai_suggestions").insert({
      user_id: userId,
      target_type: "lesson_plan",
      target_id: planId,
      mentor_type: "lesson_design",
      prompt,
      response,
      source_summary: sourceSummary,
    });

    if (error) {
      return { error: `AI提案は生成できましたが、履歴を保存できませんでした。${error.message}` };
    }
  } catch (error) {
    return { error: `AI提案は生成できましたが、履歴を保存できませんでした。${getErrorMessage(error)}` };
  }

  revalidatePath(`/lessons/${planId}`);
  revalidatePath(`/lessons/${planId}/edit`);
  revalidatePath(`/lessons/${planId}/script`);
  return { ok: true, message: "AIメンターのプラン改善提案を更新しました。" };
}

function buildStudentSuggestionPrompt(
  student: StudentRecord,
  observations: StudentObservation[],
  lessonHistory: StudentLessonHistory[],
  stats: StudentAttendanceStats,
) {
  const recentObservations = observations.slice(0, 5).map((memo) => ({
    date: memo.date,
    lesson: memo.lessonTitle,
    attendance: memo.attendanceStatus,
    todayNote: memo.condition,
    personalMemo: memo.memo ?? "",
    nextFollow: memo.nextFollow,
  }));

  const recentLessons = lessonHistory.slice(0, 5).map((history) => ({
    date: history.date,
    lesson: history.lessonTitle,
    plan: history.planName,
    attendance: history.attendanceStatus,
  }));

  const source = {
    student: {
      name: student.name,
      ageGroup: student.ageGroup || "未設定",
      gender: student.gender || "未設定",
      yogaExperience: student.experience || "未記録",
      injuryCautions: student.caution || "未記録",
      memo: student.memo || "未記録",
    },
    attendanceSummary: {
      attendedCount: stats.attendedCount,
      cancelCount: stats.cancelCount,
      noShowCount: stats.noShowCount,
      cancelRate: `${stats.cancelRate}%`,
      lastAttendedDate: stats.lastAttendedDate,
    },
    recentObservations,
    recentLessons,
  };

  const sourceSummary = JSON.stringify(source, null, 2);

  return {
    sourceSummary,
    prompt: `以下の生徒情報をもとに、次回レッスンに向けた配慮ポイントを提案してください。

出力形式:
1. 次回レッスンで意識したいポイント
2. 避けた方がよい動き・注意点
3. 入れると良さそうなレッスン要素
4. 声かけ・接し方のヒント
5. 観察しておきたいこと

各項目は2〜3行以内にしてください。医療診断や治療効果の断定は避け、ヨガレッスン設計上の配慮として書いてください。

生徒データ:
${sourceSummary}`,
  };
}

type LessonPlanAiContext = {
  upcomingSchedules: Array<{
    date: string;
    place: string;
    format: string;
    status: string;
    participants: Array<{
      label: string;
      ageGroup: string;
      gender: string;
      experience: string;
      caution: string;
      memo: string;
    }>;
  }>;
  recentBlockRecords: Array<{
    lessonDate: string;
    lessonName: string;
    blockName: string;
    reaction: string;
    teacherMemo: string;
    improvementMemo: string;
    useAgain: boolean;
    scriptRevision: string;
  }>;
};

async function getLessonPlanAiContext(planId: string): Promise<LessonPlanAiContext> {
  const { supabase } = await requireUserId();
  const nowIso = new Date().toISOString();
  const [schedulesResult, recordsResult] = await Promise.all([
    supabase
      .from("schedules")
      .select(`
        id,
        starts_at,
        place,
        format,
        status,
        schedule_participants(
          id,
          student:students(id,age_group,gender,experience,caution,memo)
        )
      `)
      .eq("lesson_plan_id", planId)
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(3),
    supabase
      .from("lesson_records")
      .select(`
        id,
        lesson_name,
        record_date,
        schedule:schedules(starts_at),
        lesson_record_blocks(
          id,
          reaction,
          teacher_memo,
          improvement_memo,
          use_again,
          script_revision,
          block:block_templates(name)
        )
      `)
      .eq("lesson_plan_id", planId)
      .order("record_date", { ascending: false })
      .limit(5),
  ]);

  const upcomingSchedules = schedulesResult.error
    ? []
    : ((schedulesResult.data ?? []) as unknown as RawAiSchedule[]).map((schedule) => ({
        date: formatDateForAi(schedule.starts_at),
        place: schedule.place ?? "",
        format: schedule.format ?? "",
        status: schedule.status ?? "",
        participants: (schedule.schedule_participants ?? []).flatMap((participant, index) => {
          const student = Array.isArray(participant.student) ? participant.student[0] : participant.student;
          if (!student) return [];
          return [{
            label: `生徒${index + 1}`,
            ageGroup: student.age_group ?? "未設定",
            gender: student.gender ?? "未設定",
            experience: student.experience ?? "未記録",
            caution: student.caution ?? "未記録",
            memo: student.memo ?? "未記録",
          }];
        }),
      }));

  const recentBlockRecords = recordsResult.error
    ? []
    : ((recordsResult.data ?? []) as unknown as RawAiLessonRecord[]).flatMap((record) =>
        (record.lesson_record_blocks ?? []).slice(0, 4).map((block) => ({
          lessonDate: formatDateForAi(record.schedule?.starts_at ?? record.record_date),
          lessonName: record.lesson_name,
          blockName: block.block?.name ?? "未設定ブロック",
          reaction: block.reaction ?? "未評価",
          teacherMemo: block.teacher_memo ?? "",
          improvementMemo: block.improvement_memo ?? "",
          useAgain: block.use_again,
          scriptRevision: block.script_revision ?? "",
        })),
      ).slice(0, 12);

  return { upcomingSchedules, recentBlockRecords };
}

type RawAiSchedule = {
  starts_at: string;
  place: string | null;
  format: string | null;
  status: string | null;
  schedule_participants?: Array<{
    student?: {
      age_group: string | null;
      gender: string | null;
      experience: string | null;
      caution: string | null;
      memo: string | null;
    } | Array<{
      age_group: string | null;
      gender: string | null;
      experience: string | null;
      caution: string | null;
      memo: string | null;
    }> | null;
  }>;
};

type RawAiLessonRecord = {
  lesson_name: string;
  record_date: string;
  schedule?: { starts_at: string | null } | null;
  lesson_record_blocks?: Array<{
    reaction: string | null;
    teacher_memo: string | null;
    improvement_memo: string | null;
    use_again: boolean;
    script_revision: string | null;
    block?: { name: string | null } | null;
  }>;
};

function buildLessonPlanSuggestionPrompt(plan: DbLessonPlan, context: LessonPlanAiContext) {
  const source = {
    lessonPlan: {
      name: plan.name,
      theme: plan.theme || "未設定",
      format: plan.formatLabel || plan.format || "未設定",
      totalMinutes: plan.totalMinutes,
      status: plan.statusLabel,
      tags: plan.tags,
      blockCount: plan.blockCount,
      categoryMinutes: plan.categoryMinutes,
    },
    blocks: plan.blocks.map((block, index) => ({
      order: index + 1,
      name: block.name,
      majorCategory: block.majorCategory,
      minorCategory: block.minorCategory,
      minutes: block.plannedDurationMinutes,
      purpose: block.purpose || "未記録",
      cautions: block.cautionsOverride || block.cautions || "未記録",
      scriptPreview: truncateForPrompt(block.scriptOverride || block.script || "", 180),
      tags: block.tags,
    })),
    upcomingSchedules: context.upcomingSchedules,
    recentBlockRecords: context.recentBlockRecords,
  };

  const sourceSummary = JSON.stringify(source, null, 2);

  return {
    sourceSummary,
    prompt: `以下のレッスンプラン情報をもとに、ヨガインストラクター向けの改善提案をしてください。

出力形式:
1. 全体評価
2. 時間配分の改善点
3. ブロック順序の改善提案
4. 追加すると良さそうなブロック
5. 省略・短縮してもよい部分
6. 参加予定生徒への配慮
7. 声かけ・誘導のヒント
8. 安全面の注意

各項目は2〜3行程度で、実践的な日本語にしてください。医療診断や治療効果の断定は避け、ヨガレッスン設計上の配慮として書いてください。

コスト対策のため、誘導セリフは冒頭のみ渡しています。必要な場合は「原稿全体を見直す」ではなく、流れ・安全面・時間配分の観点で助言してください。

レッスンプランデータ:
${sourceSummary}`,
  };
}

function truncateForPrompt(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}...`;
}

function formatDateForAi(value: string | null | undefined) {
  if (!value) return "未記録";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "numeric", day: "numeric", timeZone: "Asia/Tokyo" }).format(date);
}

function mapAiSuggestion(row: AiSuggestionRow): AiSuggestion {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    mentorType: row.mentor_type,
    response: row.response,
    sourceSummary: row.source_summary ?? "",
    createdAt: row.created_at,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "詳細不明のエラーです。";
}
