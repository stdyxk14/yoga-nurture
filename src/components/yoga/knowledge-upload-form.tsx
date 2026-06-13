"use client";

import { useActionState, useMemo, useState } from "react";
import { FileText, ImageUp, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SoftCard } from "@/components/yoga/page-kit";
import { uploadKnowledgeDocumentAction, type KnowledgeActionState } from "@/app/settings/knowledge/actions";

const sourceTypes = [
  { value: "handwritten_image", label: "手書き画像", hint: "jpg / png / webp" },
  { value: "handwritten_pdf", label: "手書きPDF", hint: "pdf" },
  { value: "manual_text", label: "テキストメモ", hint: "ファイルなしでも保存できます" },
  { value: "image", label: "画像資料", hint: "jpg / png / webp" },
  { value: "pdf", label: "PDF資料", hint: "pdf" },
];

export function KnowledgeUploadForm() {
  const [state, formAction, pending] = useActionState<KnowledgeActionState, FormData>(uploadKnowledgeDocumentAction, {});
  const [sourceType, setSourceType] = useState("handwritten_image");
  const isManualText = sourceType === "manual_text";
  const accept = useMemo(() => {
    if (sourceType.includes("pdf")) return "application/pdf";
    if (sourceType.includes("image")) return "image/jpeg,image/png,image/webp";
    return "image/jpeg,image/png,image/webp,application/pdf";
  }, [sourceType]);

  return (
    <form action={formAction} className="grid gap-4">
      {state.error ? (
        <div className="rounded-2xl border border-[#f3b8aa] bg-[#fff5f2] p-3 text-[13px] font-bold leading-6 text-[#bb4e3d]">
          {state.error}
        </div>
      ) : null}

      <SoftCard className="p-4">
        <div className="mb-4 flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-[#5d956d]" />
          <h2 className="text-[17px] font-extrabold">メモ情報</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="タイトル">
            <Input name="title" required placeholder="例：肩まわりクラスの指導メモ" className="h-11 rounded-xl bg-white/90" />
          </Field>
          <Field label="メモの種類">
            <select
              name="source_type"
              value={sourceType}
              onChange={(event) => setSourceType(event.target.value)}
              className="h-11 rounded-xl border border-input bg-white/90 px-3 text-[14px]"
            >
              {sourceTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <p className="mt-2 text-[12px] font-semibold text-[#6d7469]">
          {sourceTypes.find((item) => item.value === sourceType)?.hint}
        </p>

        <div className="mt-4 grid gap-4">
          {!isManualText ? (
            <Field label="ファイル">
              <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#cfdcca] bg-[#fbfdf9] px-4 py-6 text-center transition hover:bg-[#f4faf2]">
                <ImageUp className="mb-2 h-8 w-8 text-[#5d956d]" />
                <span className="text-[14px] font-bold">画像またはPDFを選択</span>
                <span className="mt-1 text-[12px] font-semibold text-[#6b7468]">最大20MB。OCR結果はあとで確認・修正できます。</span>
                <input name="file" type="file" accept={accept} className="mt-3 w-full max-w-sm text-[13px]" />
              </label>
            </Field>
          ) : (
            <Field label="読み取り結果として保存するテキスト">
              <Textarea
                name="manual_text"
                rows={8}
                placeholder="手入力のメモをここに貼り付けます。あとで確認画面で修正できます。"
                className="rounded-2xl bg-white/90 text-[14px] leading-7"
              />
            </Field>
          )}

          <Field label="メモ説明">
            <Textarea name="description" rows={3} placeholder="このメモの用途や背景を短く書いてください。" className="rounded-2xl bg-white/90" />
          </Field>
          <Field label="関連タグ">
            <Input name="tags" placeholder="#肩こり改善 #呼吸 #初心者向け" className="h-11 rounded-xl bg-white/90" />
          </Field>
        </div>
      </SoftCard>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="submit" disabled={pending} className="h-11 rounded-xl bg-[#5d956d] px-6 text-white hover:bg-[#4f835d]">
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
          {pending ? "保存中..." : "アップロードして保存"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <Label className="text-[13px] font-bold text-[#3f463d]">{label}</Label>
      {children}
    </label>
  );
}
