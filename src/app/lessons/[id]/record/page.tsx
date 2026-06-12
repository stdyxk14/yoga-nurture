import { LessonRecordForm } from "@/components/yoga/lesson-record-form";
import { getLessonRecordAiSuggestionState } from "@/lib/ai-suggestions";
import { getLessonRecordFormData } from "@/lib/lesson-records";

export const dynamic = "force-dynamic";

export default async function LessonRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getLessonRecordFormData(id);
  const aiSuggestionState = data.record?.id ? await getLessonRecordAiSuggestionState(data.record.id) : undefined;
  return <LessonRecordForm data={data} aiSuggestionState={aiSuggestionState} />;
}
