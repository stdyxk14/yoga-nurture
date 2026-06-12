import { LessonPlanScript } from "@/components/yoga/lesson-plan-script";
import { getLessonPlanAiSuggestionState } from "@/lib/ai-suggestions";
import { getLessonPlanById } from "@/lib/lesson-plans";

export const dynamic = "force-dynamic";

export default async function LessonScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [plan, aiSuggestionState] = await Promise.all([
    getLessonPlanById(id),
    getLessonPlanAiSuggestionState(id),
  ]);

  return <LessonPlanScript plan={plan} aiSuggestionState={aiSuggestionState} />;
}
