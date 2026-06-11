import { LessonDetail } from "@/components/yoga/lesson-detail";
import { getLesson, lessons } from "@/components/yoga/records";

export function generateStaticParams() {
  return lessons.map((lesson) => ({ id: lesson.id }));
}

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <LessonDetail lesson={getLesson(id)} />;
}
