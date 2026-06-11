import { ScheduleForm } from "@/components/yoga/schedule-form";
import { lessons, students } from "@/components/yoga/records";

export default async function NewSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;

  return <ScheduleForm plans={lessons} students={students} initialPlanId={plan} />;
}
