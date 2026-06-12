import { BlockDetail } from "@/components/yoga/block-detail";
import { getBlockById } from "@/lib/blocks";
import { getBlockUsageHistory } from "@/lib/lesson-records";

export const dynamic = "force-dynamic";

export default async function BlockDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [block, histories] = await Promise.all([
    getBlockById(id),
    getBlockUsageHistory(id),
  ]);

  return <BlockDetail block={block} histories={histories} />;
}
