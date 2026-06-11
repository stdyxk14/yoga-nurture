"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { Plus, Save, Tag, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, SectionTitle, SoftCard } from "@/components/yoga/page-kit";

const tagCandidates = ["#呼吸", "#肩こり改善", "#バランス", "#体幹強化", "#クールダウン", "#初心者向け", "#リラックス"];
const categories = ["事前準備", "雑談", "導入", "呼吸法", "ウォーミングアップ", "スーリャナマスカーラ", "立位", "立位以外", "ターゲットアーサナ", "クールダウン", "クロージング", "その他"];

export function BlockForm() {
  const [selectedTags, setSelectedTags] = useState(["#呼吸", "#初心者向け"]);
  const [draftTag, setDraftTag] = useState("");

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
      <PageHeader title="ブロックテンプレート登録" subtitle="誘導セリフをブロックとして登録し、レッスンプランに再利用" />

      <SoftCard className="p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-5">
          <div className="min-w-0">
            <div className="grid grid-cols-[1fr_170px_170px] gap-3">
              <Field label="ブロック名">
                <Input defaultValue="完全呼吸法" className="h-10 bg-white/80 text-[14px]" />
              </Field>
              <Field label="大カテゴリー">
                <select className="h-10 w-full rounded-md border border-input bg-white/80 px-3 text-[14px]">
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </Field>
              <Field label="小カテゴリー">
                <Input defaultValue="完全呼吸法" className="h-10 bg-white/80 text-[14px]" />
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-[120px_1fr_160px] gap-3">
              <Field label="目安時間">
                <Input defaultValue="8分" className="h-10 bg-white/80 text-[14px]" />
              </Field>
              <Field label="目的">
                <Input defaultValue="呼吸を深める" className="h-10 bg-white/80 text-[14px]" />
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
                  defaultValue={"では完全呼吸法から行いましょう。お腹、胸、鎖骨のあたりの呼吸筋を使って呼吸を深めます。\n仰向けになり、鼻から深く吸って、鼻から深く吐いてリラックスしていきましょう。\n吸う息で下からお腹、胸、鎖骨。吐く息も下からお腹、胸、鎖骨を意識しましょう。"}
                  className="min-h-[300px] bg-white/80 text-[14px]"
                />
              </Field>
              <div className="grid gap-4">
                <Field label="注意点">
                  <Textarea defaultValue="息苦しさがある人は自然呼吸に戻す" className="min-h-[126px] bg-white/80 text-[14px]" />
                </Field>
                <Field label="メモ">
                  <Textarea defaultValue="説明が長くなりやすいので、最初は短く区切る" className="min-h-[126px] bg-white/80 text-[14px]" />
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
              <p className="text-[12px] font-medium leading-5 text-[#5f665c]">
                保存後はブロックテンプレート一覧から検索・絞り込みでき、レッスンプラン作成時に追加できます。
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/lessons?tab=blocks" className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#5d956d] px-5 text-[13px] font-bold text-white">
                  <Save className="h-4 w-4" />
                  保存する
                </Link>
                <Link href="/lessons?tab=blocks" className="inline-flex h-9 items-center justify-center rounded-lg border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58]">
                  キャンセル
                </Link>
              </div>
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
