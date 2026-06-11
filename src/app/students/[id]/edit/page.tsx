import { StudentForm } from "@/components/yoga/student-form";
import { getStudent, students } from "@/components/yoga/records";

export function generateStaticParams() {
  return students.map((student) => ({ id: student.id }));
}

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <StudentForm mode="edit" student={getStudent(id)} />;
}
