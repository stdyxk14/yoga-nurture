import { LessonPlanPrintPage } from "@/components/yoga/lesson-plan-print-page";
import { isUuid } from "@/lib/ids";
import { getLessonPlanById } from "@/lib/lesson-plans";
import { getScheduleById } from "@/lib/schedules";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ScheduleScriptPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const schedule = await getScheduleById(id);
  if (!schedule.lessonPlanId) notFound();

  const plan = await getLessonPlanById(schedule.lessonPlanId);
  return <LessonPlanPrintPage plan={plan} schedule={schedule} backHref={`/schedules/${schedule.id}/script`} />;
}
