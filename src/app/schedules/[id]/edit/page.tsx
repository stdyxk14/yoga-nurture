import { notFound } from "next/navigation";
import { updateScheduleAction } from "@/app/schedules/actions";
import { ScheduleForm } from "@/components/yoga/schedule-form";
import { isUuid } from "@/lib/ids";
import { getLessonPlans } from "@/lib/lesson-plans";
import { getScheduleById } from "@/lib/schedules";
import { getStudents } from "@/lib/students";

export const dynamic = "force-dynamic";

export default async function EditSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const [schedule, plans, students] = await Promise.all([getScheduleById(id), getLessonPlans(), getStudents()]);

  return (
    <ScheduleForm
      plans={plans}
      students={students}
      schedule={schedule}
      mode="edit"
      action={updateScheduleAction.bind(null, id)}
    />
  );
}
