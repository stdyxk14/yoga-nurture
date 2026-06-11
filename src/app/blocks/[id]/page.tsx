import { notFound } from "next/navigation";
import { BlockDetail } from "@/components/yoga/block-detail";
import { blockTemplates, getBlock } from "@/components/yoga/records";

export function generateStaticParams() {
  return blockTemplates.map((block) => ({ id: block.id }));
}

export default async function BlockDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const block = getBlock(id);

  if (!blockTemplates.some((item) => item.id === id)) {
    notFound();
  }

  return <BlockDetail block={block} />;
}
