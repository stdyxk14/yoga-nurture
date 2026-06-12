import { revalidatePath } from "next/cache";
import type { StudentAttendanceStats, StudentLessonHistory, StudentObservation, StudentRecord } from "@/components/yoga/records";
import { getStudentRecordInsights } from "@/lib/lesson-records";
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
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("ai_suggestions")
    .select("id,target_type,target_id,mentor_type,response,source_summary,created_at")
    .eq("user_id", userId)
    .eq("target_type", "student")
    .eq("target_id", studentId)
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
