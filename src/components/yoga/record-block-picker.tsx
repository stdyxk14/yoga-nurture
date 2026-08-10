"use client";

import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LessonRecordDialog } from "@/components/yoga/lesson-record-dialog";
import type { BlockCategory, DbBlockTemplate } from "@/lib/blocks";

type Props = {
  open: boolean;
  blocks: DbBlockTemplate[];
  categories: BlockCategory[];
  title?: string;
  onClose: () => void;
  onSelect: (block: DbBlockTemplate) => void;
};

export function RecordBlockPicker({ open, blocks, categories, title = "ブロックライブラリから追加", onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("ja");
    return blocks.filter((block) => {
      if (categoryId && block.categoryId !== categoryId) return false;
      if (!keyword) return true;
      return [block.name, block.majorCategory, block.minorCategory, block.script, ...block.tags]
        .join(" ")
        .toLocaleLowerCase("ja")
        .includes(keyword);
    });
  }, [blocks, categoryId, query]);

  return (
    <LessonRecordDialog open={open} title={title} description="必要な情報だけを表示しています。同じブロックを何度でも追加できます。" onClose={onClose}>
      <div className="grid gap-3 border-b border-[#e5e4dc] p-5 md:grid-cols-[minmax(0,1fr)_220px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#7b8478]" />
          <Input data-autofocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="名前・タグ・原稿で検索" className="h-10 bg-white pl-9 text-sm" />
        </label>
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
          <option value="">すべての大カテゴリー</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </div>
      <div className="grid gap-2 p-5">
        {filtered.map((block) => (
          <button
            key={block.id}
            type="button"
            onClick={() => onSelect(block)}
            className="grid w-full gap-2 rounded-lg border border-[#e2e4dc] bg-white p-4 text-left transition hover:border-[#90ad91] hover:bg-[#f8fbf6] md:grid-cols-[minmax(0,1fr)_100px]"
          >
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-[15px] font-semibold text-[#2f342e]"><BookOpen className="h-4 w-4 text-[#5d956d]" />{block.name}</span>
              <span className="mt-1 block text-sm text-[#687166]">{block.majorCategory} / {block.minorCategory}</span>
              {block.tags.length ? <span className="mt-2 block text-sm text-[#7469a8]">{block.tags.map((tag) => `#${tag}`).join(" ")}</span> : null}
              {block.script ? <span className="mt-2 line-clamp-2 block text-sm leading-6 text-[#586056]">{block.script}</span> : null}
            </span>
            <span className="self-start rounded-full bg-[#f6efe1] px-3 py-1 text-center text-sm font-medium text-[#8b6936]">目安 {block.durationMinutes}分</span>
          </button>
        ))}
        {!filtered.length ? <p className="rounded-lg border border-dashed border-[#ccd8ca] bg-[#f8fbf6] p-6 text-center text-sm text-[#687166]">条件に合うブロックがありません。</p> : null}
      </div>
    </LessonRecordDialog>
  );
}
