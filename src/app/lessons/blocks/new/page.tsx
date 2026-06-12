import { BlockForm } from "@/components/yoga/block-form";
import { createBlockAction } from "@/app/blocks/actions";
import { getBlockCategories, getBlockTags } from "@/lib/blocks";

export const dynamic = "force-dynamic";

export default async function NewBlockPage() {
  const [categories, tags] = await Promise.all([getBlockCategories(), getBlockTags()]);

  return <BlockForm categories={categories} tagCandidates={tags.map((tag) => tag.name)} action={createBlockAction} />;
}
