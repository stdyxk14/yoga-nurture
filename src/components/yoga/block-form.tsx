"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { FolderPlus, Plus, Save, Settings2, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmSubmitButton } from "@/components/yoga/confirm-submit-button";
import {
  WorkspaceAction,
  WorkspaceActionBar,
  WorkspaceFeedback,
  WorkspaceField,
  WorkspaceFormSection,
  WorkspacePageHeader,
} from "@/components/yoga/workspace-kit";
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
  const isEdit = mode === "edit";
  const returnHref = block ? `/blocks/${block.id}` : "/lessons?tab=blocks";
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
    <form action={formAction} aria-busy={pending} className="mx-auto max-w-[1320px] space-y-4 pb-10">
      <WorkspacePageHeader
        title={isEdit ? "ブロックテンプレートを編集" : "ブロックテンプレートを登録"}
        description="誘導セリフと注意点を、レッスンプランで繰り返し使える単位として整理します。"
        backLink={{ href: returnHref, label: isEdit ? "ブロック詳細へ戻る" : "ブロック一覧へ戻る" }}
        eyebrow="TEACHING BLOCK"
        meta={<span>ブロックは同じレッスンプラン内で複数回使用できます</span>}
      />

      {error ? <WorkspaceFeedback tone="error">{error}</WorkspaceFeedback> : null}

      <WorkspaceActionBar className="sticky top-[4.5rem] md:top-4" sticky={false} danger={deleteAction ? (
        <ConfirmSubmitButton
          message="このブロックテンプレートを削除します。使用中の場合は削除できないことがあります。"
          title="ブロックを削除"
          confirmLabel="削除する"
          formAction={deleteAction}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#efc9c0] bg-[#fff5f1] px-3.5 text-[13px] font-semibold text-[#bd5d50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bd5d50] focus-visible:ring-offset-2"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />削除
        </ConfirmSubmitButton>
      ) : undefined}>
        <WorkspaceAction href={returnHref} variant="secondary">キャンセル</WorkspaceAction>
        <WorkspaceAction type="submit" disabled={pending} variant="primary" icon={Save}>
          {pending ? "保存中…" : isEdit ? "変更を保存" : "ブロックを登録"}
        </WorkspaceAction>
      </WorkspaceActionBar>

      {selectedTags.map((tag) => <input key={tag} type="hidden" name="tags" value={tag} />)}

      <WorkspaceFormSection title="基本情報" description="名前と目安時間は、プラン作成時の一覧にも表示されます。">
        <div className="grid gap-4 lg:grid-cols-2">
          <WorkspaceField label="ブロック名" required className="lg:col-span-2">
            <Input name="name" defaultValue={block?.name ?? ""} placeholder="完全呼吸法" required autoFocus className="yn-control" />
          </WorkspaceField>
          <WorkspaceField label="大カテゴリー">
            <select name="category_id" value={selectedCategoryId} onChange={(event) => setSelectedCategoryId(event.target.value)} className="yn-control w-full px-3">
              <option value="">未分類</option>
              {categories.filter((category) => !category.archived).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </WorkspaceField>
          <WorkspaceField label="小カテゴリー">
            <select name="subcategory_id" defaultValue={block?.subcategoryId ?? ""} className="yn-control w-full px-3">
              <option value="">未分類</option>
              {subcategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </WorkspaceField>
          <div className="flex flex-wrap gap-2 lg:col-span-2">
            <WorkspaceAction href="/settings#block-categories" variant="secondary" icon={Settings2}>カテゴリー管理</WorkspaceAction>
            <WorkspaceAction href="/settings#block-categories" variant="ghost" icon={FolderPlus}>新しいカテゴリーを追加</WorkspaceAction>
          </div>
          <WorkspaceField label="目安時間（分）" required>
            <Input name="duration_minutes" type="number" min={1} defaultValue={block?.durationMinutes ?? 5} required className="yn-control" />
          </WorkspaceField>
          <WorkspaceField label="対象レベル">
            <select name="level" defaultValue={block?.level ?? "全レベル"} className="yn-control w-full px-3">
              {levelOptions.map((level) => <option key={level}>{level}</option>)}
            </select>
          </WorkspaceField>
          <WorkspaceField label="目的" hint="このブロックで何を育てたいかを短く記します" className="lg:col-span-2">
            <Input name="purpose" defaultValue={block?.purpose ?? ""} placeholder="呼吸を深め、心身を落ち着かせる" className="yn-control" />
          </WorkspaceField>
        </div>
      </WorkspaceFormSection>

      <WorkspaceFormSection title="誘導と安全上の注意" description="実際に話す言葉を主役にし、注意点と振り返りは分けて残します。">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <WorkspaceField label="誘導セリフ／レッスン原稿">
            <ScriptTextarea name="script" defaultValue={block?.script ?? ""} placeholder="実際にインストラクターが話す誘導セリフを書きます。" className="min-h-[380px] text-[14px]" />
          </WorkspaceField>
          <div className="grid content-start gap-4">
            <WorkspaceField label="注意点" hint="ケガや体調への配慮、避けたい動き">
              <Textarea name="cautions" defaultValue={block?.cautions ?? ""} placeholder="首に違和感がある人は無理をしない、など" className="min-h-[150px] text-[14px]" />
            </WorkspaceField>
            <WorkspaceField label="改善・補足メモ">
              <Textarea name="memo" defaultValue={block?.memo ?? ""} placeholder="反応が良かった言い回し、改善したい点など" className="min-h-[150px] text-[14px]" />
            </WorkspaceField>
          </div>
        </div>
      </WorkspaceFormSection>

      <WorkspaceFormSection title="タグ" description="検索しやすい言葉を選ぶか、新しく追加できます。">
        <div className="flex flex-wrap gap-2">
          {selectedTags.length ? selectedTags.map((tag) => (
            <button key={tag} type="button" onClick={() => toggleTag(tag)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#5d8f68] bg-[#5d8f68] px-3 text-[13px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76] focus-visible:ring-offset-2">
              {tag}<X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )) : <p className="text-[13px] text-[var(--yn-text-muted)]">タグはまだ選択されていません。</p>}
        </div>
        <div className="flex max-h-[180px] flex-wrap gap-2 overflow-y-auto rounded-xl bg-[var(--yn-surface-muted)] p-3">
          {tagCandidates.map((tag) => {
            const selected = selectedTags.includes(tag);
            return (
              <button key={tag} type="button" onClick={() => toggleTag(tag)} aria-pressed={selected} className={selected ? "min-h-9 rounded-full border border-[#8fb296] bg-[#edf5ef] px-3 text-[13px] font-semibold text-[#477b52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]" : "min-h-9 rounded-full border border-[#dbe4d6] bg-white px-3 text-[13px] font-medium text-[#4f6754] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]"}>
                {tag}
              </button>
            );
          })}
        </div>
        <div className="flex max-w-lg gap-2">
          <Input value={draftTag} onChange={(event) => setDraftTag(event.target.value)} placeholder="#新しいタグ" className="yn-control" />
          <button type="button" onClick={addTag} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#5d8f68] px-3.5 text-[13px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76] focus-visible:ring-offset-2" aria-label="タグを追加">
            <Plus className="h-4 w-4" aria-hidden="true" />追加
          </button>
        </div>
      </WorkspaceFormSection>
    </form>
  );
}

function ScriptTextarea({ name, defaultValue, placeholder, className }: { name: string; defaultValue: string; placeholder?: string; className?: string }) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const [value, setValue] = useState(defaultValue);

  function insertBold() {
    const textarea = ref.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const insert = selected ? `**${selected}**` : "**太字**";
    setValue(`${value.slice(0, start)}${insert}${value.slice(end)}`);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, selected ? start + 2 + selected.length : start + 4);
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#dcd6cc] bg-white">
      <div className="flex items-center gap-2 border-b border-[var(--yn-border-subtle)] bg-[#faf8f3] px-2.5 py-2">
        <button type="button" onClick={insertBold} className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-[#d8e3d4] bg-white px-2 text-[14px] font-semibold text-[#4f7b58] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]" title="選択した文字を太字にする">B</button>
        <p className="text-[13px] leading-5 text-[var(--yn-text-muted)]">選択した文字を強調できます。</p>
      </div>
      <Textarea ref={ref} name={name} value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} className={`border-0 bg-transparent shadow-none focus-visible:ring-0 ${className ?? ""}`} />
    </div>
  );
}
