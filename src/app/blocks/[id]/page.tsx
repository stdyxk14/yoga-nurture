import { BlockDetail } from "@/components/yoga/block-detail";
import { getBlockById } from "@/lib/blocks";

export const dynamic = "force-dynamic";

export default async function BlockDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const block = await getBlockById(id);

  return <BlockDetail block={block} />;
}
