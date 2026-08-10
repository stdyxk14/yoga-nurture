import { ScheduleDetail } from "@/components/yoga/schedule-detail";
import { isUuid } from "@/lib/ids";
import { getScheduleById } from "@/lib/schedules";
import { notFound } from "next/navigation";
import { measurePerformance } from "@/lib/performance";

export const dynamic = "force-dynamic";

export default async function ScheduleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  if (!isUuid(id)) notFound();

  const schedule = await measurePerformance(
    { operation: "data.scheduleDetail", route: "/schedules/[id]" },
    () => getScheduleById(id),
    (item) => item.participantCount,
  );

  return <ScheduleDetail schedule={schedule} error={resolvedSearchParams?.error} />;
}
