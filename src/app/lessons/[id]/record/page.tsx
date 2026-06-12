import { LessonRecordForm } from "@/components/yoga/lesson-record-form";
import { getLessonRecordFormData } from "@/lib/lesson-records";

export const dynamic = "force-dynamic";

export default async function LessonRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getLessonRecordFormData(id);
  return <LessonRecordForm data={data} />;
}
