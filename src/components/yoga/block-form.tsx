"use client";

import Link from "next/link";
import { useActionState, useMemo, useRef, useState, type ReactNode } from "react";
import { FolderPlus, Plus, Save, Settings2, Tag, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import type { StudentAiSuggestionState } from "@/lib/ai-suggestions";
import type { BlockCategory, BlockFormState, DbBlockTemplate } from "@/lib/blocks";

type BlockAction = (state: BlockFormState, formData: FormData) => Promise<BlockFormState>;
type DeleteAction = (formData: FormData) => Promise<void>;

const levelOptions = ["初心者向け", "中級者向け", "全レベル"];

export function BlockForm({
  mode = "new",
  block,
  categories,
  tagCandidates,
  action,
  deleteAction,
  deleteError,
}: {
  mode?: "new" | "edit";
  block?: DbBlockTemplate;
  categories: BlockCategory[];
  tagCandidates: string[];
  action: BlockAction;
  deleteAction?: DeleteAction;
  deleteError?: string;
  aiSuggestionState?: StudentAiSuggestionState;
}) {
  const [selectedTags, setSelectedTags] = useState(block?.tags ?? []);
  const [draftTag, setDraftTag] = useState("");
  const [state, formAction, pending] = useActionState(action, {});
  const [selectedCategoryId, setSelectedCategoryId] = useState(block?.categoryId ?? categories[0]?.id ?? "");
  const subcategories = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId)?.subcategories.filter((subcategory) => !subcategory.archived) ?? [],
    [categories, selectedCategoryId],
  );
  const pageTitle = mode === "edit" ? "ブロックテンプレート編集" : "ブロックテンプレート登録";
  const submitLabel = mode === "edit" ? "更新する" : "保存する";
  const error = state.error ?? deleteError;

  function toggleTag(tag: string) {
    setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  }

  function addTag() {
    const trimmed = draftTag.trim();
    const normalized = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    if (!trimmed || selectedTags.includes(normalized)) return;
    setSelectedTags((current) => [...current, normalized]);
    setDraftTag("");
  }

  return (
    <>
      <form action={formAction} className="md:hidden">
        <MobileBlockForm
          block={block}
          pageTitle={pageTitle}
          submitLabel={submitLabel}
          selectedTags={selectedTags}
          draftTag={draftTag}
          setDraftTag={setDraftTag}
          toggleTag={toggleTag}
          addTag={addTag}
          categories={categories}
          subcategories={subcategories}
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
          tagCandidates={tagCandidates}
          pending={pending}
          error={error}
          deleteAction={deleteAction}
        />
      </form>

      <form action={formAction} className="hidden md:block">
        <PageHeader title={pageTitle} subtitle="誘導セリフをブロックとして登録し、レッスンプランに再利用" />
        <SoftCard className="p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_310px] gap-5">
            <BlockFields
              block={block}
              categories={categories}
              subcategories={subcategories}
              selectedCategoryId={selectedCategoryId}
              setSelectedCategoryId={setSelectedCategoryId}
            />
            <TagPanel
              selectedTags={selectedTags}
              draftTag={draftTag}
              setDraftTag={setDraftTag}
              toggleTag={toggleTag}
              addTag={addTag}
              tagCandidates={tagCandidates}
              submitLabel={submitLabel}
              pending={pending}
              error={error}
              deleteAction={deleteAction}
            />
          </div>
        </SoftCard>
      </form>

    </>
  );
}

