import { ScheduleDetail } from "@/components/yoga/schedule-detail";
import { getScheduleById } from "@/lib/schedules";

export const dynamic = "force-dynamic";

export default async function ScheduleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const schedule = await getScheduleById(id);

  return <ScheduleDetail schedule={schedule} />;
}
