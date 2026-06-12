import { ScheduleForm } from "@/components/yoga/schedule-form";
import { getLessonPlans } from "@/lib/lesson-plans";
import { getStudents } from "@/lib/students";

export const dynamic = "force-dynamic";

export default async function NewSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const [plans, students] = await Promise.all([getLessonPlans(), getStudents()]);

  return <ScheduleForm plans={plans} students={students} initialPlanId={plan} />;
}
