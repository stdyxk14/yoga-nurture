import { LessonForm } from "@/components/yoga/lesson-form";
import { getLesson, lessons } from "@/components/yoga/records";

export function generateStaticParams() {
  return lessons.map((lesson) => ({ id: lesson.id }));
}

export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <LessonForm mode="edit" lesson={getLesson(id)} />;
}
