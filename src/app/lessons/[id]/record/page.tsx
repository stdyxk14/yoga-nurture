import { LessonRecordForm } from "@/components/yoga/lesson-record-form";
import { getLesson, lessons } from "@/components/yoga/records";

export function generateStaticParams() {
  return lessons.map((lesson) => ({ id: lesson.id }));
}

export default async function LessonRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LessonRecordForm lesson={getLesson(id)} />;
}
