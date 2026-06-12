import { StudentForm } from "@/components/yoga/student-form";
import { deleteStudentAction, updateStudentAction } from "@/app/students/actions";
import { getStudentById } from "@/lib/students";

export const dynamic = "force-dynamic";

export default async function EditStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const student = await getStudentById(id);
  const updateAction = updateStudentAction.bind(null, id);
  const deleteAction = deleteStudentAction.bind(null, id);

  return <StudentForm mode="edit" student={student} action={updateAction} deleteAction={deleteAction} deleteError={error} />;
}
