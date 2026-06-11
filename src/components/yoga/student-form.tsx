import Link from "next/link";
import type { ReactNode } from "react";
import { Save, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, SoftCard } from "@/components/yoga/page-kit";
import type { StudentRecord } from "@/components/yoga/records";

const ageGroups = ["10代", "20前半", "20半ば", "20後半", "30前半", "30半ば", "30後半", "40前半", "40半ば", "40後半", "50前半", "50半ば", "50後半", "60代以上"];
const genders = ["女性", "男性", "その他", "回答しない"];

export function StudentForm({ mode, student }: { mode: "new" | "edit"; student?: StudentRecord }) {
  const isEdit = mode === "edit";
  const returnHref = isEdit && student ? `/students/${student.id}` : "/students";

  return (
    <>
      <div className="md:hidden">
        <MobileStudentForm isEdit={isEdit} student={student} returnHref={returnHref} />
      </div>

      <div className="hidden md:block">
        <PageHeader
          title={isEdit ? "生徒カルテ編集" : "生徒カルテ新規登録"}
          subtitle={isEdit ? "基本情報とメモを更新" : "年代・性別・注意点を最小項目で登録"}
        />

        <SoftCard className="p-4">
          <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-6">
            <div className="flex flex-col items-center justify-center rounded-2xl bg-[#edf4ea] p-5 text-[#4f875a]">
              <UserRound className="h-20 w-20" strokeWidth={1.35} />
              <p className="mt-3 text-center text-[13px] font-bold text-[#607463]">生徒の基本情報を<br />最小項目で管理</p>
            </div>

            <div className="min-w-0">
              <div className="grid grid-cols-[1.2fr_1fr_150px_150px] gap-4">
                <Field label="名前">
                  <Input defaultValue={student?.name ?? ""} placeholder="佐藤 美咲" className="h-10 bg-white/80 text-[14px]" />
                </Field>
                <Field label="ふりがな">
                  <Input defaultValue={student?.kana ?? ""} placeholder="さとう みさき" className="h-10 bg-white/80 text-[14px]" />
                </Field>
                <Field label="年代">
                  <select defaultValue={student?.ageGroup ?? "30半ば"} className="h-10 w-full rounded-md border border-input bg-white/80 px-3 text-[14px]">
                    {ageGroups.map((ageGroup) => <option key={ageGroup}>{ageGroup}</option>)}
                  </select>
                </Field>
                <Field label="性別">
                  <select defaultValue={student?.gender ?? "回答しない"} className="h-10 w-full rounded-md border border-input bg-white/80 px-3 text-[14px]">
                    {genders.map((gender) => <option key={gender}>{gender}</option>)}
                  </select>
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <Field label="ヨガ他経験">
                  <Textarea defaultValue={student?.experience ?? ""} placeholder="ヨガ約3年、ピラティス経験あり" className="min-h-[92px] bg-white/80 text-[14px]" />
                </Field>
                <Field label="ケガなどの注意点">
                  <Textarea defaultValue={student?.caution ?? ""} placeholder="膝に違和感あり。深い後屈は避ける" className="min-h-[92px] bg-white/80 text-[14px]" />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="その他メモ">
                  <Textarea defaultValue={student?.memo ?? ""} placeholder="呼吸を重視したゆったりフローが好み" className="min-h-[120px] bg-white/80 text-[14px]" />
                </Field>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Link href={returnHref} className="inline-flex h-9 items-center rounded-lg border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58]">
                  キャンセル
                </Link>
                <Link href={returnHref} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#5d956d] px-5 text-[13px] font-bold text-white">
                  <Save className="h-4 w-4" />
                  {isEdit ? "更新する" : "保存する"}
                </Link>
              </div>
            </div>
          </div>
        </SoftCard>
      </div>
    </>
  );
}

function MobileStudentForm({
  isEdit,
  student,
  returnHref,
}: {
  isEdit: boolean;
  student?: StudentRecord;
  returnHref: string;
}) {
  return (
    <div className="mx-auto max-w-[430px] space-y-4 overflow-x-hidden">
      <section className="rounded-[24px] border border-[#eee4d8] bg-white/84 p-4 shadow-[0_12px_26px_rgba(122,104,80,0.08)]">
        <h1 className="text-[22px] font-extrabold tracking-normal">{isEdit ? "生徒カルテ編集" : "生徒カルテ新規登録"}</h1>
        <p className="mt-1 text-[12px] font-semibold leading-5 text-[#6d7469]">年代・性別・注意点を1カラムで入力</p>
      </section>

      <section className="rounded-[24px] border border-[#eee4d8] bg-white/84 p-4 shadow-[0_10px_24px_rgba(122,104,80,0.06)]">
        <div className="grid gap-4">
          <Field label="名前">
            <Input defaultValue={student?.name ?? ""} placeholder="佐藤 美咲" className="h-11 w-full bg-white/90 text-[16px]" />
          </Field>
          <Field label="ふりがな">
            <Input defaultValue={student?.kana ?? ""} placeholder="さとう みさき" className="h-11 w-full bg-white/90 text-[16px]" />
          </Field>
          <Field label="年代">
            <select defaultValue={student?.ageGroup ?? "30半ば"} className="h-11 w-full rounded-md border border-input bg-white/90 px-3 text-[16px]">
              {ageGroups.map((ageGroup) => <option key={ageGroup}>{ageGroup}</option>)}
            </select>
          </Field>
          <Field label="性別">
            <select defaultValue={student?.gender ?? "回答しない"} className="h-11 w-full rounded-md border border-input bg-white/90 px-3 text-[16px]">
              {genders.map((gender) => <option key={gender}>{gender}</option>)}
            </select>
          </Field>
          <Field label="ヨガ他経験">
            <Textarea defaultValue={student?.experience ?? ""} placeholder="ヨガ約3年、ピラティス経験あり" className="min-h-[110px] w-full bg-white/90 text-[15px]" />
          </Field>
          <Field label="ケガなどの注意点">
            <Textarea defaultValue={student?.caution ?? ""} placeholder="膝に違和感あり。深い後屈は避ける" className="min-h-[110px] w-full bg-white/90 text-[15px]" />
          </Field>
          <Field label="その他メモ">
            <Textarea defaultValue={student?.memo ?? ""} placeholder="呼吸を重視したゆったりフローが好み" className="min-h-[130px] w-full bg-white/90 text-[15px]" />
          </Field>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-2">
        <Link href={returnHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#5d956d] text-[15px] font-bold text-white">
          <Save className="h-5 w-5" />
          {isEdit ? "更新する" : "保存する"}
        </Link>
        <Link href={returnHref} className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#d8e3d4] bg-white text-[14px] font-bold text-[#4f7b58]">
          キャンセル
        </Link>
      </div>
    </div>
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
