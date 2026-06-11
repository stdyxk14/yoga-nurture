import Link from "next/link";
import type { ReactNode } from "react";
import { Save, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, SoftCard } from "@/components/yoga/page-kit";
import type { StudentRecord } from "@/components/yoga/records";

export function StudentForm({ mode, student }: { mode: "new" | "edit"; student?: StudentRecord }) {
  const isEdit = mode === "edit";
  const returnHref = isEdit && student ? `/students/${student.id}` : "/students";

  return (
    <>
      <PageHeader
        title={isEdit ? "生徒カルテ編集" : "生徒カルテ新規登録"}
        subtitle={isEdit ? "基本情報とメモを更新" : "生徒をすぐ登録できるシンプルな入力画面"}
      />

      <SoftCard className="p-4">
        <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-6">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-[#edf4ea] p-5 text-[#4f875a]">
            <UserRound className="h-20 w-20" strokeWidth={1.35} />
            <p className="mt-3 text-center text-[13px] font-bold text-[#607463]">
              生徒の基本情報を
              <br />
              最小項目で管理
            </p>
          </div>

          <div className="min-w-0">
            <div className="grid grid-cols-[1.4fr_120px] gap-4">
              <Field label="名前">
                <Input defaultValue={student?.name ?? ""} placeholder="佐藤 美咲" className="h-10 bg-white/80 text-[14px]" />
              </Field>
              <Field label="年齢">
                <Input defaultValue={student?.age ?? ""} type="number" placeholder="35" className="h-10 bg-white/80 text-[14px]" />
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <Field label="ヨガ他経験">
                <Textarea
                  defaultValue={student?.experience ?? ""}
                  placeholder="ヨガ約3年、ピラティス経験あり"
                  className="min-h-[92px] bg-white/80 text-[14px]"
                />
              </Field>
              <Field label="ケガなどの注意点">
                <Textarea
                  defaultValue={student?.caution ?? ""}
                  placeholder="膝に違和感あり。深い後屈は避ける"
                  className="min-h-[92px] bg-white/80 text-[14px]"
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="その他メモ">
                <Textarea
                  defaultValue={student?.memo ?? ""}
                  placeholder="呼吸を重視したゆったりフローが好み。変化を実感すると継続しやすい"
                  className="min-h-[120px] bg-white/80 text-[14px]"
                />
              </Field>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Link
                href={returnHref}
                className="inline-flex h-9 items-center rounded-lg border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58]"
              >
                キャンセル
              </Link>
              <Link
                href={returnHref}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#5d956d] px-5 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(64,113,77,0.2)]"
              >
                <Save className="h-4 w-4" />
                {isEdit ? "更新する" : "保存する"}
              </Link>
            </div>
          </div>
        </div>
      </SoftCard>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <Label className="mb-2 text-[13px] font-bold text-[#394238]">{label}</Label>
      {children}
    </div>
  );
}
