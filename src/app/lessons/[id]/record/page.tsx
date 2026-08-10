import { LessonRecordForm } from "@/components/yoga/lesson-record-form";
import { getLessonRecordAiAvailabilityState, getLessonRecordAiSuggestionState } from "@/lib/ai-suggestions";
import { isUuid } from "@/lib/ids";
import { getLessonRecordFormData } from "@/lib/lesson-records";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LessonRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  if (!isUuid(id)) notFound();

  const data = await getLessonRecordFormData(id);
  const aiSuggestionState = data.record?.id
    ? await getLessonRecordAiSuggestionState(data.record.id)
    : await getLessonRecordAiAvailabilityState();
  return <LessonRecordForm data={data} aiSuggestionState={aiSuggestionState} draftSaved={saved === "draft"} />;
}
