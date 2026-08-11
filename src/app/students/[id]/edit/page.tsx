import { StudentForm } from "@/components/yoga/student-form";
import { archiveStudentAction, updateStudentAction } from "@/app/students/actions";
import { isUuid } from "@/lib/ids";
import { getStudentById } from "@/lib/students";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const { error } = await searchParams;
  const student = await getStudentById(id);
  const updateAction = updateStudentAction.bind(null, id);
  const archiveAction = archiveStudentAction.bind(null, id);

  return <StudentForm mode="edit" student={student} action={updateAction} archiveAction={archiveAction} deleteError={error} />;
}
