import { BlockForm } from "@/components/yoga/block-form";
import { deleteBlockAction, updateBlockAction } from "@/app/blocks/actions";
import { getBlockAiSuggestionState } from "@/lib/ai-suggestions";
import { getBlockById, getBlockCategories, getBlockTags } from "@/lib/blocks";
import { isUuid } from "@/lib/ids";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditBlockPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const { error } = await searchParams;
  const [block, categories, tags, aiSuggestionState] = await Promise.all([
    getBlockById(id),
    getBlockCategories(),
    getBlockTags(),
    getBlockAiSuggestionState(id),
  ]);
  const updateAction = updateBlockAction.bind(null, id);
  const deleteAction = deleteBlockAction.bind(null, id);

  return (
    <BlockForm
      mode="edit"
      block={block}
      categories={categories}
      tagCandidates={tags.map((tag) => tag.name)}
      action={updateAction}
      deleteAction={deleteAction}
      deleteError={error}
      aiSuggestionState={aiSuggestionState}
    />
  );
}
