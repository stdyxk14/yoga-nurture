import { BlockForm } from "@/components/yoga/block-form";
import { deleteBlockAction, updateBlockAction } from "@/app/blocks/actions";
import { getBlockById, getBlockCategories, getBlockTags } from "@/lib/blocks";

export const dynamic = "force-dynamic";

export default async function EditBlockPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const [block, categories, tags] = await Promise.all([getBlockById(id), getBlockCategories(), getBlockTags()]);
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
    />
  );
}
