import { notFound } from "next/navigation";
import { BlockForm } from "@/components/yoga/block-form";
import { blockTemplates, getBlock } from "@/components/yoga/records";

export function generateStaticParams() {
  return blockTemplates.map((block) => ({ id: block.id }));
}

export default async function EditBlockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const block = getBlock(id);

  if (!blockTemplates.some((item) => item.id === id)) {
    notFound();
  }

  return <BlockForm mode="edit" block={block} />;
}
