"use client";

import { useEffect, useMemo, useState, useActionState } from "react";
import type { DragEvent, ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Clock, FileText, Plus, Save, Search, Trash2, X } from "lucide-react";
import { createLessonPlanAction, updateLessonPlanAction } from "@/app/lessons/lesson-plan-actions";
import { Input } from "@/components/ui/input";
import type { BlockCategory, DbBlockTemplate } from "@/lib/blocks";
import type { StudentAiSuggestionState } from "@/lib/ai-suggestions";
import type { DbLessonPlan, LessonPlanFormState } from "@/lib/lesson-plans";
import { Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";

type Props = {
  mode: "new" | "edit";
  blocks: DbBlockTemplate[];
  categories: BlockCategory[];
  tags: string[];
  initialPlan?: DbLessonPlan;
  aiSuggestionState?: StudentAiSuggestionState;
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
  const [condition, setCondition] = useState("");
  const [visibleCount, setVisibleCount] = useState(18);
  const [previewBlock, setPreviewBlock] = useState<DbBlockTemplate | null>(null);
  const action = mode === "edit" && initialPlan ? updateLessonPlanAction.bind(null, initialPlan.id) : createLessonPlanAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const selectedCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const block of selectedBlocks) counts.set(block.id, (counts.get(block.id) ?? 0) + 1);
    return counts;
  }, [selectedBlocks]);
  const visibleSubcategories = useMemo(
    () => categories.find((category) => category.id === categoryId)?.subcategories.filter((item) => !item.archived) ?? categories.flatMap((category) => category.subcategories).filter((item) => !item.archived),
    [categories, categoryId],
  );
  const levels = useMemo(() => Array.from(new Set(blocks.map((block) => block.level).filter(Boolean))).sort(), [blocks]);

  const filteredBlocks = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = blocks
      .filter((block) => {
        if (categoryId && block.categoryId !== categoryId) return false;
        if (subcategoryId && block.subcategoryId !== subcategoryId) return false;
        if (tag && !block.tags.includes(tag)) return false;
        if (level && block.level !== level) return false;
        if (condition === "unused" && block.usageCount > 0) return false;
        if (condition === "used" && block.usageCount === 0) return false;
        if (condition === "good" && (block.goodRate ?? 0) < 70) return false;
        if (condition === "improvement" && !(block.improvementCount ?? 0)) return false;
        if (!q) return true;
        return [block.name, block.majorCategory, block.minorCategory, block.purpose, block.cautions, block.script, block.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(q);
      });

    if (sort === "name") return result.sort((a, b) => a.name.localeCompare(b.name, "ja"));
    if (sort === "duration") return result.sort((a, b) => a.durationMinutes - b.durationMinutes);
    if (sort === "usage") return result.sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name, "ja"));
    if (sort === "good") return result.sort((a, b) => (b.goodRate ?? -1) - (a.goodRate ?? -1) || b.usageCount - a.usageCount);
    if (sort === "recent") return result.sort((a, b) => (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? ""));
    return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [blocks, categoryId, condition, level, query, sort, subcategoryId, tag]);

  const visibleBlocks = filteredBlocks.slice(0, visibleCount);
  const hasFilters = Boolean(query || categoryId || subcategoryId || tag || level || condition || sort !== "updated");

  const totalMinutes = selectedBlocks.reduce((sum, block) => sum + block.durationMinutes, 0);
  const categoryMinutes = useMemo(() => {
    const totals = new Map<string, number>();
    for (const block of selectedBlocks) {
      totals.set(block.majorCategory, (totals.get(block.majorCategory) ?? 0) + block.durationMinutes);
    }
    return Array.from(totals.entries()).map(([category, minutes]) => ({ category, minutes }));
  }, [selectedBlocks]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!selectedBlocks.length || pending) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [pending, selectedBlocks.length]);

  const insertBlock = (block: DbBlockTemplate, index?: number) => {
    setSelectedBlocks((current) => {
      if (index === undefined || index < 0 || index > current.length) return [...current, block];
      return [...current.slice(0, index), block, ...current.slice(index)];
    });
  };
  const addBlock = (block: DbBlockTemplate) => insertBlock(block);
  const clearFilters = () => {
    setQuery("");
    setCategoryId("");
    setSubcategoryId("");
    setTag("");
    setLevel("");
    setCondition("");
    setSort("updated");
  };
  const handleDragStart = (event: DragEvent<HTMLElement>, blockId: string) => {
    event.dataTransfer.setData("text/plain", blockId);
    event.dataTransfer.effectAllowed = "copy";
  };
  const handleDrop = (event: DragEvent<HTMLElement>, index?: number) => {
    event.preventDefault();
    const blockId = event.dataTransfer.getData("text/plain");
    const block = blocks.find((item) => item.id === blockId);
    if (block) insertBlock(block, index);
  };
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
    <>
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
              <Label text="条件">
                <select value={condition} onChange={(event) => setCondition(event.target.value)} className="h-10 w-full rounded-xl border border-[#e1d9ce] bg-white px-3 text-[13px] font-semibold">
                  <option value="">指定なし</option>
                  <option value="used">使用履歴あり</option>
                  <option value="unused">未使用</option>
                  <option value="good">良かった率70%以上</option>
                  <option value="improvement">改善メモあり</option>
                </select>
              </Label>
              <Label text="並び替え">
                <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 w-full rounded-xl border border-[#e1d9ce] bg-white px-3 text-[13px] font-semibold">
                  <option value="updated">更新日順</option>
                  <option value="recent">最近使った順</option>
                  <option value="usage">使用回数順</option>
                  <option value="good">良かった率順</option>
                  <option value="name">ブロック名順</option>
                  <option value="duration">目安時間順</option>
                </select>
              </Label>
              {hasFilters ? (
                <button type="button" onClick={clearFilters} className="inline-flex h-9 w-full items-center justify-center rounded-xl border border-[#d8e3d4] bg-white text-[12px] font-bold text-[#4f7b58]">
                  絞り込みを解除
                </button>
              ) : null}
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
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#6b7468]">
            <span className="rounded-full bg-[#edf5ef] px-3 py-1 text-[#4f875a]">{filteredBlocks.length}件中 {visibleBlocks.length}件を表示</span>
            <span className="hidden rounded-full bg-[#f8f6f0] px-3 py-1 md:inline-flex">PCでは候補カードを作成中プランへドラッグして追加できます</span>
          </div>
          {blocks.length === 0 ? (
            <EmptyBlocks />
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {visibleBlocks.map((block) => {
                const selectedCount = selectedCounts.get(block.id) ?? 0;
                return (
                <article
                  key={block.id}
                  draggable
                  onDragStart={(event) => handleDragStart(event, block.id)}
                  className="flex min-h-[270px] min-w-0 cursor-grab flex-col rounded-2xl border border-[#eee4d8] bg-white/75 p-3 active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-extrabold">{block.name}</h3>
                      <p className="mt-1 truncate text-[11px] font-bold text-[#5d956d]">{block.majorCategory} / {block.minorCategory}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#edf5ef] px-2 py-1 text-[11px] font-bold text-[#4f875a]">{block.durationMinutes}分</span>
                  </div>
                  {selectedCount ? <span className="mt-2 w-fit rounded-full bg-[#f2efff] px-2 py-1 text-[11px] font-bold text-[#7469bf]">選択済み {selectedCount}回</span> : null}
                  <p className="mt-2 line-clamp-2 min-h-10 text-[12px] font-medium leading-5 text-[#50584e]">{block.purpose || block.script || "目的や原稿は未入力です。"}</p>
                  <p className="mt-2 line-clamp-2 min-h-10 text-[11px] font-bold leading-5 text-[#c86b55]">{block.cautions ? `注意点：${block.cautions}` : "注意点：未入力"}</p>
                  <div className="mt-2 flex min-h-7 flex-wrap gap-1 overflow-hidden">
                    {block.tags.slice(0, 4).map((item) => <Pill key={item}>{item}</Pill>)}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                    <MiniSummary label="使用回数" value={`${block.usageCount}回`} />
                    <MiniSummary label="良かった率" value={formatGoodRate(block)} />
                    <MiniSummary label="最近使用" value={block.lastUsed} />
                    <MiniSummary label="改善メモ" value={`${block.improvementCount ?? 0}件`} />
                  </div>
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
                    <button type="button" onClick={() => setPreviewBlock(block)} className="inline-flex h-9 items-center justify-center rounded-xl border border-[#d8e3d4] bg-white text-[12px] font-bold text-[#4f7b58]">
                      原稿を見る
                    </button>
                    <button type="button" onClick={() => addBlock(block)} className="inline-flex h-9 items-center justify-center rounded-xl bg-[#5d956d] text-[12px] font-bold text-white">
                      追加
                    </button>
                  </div>
                </article>
              )})}
            </div>
          )}
          {visibleCount < filteredBlocks.length ? (
            <button type="button" onClick={() => setVisibleCount((count) => count + 18)} className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-[#d8e3d4] bg-white text-[12px] font-bold text-[#4f7b58]">
              もっと見る
            </button>
          ) : null}
        </SoftCard>

        <SoftCard
          className="sticky bottom-20 z-10 max-h-[72vh] overflow-auto p-4 md:bottom-4 xl:top-4"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => handleDrop(event)}
        >
          <SectionTitle icon={Clock} title="作成中のプラン" subtitle={`${totalMinutes}分 / ${selectedBlocks.length}ブロック`} />
          {selectedBlocks.map((block, index) => (
            <input key={`${block.id}-${index}`} type="hidden" name="block_ids" value={block.id} />
          ))}
          <div className="mt-4 space-y-2">
            {selectedBlocks.length ? selectedBlocks.map((block, index) => (
              <article
                key={`${block.id}-${index}`}
                className="rounded-2xl border border-[#eee4d8] bg-white/78 p-3"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, index)}
              >
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
                  <button type="button" onClick={() => setPreviewBlock(block)} className="inline-flex h-8 items-center justify-center rounded-lg border border-[#e7dfd4] bg-white text-[11px] font-bold text-[#6b7468]">
                    原稿
                  </button>
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
      {previewBlock ? <BlockScriptModal block={previewBlock} onClose={() => setPreviewBlock(null)} /> : null}
    </>
  );
}

