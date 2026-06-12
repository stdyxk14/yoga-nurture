import { LessonPlanDetail } from "@/components/yoga/lesson-plan-detail";
import { getLessonPlanAiSuggestionState } from "@/lib/ai-suggestions";
import { getLessonPlanById } from "@/lib/lesson-plans";

export const dynamic = "force-dynamic";

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [plan, aiSuggestionState] = await Promise.all([
    getLessonPlanById(id),
    getLessonPlanAiSuggestionState(id),
  ]);

  return <LessonPlanDetail plan={plan} aiSuggestionState={aiSuggestionState} />;
}
