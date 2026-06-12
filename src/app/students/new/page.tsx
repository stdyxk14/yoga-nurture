import { StudentForm } from "@/components/yoga/student-form";
import { createStudentAction } from "@/app/students/actions";

export default function NewStudentPage() {
  return <StudentForm mode="new" action={createStudentAction} />;
}
