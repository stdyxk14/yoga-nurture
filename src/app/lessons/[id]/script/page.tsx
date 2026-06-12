import { LessonPlanScript } from "@/components/yoga/lesson-plan-script";
import { getLessonPlanById } from "@/lib/lesson-plans";

export const dynamic = "force-dynamic";

export default async function LessonScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = await getLessonPlanById(id);

  return <LessonPlanScript plan={plan} />;
}
