"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { Layers3, Plus, Save, Tag, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, SectionTitle, SoftCard } from "@/components/yoga/page-kit";

const tagCandidates = [
  "#肩こり改善",
  "#呼吸",
  "#リラックス",
  "#ベーシックフロー",
  "#体幹強化",
  "#柔軟性向上",
  "#骨盤調整",
  "#陰ヨガ",
  "#リストラティブ",
];

export function TemplateForm() {
  const [selectedTags, setSelectedTags] = useState(["#ベーシックフロー", "#呼吸", "#体幹強化"]);
  const [tagInput, setTagInput] = useState("");

  function toggleTag(tag: string) {
    setSelectedTags((current) => (
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    ));
  }

  function addTag() {
    const normalized = tagInput.trim().startsWith("#") ? tagInput.trim() : `#${tagInput.trim()}`;
    if (!normalized || normalized === "#") return;
    setSelectedTags((current) => (current.includes(normalized) ? current : [...current, normalized]));
    setTagInput("");
  }

  return (
    <>
      <PageHeader title="テンプレート作成" subtitle="よく使うレッスン内容の型を登録" />

      <SoftCard className="p-4">
        <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-6">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-[#edf4ea] p-5 text-[#4f875a]">
            <Layers3 className="h-20 w-20" strokeWidth={1.35} />
            <p className="mt-3 text-center text-[13px] font-bold text-[#607463]">
              予定作成の元になる
              <br />
              レッスンの型
            </p>
          </div>

          <div className="min-w-0">
            <Field label="テンプレート名">
              <Input defaultValue="ベーシックフロー" className="h-10 bg-white/80 text-[14px]" />
            </Field>

            <div className="mt-4">
              <Field label="目的・テーマ">
                <Textarea
                  defaultValue="体幹強化・柔軟性向上・呼吸の安定"
                  className="min-h-[76px] bg-white/80 text-[14px]"
                />
              </Field>
            </div>

            <div className="mt-4 rounded-xl border border-[#eee4d8] bg-white/62 p-3">
              <SectionTitle icon={Tag} title="タグ" subtitle="候補から選ぶか、新しいタグを追加できます" />
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="inline-flex h-8 items-center gap-1 rounded-full border border-[#5d956d] bg-[#5d956d] px-3 text-[12px] font-bold text-white"
                  >
                    {tag}
                    <X className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                {tagCandidates.map((tag) => {
                  const active = selectedTags.includes(tag);

                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={
                        active
                          ? "inline-flex h-8 items-center rounded-full border border-[#5d956d] bg-[#edf5ef] px-3 text-[12px] font-bold text-[#3f7c52]"
                          : "inline-flex h-8 items-center rounded-full border border-[#dbe4d6] bg-white px-3 text-[12px] font-bold text-[#4f7b58]"
                      }
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  placeholder="#新しいタグ"
                  className="h-9 bg-white/80 text-[13px]"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#5d956d] px-3 text-[12px] font-bold text-white"
                >
                  <Plus className="h-4 w-4" />
                  追加
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-[1.15fr_0.85fr] gap-4">
              <Field label="基本構成">
                <Textarea
                  defaultValue={`0-5分：センタリング・呼吸観察
5-15分：肩甲骨まわりのウォームアップ
15-30分：太陽礼拝と立位ポーズ
30-45分：バランス・体幹ワーク
45-55分：ツイスト・クールダウン
55-60分：シャバーサナ`}
                  className="min-h-[220px] bg-white/80 text-[14px]"
                />
              </Field>
              <Field label="注意点">
                <Textarea
                  defaultValue="膝や腰に違和感がある生徒には後屈と深い前屈を控えめにする。呼吸が浅くなったら休息を入れる。"
                  className="min-h-[220px] bg-white/80 text-[14px]"
                />
              </Field>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Link href="/lessons?tab=templates" className="inline-flex h-9 items-center rounded-lg border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58]">
                キャンセル
              </Link>
              <Link href="/lessons?tab=templates" className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#5d956d] px-5 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(64,113,77,0.2)]">
                <Save className="h-4 w-4" />
                保存する
              </Link>
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
