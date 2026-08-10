"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { LibraryBig } from "lucide-react";
import { createBlockTemplateFromRecordItemAction } from "@/app/lessons/[id]/record/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LessonRecordDialog } from "@/components/yoga/lesson-record-dialog";
import type { BlockCategory } from "@/lib/blocks";
import type { LessonRecordBlockFormItem } from "@/lib/lesson-records";

type Props = {
  open: boolean;
  block: LessonRecordBlockFormItem | null;
  categories: BlockCategory[];
  onClose: () => void;
  onCreated: (fieldId: string, blockTemplateId: string) => void;
};

export function LessonRecordTemplateDialog({ open, block, categories, onClose, onCreated }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState("1");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [level, setLevel] = useState("");
  const [script, setScript] = useState("");
  const [cautions, setCautions] = useState("");
  const [memo, setMemo] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (!open || !block) return;
    const category = categories.find((item) => item.name === block.majorCategory);
    const subcategory = category?.subcategories.find((item) => item.name === block.minorCategory);
    setName(block.name);
    setMinutes(String(Math.max(1, block.actualMinutes ?? block.plannedMinutes ?? 1)));
    setCategoryId(category?.id ?? block.categoryId ?? "");
    setSubcategoryId(subcategory?.id ?? block.subcategoryId ?? "");
    setPurpose(block.purpose);
    setLevel(block.level);
    setScript(block.script);
    setCautions(block.cautions);
    setMemo(block.memo);
    setTags(block.tags.join(", "));
    setError("");
  }, [block, categories, open]);

  const subcategories = useMemo(() => categories.find((item) => item.id === categoryId)?.subcategories ?? [], [categories, categoryId]);

  function save() {
    if (!block?.recordBlockId || pending) return;
    startTransition(async () => {
      setError("");
      const result = await createBlockTemplateFromRecordItemAction({
        recordBlockId: block.recordBlockId!,
        name,
        categoryId: categoryId || null,
        subcategoryId: subcategoryId || null,
        durationMinutes: Math.max(1, Number(minutes) || 1),
        purpose,
        level,
        script,
        cautions,
        memo,
        tags: Array.from(new Set(tags.split(/[,、\n]/).map((tag) => tag.trim()).filter(Boolean))),
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.blockId) {
        onCreated(block.fieldId, result.blockId);
        onClose();
      }
    });
  }

  return (
    <LessonRecordDialog open={open} title="ブロックテンプレートとして保存" description="実施時のスナップショットを初期値にして、再利用できるブロックへ変換します。元の記録は変更しません。" onClose={onClose} className="max-w-2xl">
      {block ? (
        <div className="grid gap-4 p-5 md:grid-cols-2">
          {error ? <p className="rounded-lg border border-[#efc9c0] bg-[#fff0ea] p-3 text-sm text-[#b84a38] md:col-span-2">{error}</p> : null}
          <label className="grid gap-1.5 text-sm font-medium md:col-span-2">名前<Input data-autofocus value={name} onChange={(event) => setName(event.target.value)} className="h-10 bg-white text-sm" /></label>
          <label className="grid gap-1.5 text-sm font-medium">目安時間（分）<Input type="number" min={1} value={minutes} onChange={(event) => setMinutes(event.target.value)} className="h-10 bg-white text-sm" /></label>
          <label className="grid gap-1.5 text-sm font-medium">レベル<Input value={level} onChange={(event) => setLevel(event.target.value)} className="h-10 bg-white text-sm" /></label>
          <label className="grid gap-1.5 text-sm font-medium">大カテゴリー
            <select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setSubcategoryId(""); }} className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
              <option value="">未分類</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">小カテゴリー
            <select value={subcategoryId} onChange={(event) => setSubcategoryId(event.target.value)} className="h-10 rounded-lg border border-input bg-white px-3 text-sm" disabled={!categoryId}>
              <option value="">未分類</option>
              {subcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium md:col-span-2">目的<Input value={purpose} onChange={(event) => setPurpose(event.target.value)} className="h-10 bg-white text-sm" /></label>
          <label className="grid gap-1.5 text-sm font-medium md:col-span-2">原稿<Textarea value={script} onChange={(event) => setScript(event.target.value)} className="min-h-24 bg-white text-sm" /></label>
          <label className="grid gap-1.5 text-sm font-medium">注意点<Textarea value={cautions} onChange={(event) => setCautions(event.target.value)} className="min-h-20 bg-white text-sm" /></label>
          <label className="grid gap-1.5 text-sm font-medium">メモ<Textarea value={memo} onChange={(event) => setMemo(event.target.value)} className="min-h-20 bg-white text-sm" /></label>
          <label className="grid gap-1.5 text-sm font-medium md:col-span-2">タグ（カンマ区切り）<Input value={tags} onChange={(event) => setTags(event.target.value)} className="h-10 bg-white text-sm" /></label>
        </div>
      ) : null}
      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[#e5e4dc] bg-[#fbfaf6]/95 p-4 backdrop-blur">
        <button type="button" onClick={onClose} disabled={pending} className="h-10 rounded-lg border border-[#dfe3da] bg-white px-4 text-sm font-medium">キャンセル</button>
        <button type="button" onClick={save} disabled={pending || !name.trim() || !block?.recordBlockId} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#5d956d] px-4 text-sm font-medium text-white disabled:opacity-50"><LibraryBig className="h-4 w-4" />{pending ? "保存中…" : "テンプレートを作成"}</button>
      </div>
    </LessonRecordDialog>
  );
}
