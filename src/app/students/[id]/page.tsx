import { StudentDetail } from "@/components/yoga/student-detail";
import { getStudent, students } from "@/components/yoga/records";

export function generateStaticParams() {
  return students.map((student) => ({ id: student.id }));
}

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <StudentDetail student={getStudent(id)} />;
}
