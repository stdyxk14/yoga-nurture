"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, ChevronDown } from "lucide-react";
import { WorkspaceStatus } from "@/components/yoga/workspace-kit";
import { lessonRecordChangeReasons } from "@/lib/lesson-record-flow";
import type { LessonRecordDetailBlock } from "@/lib/lesson-records";
import { cn } from "@/lib/utils";

type FlowFilter = "all" | "changed" | "notes";

const filterLabels: Array<{ id: FlowFilter; label: string }> = [
  { id: "all", label: "すべて" },
  { id: "changed", label: "変更あり" },
  { id: "notes", label: "メモあり" },
];

export function LessonRecordFlowList({ blocks }: { blocks: LessonRecordDetailBlock[] }) {
  const [filter, setFilter] = useState<FlowFilter>("all");
  const relationships = useMemo(() => {
    const blockBySchedulePlanItemId = new Map<string, LessonRecordDetailBlock>();
    const replacementBySourceId = new Map<string, LessonRecordDetailBlock>();
    const sourceByReplacementId = new Map<string, LessonRecordDetailBlock>();
    const orderById = new Map<string, number>();

    for (const [index, block] of blocks.entries()) {
      orderById.set(block.id, index + 1);
      if (block.schedulePlanItemId) blockBySchedulePlanItemId.set(block.schedulePlanItemId, block);
    }
    for (const block of blocks) {
      if (!block.replacesSchedulePlanItemId) continue;
      const source = blockBySchedulePlanItemId.get(block.replacesSchedulePlanItemId);
      if (!source) continue;
      replacementBySourceId.set(source.id, block);
      sourceByReplacementId.set(block.id, source);
    }

    return { orderById, replacementBySourceId, sourceByReplacementId };
  }, [blocks]);
  const counts = useMemo(() => ({
    all: blocks.length,
    changed: blocks.filter(hasChange).length,
    notes: blocks.filter(hasMemo).length,
  }), [blocks]);
  const visibleBlocks = blocks.filter((block) => {
    if (filter === "changed") return hasChange(block);
    if (filter === "notes") return hasMemo(block);
    return true;
  });

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--yn-border-subtle)] pb-3">
        <p className="text-[12px] text-[var(--yn-text-muted)]">{visibleBlocks.length}件を表示</p>
        <div role="group" aria-label="実施フローの表示切替" className="flex flex-wrap gap-1.5">
          {filterLabels.map((option) => {
            const active = filter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(option.id)}
                className={cn(
                  "inline-flex min-h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--yn-focus)] focus-visible:ring-offset-1",
                  active
                    ? "border-[#7fa383] bg-[#e6f1e3] text-[#356540]"
                    : "border-[#d9ddd4] bg-white text-[#626a60] hover:border-[#adc3aa] hover:bg-[#f4f8f1]",
                )}
              >
                {option.label}
                <span className={cn("text-[11px]", active ? "text-[#4d7555]" : "text-[#899087]")}>{counts[option.id]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {visibleBlocks.length ? (
        <div className="mt-3 min-w-0 space-y-1.5">
          {visibleBlocks.map((block, index) => {
            const replacement = relationships.replacementBySourceId.get(block.id);
            const replacementSource = relationships.sourceByReplacementId.get(block.id);
            const nextVisibleBlock = visibleBlocks[index + 1];
            const relationshipConnected = Boolean(replacement && nextVisibleBlock?.id === replacement.id);

            return (
              <Fragment key={block.id}>
                <ExecutionRow
                  block={block}
                  order={relationships.orderById.get(block.id) ?? index + 1}
                  replacement={replacement}
                  replacementSource={replacementSource}
                  relationshipConnected={relationshipConnected || Boolean(replacementSource && visibleBlocks[index - 1]?.id === replacementSource.id)}
                />
                {relationshipConnected ? <ReplacementConnector /> : null}
              </Fragment>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-[#d2dbcf] bg-[#f8faf6] px-4 py-5 text-center text-[13px] text-[var(--yn-text-muted)]">
          この条件に合う項目はありません
        </p>
      )}
    </div>
  );
}

function ExecutionRow({
  block,
  order,
  replacement,
  replacementSource,
  relationshipConnected,
}: {
  block: LessonRecordDetailBlock;
  order: number;
  replacement?: LessonRecordDetailBlock;
  replacementSource?: LessonRecordDetailBlock;
  relationshipConnected: boolean;
}) {
  const inactive = block.done === false || block.changeType === "skipped" || block.changeType === "replaced";
  const preview = memoPreview(block);
  const savedDetails = getSavedDetails(block);
  const relationshipLabel = replacement ? "置き換え元" : replacementSource ? "置き換え先" : null;
  const unconnectedRelationship = !relationshipConnected
    ? replacement
      ? `置き換え先：${replacement.name}`
      : replacementSource
        ? `置き換え元：${replacementSource.name}`
        : null
    : null;

  return (
    <article className={cn(
      "relative min-w-0 overflow-hidden rounded-lg border border-l-4",
      rowTone(block),
      replacementSource && "ml-5 sm:ml-8",
    )}>
      <div className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 px-3 py-2.5 pr-20">
        <span className={cn(
          "inline-flex h-7 min-w-7 items-center justify-center self-start rounded-md px-1.5 text-[12px] font-semibold",
          inactive ? "bg-[#e6e7e2] text-[#6d726b]" : "bg-[#eaf1e7] text-[#456d4c]",
        )}>
          {order}
        </span>
        <div className="min-w-0">
          {block.blockTemplateId ? (
            <Link
              href={`/blocks/${block.blockTemplateId}`}
              className={cn(
                "break-words text-[14px] font-semibold leading-5 text-[var(--yn-text)] hover:text-[var(--yn-primary-strong)] hover:underline",
                inactive && "text-[#70756f]",
              )}
            >
              {block.name}
            </Link>
          ) : (
            <h3 className={cn("break-words text-[14px] font-semibold leading-5 text-[var(--yn-text)]", inactive && "text-[#70756f]")}>{block.name}</h3>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--yn-text-muted)]">
            <span className="whitespace-nowrap">{block.majorCategory}／{block.minorCategory}</span>
            <span aria-hidden="true" className="text-[#c6c9c2]">•</span>
            <span className="whitespace-nowrap">{sourceLabel(block.itemSource)}</span>
            <WorkspaceStatus tone={changeTone(block.changeType)} className="min-h-6 whitespace-nowrap px-2 text-[12px]">
              {changeLabel(block.changeType)}
            </WorkspaceStatus>
            {relationshipLabel ? <span className="whitespace-nowrap font-semibold text-[#7a694b]">{relationshipLabel}</span> : null}
            {block.done === false ? <span className="whitespace-nowrap font-semibold text-[#a45a4e]">未実施</span> : null}
            {block.done === null ? <span className="whitespace-nowrap font-semibold text-[#9a5b50]">未確認</span> : null}
            <span className="inline-flex flex-wrap items-center gap-1 whitespace-nowrap font-medium text-[#596159]">
              <span>予定 {minuteLabel(block.plannedMinutes)}</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#9aa098]" aria-hidden="true" />
              <span>実際 {minuteLabel(block.actualMinutes)}</span>
            </span>
          </div>
          {unconnectedRelationship ? <p className="mt-1 truncate text-[12px] font-medium text-[#7568a7]">{unconnectedRelationship}</p> : null}
          {preview ? <p className="mt-1 truncate text-[12px] text-[#5f665d]">{preview}</p> : null}
        </div>
      </div>

      <details className="group">
        <summary
          aria-label={`${block.name}の保存内容を表示`}
          className="absolute right-2.5 top-2.5 inline-flex min-h-8 cursor-pointer list-none items-center gap-1 rounded-lg px-2 text-[12px] font-semibold text-[#4e7454] transition hover:bg-[#eef4eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--yn-focus)] [&::-webkit-details-marker]:hidden"
        >
          詳細
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="border-t border-[var(--yn-border-subtle)] bg-white/72 px-3 py-3">
          {savedDetails.length ? (
            <dl className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {savedDetails.map(([label, value]) => <SavedDetail key={label} label={label} value={value} />)}
            </dl>
          ) : <p className="text-[13px] text-[var(--yn-text-muted)]">追加メモなし</p>}
        </div>
      </details>
    </article>
  );
}

function ReplacementConnector() {
  return (
    <div className="ml-7 flex h-7 items-center gap-2 text-[12px] font-semibold text-[#7568a7] sm:ml-11" aria-label="次の項目へ置き換え">
      <span className="h-full border-l-2 border-dashed border-[#cfc5e3]" aria-hidden="true" />
      <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
      <span>置き換え</span>
    </div>
  );
}

function SavedDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-l-2 border-[#d9e5d5] pl-3">
      <dt className="text-[12px] font-medium text-[var(--yn-text-muted)]">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-[14px] font-medium leading-6 text-[var(--yn-text)] [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}

function getSavedDetails(block: LessonRecordDetailBlock): Array<[string, string]> {
  const details: Array<[string, string]> = [];
  const reasonLabels = block.changeReasonCodes.map((code) => lessonRecordChangeReasons.find((reason) => reason.code === code)?.label ?? code);
  if (reasonLabels.length) details.push(["変更理由", reasonLabels.join("、")]);
  pushTextDetail(details, "変更理由メモ", block.changeReasonNote);
  pushTextDetail(details, "実際に行った内容", block.actualContentNote);
  if (block.reaction !== null) details.push(["生徒の反応", reactionLabel(block.reaction)]);
  pushTextDetail(details, "講師メモ", block.teacherMemo);
  pushTextDetail(details, "改善メモ", block.improvementMemo);
  if (block.useAgain !== null) details.push(["また使いたいか", formatUseAgainLabel(block.useAgain)]);
  pushTextDetail(details, "誘導セリフの修正案", block.scriptRevision);
  return details;
}

function pushTextDetail(details: Array<[string, string]>, label: string, value: string) {
  if (value.trim()) details.push([label, value]);
}

function memoPreview(block: LessonRecordDetailBlock) {
  const reasonLabels = block.changeReasonCodes.map((code) => lessonRecordChangeReasons.find((reason) => reason.code === code)?.label ?? code);
  const parts = [
    reasonLabels.length ? `変更理由：${reasonLabels.join("、")}` : "",
    block.changeReasonNote.trim() ? `理由メモ：${block.changeReasonNote.trim()}` : "",
    block.actualContentNote.trim() ? `実施内容：${block.actualContentNote.trim()}` : "",
    block.teacherMemo.trim() ? `講師メモ：${block.teacherMemo.trim()}` : "",
    block.improvementMemo.trim() ? `改善メモ：${block.improvementMemo.trim()}` : "",
    block.scriptRevision.trim() ? `誘導修正：${block.scriptRevision.trim()}` : "",
  ].filter(Boolean);
  return parts.slice(0, 2).join(" ・ ");
}

function hasChange(block: LessonRecordDetailBlock) {
  return block.changeType === "adjusted"
    || block.changeType === "skipped"
    || block.changeType === "replaced"
    || block.changeType === "added";
}

function hasMemo(block: LessonRecordDetailBlock) {
  return Boolean(
    block.changeReasonNote.trim()
      || block.actualContentNote.trim()
      || block.teacherMemo.trim()
      || block.improvementMemo.trim()
      || block.scriptRevision.trim(),
  );
}

function rowTone(block: LessonRecordDetailBlock) {
  if (block.changeType === "adjusted") return "border-[#d9d0eb] border-l-[#8878b8] bg-[#fbf9fe]";
  if (block.changeType === "skipped") return "border-[#efd5cf] border-l-[#c46d5e] bg-[#fff8f5]";
  if (block.changeType === "replaced") return "border-[#e6d7bd] border-l-[#b08a52] bg-[#faf8f2]";
  if (block.changeType === "added") return "border-[#d9d0eb] border-l-[#8878b8] bg-[#faf8fd]";
  if (block.changeType === null || block.done === null) return "border-[#ead9bc] border-l-[#b08a52] bg-[#fffaf0]";
  return "border-[#e0e5dd] border-l-[#c8d8c5] bg-white";
}

function sourceLabel(source: LessonRecordDetailBlock["itemSource"]) {
  if (source === "library") return "ライブラリ追加";
  if (source === "improvised") return "即興追加";
  return "予定内";
}

function changeLabel(changeType: LessonRecordDetailBlock["changeType"]) {
  if (changeType === "as_planned") return "予定どおり";
  if (changeType === "adjusted") return "調整";
  if (changeType === "skipped") return "スキップ";
  if (changeType === "replaced") return "置き換え";
  if (changeType === "added") return "追加";
  return "旧形式／未分類";
}

function changeTone(changeType: LessonRecordDetailBlock["changeType"]): "green" | "purple" | "coral" | "sand" | "neutral" {
  if (changeType === "as_planned") return "green";
  if (changeType === "adjusted" || changeType === "added") return "purple";
  if (changeType === "skipped") return "coral";
  if (changeType === "replaced") return "sand";
  return "neutral";
}

function minuteLabel(value: number | null) {
  return value === null ? "未入力" : `${value}分`;
}

function reactionLabel(reaction: NonNullable<LessonRecordDetailBlock["reaction"]>) {
  if (reaction === "good") return "良かった";
  if (reaction === "neutral") return "普通";
  return "いまひとつ";
}

function formatUseAgainLabel(value: boolean) {
  return value ? "次回も使いたい" : "今回は使わない";
}
