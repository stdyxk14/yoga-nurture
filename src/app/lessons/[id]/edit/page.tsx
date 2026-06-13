import { LessonPlanForm } from "@/components/yoga/lesson-plan-form";
import { getLessonPlanAiSuggestionState } from "@/lib/ai-suggestions";
import { getBlockCategories, getBlocks, getBlockTags } from "@/lib/blocks";
import { isUuid } from "@/lib/ids";
import { getLessonPlanById } from "@/lib/lesson-plans";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const [plan, blocks, categories, tags, aiSuggestionState] = await Promise.all([
    getLessonPlanById(id),
    getBlocks(),
    getBlockCategories(),
    getBlockTags(),
    getLessonPlanAiSuggestionState(id),
  ]);

  return <LessonPlanForm mode="edit" initialPlan={plan} blocks={blocks} categories={categories} tags={tags.map((tag) => tag.name)} aiSuggestionState={aiSuggestionState} />;
}
