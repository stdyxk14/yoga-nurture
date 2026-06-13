import { LessonPlanScript } from "@/components/yoga/lesson-plan-script";
import { getLessonPlanAiSuggestionState } from "@/lib/ai-suggestions";
import { isUuid } from "@/lib/ids";
import { getLessonPlanById } from "@/lib/lesson-plans";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LessonScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const [plan, aiSuggestionState] = await Promise.all([
    getLessonPlanById(id),
    getLessonPlanAiSuggestionState(id),
  ]);

  return <LessonPlanScript plan={plan} aiSuggestionState={aiSuggestionState} />;
}
