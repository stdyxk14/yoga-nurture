"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { FolderPlus, Plus, Save, Settings2, Tag, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import type { BlockTemplate } from "@/components/yoga/records";

const tagCandidates = ["#呼吸", "#肩こり改善", "#バランス", "#体幹強化", "#クールダウン", "#初心者向け", "#リラックス"];
const majorCategories = ["事前準備", "雑談", "導入", "呼吸法", "ウォーミングアップ", "スーリャナマスカーラ", "立位", "立位以外", "ターゲットアーサナ", "クールダウン", "クロージング", "その他"];
const minorCategories = ["足指体操", "完全呼吸法", "キャットカウ", "首のストレッチ", "ハラアーサナ", "シャヴァーサナ"];

export function BlockForm({ mode = "new", block }: { mode?: "new" | "edit"; block?: BlockTemplate }) {
  const [selectedTags, setSelectedTags] = useState(block?.tags ?? ["#呼吸", "#初心者向け"]);
  const [draftTag, setDraftTag] = useState("");
  const pageTitle = mode === "edit" ? "ブロックテンプレート編集" : "ブロックテンプレート登録";
  const submitLabel = mode === "edit" ? "更新する" : "保存する";

  function toggleTag(tag: string) {
    setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  }

  function addTag() {
    const normalized = draftTag.trim().startsWith("#") ? draftTag.trim() : `#${draftTag.trim()}`;
    if (!draftTag.trim() || selectedTags.includes(normalized)) return;
    setSelectedTags((current) => [...current, normalized]);
    setDraftTag("");
  }

  return (
    <>
      <div className="md:hidden">
        <MobileBlockForm
          block={block}
          pageTitle={pageTitle}
          submitLabel={submitLabel}
          selectedTags={selectedTags}
          draftTag={draftTag}
          setDraftTag={setDraftTag}
          toggleTag={toggleTag}
          addTag={addTag}
        />
      </div>

      <div className="hidden md:block">
      <PageHeader title={pageTitle} subtitle="誘導セリフをブロックとして登録し、レッスンプランに再利用" />
      <SoftCard className="p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_310px] gap-5">
          <div className="min-w-0">
            <div className="grid grid-cols-[1fr_180px_180px] gap-3">
              <Field label="ブロック名">
                <Input defaultValue={block?.name ?? "完全呼吸法"} className="h-10 bg-white/80 text-[14px]" />
              </Field>
              <Field label="大カテゴリー">
                <select className="h-10 w-full rounded-md border border-input bg-white/80 px-3 text-[14px]">
                  {majorCategories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </Field>
              <Field label="小カテゴリー">
                <select className="h-10 w-full rounded-md border border-input bg-white/80 px-3 text-[14px]">
                  {minorCategories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </Field>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d8e3d4] bg-white px-3 text-[12px] font-bold text-[#4f7b58]">
                <FolderPlus className="h-3.5 w-3.5" />
                新しい大カテゴリーを追加
              </button>
              <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d8e3d4] bg-white px-3 text-[12px] font-bold text-[#4f7b58]">
                <FolderPlus className="h-3.5 w-3.5" />
                新しい小カテゴリーを追加
              </button>
              <Link href="/settings#block-categories" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d8e3d4] bg-[#f8fcf6] px-3 text-[12px] font-bold text-[#4f7b58]">
                <Settings2 className="h-3.5 w-3.5" />
                カテゴリー管理へ移動
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-[120px_1fr_160px] gap-3">
              <Field label="目安時間">
                <Input defaultValue={block?.duration ?? "8分"} className="h-10 bg-white/80 text-[14px]" />
              </Field>
              <Field label="目的">
                <Input defaultValue={block?.purpose ?? "呼吸を深める"} className="h-10 bg-white/80 text-[14px]" />
              </Field>
              <Field label="対象レベル">
                <select className="h-10 w-full rounded-md border border-input bg-white/80 px-3 text-[14px]">
                  {["初心者向け", "中級者向け", "全レベル"].map((level) => <option key={level}>{level}</option>)}
                </select>
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_260px] gap-4">
              <Field label="誘導セリフ / レッスン原稿">
                <Textarea
                  defaultValue={block?.script ?? "では完全呼吸法から行いましょう。お腹、胸、鎖骨のあたりの呼吸筋を使って呼吸を深めます。\n吸う息で下から深く吸って、吐く息でゆっくりリラックスしましょう。\nご自身の呼吸のペースで、無理なく続けていきます。"}
                  className="min-h-[320px] bg-white/80 text-[14px]"
                />
              </Field>
              <div className="grid gap-4">
                <Field label="注意点">
                  <Textarea defaultValue={block?.cautions ?? "息苦しさがある人は自然呼吸に戻す。首や肩に力が入りすぎないように声かけする。"} className="min-h-[136px] bg-white/80 text-[14px]" />
                </Field>
                <Field label="メモ">
                  <Textarea defaultValue={block?.memo ?? "説明が長くなりやすいので、最初は短く区切る。反応が良かった言い回しを残す。"} className="min-h-[136px] bg-white/80 text-[14px]" />
                </Field>
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="rounded-xl border border-[#eee4d8] bg-white/62 p-3">
              <SectionTitle icon={Tag} title="タグ" subtitle="選択・追加・削除" />
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="inline-flex items-center gap-1 rounded-full border border-[#5d956d] bg-[#5d956d] px-3 py-1 text-[12px] font-bold text-white"
                  >
                    {tag}
                    <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {tagCandidates.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={
                      selectedTags.includes(tag)
                        ? "rounded-full border border-[#5d956d] bg-[#eaf4eb] px-2.5 py-1 text-[11px] font-bold text-[#4f7b58]"
                        : "rounded-full border border-[#dbe4d6] bg-white px-2.5 py-1 text-[11px] font-bold text-[#4f7b58]"
                    }
                  >
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
                大カテゴリー・小カテゴリーは設定画面で追加、編集、並び替え、アーカイブできる想定です。既存ブロックに使われているカテゴリーは、付け替え後に削除します。
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/lessons?tab=blocks" className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#5d956d] px-5 text-[13px] font-bold text-white">
                  <Save className="h-4 w-4" />
                  {submitLabel}
                </Link>
                <Link href="/lessons?tab=blocks" className="inline-flex h-9 items-center justify-center rounded-lg border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58]">
                  キャンセル
                </Link>
              </div>
            </div>
          </div>
        </div>
      </SoftCard>
      </div>
    </>
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
}: {
  block?: BlockTemplate;
  pageTitle: string;
  submitLabel: string;
  selectedTags: string[];
  draftTag: string;
  setDraftTag: (value: string) => void;
  toggleTag: (tag: string) => void;
  addTag: () => void;
}) {
  return (
    <div className="mx-auto max-w-[430px] space-y-4 overflow-x-hidden">
      <section className="rounded-3xl border border-[#eee4d8] bg-white/84 p-4 shadow-[0_10px_24px_rgba(122,104,80,0.06)]">
        <h1 className="text-[21px] font-extrabold">{pageTitle}</h1>
        <p className="mt-1 text-[12px] font-medium leading-5 text-[#6b7468]">誘導セリフを登録して、レッスンプランで再利用します。</p>
      </section>

      <section className="grid gap-3 rounded-3xl border border-[#eee4d8] bg-white/84 p-4 shadow-[0_10px_24px_rgba(122,104,80,0.06)]">
        <Field label="ブロック名">
          <Input defaultValue={block?.name ?? "完全呼吸法"} className="h-11 w-full bg-white/80 text-[14px]" />
        </Field>
        <Field label="大カテゴリー">
          <select defaultValue={block?.majorCategory ?? majorCategories[0]} className="h-11 w-full rounded-md border border-input bg-white/80 px-3 text-[14px]">
            {majorCategories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </Field>
        <Field label="小カテゴリー">
          <select defaultValue={block?.minorCategory ?? minorCategories[0]} className="h-11 w-full rounded-md border border-input bg-white/80 px-3 text-[14px]">
            {minorCategories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </Field>
        <div className="grid gap-2">
          <button type="button" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#d8e3d4] bg-white px-3 text-[12px] font-bold text-[#4f7b58]">
            <FolderPlus className="h-3.5 w-3.5" />
            新しい大カテゴリーを追加
          </button>
          <button type="button" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#d8e3d4] bg-white px-3 text-[12px] font-bold text-[#4f7b58]">
            <FolderPlus className="h-3.5 w-3.5" />
            新しい小カテゴリーを追加
          </button>
          <Link href="/settings#block-categories" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#d8e3d4] bg-[#f8fcf6] px-3 text-[12px] font-bold text-[#4f7b58]">
            <Settings2 className="h-3.5 w-3.5" />
            カテゴリー管理へ移動
          </Link>
        </div>
        <Field label="目安時間">
          <Input defaultValue={block?.duration ?? "8分"} className="h-11 w-full bg-white/80 text-[14px]" />
        </Field>
        <Field label="目的">
          <Input defaultValue={block?.purpose ?? "呼吸を深める"} className="h-11 w-full bg-white/80 text-[14px]" />
        </Field>
        <Field label="対象レベル">
          <select defaultValue={block?.level ?? "全レベル"} className="h-11 w-full rounded-md border border-input bg-white/80 px-3 text-[14px]">
            {["初心者向け", "中級者向け", "全レベル"].map((level) => <option key={level}>{level}</option>)}
          </select>
        </Field>
        <Field label="注意点">
          <Textarea defaultValue={block?.cautions ?? "息苦しさがある人は自然呼吸に戻す。首や肩に力が入りすぎないように声かけする。"} className="min-h-[110px] w-full bg-white/80 text-[14px]" />
        </Field>
        <Field label="誘導セリフ / レッスン原稿">
          <Textarea
            defaultValue={block?.script ?? "では完全呼吸法から行いましょう。お腹、胸、鎖骨のあたりの呼吸筋を使って呼吸を深めます。\n吸う息で下から深く吸って、吐く息でゆっくりリラックスしましょう。\nご自身の呼吸のペースで、無理なく続けていきます。"}
            className="min-h-[260px] w-full bg-white/80 text-[14px]"
          />
        </Field>
        <Field label="タグ">
          <div className="rounded-2xl border border-[#eee4d8] bg-white/62 p-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)} className="inline-flex items-center gap-1 rounded-full border border-[#5d956d] bg-[#5d956d] px-3 py-1 text-[12px] font-bold text-white">
                  {tag}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {tagCandidates.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)} className={selectedTags.includes(tag) ? "rounded-full border border-[#5d956d] bg-[#eaf4eb] px-2.5 py-1 text-[11px] font-bold text-[#4f7b58]" : "rounded-full border border-[#dbe4d6] bg-white px-2.5 py-1 text-[11px] font-bold text-[#4f7b58]"}>
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={draftTag} onChange={(event) => setDraftTag(event.target.value)} placeholder="#新しいタグ" className="h-10 min-w-0 flex-1 bg-white/80 text-[13px]" />
              <button type="button" onClick={addTag} className="inline-flex h-10 w-11 shrink-0 items-center justify-center rounded-xl bg-[#5d956d] text-white">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Field>
        <Field label="メモ">
          <Textarea defaultValue={block?.memo ?? "説明が長くなりやすいので、最初は短く区切る。反応が良かった言い回しを残す。"} className="min-h-[120px] w-full bg-white/80 text-[14px]" />
        </Field>
        <div className="grid gap-2 pt-2">
          <Link href="/lessons?tab=blocks" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#5d956d] px-5 text-[14px] font-bold text-white">
            <Save className="h-4 w-4" />
            {submitLabel}
          </Link>
          <Link href="/lessons?tab=blocks" className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58]">
            キャンセル
          </Link>
        </div>
      </section>
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
