import { LessonScript } from "@/components/yoga/lesson-script";
import { getLesson, lessons } from "@/components/yoga/records";

export function generateStaticParams() {
  return lessons.map((lesson) => ({ id: lesson.id }));
}

export default async function LessonScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LessonScript lesson={getLesson(id)} />;
}
