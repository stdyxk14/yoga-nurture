"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Clock,
  Eye,
  GripVertical,
  LayoutGrid,
  List,
  Plus,
  Save,
  Search,
  Tag,
  Trash2,
  UsersRound,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { blockTemplates, getLessonBlocks, students } from "@/components/yoga/records";
import type { BlockTemplate, LessonRecord } from "@/components/yoga/records";

const majorCategories = [
  "すべて",
  "事前準備",
  "雑談",
  "導入",
  "呼吸法",
  "ウォーミングアップ",
  "スーリャナマスカーラ",
  "立位",
  "立位以外",
  "ターゲットアーサナ",
  "クールダウン",
  "クロージング",
  "その他",
];

const minorCategories = ["すべて", "足指体操", "完全呼吸法", "キャットカウ", "首のストレッチ", "ハラアーサナ", "シャヴァーサナ"];
const tagFilters = ["#呼吸", "#肩こり改善", "#リラックス", "#ベーシックフロー", "#体幹強化", "#柔軟性向上", "#初心者向け"];
const conditionFilters = ["よく使う", "反応が良い", "最近使った", "最近使っていない", "未使用", "改善メモあり", "お気に入り"];
const sortOptions = ["使用回数順", "評価が高い順", "最近使った順", "目安時間順", "更新日順"];

type ViewMode = "cards" | "list" | "group";

