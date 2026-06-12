import { LessonPlanForm } from "@/components/yoga/lesson-plan-form";
import { getBlockCategories, getBlocks, getBlockTags } from "@/lib/blocks";

export const dynamic = "force-dynamic";

export default async function NewLessonPage() {
  const [blocks, categories, tags] = await Promise.all([getBlocks(), getBlockCategories(), getBlockTags()]);

  return <LessonPlanForm mode="new" blocks={blocks} categories={categories} tags={tags.map((tag) => tag.name)} />;
}
