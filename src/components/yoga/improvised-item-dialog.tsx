"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LessonRecordDialog } from "@/components/yoga/lesson-record-dialog";
import { lessonRecordChangeReasons, type LessonRecordChangeReasonCode } from "@/lib/lesson-record-flow";
import type { BlockCategory } from "@/lib/blocks";

export type ImprovisedItemInput = {
  name: string;
  actualMinutes: number | null;
  actualContentNote: string;
  reasonCodes: LessonRecordChangeReasonCode[];
  reasonNote: string;
  categoryId: string | null;
  subcategoryId: string | null;
  majorCategory: string;
  minorCategory: string;
  purpose: string;
  level: string;
  script: string;
  cautions: string;
  memo: string;
  tags: string[];
};

type Props = {
  open: boolean;
  categories: BlockCategory[];
  title?: string;
  onClose: () => void;
  onAdd: (input: ImprovisedItemInput) => void;
};

export function ImprovisedItemDialog({ open, categories, title = "即興の内容を追加", onClose, onAdd }: Props) {
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState("");
  const [content, setContent] = useState("");
  const [reasonCodes, setReasonCodes] = useState<LessonRecordChangeReasonCode[]>([]);
  const [reasonNote, setReasonNote] = useState("");
  const [details, setDetails] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [level, setLevel] = useState("");
  const [script, setScript] = useState("");
  const [cautions, setCautions] = useState("");
  const [memo, setMemo] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    setMinutes("");
    setContent("");
    setReasonCodes([]);
    setReasonNote("");
    setDetails(false);
    setCategoryId("");
    setSubcategoryId("");
    setPurpose("");
    setLevel("");
    setScript("");
    setCautions("");
    setMemo("");
    setTags("");
  }, [open]);

  const selectedCategory = categories.find((category) => category.id === categoryId);
  const subcategories = useMemo(() => selectedCategory?.subcategories ?? [], [selectedCategory]);

  function submit() {
    if (!name.trim()) return;
    const selectedSubcategory = subcategories.find((subcategory) => subcategory.id === subcategoryId);
    onAdd({
      name: name.trim(),
      actualMinutes: minutes === "" ? null : Math.max(0, Number(minutes)),
      actualContentNote: content,
      reasonCodes,
      reasonNote,
      categoryId: categoryId || null,
      subcategoryId: subcategoryId || null,
      majorCategory: selectedCategory?.name ?? "未分類",
      minorCategory: selectedSubcategory?.name ?? "未分類",
      purpose,
      level,
      script,
      cautions,
      memo,
      tags: Array.from(new Set(tags.split(/[,、\n]/).map((tag) => tag.trim()).filter(Boolean))),
    });
  }

  return (
    <LessonRecordDialog open={open} title={title} description="ライブラリにない現場対応を、まず最小限の内容で残せます。" onClose={onClose} className="max-w-2xl">
      <div className="grid gap-4 p-5">
        <label className="grid gap-1.5 text-sm font-medium text-[#394238]">内容名 <span className="text-[#c4523d]">必須</span>
          <Input data-autofocus value={name} onChange={(event) => setName(event.target.value)} placeholder="例：仰向けで行うやさしい胸開き" className="h-10 bg-white text-sm" />
        </label>
        <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
          <label className="grid gap-1.5 text-sm font-medium text-[#394238]">実際の時間（分）
            <Input type="number" min={0} value={minutes} onChange={(event) => setMinutes(event.target.value)} className="h-10 bg-white text-sm" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-[#394238]">実施内容・補足
            <Textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-20 bg-white text-sm" />
          </label>
        </div>
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium text-[#394238]">変更理由（複数選択可・任意）</legend>
          <div className="flex flex-wrap gap-2">
            {lessonRecordChangeReasons.map((reason) => {
              const selected = reasonCodes.includes(reason.code);
              return (
                <button key={reason.code} type="button" aria-pressed={selected} onClick={() => setReasonCodes((current) => selected ? current.filter((code) => code !== reason.code) : [...current, reason.code])} className={`rounded-full border px-3 py-1.5 text-sm ${selected ? "border-[#6d9473] bg-[#eaf3e8] text-[#416448]" : "border-[#dfe3da] bg-white text-[#687166]"}`}>
                  {reason.label}
                </button>
              );
            })}
          </div>
        </fieldset>
        {reasonCodes.includes("other") ? <Input value={reasonNote} onChange={(event) => setReasonNote(event.target.value)} placeholder="その他の理由・補足" className="h-10 bg-white text-sm" /> : null}

        <button type="button" onClick={() => setDetails((current) => !current)} className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#dfe3da] bg-white px-3 py-2 text-sm font-medium text-[#4f6f55]">
          {details ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          詳細を追加
        </button>
        {details ? (
          <div className="grid gap-4 rounded-lg border border-[#e2e4dc] bg-white/70 p-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm">大カテゴリー
              <select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setSubcategoryId(""); }} className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
                <option value="">未分類</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">小カテゴリー
              <select value={subcategoryId} onChange={(event) => setSubcategoryId(event.target.value)} className="h-10 rounded-lg border border-input bg-white px-3 text-sm" disabled={!categoryId}>
                <option value="">未分類</option>
                {subcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">目的<Input value={purpose} onChange={(event) => setPurpose(event.target.value)} className="h-10 bg-white text-sm" /></label>
            <label className="grid gap-1.5 text-sm">レベル<Input value={level} onChange={(event) => setLevel(event.target.value)} className="h-10 bg-white text-sm" /></label>
            <label className="grid gap-1.5 text-sm md:col-span-2">誘導セリフ<Textarea value={script} onChange={(event) => setScript(event.target.value)} className="min-h-24 bg-white text-sm" /></label>
            <label className="grid gap-1.5 text-sm">注意点<Textarea value={cautions} onChange={(event) => setCautions(event.target.value)} className="min-h-20 bg-white text-sm" /></label>
            <label className="grid gap-1.5 text-sm">メモ<Textarea value={memo} onChange={(event) => setMemo(event.target.value)} className="min-h-20 bg-white text-sm" /></label>
            <label className="grid gap-1.5 text-sm md:col-span-2">タグ（カンマ区切り）<Input value={tags} onChange={(event) => setTags(event.target.value)} className="h-10 bg-white text-sm" /></label>
          </div>
        ) : null}
      </div>
      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[#e5e4dc] bg-[#fbfaf6]/95 p-4 backdrop-blur">
        <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#dfe3da] bg-white px-4 text-sm font-medium">キャンセル</button>
        <button type="button" onClick={submit} disabled={!name.trim()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#5d956d] px-4 text-sm font-medium text-white disabled:opacity-50"><Plus className="h-4 w-4" />追加する</button>
      </div>
    </LessonRecordDialog>
  );
}
