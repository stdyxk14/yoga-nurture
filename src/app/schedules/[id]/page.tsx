import { ScheduleDetail } from "@/components/yoga/schedule-detail";
import { isUuid } from "@/lib/ids";
import { getScheduleById } from "@/lib/schedules";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ScheduleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const schedule = await getScheduleById(id);

  return <ScheduleDetail schedule={schedule} />;
}
