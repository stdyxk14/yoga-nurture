import Link from "next/link";
import type { ReactNode } from "react";
import { Layers3, Save, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";

const tags = ["#ベーシックフロー", "#肩こり改善", "#呼吸", "#体幹強化"];

export default function NewTemplatePage() {
  return (
    <>
      <PageHeader title="テンプレート作成" subtitle="よく使うレッスン内容の型を登録" />

      <SoftCard className="p-4">
        <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-6">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-[#edf4ea] p-5 text-[#4f875a]">
            <Layers3 className="h-20 w-20" strokeWidth={1.35} />
            <p className="mt-3 text-center text-[13px] font-bold text-[#607463]">
              予定作成の元になる
              <br />
              レッスンの型
            </p>
          </div>

          <div className="min-w-0">
            <div className="grid grid-cols-[1fr_280px] gap-4">
              <Field label="テンプレート名">
                <Input defaultValue="ベーシックフロー" className="h-10 bg-white/80 text-[14px]" />
              </Field>
              <div>
                <SectionTitle icon={Tag} title="タグ" />
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Pill key={tag}>{tag}</Pill>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Field label="目的・テーマ">
                <Textarea
                  defaultValue="体幹強化・柔軟性向上・呼吸の安定"
                  className="min-h-[78px] bg-white/80 text-[14px]"
                />
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <Field label="基本構成">
                <Textarea
                  defaultValue="呼吸法、肩甲骨ウォームアップ、太陽礼拝、立位、バランス、クールダウン"
                  className="min-h-[150px] bg-white/80 text-[14px]"
                />
              </Field>
              <Field label="注意点">
                <Textarea
                  defaultValue="膝や腰に違和感がある生徒には後屈と深い前屈を控えめにする"
                  className="min-h-[150px] bg-white/80 text-[14px]"
                />
              </Field>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Link
                href="/lessons?tab=templates"
                className="inline-flex h-9 items-center rounded-lg border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58]"
              >
                キャンセル
              </Link>
              <Link
                href="/lessons?tab=templates"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#5d956d] px-5 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(64,113,77,0.2)]"
              >
                <Save className="h-4 w-4" />
                保存する
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