function BlockFields({
  block,
  categories,
  subcategories,
  selectedCategoryId,
  setSelectedCategoryId,
}: {
  block?: DbBlockTemplate;
  categories: BlockCategory[];
  subcategories: BlockCategory["subcategories"];
  selectedCategoryId: string;
  setSelectedCategoryId: (value: string) => void;
}) {
  return (
    <div className="min-w-0">
      <div className="grid grid-cols-[1fr_180px_180px] gap-3">
        <Field label="ブロック名">
          <Input name="name" defaultValue={block?.name ?? ""} placeholder="完全呼吸法" className="h-10 bg-white/80 text-[14px]" />
        </Field>
        <Field label="大カテゴリー">
          <select
            name="category_id"
            value={selectedCategoryId}
            onChange={(event) => setSelectedCategoryId(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-white/80 px-3 text-[14px]"
          >
            <option value="">未分類</option>
            {categories.filter((category) => !category.archived).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </Field>
        <Field label="小カテゴリー">
          <select name="subcategory_id" defaultValue={block?.subcategoryId ?? ""} className="h-10 w-full rounded-md border border-input bg-white/80 px-3 text-[14px]">
            <option value="">未分類</option>
            {subcategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </Field>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <Link href="/settings#block-categories" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d8e3d4] bg-[#f8fcf6] px-3 text-[12px] font-bold text-[#4f7b58]">
          <Settings2 className="h-3.5 w-3.5" />
          カテゴリー管理へ移動
        </Link>
        <Link href="/settings#block-categories" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d8e3d4] bg-white px-3 text-[12px] font-bold text-[#4f7b58]">
          <FolderPlus className="h-3.5 w-3.5" />
          新しいカテゴリーを追加
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-[120px_1fr_160px] gap-3">
        <Field label="目安時間">
          <Input name="duration_minutes" type="number" min={1} defaultValue={block?.durationMinutes ?? 5} className="h-10 bg-white/80 text-[14px]" />
        </Field>
        <Field label="目的">
          <Input name="purpose" defaultValue={block?.purpose ?? ""} placeholder="呼吸を深める" className="h-10 bg-white/80 text-[14px]" />
        </Field>
        <Field label="対象レベル">
          <select name="level" defaultValue={block?.level ?? "全レベル"} className="h-10 w-full rounded-md border border-input bg-white/80 px-3 text-[14px]">
            {levelOptions.map((level) => <option key={level}>{level}</option>)}
          </select>
        </Field>
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_260px] gap-4">
        <Field label="誘導セリフ / レッスン原稿">
          <ScriptTextarea
            name="script"
            defaultValue={block?.script ?? ""}
            placeholder="実際にインストラクターが話す誘導セリフを書きます。"
            className="min-h-[320px] bg-white/80 text-[14px]"
          />
        </Field>
        <div className="grid gap-4">
          <Field label="注意点">
            <Textarea name="cautions" defaultValue={block?.cautions ?? ""} placeholder="首に違和感がある人は無理をしない、など" className="min-h-[136px] bg-white/80 text-[14px]" />
          </Field>
          <Field label="メモ">
            <Textarea name="memo" defaultValue={block?.memo ?? ""} placeholder="反応が良かった言い回し、改善したい点など" className="min-h-[136px] bg-white/80 text-[14px]" />
          </Field>
        </div>
      </div>
    </div>
  );
}

function TagPanel({
  selectedTags,
  draftTag,
  setDraftTag,
  toggleTag,
  addTag,
  tagCandidates,
  submitLabel,
  pending,
  error,
  deleteAction,
}: {
  selectedTags: string[];
  draftTag: string;
  setDraftTag: (value: string) => void;
  toggleTag: (tag: string) => void;
  addTag: () => void;
  tagCandidates: string[];
  submitLabel: string;
  pending: boolean;
  error?: string;
  deleteAction?: DeleteAction;
}) {
  return (
    <div className="min-w-0">
      {selectedTags.map((tag) => <input key={tag} type="hidden" name="tags" value={tag} />)}
      <div className="rounded-xl border border-[#eee4d8] bg-white/62 p-3">
        <SectionTitle icon={Tag} title="タグ" subtitle="選択・追加・削除" />
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedTags.length ? selectedTags.map((tag) => (
            <button key={tag} type="button" onClick={() => toggleTag(tag)} className="inline-flex items-center gap-1 rounded-full border border-[#5d956d] bg-[#5d956d] px-3 py-1 text-[12px] font-bold text-white">
              {tag}
              <X className="h-3 w-3" />
            </button>
          )) : <p className="text-[12px] font-semibold text-[#6b7468]">タグはまだ選択されていません。</p>}
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {tagCandidates.map((tag) => (
            <button key={tag} type="button" onClick={() => toggleTag(tag)} className={selectedTags.includes(tag) ? "rounded-full border border-[#5d956d] bg-[#eaf4eb] px-2.5 py-1 text-[11px] font-bold text-[#4f7b58]" : "rounded-full border border-[#dbe4d6] bg-white px-2.5 py-1 text-[11px] font-bold text-[#4f7b58]"}>
              {tag}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={draftTag} onChange={(event) => setDraftTag(event.target.value)} placeholder="#新しいタグ" className="h-9 bg-white/80 text-[13px]" />
          <button type="button" onClick={addTag} className="inline-flex h-9 w-10 items-center justify-center rounded-lg bg-[#5d956d] text-white">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-[#eee4d8] bg-white/62 p-3">
        <p className="text-[12px] font-bold text-[#4f7b58]">カテゴリーについて</p>
        <p className="mt-1 text-[12px] font-medium leading-5 text-[#5f665c]">
          大カテゴリー・小カテゴリーは設定画面で追加、編集、アーカイブできます。
        </p>
        {error ? <p className="mt-3 rounded-xl border border-[#f0c7b4] bg-[#fff3ec] p-3 text-[12px] font-bold leading-5 text-[#b95542]">{error}</p> : null}
        <div className="mt-4 grid gap-2">
          <button type="submit" disabled={pending} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#5d956d] px-5 text-[13px] font-bold text-white disabled:opacity-60">
            <Save className="h-4 w-4" />
            {pending ? "保存中..." : submitLabel}
          </button>
          {deleteAction ? <DeleteBlockButton action={deleteAction} /> : null}
          <Link href="/lessons?tab=blocks" className="inline-flex h-9 items-center justify-center rounded-lg border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58]">
            キャンセル
          </Link>
        </div>
      </div>
    </div>
  );
}

function MobileBlockForm({
  block,
  pageTitle,
  submitLabel,
  selectedTags,
  draftTag,
  setDraftTag,
  toggleTag,
  addTag,
  categories,
  subcategories,
  selectedCategoryId,
  setSelectedCategoryId,
  tagCandidates,
  pending,
  error,
  deleteAction,
}: {
  block?: DbBlockTemplate;
  pageTitle: string;
  submitLabel: string;
  selectedTags: string[];
  draftTag: string;
  setDraftTag: (value: string) => void;
  toggleTag: (tag: string) => void;
  addTag: () => void;
  categories: BlockCategory[];
  subcategories: BlockCategory["subcategories"];
  selectedCategoryId: string;
  setSelectedCategoryId: (value: string) => void;
  tagCandidates: string[];
  pending: boolean;
  error?: string;
  deleteAction?: DeleteAction;
}) {
  return (
    <div className="mx-auto max-w-[430px] space-y-4 overflow-x-hidden">
      <section className="rounded-3xl border border-[#eee4d8] bg-white/84 p-4 shadow-[0_10px_24px_rgba(122,104,80,0.06)]">
        <h1 className="text-[21px] font-extrabold">{pageTitle}</h1>
        <p className="mt-1 text-[12px] font-medium leading-5 text-[#6b7468]">誘導セリフを登録して、レッスンプランで再利用します。</p>
      </section>

      <section className="grid gap-3 rounded-3xl border border-[#eee4d8] bg-white/84 p-4 shadow-[0_10px_24px_rgba(122,104,80,0.06)]">
        <Field label="ブロック名"><Input name="name" defaultValue={block?.name ?? ""} className="h-11 w-full bg-white/80 text-[14px]" /></Field>
        <Field label="大カテゴリー">
          <select name="category_id" value={selectedCategoryId} onChange={(event) => setSelectedCategoryId(event.target.value)} className="h-11 w-full rounded-md border border-input bg-white/80 px-3 text-[14px]">
            <option value="">未分類</option>
            {categories.filter((category) => !category.archived).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </Field>
        <Field label="小カテゴリー">
          <select name="subcategory_id" defaultValue={block?.subcategoryId ?? ""} className="h-11 w-full rounded-md border border-input bg-white/80 px-3 text-[14px]">
            <option value="">未分類</option>
            {subcategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </Field>
        <Link href="/settings#block-categories" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#d8e3d4] bg-[#f8fcf6] px-3 text-[12px] font-bold text-[#4f7b58]">
          <Settings2 className="h-3.5 w-3.5" />カテゴリー管理へ移動
        </Link>
        <Field label="目安時間"><Input name="duration_minutes" type="number" min={1} defaultValue={block?.durationMinutes ?? 5} className="h-11 w-full bg-white/80 text-[14px]" /></Field>
        <Field label="目的"><Input name="purpose" defaultValue={block?.purpose ?? ""} className="h-11 w-full bg-white/80 text-[14px]" /></Field>
        <Field label="対象レベル">
          <select name="level" defaultValue={block?.level ?? "全レベル"} className="h-11 w-full rounded-md border border-input bg-white/80 px-3 text-[14px]">
            {levelOptions.map((level) => <option key={level}>{level}</option>)}
          </select>
        </Field>
        <Field label="注意点"><Textarea name="cautions" defaultValue={block?.cautions ?? ""} className="min-h-[110px] w-full bg-white/80 text-[14px]" /></Field>
        <Field label="誘導セリフ / レッスン原稿"><ScriptTextarea name="script" defaultValue={block?.script ?? ""} className="min-h-[260px] w-full bg-white/80 text-[14px]" /></Field>
        <Field label="メモ"><Textarea name="memo" defaultValue={block?.memo ?? ""} className="min-h-[120px] w-full bg-white/80 text-[14px]" /></Field>
        <Field label="タグ">
          <TagPanel selectedTags={selectedTags} draftTag={draftTag} setDraftTag={setDraftTag} toggleTag={toggleTag} addTag={addTag} tagCandidates={tagCandidates} submitLabel={submitLabel} pending={pending} error={error} deleteAction={deleteAction} />
        </Field>
      </section>
    </div>
  );
}

function ScriptTextarea({
  name,
  defaultValue,
  placeholder,
  className,
}: {
  name: string;
  defaultValue: string;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const [value, setValue] = useState(defaultValue);

  function insertBold() {
    const textarea = ref.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const insert = selected ? `**${selected}**` : "**太字**";
    const next = `${value.slice(0, start)}${insert}${value.slice(end)}`;
    setValue(next);

    window.requestAnimationFrame(() => {
      textarea.focus();
      const cursorStart = selected ? start + 2 : start + 2;
      const cursorEnd = selected ? start + 2 + selected.length : start + 4;
      textarea.setSelectionRange(cursorStart, cursorEnd);
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#e1d9ce] bg-white/80">
      <div className="flex items-center gap-2 border-b border-[#eee4d8] bg-[#fbfaf6] px-2 py-2">
        <button
          type="button"
          onClick={insertBold}
          className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-[#d8e3d4] bg-white px-2 text-[13px] font-extrabold text-[#4f7b58]"
          title="選択した文字を太字にする"
        >
          B
        </button>
        <p className="truncate text-[11px] font-semibold text-[#6b7468]">強調したい言葉を選択してBを押すと太字になります。</p>
      </div>
      <Textarea
        ref={ref}
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className={`border-0 bg-transparent shadow-none focus-visible:ring-0 ${className ?? ""}`}
      />
    </div>
  );
}

function DeleteBlockButton({ action }: { action: DeleteAction }) {
  return (
    <button
      type="submit"
      formAction={action}
      onClick={(event) => {
        if (!window.confirm("このブロックテンプレートを削除します。よろしいですか？")) event.preventDefault();
      }}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#f2c9bd] bg-[#fff0ea] px-4 text-[13px] font-bold text-[#d96c55]"
    >
      <Trash2 className="h-4 w-4" />
      削除する
    </button>
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
