"use client";

import { useMemo, useState, useActionState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Clock, FileText, Plus, Save, Search, Trash2 } from "lucide-react";
import { createLessonPlanAction, updateLessonPlanAction } from "@/app/lessons/lesson-plan-actions";
import { Input } from "@/components/ui/input";
import type { BlockCategory, DbBlockTemplate } from "@/lib/blocks";
import type { DbLessonPlan, LessonPlanFormState } from "@/lib/lesson-plans";
import { Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";

type Props = {
  mode: "new" | "edit";
  blocks: DbBlockTemplate[];
  categories: BlockCategory[];
  tags: string[];
  initialPlan?: DbLessonPlan;
};

const initialState: LessonPlanFormState = {};

const lessonFormatOptions = [
  { value: "group", label: "グループ" },
  { value: "personal", label: "パーソナル" },
  { value: "online", label: "オンライン" },
] as const;

const lessonPlanStatusOptions = [
  { value: "draft", label: "下書き" },
  { value: "ready", label: "準備済み" },
  { value: "archived", label: "アーカイブ" },
] as const;

export function LessonPlanForm({ mode, blocks, categories, tags, initialPlan }: Props) {
  const [selectedBlocks, setSelectedBlocks] = useState<DbBlockTemplate[]>(initialPlan?.blocks ?? []);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [tag, setTag] = useState("");
  const [level, setLevel] = useState("");
  const [sort, setSort] = useState("updated");
  const action = mode === "edit" && initialPlan ? updateLessonPlanAction.bind(null, initialPlan.id) : createLessonPlanAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const selectedIds = useMemo(() => new Set(selectedBlocks.map((block) => block.id)), [selectedBlocks]);
  const visibleSubcategories = useMemo(
    () => categories.find((category) => category.id === categoryId)?.subcategories.filter((item) => !item.archived) ?? categories.flatMap((category) => category.subcategories).filter((item) => !item.archived),
    [categories, categoryId],
  );
  const levels = useMemo(() => Array.from(new Set(blocks.map((block) => block.level).filter(Boolean))).sort(), [blocks]);

  const filteredBlocks = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = blocks
      .filter((block) => !selectedIds.has(block.id))
      .filter((block) => {
        if (categoryId && block.categoryId !== categoryId) return false;
        if (subcategoryId && block.subcategoryId !== subcategoryId) return false;
        if (tag && !block.tags.includes(tag)) return false;
        if (level && block.level !== level) return false;
        if (!q) return true;
        return [block.name, block.majorCategory, block.minorCategory, block.purpose, block.cautions, block.script, block.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(q);
      });

    if (sort === "name") return result.sort((a, b) => a.name.localeCompare(b.name, "ja"));
    if (sort === "duration") return result.sort((a, b) => a.durationMinutes - b.durationMinutes);
    return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [blocks, categoryId, level, query, selectedIds, sort, subcategoryId, tag]);

  const totalMinutes = selectedBlocks.reduce((sum, block) => sum + block.durationMinutes, 0);
  const categoryMinutes = useMemo(() => {
    const totals = new Map<string, number>();
    for (const block of selectedBlocks) {
      totals.set(block.majorCategory, (totals.get(block.majorCategory) ?? 0) + block.durationMinutes);
    }
    return Array.from(totals.entries()).map(([category, minutes]) => ({ category, minutes }));
  }, [selectedBlocks]);

  const addBlock = (block: DbBlockTemplate) => setSelectedBlocks((current) => [...current, block]);
  const removeBlock = (index: number) => setSelectedBlocks((current) => current.filter((_, itemIndex) => itemIndex !== index));
  const moveBlock = (index: number, direction: -1 | 1) => {
    setSelectedBlocks((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  return (
    <form action={formAction} className="space-y-4 pb-24 md:pb-0">
      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <SoftCard className="p-4">
            <SectionTitle icon={FileText} title={mode === "new" ? "レッスンプランを作成" : "レッスンプランを編集"} subtitle="ブロックを組み合わせて、印刷できる原稿を作ります。" />
            {state.error ? (
              <p className="mt-3 rounded-xl border border-[#f2c7be] bg-[#fff0ea] px-3 py-2 text-[12px] font-bold text-[#c4523d]">{state.error}</p>
            ) : null}
            <div className="mt-4 space-y-3">
              <Label text="レッスンプラン名">
                <Input name="name" defaultValue={initialPlan?.name ?? ""} required className="h-10" />
              </Label>
              <Label text="テーマ">
                <Input name="theme" defaultValue={initialPlan?.theme ?? ""} className="h-10" />
              </Label>
              <Label text="場所">
                <Input name="place" defaultValue={initialPlan?.place ?? ""} className="h-10" />
              </Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Label text="形式">
                  <select name="format" defaultValue={initialPlan?.format || "group"} className="h-10 w-full rounded-xl border border-[#e1d9ce] bg-white px-3 text-[13px] font-semibold">
                    {lessonFormatOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </Label>
                <Label text="ステータス">
                  <select name="status" defaultValue={initialPlan?.status ?? "draft"} className="h-10 w-full rounded-xl border border-[#e1d9ce] bg-white px-3 text-[13px] font-semibold">
                    {lessonPlanStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </Label>
              </div>
              <Label text="タグ">
                <Input name="tags" defaultValue={initialPlan?.tags.join(", ") ?? ""} placeholder="#呼吸, #リラックス" className="h-10" />
              </Label>
              <div className="rounded-2xl border border-[#e6e0d6] bg-[#fbfaf6] p-3">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <MiniSummary label="合計時間" value={`${totalMinutes}分`} />
                  <MiniSummary label="ブロック数" value={`${selectedBlocks.length}個`} />
                </div>
                <div className="mt-3 space-y-1">
                  {categoryMinutes.length ? categoryMinutes.map((item) => (
                    <div key={item.category} className="flex items-center justify-between gap-2 text-[12px] font-bold text-[#5d6b58]">
                      <span className="truncate">{item.category}</span>
                      <span>{item.minutes}分</span>
                    </div>
                  )) : <p className="text-[12px] font-medium text-[#7c8476]">ブロックを追加すると時間配分が表示されます。</p>}
                </div>
              </div>
            </div>
          </SoftCard>

          <SoftCard className="p-4">
            <SectionTitle icon={Search} title="検索・絞り込み" subtitle="登録済みブロックから追加します。" />
            <div className="mt-4 space-y-3">
              <Label text="キーワード">
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ブロック名・原稿・タグで検索" className="h-10" />
              </Label>
              <Label text="大カテゴリー">
                <select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setSubcategoryId(""); }} className="h-10 w-full rounded-xl border border-[#e1d9ce] bg-white px-3 text-[13px] font-semibold">
                  <option value="">すべて</option>
                  {categories.filter((category) => !category.archived).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </Label>
              <Label text="小カテゴリー">
                <select value={subcategoryId} onChange={(event) => setSubcategoryId(event.target.value)} className="h-10 w-full rounded-xl border border-[#e1d9ce] bg-white px-3 text-[13px] font-semibold">
                  <option value="">すべて</option>
                  {visibleSubcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
                </select>
              </Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Label text="タグ">
                  <select value={tag} onChange={(event) => setTag(event.target.value)} className="h-10 w-full rounded-xl border border-[#e1d9ce] bg-white px-3 text-[13px] font-semibold">
                    <option value="">すべて</option>
                    {tags.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </Label>
                <Label text="対象レベル">
                  <select value={level} onChange={(event) => setLevel(event.target.value)} className="h-10 w-full rounded-xl border border-[#e1d9ce] bg-white px-3 text-[13px] font-semibold">
                    <option value="">すべて</option>
                    {levels.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </Label>
              </div>
              <Label text="並び替え">
                <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 w-full rounded-xl border border-[#e1d9ce] bg-white px-3 text-[13px] font-semibold">
                  <option value="updated">更新日順</option>
                  <option value="name">ブロック名順</option>
                  <option value="duration">目安時間順</option>
                </select>
              </Label>
            </div>
          </SoftCard>
        </div>

        <SoftCard className="min-w-0 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <SectionTitle icon={Plus} title="ブロック候補" subtitle={`${filteredBlocks.length}件表示`} />
            <Link href="/blocks/new" className="inline-flex h-9 items-center justify-center rounded-xl border border-[#d8e3d4] bg-white px-3 text-[12px] font-bold text-[#4f7b58]">
              ブロックを登録
            </Link>
          </div>
          {blocks.length === 0 ? (
            <EmptyBlocks />
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {filteredBlocks.map((block) => (
                <article key={block.id} className="flex min-h-[250px] min-w-0 flex-col rounded-2xl border border-[#eee4d8] bg-white/75 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-extrabold">{block.name}</h3>
                      <p className="mt-1 truncate text-[11px] font-bold text-[#5d956d]">{block.majorCategory} / {block.minorCategory}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#edf5ef] px-2 py-1 text-[11px] font-bold text-[#4f875a]">{block.durationMinutes}分</span>
                  </div>
                  <p className="mt-2 line-clamp-2 min-h-10 text-[12px] font-medium leading-5 text-[#50584e]">{block.purpose || block.script || "目的や原稿は未入力です。"}</p>
                  <p className="mt-2 line-clamp-2 min-h-10 text-[11px] font-bold leading-5 text-[#c86b55]">{block.cautions ? `注意点：${block.cautions}` : "注意点：未入力"}</p>
                  <div className="mt-2 flex min-h-7 flex-wrap gap-1 overflow-hidden">
                    {block.tags.slice(0, 4).map((item) => <Pill key={item}>{item}</Pill>)}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                    <MiniSummary label="使用回数" value="0回" />
                    <MiniSummary label="評価" value="未評価" />
                  </div>
                  <button type="button" onClick={() => addBlock(block)} className="mt-auto inline-flex h-9 items-center justify-center rounded-xl bg-[#5d956d] text-[12px] font-bold text-white">
                    追加
                  </button>
                </article>
              ))}
            </div>
          )}
        </SoftCard>

        <SoftCard className="sticky bottom-20 z-10 max-h-[72vh] overflow-auto p-4 md:bottom-4 xl:top-4">
          <SectionTitle icon={Clock} title="作成中のプラン" subtitle={`${totalMinutes}分 / ${selectedBlocks.length}ブロック`} />
          {selectedBlocks.map((block, index) => (
            <input key={`${block.id}-${index}`} type="hidden" name="block_ids" value={block.id} />
          ))}
          <div className="mt-4 space-y-2">
            {selectedBlocks.length ? selectedBlocks.map((block, index) => (
              <article key={`${block.id}-${index}`} className="rounded-2xl border border-[#eee4d8] bg-white/78 p-3">
                <div className="flex items-start gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edf5ef] text-[12px] font-extrabold text-[#4f875a]">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[13px] font-extrabold">{block.name}</h3>
                    <p className="truncate text-[11px] font-bold text-[#6b7468]">{block.majorCategory} / {block.minorCategory} / {block.durationMinutes}分</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} className="inline-flex h-8 items-center justify-center rounded-lg border border-[#d8e3d4] bg-white text-[#4f7b58] disabled:opacity-35">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === selectedBlocks.length - 1} className="inline-flex h-8 items-center justify-center rounded-lg border border-[#d8e3d4] bg-white text-[#4f7b58] disabled:opacity-35">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <Link href={`/blocks/${block.id}`} className="inline-flex h-8 items-center justify-center rounded-lg border border-[#e7dfd4] bg-white text-[11px] font-bold text-[#6b7468]">
                    原稿
                  </Link>
                  <button type="button" onClick={() => removeBlock(index)} className="inline-flex h-8 items-center justify-center rounded-lg bg-[#fff0ea] text-[#d96c55]">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            )) : (
              <div className="rounded-2xl border border-dashed border-[#d8e3d4] bg-white/55 p-4 text-center text-[12px] font-medium text-[#6b7468]">
                左の候補からブロックを追加してください。
              </div>
            )}
          </div>
          <button type="submit" disabled={pending} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#5d956d] text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(64,113,77,0.18)] disabled:opacity-60">
            <Save className="h-4 w-4" />
            {pending ? "保存中..." : mode === "new" ? "プランを保存" : "変更を保存"}
          </button>
        </SoftCard>
      </div>
    </form>
  );
}

function Label({ text, children }: { text: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[12px] font-bold text-[#5f665c]">{text}</span>
      {children}
    </label>
  );
}

function MiniSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#eee4d8] bg-white/70 px-2 py-2">
      <p className="truncate text-[10px] font-bold text-[#7c8476]">{label}</p>
      <p className="mt-0.5 truncate text-[13px] font-extrabold text-[#4f875a]">{value}</p>
    </div>
  );
}

function EmptyBlocks() {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-[#d8e3d4] bg-white/65 p-6 text-center">
      <p className="text-[14px] font-extrabold">まだブロックテンプレートがありません。</p>
      <p className="mt-2 text-[12px] font-medium leading-5 text-[#6b7468]">先に誘導セリフやレッスンパートを登録すると、ここからレッスンプランに追加できます。</p>
      <Link href="/blocks/new" className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[#5d956d] px-4 text-[12px] font-bold text-white">
        ブロックを登録
      </Link>
    </div>
  );
}
