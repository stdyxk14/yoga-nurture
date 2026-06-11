import { ScheduleForm } from "@/components/yoga/schedule-form";
import { lessonTemplates, students } from "@/components/yoga/records";

export default async function NewSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template } = await searchParams;

  return <ScheduleForm templates={lessonTemplates} students={students} initialTemplateId={template} />;
}
