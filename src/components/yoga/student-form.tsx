"use client";

import { useActionState } from "react";
import { Archive, Save, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmSubmitButton } from "@/components/yoga/confirm-submit-button";
import {
  WorkspaceAction,
  WorkspaceActionBar,
  WorkspaceFeedback,
  WorkspaceField,
  WorkspaceFormSection,
  WorkspacePageHeader,
} from "@/components/yoga/workspace-kit";
import type { StudentRecord } from "@/components/yoga/records";
import { genderOptions } from "@/lib/student-fields";
import type { StudentFormState } from "@/lib/students";

const ageGroups = ["年齢不明", "10代", "20前半", "20半ば", "20後半", "30前半", "30半ば", "30後半", "40前半", "40半ば", "40後半", "50前半", "50半ば", "50後半", "60代以上"];
type StudentAction = (state: StudentFormState, formData: FormData) => Promise<StudentFormState>;
type ArchiveAction = (formData: FormData) => Promise<void>;

export function StudentForm({
  mode,
  student,
  action,
  archiveAction,
  deleteError,
}: {
  mode: "new" | "edit";
  student?: StudentRecord;
  action: StudentAction;
  archiveAction?: ArchiveAction;
  deleteError?: string;
}) {
  const isEdit = mode === "edit";
  const returnHref = isEdit && student ? `/students/${student.id}` : "/students";
  const [state, formAction, pending] = useActionState(action, {});
  const formError = state.error ?? deleteError;

  return (
    <form action={formAction} aria-busy={pending} className="mx-auto max-w-[1180px] space-y-4 pb-10">
      <WorkspacePageHeader
        title={isEdit ? "生徒カルテを編集" : "生徒カルテを登録"}
        description={isEdit ? "基本情報と、次の指導に必要なメモを更新します。" : "レッスン前後に確認したい基本情報を、必要な項目だけ登録します。"}
        backLink={{ href: returnHref, label: isEdit ? "生徒詳細へ戻る" : "生徒一覧へ戻る" }}
        eyebrow="STUDENT PROFILE"
        meta={
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="h-4 w-4 text-[#5d8f68]" aria-hidden="true" />
            安全に関わる注意点を優先して記録してください
          </span>
        }
      />

      {formError ? <WorkspaceFeedback tone="error">{formError}</WorkspaceFeedback> : null}

      <WorkspaceActionBar className="sticky top-[4.5rem] md:top-4" sticky={false} danger={archiveAction ? (
        <ConfirmSubmitButton
          message="過去の予定・記録・コメントは保持したまま、この生徒カルテをアーカイブします。"
          title="生徒カルテをアーカイブ"
          confirmLabel="アーカイブする"
          formAction={archiveAction}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#efc9c0] bg-[#fff5f1] px-3.5 text-[13px] font-semibold text-[#bd5d50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bd5d50] focus-visible:ring-offset-2"
        >
          <Archive className="h-4 w-4" aria-hidden="true" />
          アーカイブ
        </ConfirmSubmitButton>
      ) : undefined}>
        <WorkspaceAction href={returnHref} variant="secondary">キャンセル</WorkspaceAction>
        <WorkspaceAction type="submit" disabled={pending} variant="primary" icon={Save}>
          {pending ? (isEdit ? "更新中…" : "保存中…") : isEdit ? "変更を保存" : "生徒を登録"}
        </WorkspaceAction>
      </WorkspaceActionBar>

      <WorkspaceFormSection title="基本情報" description="名前以外は、分かる範囲で入力できます。">
        <div className="grid gap-4 lg:grid-cols-2">
          <WorkspaceField label="名前" required>
            <Input name="name" defaultValue={student?.name ?? ""} placeholder="佐藤 美咲" required autoFocus className="yn-control" />
          </WorkspaceField>
          <WorkspaceField label="ふりがな">
            <Input name="kana" defaultValue={student?.kana ?? ""} placeholder="さとう みさき" className="yn-control" />
          </WorkspaceField>
          <WorkspaceField label="年代">
            <select name="age_group" defaultValue={student?.ageGroup ?? "年齢不明"} className="yn-control w-full px-3">
              {ageGroups.map((ageGroup) => <option key={ageGroup} value={ageGroup}>{ageGroup}</option>)}
            </select>
          </WorkspaceField>
          <WorkspaceField label="性別">
            <select name="gender" defaultValue={student?.genderCode ?? "prefer_not_to_say"} className="yn-control w-full px-3">
              {genderOptions.map((gender) => <option key={gender.value} value={gender.value}>{gender.label}</option>)}
            </select>
          </WorkspaceField>
        </div>
      </WorkspaceFormSection>

      <WorkspaceFormSection title="指導に活かす情報" description="安全面と、これまでの経験を分けて残します。">
        <div className="grid gap-4 xl:grid-cols-2">
          <WorkspaceField label="ヨガ・運動経験" hint="経験年数、よく行う運動、得意な動きなど">
            <Textarea name="experience" defaultValue={student?.experience ?? ""} placeholder="ヨガ約3年、ピラティス経験あり" className="min-h-[120px] text-[14px]" />
          </WorkspaceField>
          <WorkspaceField label="ケガ・体調の注意点" hint="レッスン前に必ず確認したい内容">
            <Textarea name="caution" defaultValue={student?.caution ?? ""} placeholder="膝に違和感あり。深い後屈は避ける" className="min-h-[120px] text-[14px]" />
          </WorkspaceField>
        </div>
      </WorkspaceFormSection>

      <WorkspaceFormSection title="補足メモ" description="好みやコミュニケーション上の配慮を自由に記録できます。">
        <WorkspaceField label="その他メモ">
          <Textarea name="memo" defaultValue={student?.memo ?? ""} placeholder="呼吸を重視したゆったりフローが好み" className="min-h-[150px] text-[14px]" />
        </WorkspaceField>
      </WorkspaceFormSection>
    </form>
  );
}
