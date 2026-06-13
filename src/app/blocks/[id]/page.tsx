import { BlockDetail } from "@/components/yoga/block-detail";
import { getBlockAiSuggestionState } from "@/lib/ai-suggestions";
import { getBlockById } from "@/lib/blocks";
import { isUuid } from "@/lib/ids";
import { getBlockUsageHistory } from "@/lib/lesson-records";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BlockDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const [block, histories, aiSuggestionState] = await Promise.all([
    getBlockById(id),
    getBlockUsageHistory(id),
    getBlockAiSuggestionState(id),
  ]);

  return <BlockDetail block={block} histories={histories} aiSuggestionState={aiSuggestionState} />;
}
