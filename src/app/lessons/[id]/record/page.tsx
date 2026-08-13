import { LessonRecordForm } from "@/components/yoga/lesson-record-form";
import { getLessonRecordAiAvailabilityState, getLessonRecordAiSuggestionState } from "@/lib/ai-suggestions";
import { isUuid } from "@/lib/ids";
import { getLessonRecordFormData } from "@/lib/lesson-records";
import { notFound } from "next/navigation";
import Link from "next/link";
import { WorkspaceFeedback, WorkspacePageHeader, WorkspacePanel } from "@/components/yoga/workspace-kit";

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
  if (data.schedule?.activeClosure) {
    return (
      <div className="space-y-4">
        <WorkspacePageHeader
          eyebrow="LESSON RECORD"
          title="実施後記録"
          description={data.schedule.lessonName}
          backLink={{ href: `/schedules/${id}`, label: "予定詳細へ戻る" }}
        />
        <WorkspacePanel>
          <WorkspaceFeedback tone="info">
            この予定はクローズ済みです。実施後記録を作成・更新するには、予定詳細で先にクローズを解除してください。下書きがある場合も内容は保持されています。
          </WorkspaceFeedback>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/schedules/${id}`} className="inline-flex h-10 items-center rounded-lg bg-[#5d8f68] px-4 text-[13px] font-semibold text-white">予定詳細で確認</Link>
            <Link href="/lessons" className="inline-flex h-10 items-center rounded-lg border border-[#ddd6cc] bg-white px-4 text-[13px] font-semibold text-[#626a60]">レッスンカルテへ戻る</Link>
          </div>
        </WorkspacePanel>
      </div>
    );
  }
  if (data.schedule && !data.schedule.lessonPlanId) {
    return (
      <div className="space-y-4">
        <WorkspacePageHeader
          eyebrow="LESSON RECORD"
          title="実施後記録"
          description={data.schedule.lessonName}
          backLink={{ href: `/schedules/${id}`, label: "予定詳細へ戻る" }}
        />
        <WorkspacePanel>
          <WorkspaceFeedback tone="info">
            この予定はプラン未確定です。実施後記録を始める前に、予定を編集してレッスンプランを設定してください。
          </WorkspaceFeedback>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/schedules/${id}/edit`} className="inline-flex h-10 items-center rounded-lg bg-[#5d8f68] px-4 text-[13px] font-semibold text-white">予定を編集してプランを設定</Link>
            <Link href={`/schedules/${id}`} className="inline-flex h-10 items-center rounded-lg border border-[#ddd6cc] bg-white px-4 text-[13px] font-semibold text-[#626a60]">予定詳細へ戻る</Link>
          </div>
        </WorkspacePanel>
      </div>
    );
  }
  const aiSuggestionState = data.record?.id
    ? await getLessonRecordAiSuggestionState(data.record.id)
    : await getLessonRecordAiAvailabilityState();
  return <LessonRecordForm data={data} aiSuggestionState={aiSuggestionState} draftSaved={saved === "draft"} />;
}
