import { LessonPlanForm } from "@/components/yoga/lesson-plan-form";
import { getBlockCategories, getBlocks, getBlockTags } from "@/lib/blocks";
import { getLessonPlanById } from "@/lib/lesson-plans";

export const dynamic = "force-dynamic";

export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [plan, blocks, categories, tags] = await Promise.all([
    getLessonPlanById(id),
    getBlocks(),
    getBlockCategories(),
    getBlockTags(),
  ]);

  return <LessonPlanForm mode="edit" initialPlan={plan} blocks={blocks} categories={categories} tags={tags.map((tag) => tag.name)} />;
}
