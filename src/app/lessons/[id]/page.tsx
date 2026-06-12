import { LessonPlanDetail } from "@/components/yoga/lesson-plan-detail";
import { getLessonPlanById } from "@/lib/lesson-plans";

export const dynamic = "force-dynamic";

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = await getLessonPlanById(id);

  return <LessonPlanDetail plan={plan} />;
}
