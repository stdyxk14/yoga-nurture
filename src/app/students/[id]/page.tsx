import { StudentDetail } from "@/components/yoga/student-detail";
import { getStudentById } from "@/lib/students";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentById(id);

  return <StudentDetail student={student} />;
}
