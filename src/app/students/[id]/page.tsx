import { StudentDetail } from "@/components/yoga/student-detail";
import { getStudentAiSuggestionState } from "@/lib/ai-suggestions";
import { getStudentRecordInsights } from "@/lib/lesson-records";
import { getStudentById } from "@/lib/students";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [student, insights, aiSuggestionState] = await Promise.all([
    getStudentById(id),
    getStudentRecordInsights(id),
    getStudentAiSuggestionState(id),
  ]);

  return (
    <StudentDetail
      student={student}
      observations={insights.observations}
      lessonHistory={insights.lessonHistory}
      stats={insights.stats}
      aiSuggestionState={aiSuggestionState}
    />
  );
}
