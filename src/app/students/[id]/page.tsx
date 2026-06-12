import { StudentDetail } from "@/components/yoga/student-detail";
import { getStudentRecordInsights } from "@/lib/lesson-records";
import { getStudentById } from "@/lib/students";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [student, insights] = await Promise.all([
    getStudentById(id),
    getStudentRecordInsights(id),
  ]);

  return <StudentDetail student={student} observations={insights.observations} lessonHistory={insights.lessonHistory} stats={insights.stats} />;
}
