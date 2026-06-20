import { LessonRecordForm } from "@/components/yoga/lesson-record-form";
import { getLessonRecordAiAvailabilityState, getLessonRecordAiSuggestionState } from "@/lib/ai-suggestions";
import { isUuid } from "@/lib/ids";
import { getLessonRecordFormData } from "@/lib/lesson-records";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LessonRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const data = await getLessonRecordFormData(id);
  const aiSuggestionState = data.record?.id
    ? await getLessonRecordAiSuggestionState(data.record.id)
    : await getLessonRecordAiAvailabilityState();
  return <LessonRecordForm data={data} aiSuggestionState={aiSuggestionState} />;
}
