"use client";

import { useMemo, useState } from "react";
import { BookOpen, Plus, Sparkles } from "lucide-react";
import { ImprovisedItemDialog, type ImprovisedItemInput } from "@/components/yoga/improvised-item-dialog";
import { LessonRecordDialog } from "@/components/yoga/lesson-record-dialog";
import { LessonRecordItemRow } from "@/components/yoga/lesson-record-item-row";
import { LessonRecordTemplateDialog } from "@/components/yoga/lesson-record-template-dialog";
import { RecordBlockPicker } from "@/components/yoga/record-block-picker";
import { summarizeLessonExecution } from "@/lib/lesson-record-flow";
import type { BlockCategory, DbBlockTemplate } from "@/lib/blocks";
import type { LessonRecordBlockFormItem } from "@/lib/lesson-records";

type Props = {
  blocks: LessonRecordBlockFormItem[];
  blockLibrary: DbBlockTemplate[];
  categories: BlockCategory[];
  detailedMode: boolean;
  expandedIds: Set<string>;
  completionError?: number;
  onClearCompletionError: () => void;
  onToggleExpanded: (fieldId: string) => void;
  onUpdate: (fieldId: string, patch: Partial<LessonRecordBlockFormItem>) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDelete: (fieldId: string) => void;
  onBulkAsPlanned: () => void;
  onAddLibrary: (block: DbBlockTemplate, replacesSchedulePlanItemId: string | null) => void;
  onAddImprovised: (input: ImprovisedItemInput, replacesSchedulePlanItemId: string | null) => void;
  onCancelReplacement: (sourceFieldId: string) => void;
  onTemplateCreated: (fieldId: string, blockTemplateId: string) => void;
};

