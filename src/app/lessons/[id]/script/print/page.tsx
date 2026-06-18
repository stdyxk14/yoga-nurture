import { LessonPlanPrintPage } from "@/components/yoga/lesson-plan-print-page";
import { isUuid } from "@/lib/ids";
import { getLessonPlanById } from "@/lib/lesson-plans";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LessonScriptPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const plan = await getLessonPlanById(id);
  return <LessonPlanPrintPage plan={plan} backHref={`/lessons/${plan.id}/script`} />;
}