function BlockScriptModal({ block, onClose }: { block: DbBlockTemplate; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/30 p-3 md:items-center md:justify-center" role="dialog" aria-modal="true">
      <div className="max-h-[88vh] w-full overflow-auto rounded-3xl border border-[#eee4d8] bg-[#fffdf8] p-4 shadow-[0_18px_48px_rgba(49,43,31,0.18)] md:max-w-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-[#5d956d]">{block.majorCategory} / {block.minorCategory} / {block.duration}</p>
            <h2 className="mt-1 text-[20px] font-extrabold">{block.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#d8e3d4] bg-white text-[#4f7b58]" aria-label="閉じる">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {block.tags.length ? block.tags.map((tag) => <Pill key={tag}>{tag}</Pill>) : <Pill>タグ未設定</Pill>}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <PreviewInfo title="目的" value={block.purpose || "未入力"} />
          <PreviewInfo title="注意点" value={block.cautions || "未入力"} />
          <PreviewInfo title="使用回数" value={`${block.usageCount}回`} />
          <PreviewInfo title="良かった率" value={formatGoodRate(block)} />
        </div>
        <div className="mt-4 rounded-2xl border border-[#eee4d8] bg-white/80 p-4">
          <p className="text-[13px] font-extrabold text-[#4f7b58]">誘導セリフ全文</p>
          <p className="mt-2 whitespace-pre-line text-[13px] font-medium leading-7 text-[#30362f]">{block.script || "原稿は未入力です。"}</p>
        </div>
      </div>
    </div>
  );
}

function PreviewInfo({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#eee4d8] bg-white/70 p-3">
      <p className="text-[12px] font-bold text-[#8b704c]">{title}</p>
      <p className="mt-1 text-[13px] font-medium leading-6 text-[#30362f]">{value}</p>
    </div>
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

function formatGoodRate(block: DbBlockTemplate) {
  return typeof block.goodRate === "number" ? `${block.goodRate}%` : "評価データなし";
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
