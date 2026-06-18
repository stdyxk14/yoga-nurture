import { LessonPlanScript } from "@/components/yoga/lesson-plan-script";
import { getLessonPlanAiSuggestionState } from "@/lib/ai-suggestions";
import { isUuid } from "@/lib/ids";
import { getLessonPlanById } from "@/lib/lesson-plans";
import { getScheduleById } from "@/lib/schedules";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ScheduleScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const schedule = await getScheduleById(id);
  if (!schedule.lessonPlanId) notFound();

  const [plan, aiSuggestionState] = await Promise.all([
    getLessonPlanById(schedule.lessonPlanId),
    getLessonPlanAiSuggestionState(schedule.lessonPlanId),
  ]);

  return <LessonPlanScript plan={plan} schedule={schedule} aiSuggestionState={aiSuggestionState} />;
}
