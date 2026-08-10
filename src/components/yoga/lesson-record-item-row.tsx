"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Ban,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  LibraryBig,
  PencilLine,
  RefreshCcw,
  Replace,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { lessonRecordChangeReasons, markItemAsPlanned, type LessonRecordChangeReasonCode } from "@/lib/lesson-record-flow";
import type { LessonRecordBlockFormItem } from "@/lib/lesson-records";
import { cn } from "@/lib/utils";

type Props = {
  block: LessonRecordBlockFormItem;
  index: number;
  total: number;
  detailedMode: boolean;
  expanded: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onToggleExpanded: () => void;
  onUpdate: (patch: Partial<LessonRecordBlockFormItem>) => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
  onReplace: () => void;
  onCancelReplacement: () => void;
  onTemplate: () => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
};

const statusLabels = {
  as_planned: "予定どおり",
  adjusted: "調整",
  skipped: "スキップ",
  replaced: "置き換え元",
  added: "予定外追加",
} as const;

export function LessonRecordItemRow(props: Props) {
  const { block, index, total, detailedMode, expanded, isDragging, isDropTarget, onUpdate } = props;
  const isPlanned = block.itemSource === "planned";
  const showDetails = detailedMode || expanded || block.changeType === "adjusted";
  const isSkipped = block.changeType === "skipped" || block.changeType === "replaced";
  const status = block.changeType ? statusLabels[block.changeType] : block.done === null ? "未確認" : block.done ? "実施済み" : "スキップ";

  function toggleReason(code: LessonRecordChangeReasonCode) {
    const selected = block.changeReasonCodes.includes(code);
    onUpdate({ changeReasonCodes: selected ? block.changeReasonCodes.filter((item) => item !== code) : [...block.changeReasonCodes, code] });
  }

  return (
    <article
      draggable
      onDragStart={props.onDragStart}
      onDragOver={(event) => { event.preventDefault(); props.onDragOver(); }}
      onDrop={(event) => { event.preventDefault(); props.onDrop(); }}
      onDragEnd={props.onDragEnd}
      className={cn(
        "relative rounded-lg border bg-white transition",
        isSkipped ? "border-[#d7dad3] bg-[#f3f4f1]" : "border-[#dde3da]",
        isDragging && "opacity-50 ring-2 ring-[#7c9d7f]",
        isDropTarget && "before:absolute before:-top-1 before:left-2 before:right-2 before:h-1 before:rounded-full before:bg-[#7469bf]",
      )}
    >
      <div className="grid items-center gap-3 p-3 md:grid-cols-[minmax(200px,1fr)_90px_120px] xl:grid-cols-[36px_minmax(190px,1fr)_90px_120px_minmax(360px,auto)]">
        <button type="button" aria-label={`${block.name}をドラッグして並べ替え`} className="hidden cursor-grab justify-center text-[#7b8478] active:cursor-grabbing xl:flex"><GripVertical className="h-5 w-5" /></button>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-[#edf2e9] px-1.5 text-sm font-semibold text-[#4f6f55]">{index + 1}</span>
            {block.replacesSchedulePlanItemId ? <span className="rounded-full bg-[#efeafd] px-2 py-0.5 text-xs font-medium text-[#665ca4]">実際に実施</span> : null}
            {block.changeType === "replaced" ? <span className="rounded-full bg-[#eceeea] px-2 py-0.5 text-xs font-medium text-[#5f675e]">置き換え元</span> : null}
          </div>
          {block.blockTemplateId ? <Link href={`/blocks/${block.blockTemplateId}`} className={cn("mt-1 block truncate text-[15px] font-semibold hover:text-[#5d956d]", isSkipped && "text-[#70766f] line-through")}>{block.name}</Link> : <p className={cn("mt-1 truncate text-[15px] font-semibold", isSkipped && "text-[#70766f] line-through")}>{block.name}</p>}
          <p className="mt-0.5 truncate text-sm text-[#687166]">{block.majorCategory} / {block.minorCategory}</p>
        </div>
        <div className="text-sm text-[#687166]"><span className="block text-xs">予定</span>{isPlanned ? `${block.plannedMinutes}分` : "予定外"}</div>
        <label className="grid gap-1 text-xs text-[#687166]">実際の時間
          <Input type="number" min={0} value={block.actualMinutes ?? ""} onChange={(event) => onUpdate({ actualMinutes: event.target.value === "" ? null : Math.max(0, Number(event.target.value)) })} disabled={block.changeType === "replaced"} className="h-9 bg-white text-sm" />
        </label>
        <div className="flex flex-wrap items-center justify-end gap-1.5 md:col-span-3 xl:col-span-1">
          {isPlanned ? (
            <>
              <Action active={block.changeType === "as_planned"} disabled={block.changeType === "replaced"} label="予定どおり" icon={Check} onClick={() => onUpdate(markItemAsPlanned(block))} />
              <Action active={block.changeType === "adjusted"} disabled={block.changeType === "replaced"} label="調整" icon={PencilLine} onClick={() => onUpdate({ changeType: "adjusted", done: true, actualMinutes: block.actualMinutes ?? block.plannedMinutes })} />
              <Action active={block.changeType === "skipped"} disabled={block.changeType === "replaced"} label="スキップ" icon={Ban} onClick={() => onUpdate({ changeType: "skipped", done: false, actualMinutes: null })} />
              <Action active={block.changeType === "replaced"} disabled={block.changeType === "replaced"} label="置き換え" icon={Replace} onClick={props.onReplace} />
              {(block.changeType === "skipped" || block.changeType === "replaced") ? <Action label="元に戻す" icon={RefreshCcw} onClick={block.changeType === "replaced" ? props.onCancelReplacement : () => onUpdate({ changeType: null, done: null, actualMinutes: null })} /> : null}
            </>
          ) : (
            <button type="button" onClick={props.onDelete} className="inline-flex h-8 items-center gap-1 rounded-md border border-[#ead5cf] bg-white px-2 text-xs font-medium text-[#a34f3f]"><Trash2 className="h-3.5 w-3.5" />削除</button>
          )}
          <button type="button" onClick={props.onToggleExpanded} aria-expanded={showDetails} className="inline-flex h-8 items-center gap-1 rounded-md border border-[#dfe3da] bg-white px-2 text-xs font-medium text-[#4f6f55]">
            {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}詳細
          </button>
          <div className="flex gap-1">
            <button type="button" onClick={() => props.onMove(-1)} disabled={index === 0} aria-label="上へ" className="rounded-md border border-[#dfe3da] bg-white p-1.5 disabled:opacity-35"><ArrowUp className="h-4 w-4" /></button>
            <button type="button" onClick={() => props.onMove(1)} disabled={index === total - 1} aria-label="下へ" className="rounded-md border border-[#dfe3da] bg-white p-1.5 disabled:opacity-35"><ArrowDown className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="border-t border-[#eceee8] px-3 py-2 text-sm text-[#5f675e]">
        <span className="font-medium">状態：</span>{status}
        {block.changeReasonCodes.length ? <span className="ml-3">理由：{block.changeReasonCodes.map((code) => lessonRecordChangeReasons.find((reason) => reason.code === code)?.label ?? code).join("、")}</span> : null}
      </div>

      {showDetails ? (
        <div className="grid gap-4 border-t border-[#eceee8] bg-[#fbfcf9] p-4 md:grid-cols-2 xl:grid-cols-3">
          {(block.changeType === "adjusted" || block.changeType === "skipped" || block.changeType === "replaced" || !isPlanned) ? (
            <fieldset className="grid gap-2 md:col-span-2 xl:col-span-3">
              <legend className="text-sm font-medium">変更理由（複数選択可）</legend>
              <div className="flex flex-wrap gap-2">
                {lessonRecordChangeReasons.map((reason) => <button key={reason.code} type="button" aria-pressed={block.changeReasonCodes.includes(reason.code)} onClick={() => toggleReason(reason.code)} className={cn("rounded-full border px-3 py-1.5 text-sm", block.changeReasonCodes.includes(reason.code) ? "border-[#6d9473] bg-[#eaf3e8] text-[#416448]" : "border-[#dfe3da] bg-white text-[#687166]")}>{reason.label}</button>)}
              </div>
              <Input value={block.changeReasonNote} onChange={(event) => onUpdate({ changeReasonNote: event.target.value })} placeholder="変更理由の補足（任意）" className="h-10 bg-white text-sm" />
            </fieldset>
          ) : null}
          <label className="grid gap-1.5 text-sm font-medium">実際に調整した内容<Textarea value={block.actualContentNote} onChange={(event) => onUpdate({ actualContentNote: event.target.value })} className="min-h-20 bg-white text-sm" /></label>
          <label className="grid gap-1.5 text-sm font-medium">生徒の反応
            <select value={block.reaction ?? ""} onChange={(event) => onUpdate({ reaction: (event.target.value || null) as LessonRecordBlockFormItem["reaction"] })} className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
              <option value="">未評価</option><option value="good">良かった</option><option value="neutral">普通</option><option value="poor">いまひとつ</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">次回利用
            <select value={block.useAgain === null ? "" : String(block.useAgain)} onChange={(event) => onUpdate({ useAgain: event.target.value === "" ? null : event.target.value === "true" })} className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
              <option value="">未選択</option><option value="true">次回も使いたい</option><option value="false">今回は使わない</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">講師メモ<Textarea value={block.teacherMemo} onChange={(event) => onUpdate({ teacherMemo: event.target.value })} className="min-h-20 bg-white text-sm" /></label>
          <label className="grid gap-1.5 text-sm font-medium">改善メモ<Textarea value={block.improvementMemo} onChange={(event) => onUpdate({ improvementMemo: event.target.value })} className="min-h-20 bg-white text-sm" /></label>
          <div className="grid content-start gap-2">
            <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={block.reviseScript} onChange={(event) => onUpdate({ reviseScript: event.target.checked })} className="h-4 w-4 accent-[#5d956d]" />セリフを見直す</label>
            {block.reviseScript ? <Textarea value={block.scriptRevision} onChange={(event) => onUpdate({ scriptRevision: event.target.value })} placeholder="見直し内容" className="min-h-20 bg-white text-sm" /> : null}
          </div>
          {block.itemSource === "improvised" && !block.blockTemplateId ? (
            <div className="rounded-lg border border-[#ded7ef] bg-[#faf7ff] p-3 md:col-span-2 xl:col-span-3">
              {block.recordBlockId ? <button type="button" onClick={props.onTemplate} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#7469bf] px-3 text-sm font-medium text-white"><LibraryBig className="h-4 w-4" />ブロックテンプレートとして保存</button> : <p className="text-sm text-[#6d6594]">下書き保存後にテンプレート化できます。</p>}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function Action({ active = false, disabled = false, label, icon: Icon, onClick }: { active?: boolean; disabled?: boolean; label: string; icon: typeof Check; onClick: () => void }) {
  return <button type="button" onClick={onClick} disabled={disabled} aria-pressed={active} className={cn("inline-flex h-8 items-center gap-1 rounded-md border px-2 text-xs font-medium disabled:opacity-60", active ? "border-[#719878] bg-[#eaf3e8] text-[#3f6647]" : "border-[#dfe3da] bg-white text-[#556055]")}><Icon className="h-3.5 w-3.5" />{label}</button>;
}
