import { LessonPlanForm } from "@/components/yoga/lesson-plan-form";
import { getBlockCategories, getBlocks, getBlockTags } from "@/lib/blocks";

export const dynamic = "force-dynamic";

export default async function NewLessonPage({ searchParams }: { searchParams: Promise<{ block?: string }> }) {
  const { block } = await searchParams;
  const [blocks, categories, tags] = await Promise.all([getBlocks(), getBlockCategories(), getBlockTags()]);
  const initialBlocks = block ? blocks.filter((item) => item.id === block) : [];

  return <LessonPlanForm mode="new" blocks={blocks} categories={categories} tags={tags.map((tag) => tag.name)} initialBlocks={initialBlocks} />;
}