export function LessonRecordFlowStep(props: Props) {
  const [chooserOpen, setChooserOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [improvisedOpen, setImprovisedOpen] = useState(false);
  const [replacementFieldId, setReplacementFieldId] = useState<string | null>(null);
  const [templateBlock, setTemplateBlock] = useState<LessonRecordBlockFormItem | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const summary = useMemo(() => summarizeLessonExecution(props.blocks), [props.blocks]);
  const replacementSource = replacementFieldId ? props.blocks.find((block) => block.fieldId === replacementFieldId) : null;

  function openChooser(fieldId: string | null) {
    setReplacementFieldId(fieldId);
    setChooserOpen(true);
  }

  function selectLibrary() {
    setChooserOpen(false);
    setPickerOpen(true);
  }

  function selectImprovised() {
    setChooserOpen(false);
    setImprovisedOpen(true);
  }

  return (
    <section className="space-y-4" aria-labelledby="lesson-flow-heading">
      <div className="rounded-xl border border-[#dfe5da] bg-[#f8faf6] p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 id="lesson-flow-heading" className="text-lg font-semibold text-[#2f342e]">実施フロー</h2>
            <p className="mt-1 text-sm leading-6 text-[#687166]">変更があった項目だけ詳しく記録します。ドラッグ、または上下ボタンで実施順を変更できます。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={props.onBulkAsPlanned} disabled={summary.unconfirmedCount === 0} className="h-10 rounded-lg border border-[#8eae91] bg-white px-4 text-sm font-medium text-[#426449] disabled:opacity-45">未確認項目を予定どおりにする</button>
            <button type="button" onClick={() => openChooser(null)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#5d956d] px-4 text-sm font-medium text-white"><Plus className="h-4 w-4" />実施した内容を追加</button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#e0e5dd] bg-[#e0e5dd] md:grid-cols-5 xl:grid-cols-9">
          <Summary label="予定ブロック" value={summary.plannedCount} />
          <Summary label="予定どおり" value={summary.asPlannedCount} />
          <Summary label="調整" value={summary.adjustedCount} />
          <Summary label="スキップ" value={summary.skippedCount} />
          <Summary label="置き換え" value={summary.replacedCount} />
          <Summary label="予定外追加" value={summary.addedCount} />
          <Summary label="未確認" value={summary.unconfirmedCount} alert={summary.unconfirmedCount > 0} />
          <Summary label="予定合計" value={`${summary.plannedMinutes}分`} />
          <Summary label="実施合計" value={`${summary.actualMinutes}分`} />
        </div>
      </div>

      {props.completionError ? (
        <div role="alert" className="rounded-lg border border-[#edc6bd] bg-[#fff0ea] p-4 text-sm leading-6 text-[#9e4334]">
          <p className="font-semibold">未確認の予定項目が{props.completionError}件あります。</p>
          <p>各項目を「予定どおり」「調整」「スキップ」「置き換え」のいずれかで確定するか、「未確認項目を予定どおりにする」を使ってください。</p>
          <button type="button" onClick={() => { props.onBulkAsPlanned(); props.onClearCompletionError(); }} className="mt-2 rounded-lg bg-[#a84d3a] px-3 py-2 font-medium text-white">残りを予定どおりとして確定</button>
        </div>
      ) : null}

      <div className="grid gap-3">
        {props.blocks.map((block, index) => (
          <div key={block.fieldId}>
            {block.replacesSchedulePlanItemId ? <div className="ml-8 h-5 border-l-2 border-dashed border-[#8f83c4] pl-4 text-sm text-[#6d6594]">↓ 置き換え</div> : null}
            <LessonRecordItemRow
              block={block}
              index={index}
              total={props.blocks.length}
              detailedMode={props.detailedMode}
              expanded={props.expandedIds.has(block.fieldId)}
              isDragging={draggingId === block.fieldId}
              isDropTarget={dropTargetId === block.fieldId && draggingId !== block.fieldId}
              onToggleExpanded={() => props.onToggleExpanded(block.fieldId)}
              onUpdate={(patch) => props.onUpdate(block.fieldId, patch)}
              onMove={(direction) => props.onReorder(index, index + direction)}
              onDelete={() => props.onDelete(block.fieldId)}
              onReplace={() => openChooser(block.fieldId)}
              onCancelReplacement={() => props.onCancelReplacement(block.fieldId)}
              onTemplate={() => setTemplateBlock(block)}
              onDragStart={() => setDraggingId(block.fieldId)}
              onDragOver={() => setDropTargetId(block.fieldId)}
              onDrop={() => {
                const fromIndex = props.blocks.findIndex((item) => item.fieldId === draggingId);
                if (fromIndex >= 0) props.onReorder(fromIndex, index);
                setDraggingId(null);
                setDropTargetId(null);
              }}
              onDragEnd={() => { setDraggingId(null); setDropTargetId(null); }}
            />
          </div>
        ))}
        {!props.blocks.length ? <p className="rounded-lg border border-dashed border-[#ccd8ca] bg-[#f8fbf6] p-6 text-center text-sm text-[#687166]">実施項目がありません。「実施した内容を追加」から記録できます。</p> : null}
      </div>

      <LessonRecordDialog open={chooserOpen} title={replacementSource ? `「${replacementSource.name}」を置き換え` : "実施した内容を追加"} description={replacementSource ? "置き換え元は予定との差分として残り、選んだ内容が直後へ追加されます。" : "追加する内容の種類を選んでください。"} onClose={() => { setChooserOpen(false); setReplacementFieldId(null); }} className="max-w-lg">
        <div className="grid gap-3 p-5 md:grid-cols-2">
          <button data-autofocus type="button" onClick={selectLibrary} className="rounded-lg border border-[#d9e2d6] bg-white p-5 text-left hover:bg-[#f7faf5]"><BookOpen className="h-6 w-6 text-[#5d956d]" /><span className="mt-3 block text-[15px] font-semibold">ライブラリから{replacementSource ? "置き換える" : "追加"}</span><span className="mt-1 block text-sm leading-6 text-[#687166]">登録済みブロックを検索して選びます。</span></button>
          <button type="button" onClick={selectImprovised} className="rounded-lg border border-[#ded7ef] bg-white p-5 text-left hover:bg-[#faf7ff]"><Sparkles className="h-6 w-6 text-[#7469bf]" /><span className="mt-3 block text-[15px] font-semibold">即興の内容を{replacementSource ? "使う" : "追加"}</span><span className="mt-1 block text-sm leading-6 text-[#687166]">現場で生まれた内容を簡単に残します。</span></button>
        </div>
      </LessonRecordDialog>

      <RecordBlockPicker
        open={pickerOpen}
        blocks={props.blockLibrary}
        categories={props.categories}
        title={replacementSource ? "ライブラリのブロックで置き換え" : undefined}
        onClose={() => { setPickerOpen(false); setReplacementFieldId(null); }}
        onSelect={(block) => {
          props.onAddLibrary(block, replacementSource?.schedulePlanItemId ?? null);
          setPickerOpen(false);
          setReplacementFieldId(null);
        }}
      />
      <ImprovisedItemDialog
        open={improvisedOpen}
        categories={props.categories}
        title={replacementSource ? "即興の内容で置き換え" : undefined}
        onClose={() => { setImprovisedOpen(false); setReplacementFieldId(null); }}
        onAdd={(input) => {
          props.onAddImprovised(input, replacementSource?.schedulePlanItemId ?? null);
          setImprovisedOpen(false);
          setReplacementFieldId(null);
        }}
      />
      <LessonRecordTemplateDialog open={Boolean(templateBlock)} block={templateBlock} categories={props.categories} onClose={() => setTemplateBlock(null)} onCreated={props.onTemplateCreated} />
    </section>
  );
}

function Summary({ label, value, alert = false }: { label: string; value: string | number; alert?: boolean }) {
  return <div className={alert ? "bg-[#fff0ea] p-3" : "bg-white p-3"}><p className="text-xs text-[#687166]">{label}</p><p className={alert ? "mt-1 text-lg font-semibold text-[#a24736]" : "mt-1 text-lg font-semibold text-[#2f342e]"}>{value}</p></div>;
}