export function LessonForm({ mode, lesson }: { mode: "new" | "edit"; lesson?: LessonRecord }) {
  const isEdit = mode === "edit";
  const returnHref = isEdit && lesson ? `/lessons/${lesson.id}` : "/lessons?tab=plans";
  const selectedBlocks = lesson ? getLessonBlocks(lesson) : blockTemplates.slice(0, 7);
  const totalMinutes = selectedBlocks.reduce((sum, block) => sum + minutes(block.duration), 0);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const distribution = selectedBlocks.reduce<Record<string, number>>((acc, block) => {
    acc[block.majorCategory] = (acc[block.majorCategory] ?? 0) + minutes(block.duration);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title={isEdit ? "レッスンプラン編集" : "レッスンプランを作成"}
        subtitle="ブロックを検索して組み合わせ、印刷できるレッスン原稿を準備"
      />

      <SoftCard className="p-4">
        <SectionTitle icon={CalendarDays} title="基本情報" subtitle="予定とプランの土台" />
        <div className="grid grid-cols-[1fr_140px_120px_120px_130px] gap-3">
          <Field label="レッスンプラン名">
            <Input defaultValue={lesson?.title ?? "基礎バランスフロー"} className="h-10 bg-white/80 text-[14px]" />
          </Field>
          <Field label="レッスン日">
            <Input defaultValue={lesson?.date.replace(/（.*）/, "") ?? "2025/6/13"} className="h-10 bg-white/80 text-[14px]" />
          </Field>
          <Field label="開始時間">
            <Input defaultValue={lesson?.startTime ?? "10:00"} className="h-10 bg-white/80 text-[14px]" />
          </Field>
          <Field label="終了時間">
            <Input defaultValue={lesson?.endTime ?? "11:00"} className="h-10 bg-white/80 text-[14px]" />
          </Field>
          <Field label="合計時間">
            <Input value={`${totalMinutes}分`} readOnly className="h-10 bg-[#f8fcf6] text-[14px] font-bold text-[#4f875a]" />
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-[180px_190px_1fr_250px] gap-3">
          <Field label="場所">
            <Input defaultValue={lesson?.place ?? "スタジオA"} className="h-10 bg-white/80 text-[14px]" />
          </Field>
          <Field label="形式">
            <select className="h-10 w-full rounded-md border border-input bg-white/80 px-3 text-[14px]">
              {["パーソナル", "グループ", "オンライン"].map((format) => (
                <option key={format}>{format}</option>
              ))}
            </select>
          </Field>
          <Field label="テーマ">
            <Input defaultValue={lesson?.theme ?? "足裏から安定をつくり、呼吸を深める"} className="h-10 bg-white/80 text-[14px]" />
          </Field>
          <div>
            <SectionTitle icon={Tag} title="タグ" />
            <div className="flex flex-wrap gap-2">
              {(lesson?.tags ?? ["#バランス", "#呼吸", "#初心者向け"]).map((tag) => (
                <Pill key={tag}>{tag}</Pill>
              ))}
            </div>
          </div>
        </div>
      </SoftCard>

      <section className="mt-4 grid grid-cols-[230px_minmax(0,1fr)_320px] gap-4">
        <SoftCard className="p-3">
          <SectionTitle icon={Search} title="検索・絞り込み" />
          <div className="flex items-center gap-2 rounded-lg border border-[#e7dfd4] bg-white/80 px-2">
            <Search className="h-4 w-4 text-[#6b7468]" />
            <Input placeholder="ブロック名・原稿・タグ・注意点を横断検索" className="h-9 border-0 bg-transparent px-0 text-[12px] shadow-none focus-visible:ring-0" />
          </div>

          <FilterGroup title="大カテゴリー" items={majorCategories} active="すべて" />
          <FilterGroup title="小カテゴリー" items={minorCategories} active="すべて" compact />

          <div className="mt-3">
            <p className="mb-1.5 text-[12px] font-bold text-[#394238]">タグフィルター</p>
            <div className="flex flex-wrap gap-1.5">
              {tagFilters.map((tag, index) => (
                <Pill key={tag} active={index < 2}>{tag}</Pill>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <p className="mb-1.5 text-[12px] font-bold text-[#394238]">条件フィルター</p>
            <div className="grid grid-cols-2 gap-1.5">
              {conditionFilters.map((condition, index) => (
                <button
                  key={condition}
                  className={`h-8 rounded-lg border px-2 text-[11px] font-bold ${
                    index === 1 || index === 5
                      ? "border-[#5d956d] bg-[#edf5ef] text-[#4f7b58]"
                      : "border-[#e3dbcf] bg-white/70 text-[#6b7468]"
                  }`}
                >
                  {condition}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <p className="mb-1.5 text-[12px] font-bold text-[#394238]">並び替え</p>
            <select className="h-9 w-full rounded-lg border border-[#e3dbcf] bg-white/80 px-3 text-[12px] font-bold text-[#4f7b58]">
              {sortOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
        </SoftCard>

        <SoftCard className="min-w-0 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <SectionTitle icon={Plus} title="ブロック候補一覧" subtitle="数百個の候補から探せる想定" />
            <div className="flex rounded-lg border border-[#e2d9cc] bg-white/70 p-1">
              <ViewButton active={viewMode === "cards"} onClick={() => setViewMode("cards")} icon={LayoutGrid} label="カード表示" />
              <ViewButton active={viewMode === "list"} onClick={() => setViewMode("list")} icon={List} label="コンパクト一覧" />
              <ViewButton active={viewMode === "group"} onClick={() => setViewMode("group")} icon={GripVertical} label="大カテゴリー別" />
            </div>
          </div>

          {viewMode === "cards" ? <CardCandidates blocks={blockTemplates.slice(0, 6)} /> : null}
          {viewMode === "list" ? <ListCandidates blocks={blockTemplates.slice(0, 8)} /> : null}
          {viewMode === "group" ? <GroupedCandidates blocks={blockTemplates.slice(0, 9)} /> : null}
        </SoftCard>

        <SoftCard className="p-3">
          <SectionTitle icon={Clock} title="作成中のレッスンプラン" />
          <div className="grid grid-cols-2 gap-2">
            <MiniStat label="合計時間" value={`${totalMinutes}分`} />
            <MiniStat label="ブロック数" value={`${selectedBlocks.length}個`} />
          </div>

          <div className="mt-3 rounded-xl border border-[#eee4d8] bg-white/68 p-3">
            <p className="text-[12px] font-bold text-[#394238]">大カテゴリー別の時間配分</p>
            <div className="mt-2 grid gap-2">
              {Object.entries(distribution).slice(0, 6).map(([category, value]) => (
                <div key={category}>
                  <div className="mb-1 flex justify-between text-[11px] font-bold text-[#5f665c]">
                    <span className="truncate">{category}</span>
                    <span>{value}分</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#ecebe5]">
                    <div className="h-full rounded-full bg-[#6e9870]" style={{ width: `${Math.max(12, (value / Math.max(totalMinutes, 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <SoftCard className="mt-3 max-h-[640px] overflow-y-auto p-2">
            <div className="grid gap-2">
              {selectedBlocks.map((block, index) => (
                <div key={block.id} className="rounded-xl border border-[#eee4d8] bg-white/78 p-2">
                  <div className="grid grid-cols-[26px_1fr] gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#edf5ef] text-[12px] font-extrabold text-[#4f875a]">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-extrabold">{block.name}</p>
                      <p className="truncate text-[11px] font-bold text-[#5d956d]">{block.majorCategory} / {block.minorCategory}</p>
                      <p className="text-[11px] font-semibold text-[#7c8476]">目安時間：{block.duration}</p>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-1">
                    <button className="inline-flex h-7 items-center justify-center rounded-lg border border-[#d8e3d4] bg-white text-[#4f7b58]" aria-label="上へ">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button className="inline-flex h-7 items-center justify-center rounded-lg border border-[#d8e3d4] bg-white text-[#4f7b58]" aria-label="下へ">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button className="inline-flex h-7 items-center justify-center rounded-lg border border-[#f0c7b4] bg-[#fff3ec] text-[#e46b50]" aria-label="削除">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button className="inline-flex h-7 items-center justify-center rounded-lg border border-[#d8e3d4] bg-[#f8fcf6] text-[#4f7b58]" aria-label="原稿を見る">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SoftCard>

          <SoftCard className="mt-3 p-3">
            <SectionTitle icon={UsersRound} title="参加予定生徒" />
            <div className="grid gap-2">
              {students.slice(0, 4).map((student, index) => (
                <label key={student.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#eee4d8] bg-white/70 px-3 py-2">
                  <input type="checkbox" defaultChecked={index < 3} className="h-4 w-4 accent-[#5d956d]" />
                  <span className="min-w-0 truncate text-[12px] font-bold">{student.name}</span>
                </label>
              ))}
            </div>
          </SoftCard>

          <div className="mt-3 grid gap-2">
            <Link href={returnHref} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#5d956d] px-5 text-[13px] font-bold text-white">
              <Save className="h-4 w-4" />
              {isEdit ? "更新する" : "保存する"}
            </Link>
            <Link href={returnHref} className="inline-flex h-9 items-center justify-center rounded-lg border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58]">
              キャンセル
            </Link>
          </div>
        </SoftCard>
      </section>
    </>
  );
}

function CardCandidates({ blocks }: { blocks: BlockTemplate[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {blocks.map((block) => (
        <CandidateCard key={block.id} block={block} />
      ))}
    </div>
  );
}

function ListCandidates({ blocks }: { blocks: BlockTemplate[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#eee4d8] bg-white/70">
      {blocks.map((block) => (
        <div key={block.id} className="grid grid-cols-[1fr_120px_74px_74px_64px] items-center gap-2 border-b border-[#eee4d8] px-3 py-2 last:border-b-0">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-extrabold">{block.name}</p>
            <p className="truncate text-[11px] font-medium text-[#6b7468]">{block.majorCategory} / {block.minorCategory}</p>
          </div>
          <p className="truncate text-[11px] font-bold text-[#5d956d]">{block.tags.slice(0, 2).join(" ")}</p>
          <p className="text-[11px] font-bold">{block.usageCount}回</p>
          <p className="text-[11px] font-bold text-[#7469bf]">★ {block.averageRating}</p>
          <button className="h-7 rounded-lg bg-[#5d956d] text-[11px] font-bold text-white">追加</button>
        </div>
      ))}
    </div>
  );
}

function GroupedCandidates({ blocks }: { blocks: BlockTemplate[] }) {
  const groups = blocks.reduce<Record<string, BlockTemplate[]>>((acc, block) => {
    acc[block.majorCategory] = [...(acc[block.majorCategory] ?? []), block];
    return acc;
  }, {});

  return (
    <div className="grid gap-3">
      {Object.entries(groups).map(([category, items]) => (
        <div key={category} className="rounded-xl border border-[#eee4d8] bg-white/62 p-3">
          <p className="mb-2 text-[13px] font-extrabold text-[#4f7b58]">{category}</p>
          <div className="grid grid-cols-2 gap-2">
            {items.map((block) => (
              <CandidateCard key={block.id} block={block} compact />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CandidateCard({ block, compact = false }: { block: BlockTemplate; compact?: boolean }) {
  return (
    <div className="rounded-xl border border-[#eee4d8] bg-white/72 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[14px] font-extrabold">{block.name}</h3>
          <p className="mt-0.5 text-[11px] font-bold text-[#5d956d]">{block.majorCategory} / {block.minorCategory}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#fff7e8] px-2 py-1 text-[11px] font-bold text-[#9b7338]">{block.duration}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {block.tags.slice(0, compact ? 2 : 4).map((tag) => (
          <Pill key={tag}>{tag}</Pill>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5 text-center text-[11px] font-bold">
        <MiniMeta label="使用" value={`${block.usageCount}回`} />
        <MiniMeta label="評価" value={`★${block.averageRating}`} />
        <MiniMeta label="最終" value={block.lastUsed} />
      </div>
      {!compact ? (
        <>
          <p className="mt-2 line-clamp-2 text-[12px] font-medium leading-5 text-[#50584e]">{block.script}</p>
          <p className="mt-1 line-clamp-1 text-[11px] font-bold text-[#d96c55]">注意点：{block.cautions}</p>
        </>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button className="inline-flex h-8 items-center justify-center rounded-lg border border-[#d8e3d4] bg-white text-[11px] font-bold text-[#4f7b58]">プレビュー</button>
        <button className="inline-flex h-8 items-center justify-center rounded-lg bg-[#5d956d] text-[11px] font-bold text-white">追加</button>
      </div>
    </div>
  );
}

function FilterGroup({ title, items, active, compact = false }: { title: string; items: string[]; active: string; compact?: boolean }) {
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[12px] font-bold text-[#394238]">{title}</p>
      <div className={compact ? "grid grid-cols-2 gap-1.5" : "flex flex-wrap gap-1.5"}>
        {items.map((item) => (
          <button
            key={item}
            className={`h-8 rounded-lg border px-2 text-[11px] font-bold ${
              item === active ? "border-[#5d956d] bg-[#5d956d] text-white" : "border-[#e3dbcf] bg-white/70 text-[#6b7468]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof LayoutGrid;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[11px] font-bold ${
        active ? "bg-[#5d956d] text-white" : "text-[#5f665c]"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#eee4d8] bg-white/70 p-3 text-center">
      <p className="text-[11px] font-bold text-[#7c8476]">{label}</p>
      <p className="mt-1 text-[22px] font-extrabold text-[#4f875a]">{value}</p>
    </div>
  );
}

function MiniMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f8f6f0] px-1.5 py-1">
      <p className="text-[10px] text-[#7c8476]">{label}</p>
      <p className="truncate text-[11px] text-[#394238]">{value}</p>
    </div>
  );
}

function minutes(duration: string) {
  return Number.parseInt(duration, 10) || 0;
}
