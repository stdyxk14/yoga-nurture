"use client";

import Link from "next/link";
import { CalendarDays, Clock3, Grid3X3, ListChecks } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  LessonCoverageDefinition,
  LessonCoverageKey,
  LessonCoverageLessonColumn,
  LessonCoverageMonthColumn,
  LessonCoverageOccurrence,
  LessonCoverageReport,
  LessonCoverageSummaryRow,
} from "@/lib/lesson-coverage";

type MatrixMode = "lesson" | "month";
type SelectedCell = { mode: MatrixMode; columnKey: string; coverageKey: LessonCoverageKey };

type DetailGroup = {
  key: string;
  blockTemplateId: string | null;
  blockName: string;
  count: number;
  recordedTimeCount: number;
  actualMinutes: number;
  lessons: Array<{ lessonRecordId: string; scheduleId: string; lessonName: string; date: string }>;
};

export function LessonCoverageView({ report }: { report: LessonCoverageReport }) {
  const [mode, setMode] = useState<MatrixMode>("lesson");
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const columns = mode === "lesson" ? report.lessons : report.months;
  const selected = selectedCell?.mode === mode ? selectedCell : null;
  const selectedOccurrences = useMemo(
    () => selected ? getSelectedOccurrences(report.occurrences, selected) : [],
    [report.occurrences, selected],
  );
  const detailGroups = useMemo(() => groupDetailOccurrences(selectedOccurrences), [selectedOccurrences]);
  const selectedDefinition = selected ? report.categoryDefinitions.find((definition) => definition.key === selected.coverageKey) ?? null : null;
  const selectedColumn = selected ? getSelectedColumn(report, selected) : null;

  function changeMode(nextMode: MatrixMode) {
    setMode(nextMode);
    setSelectedCell(null);
  }

  return (
    <div className="min-w-0 max-w-full space-y-5" data-testid="lesson-coverage-view">
      <CoverageOverview report={report} />

      {report.totalLessons ? (
        <CoverageHeatmap
          mode={mode}
          columns={columns}
          definitions={report.categoryDefinitions}
          selected={selected}
          onModeChange={changeMode}
          onSelect={setSelectedCell}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-[#cfd9ca] bg-[#f7faf5] px-5 py-9 text-center">
          <p className="text-[15px] font-semibold text-[#384338]">完了済みレッスンの実施記録がありません</p>
          <p className="mx-auto mt-1 max-w-[620px] text-[13px] leading-6 text-[#6c756a]">期間・形式・場所・プランを変更すると、別の実施後記録を確認できます。</p>
        </div>
      )}

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <RecentCoverageTrends report={report} />
        <CoverageCellDetails
          definition={selectedDefinition}
          column={selectedColumn}
          mode={mode}
          groups={detailGroups}
          occurrenceCount={selectedOccurrences.length}
        />
      </div>

      {report.unclassifiedBlocks.length ? <UnclassifiedCoverageList report={report} /> : null}
    </div>
  );
}

function CoverageOverview({ report }: { report: LessonCoverageReport }) {
  const maxCount = report.summary.reduce((highest, row) => Math.max(highest, row.occurrenceCount), 0);
  return (
    <section className="min-w-0 rounded-xl border border-[#e6ded3] bg-white/82 p-4 sm:p-5" aria-labelledby="coverage-overview-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="coverage-overview-title" className="text-[17px] font-semibold text-[#30372f]">カバレッジ概要</h2>
          <p className="mt-1 text-[13px] leading-5 text-[#70776e]">完了済みレッスンの実施項目を、記録された名称・カテゴリー・目的・タグから自動分類しています。</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[12px] font-medium text-[#626a60]">
          <span className="rounded-full border border-[#ddd6cc] bg-[#faf8f3] px-3 py-1.5">対象 {report.totalLessons}レッスン</span>
          <span className="rounded-full border border-[#ddd6cc] bg-[#faf8f3] px-3 py-1.5">実施 {report.totalExecutedItems}ブロック</span>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {report.summary.map((row) => (
          <CoverageSummaryCard key={row.key} row={row} maxCount={maxCount} />
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-5 text-[#777e74]">1つの実施ブロックが複数分類に該当する場合、それぞれへ1回ずつ数えます。根拠が見つからない実施ブロックは未分類として残します。</p>
    </section>
  );
}

function CoverageSummaryCard({ row, maxCount }: { row: LessonCoverageSummaryRow; maxCount: number }) {
  const barWidth = maxCount ? (row.occurrenceCount / maxCount) * 100 : 0;
  return (
    <article className="min-w-0 rounded-xl border border-[#e8e1d8] bg-[#fcfbf8] p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: row.color }} aria-hidden="true" />
          <h3 className="truncate text-[13px] font-semibold text-[#3f473f]">{row.label}</h3>
        </div>
        <strong className="shrink-0 text-[18px] font-semibold tabular-nums text-[#30372f]">{row.occurrenceCount}<span className="ml-0.5 text-[11px] font-medium text-[#727970]">回</span></strong>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eceae4]" aria-hidden="true">
        <span className="block h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: row.color }} />
      </div>
      <p className="mt-2 text-[11px] leading-5 text-[#6e756d]">{row.lessonCount}レッスンに登場・登場率 {row.lessonRate}%</p>
    </article>
  );
}

function CoverageHeatmap({
  mode,
  columns,
  definitions,
  selected,
  onModeChange,
  onSelect,
}: {
  mode: MatrixMode;
  columns: Array<LessonCoverageLessonColumn | LessonCoverageMonthColumn>;
  definitions: LessonCoverageDefinition[];
  selected: SelectedCell | null;
  onModeChange: (mode: MatrixMode) => void;
  onSelect: (cell: SelectedCell) => void;
}) {
  const maxCount = columns.reduce((highest, column) => definitions.reduce((rowHighest, definition) => Math.max(rowHighest, column.counts[definition.key]), highest), 0);
  const columnWidth = mode === "lesson" ? 118 : 112;
  const tableMinWidth = Math.max(760, 190 + columns.length * columnWidth);

  return (
    <section className="min-w-0 max-w-full space-y-3" aria-labelledby="coverage-heatmap-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="coverage-heatmap-title" className="text-[17px] font-semibold text-[#30372f]">カバレッジ・ヒートマップ</h2>
          <p className="mt-0.5 text-[13px] leading-5 text-[#70776e]">各セルの数値は実施ブロック回数です。セルを選ぶと下の詳細へ反映します。</p>
        </div>
        <div className="inline-flex rounded-lg border border-[#dcd6cd] bg-white p-1" role="group" aria-label="ヒートマップ表示切替">
          <button type="button" aria-pressed={mode === "lesson"} onClick={() => onModeChange("lesson")} className={mode === "lesson" ? "inline-flex h-8 items-center gap-1.5 rounded-md bg-[#e6f0e3] px-3 text-[12px] font-semibold text-[#386b46]" : "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-semibold text-[#666d63] hover:bg-[#f5f3ee]"}><ListChecks className="h-3.5 w-3.5" />レッスン別</button>
          <button type="button" aria-pressed={mode === "month"} onClick={() => onModeChange("month")} className={mode === "month" ? "inline-flex h-8 items-center gap-1.5 rounded-md bg-[#e6f0e3] px-3 text-[12px] font-semibold text-[#386b46]" : "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-semibold text-[#666d63] hover:bg-[#f5f3ee]"}><CalendarDays className="h-3.5 w-3.5" />月別</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-lg border border-[#e6ded3] bg-[#faf8f3] px-3 py-2" aria-label="カバレッジ凡例">
        {definitions.map((definition) => <span key={definition.key} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#5d655c]"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: definition.color }} aria-hidden="true" />{definition.label}</span>)}
      </div>

      {columns.length ? (
        <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-[#ddd8cf] bg-white/90">
          <div className="max-w-full overflow-x-auto overscroll-x-contain" data-testid="coverage-heatmap-scroll">
            <table className="border-separate border-spacing-0 text-left text-[12px]" style={{ minWidth: `${tableMinWidth}px`, width: "100%" }}>
              <caption className="sr-only">{mode === "lesson" ? "レッスン別" : "月別"}カバレッジ実施回数</caption>
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-20 w-[190px] min-w-[190px] border-b border-r border-[#e4ded5] bg-[#f5f3ee] px-3 py-3 font-semibold text-[#596158]">カバレッジ</th>
                  {columns.map((column) => <CoverageColumnHeader key={columnKey(column)} column={column} mode={mode} />)}
                </tr>
              </thead>
              <tbody>
                {definitions.map((definition) => (
                  <tr key={definition.key}>
                    <th scope="row" className="sticky left-0 z-10 border-b border-r border-[#ece6de] bg-[#fffefa] px-3 py-3 font-semibold text-[#434b43]">
                      <span className="flex items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: definition.color }} aria-hidden="true" />{definition.label}</span>
                    </th>
                    {columns.map((column) => {
                      const key = columnKey(column);
                      const count = column.counts[definition.key];
                      const isSelected = selected?.columnKey === key && selected.coverageKey === definition.key;
                      return (
                        <td key={`${definition.key}-${key}`} className="border-b border-[#ece6de] p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => onSelect({ mode, columnKey: key, coverageKey: definition.key })}
                            aria-pressed={isSelected}
                            aria-controls="coverage-cell-details"
                            aria-label={`${definition.label}、${columnAriaLabel(column)}、${count}回`}
                            className={`flex min-h-12 w-full min-w-[82px] items-center justify-center rounded-lg border text-[13px] font-semibold tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#527b5a] focus-visible:ring-offset-1 ${isSelected ? "border-[#385f43] ring-2 ring-[#557e5f] ring-offset-1" : "border-transparent hover:border-[#7f9b83]"}`}
                            style={{ backgroundColor: heatmapBackground(definition.color, count, maxCount), color: count ? "#2f3931" : "#858b83" }}
                          >
                            {count}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-[#d7dcd3] bg-[#fafaf7] px-4 py-7 text-center text-[13px] font-medium text-[#777e74]">この表示に該当する完了済みレッスンはありません。</p>
      )}
    </section>
  );
}

function CoverageColumnHeader({ column, mode }: { column: LessonCoverageLessonColumn | LessonCoverageMonthColumn; mode: MatrixMode }) {
  if (mode === "lesson" && "lessonRecordId" in column) {
    return (
      <th scope="col" className="min-w-[118px] border-b border-[#e4ded5] bg-[#f5f3ee] px-2.5 py-2.5 align-bottom">
        <span className="block whitespace-nowrap text-[11px] font-medium text-[#757c73]">{formatJapaneseDate(column.date)}</span>
        <span className="mt-1 block max-w-[108px] text-[12px] font-semibold leading-4 text-[#454d45]" title={column.lessonName}>{column.lessonName}</span>
      </th>
    );
  }
  const month = column as LessonCoverageMonthColumn;
  return <th scope="col" className="min-w-[112px] border-b border-[#e4ded5] bg-[#f5f3ee] px-2.5 py-2.5 align-bottom"><span className="block whitespace-nowrap text-[12px] font-semibold text-[#454d45]">{month.label}</span><span className="mt-1 block text-[11px] font-medium text-[#757c73]">{month.lessonCount}レッスン</span></th>;
}

function RecentCoverageTrends({ report }: { report: LessonCoverageReport }) {
  const unclassifiedCount = report.unclassifiedBlocks.reduce((total, block) => total + block.useCount, 0);
  const recentLabel = report.trends.recentLessonCount ? `直近${report.trends.recentLessonCount}回は未登場` : "直近レッスンなし";
  return (
    <section className="min-w-0 space-y-3" aria-labelledby="coverage-trends-title">
      <div>
        <h2 id="coverage-trends-title" className="text-[17px] font-semibold text-[#30372f]">最近の傾向</h2>
        <p className="mt-0.5 text-[13px] leading-5 text-[#70776e]">AIを使わず、選択期間内の実施記録だけから事実を表示します。</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TrendCard badge="最近少なめ" title={recentLabel} definitions={report.trends.absentRecent} emptyLabel={report.trends.recentLessonCount ? "すべて登場" : "判定対象なし"} detail={report.trends.recentLessonCount < 5 && report.trends.recentLessonCount > 0 ? "対象期間内の直近分で判定" : undefined} />
        <TrendCard badge="3回連続" title="直近から3回以上連続" definitions={report.trends.consecutive} value={(row) => `${"lessonCount" in row ? row.lessonCount : 0}回連続`} emptyLabel="該当なし" />
        <TrendCard badge="最近多め" title="選択期間内で最多" definitions={report.trends.mostUsed} value={(row) => `${"occurrenceCount" in row ? row.occurrenceCount : 0}回`} emptyLabel="実施記録なし" />
        <article className="rounded-xl border border-[#e6ded3] bg-white/82 p-4">
          <TrendBadge label="未分類" />
          <h3 className="mt-2 text-[13px] font-semibold text-[#414941]">未分類のまま実施</h3>
          <p className="mt-2 text-[21px] font-semibold tabular-nums text-[#343c34]">{unclassifiedCount}<span className="ml-1 text-[12px] font-medium text-[#737a70]">回・{report.unclassifiedBlocks.length}種類</span></p>
        </article>
        <article className="rounded-xl border border-[#e6ded3] bg-white/82 p-4 sm:col-span-2">
          <TrendBadge label="時間記録が少ない" />
          <h3 className="mt-2 text-[13px] font-semibold text-[#414941]">実時間の記録割合が低いカバレッジ</h3>
          {report.trends.timingSparse.length ? <div className="mt-3 flex flex-wrap gap-2">{report.trends.timingSparse.map((row) => <span key={row.key} className="inline-flex items-center gap-2 rounded-lg border border-[#e4ded5] bg-[#faf9f5] px-2.5 py-2 text-[12px] text-[#555d54]"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: row.color }} aria-hidden="true" /><strong>{row.label}</strong><span className="tabular-nums">記録 {row.recordedCount}/{row.totalCount}件（{row.recordedRate}%）</span></span>)}</div> : <p className="mt-3 text-[12px] text-[#777e74]">実施項目の実時間はすべて記録されています。</p>}
        </article>
      </div>
    </section>
  );
}

function TrendCard({
  badge,
  title,
  definitions,
  value,
  emptyLabel,
  detail,
}: {
  badge: string;
  title: string;
  definitions: Array<LessonCoverageDefinition | (LessonCoverageDefinition & { lessonCount: number }) | LessonCoverageSummaryRow>;
  value?: (row: LessonCoverageDefinition | (LessonCoverageDefinition & { lessonCount: number }) | LessonCoverageSummaryRow) => string;
  emptyLabel: string;
  detail?: string;
}) {
  return (
    <article className="rounded-xl border border-[#e6ded3] bg-white/82 p-4">
      <TrendBadge label={badge} />
      <h3 className="mt-2 text-[13px] font-semibold text-[#414941]">{title}</h3>
      {definitions.length ? <div className="mt-3 flex flex-wrap gap-1.5">{definitions.map((row) => <span key={row.key} className="inline-flex items-center gap-1.5 rounded-full border border-[#e3ded5] bg-[#faf9f5] px-2.5 py-1 text-[11px] font-medium text-[#555d54]"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: row.color }} aria-hidden="true" />{row.label}{value ? ` ${value(row)}` : ""}</span>)}</div> : <p className="mt-3 text-[12px] text-[#777e74]">{emptyLabel}</p>}
      {detail ? <p className="mt-2 text-[11px] text-[#7a8078]">{detail}</p> : null}
    </article>
  );
}

function TrendBadge({ label }: { label: string }) {
  return <span className="inline-flex min-h-6 items-center rounded-full border border-[#d9dfd5] bg-[#f3f7f1] px-2 text-[11px] font-semibold text-[#55715b]">{label}</span>;
}

function CoverageCellDetails({
  definition,
  column,
  mode,
  groups,
  occurrenceCount,
}: {
  definition: LessonCoverageDefinition | null;
  column: LessonCoverageLessonColumn | LessonCoverageMonthColumn | null;
  mode: MatrixMode;
  groups: DetailGroup[];
  occurrenceCount: number;
}) {
  return (
    <section id="coverage-cell-details" className="min-w-0 space-y-3" aria-labelledby="coverage-details-title" aria-live="polite">
      <div>
        <h2 id="coverage-details-title" className="text-[17px] font-semibold text-[#30372f]">セル詳細</h2>
        <p className="mt-0.5 text-[13px] leading-5 text-[#70776e]">実時間が未入力の項目は、予定時間で補いません。</p>
      </div>
      {!definition || !column ? (
        <div className="rounded-xl border border-dashed border-[#d7dcd3] bg-[#fafaf7] px-4 py-8 text-center">
          <Grid3X3 className="mx-auto h-5 w-5 text-[#7b8379]" />
          <p className="mt-2 text-[13px] font-medium text-[#687067]">ヒートマップのセルを選択してください。</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#e6ded3] bg-white/82 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#ece5db] pb-3">
            <div>
              <p className="flex items-center gap-2 text-[13px] font-semibold text-[#3e473f]"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: definition.color }} aria-hidden="true" />{definition.label}</p>
              <p className="mt-1 text-[12px] leading-5 text-[#70776e]">{selectedColumnLabel(column, mode)}</p>
            </div>
            <strong className="text-[18px] font-semibold tabular-nums text-[#343c34]">{occurrenceCount}<span className="ml-1 text-[11px] font-medium text-[#737a70]">回</span></strong>
          </div>
          {groups.length ? <div className="mt-3 space-y-3">{groups.map((group) => <CoverageDetailGroup key={group.key} group={group} />)}</div> : <p className="mt-4 rounded-lg border border-dashed border-[#d7dcd3] bg-[#fafaf7] px-3 py-5 text-center text-[12px] text-[#777e74]">このセルに該当する実施ブロックはありません。</p>}
        </div>
      )}
    </section>
  );
}

function CoverageDetailGroup({ group }: { group: DetailGroup }) {
  return (
    <article className="rounded-lg border border-[#e7e1d8] bg-[#fcfbf8] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {group.blockTemplateId ? <Link href={`/blocks/${group.blockTemplateId}`} className="font-semibold text-[#3f7048] hover:underline">{group.blockName}</Link> : <p className="font-semibold text-[#424a42]">{group.blockName}</p>}
          <p className="mt-1 text-[11px] text-[#767d74]">{group.blockTemplateId ? "ブロック詳細を開けます" : "即興項目のためブロック詳細リンクなし"}</p>
        </div>
        <span className="rounded-full border border-[#dfe3da] bg-white px-2.5 py-1 text-[11px] font-semibold tabular-nums text-[#596158]">実施 {group.count}回</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[#60685f]">
        <span className="inline-flex items-center gap-1 rounded-md bg-[#f2f0ea] px-2 py-1"><Clock3 className="h-3 w-3" />{group.recordedTimeCount ? `実時間 ${group.actualMinutes}分（${group.recordedTimeCount}/${group.count}件記録）` : "実時間 未入力"}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {group.lessons.map((lesson) => <Link key={lesson.lessonRecordId} href={`/lessons/${lesson.scheduleId}/record`} className="inline-flex min-h-7 items-center rounded-md border border-[#d4ddd0] bg-white px-2 text-[11px] font-medium text-[#456d4c] hover:bg-[#f3f8f1] hover:underline">{formatJapaneseDate(lesson.date)} {lesson.lessonName}</Link>)}
      </div>
    </article>
  );
}

function UnclassifiedCoverageList({ report }: { report: LessonCoverageReport }) {
  return (
    <section className="min-w-0 space-y-3" aria-labelledby="coverage-unclassified-title">
      <div>
        <h2 id="coverage-unclassified-title" className="text-[17px] font-semibold text-[#30372f]">未分類ブロック</h2>
        <p className="mt-0.5 text-[13px] leading-5 text-[#70776e]">自動分類の根拠が見つからなかった実施ブロックです。今回は分類の保存や手動補正は行いません。</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-[#e6ded3] bg-white/82">
        <div className="hidden grid-cols-[minmax(0,1fr)_110px_140px] border-b border-[#e6ded3] bg-[#f5f3ee] px-4 py-2 text-[11px] font-semibold text-[#666d63] sm:grid"><span>ブロック名</span><span>使用回数</span><span>最終使用日</span></div>
        <div className="divide-y divide-[#ece5db]">
          {report.unclassifiedBlocks.map((block) => (
            <article key={block.key} className="grid min-w-0 gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_110px_140px] sm:items-center">
              <div className="min-w-0">{block.blockTemplateId ? <Link href={`/blocks/${block.blockTemplateId}`} className="font-semibold text-[#3f7048] hover:underline">{block.blockName}</Link> : <p className="font-semibold text-[#424a42]">{block.blockName}</p>}<p className="mt-0.5 text-[11px] text-[#777e74]">{block.blockTemplateId ? "ブロック詳細" : "即興項目"}</p></div>
              <p className="text-[12px] text-[#626a60]"><span className="sm:hidden">使用回数 </span><strong className="tabular-nums">{block.useCount}回</strong></p>
              <p className="text-[12px] text-[#626a60]"><span className="sm:hidden">最終使用日 </span>{formatJapaneseDate(block.latestDate)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function getSelectedOccurrences(occurrences: LessonCoverageOccurrence[], selected: SelectedCell) {
  return occurrences.filter((occurrence) => {
    const matchesColumn = selected.mode === "lesson" ? occurrence.lessonRecordId === selected.columnKey : occurrence.monthKey === selected.columnKey;
    return matchesColumn && occurrence.coverageKeys.includes(selected.coverageKey);
  });
}

function groupDetailOccurrences(occurrences: LessonCoverageOccurrence[]) {
  const grouped = new Map<string, DetailGroup>();
  for (const occurrence of occurrences) {
    const key = occurrence.blockTemplateId ? `block:${occurrence.blockTemplateId}` : `name:${occurrence.blockName.normalize("NFKC").toLocaleLowerCase("ja-JP")}`;
    const current = grouped.get(key);
    const lessons = new Map((current?.lessons ?? []).map((lesson) => [lesson.lessonRecordId, lesson]));
    lessons.set(occurrence.lessonRecordId, {
      lessonRecordId: occurrence.lessonRecordId,
      scheduleId: occurrence.scheduleId,
      lessonName: occurrence.lessonName,
      date: occurrence.date,
    });
    grouped.set(key, {
      key,
      blockTemplateId: occurrence.blockTemplateId,
      blockName: occurrence.blockName,
      count: (current?.count ?? 0) + 1,
      recordedTimeCount: (current?.recordedTimeCount ?? 0) + (occurrence.actualDurationMinutes === null ? 0 : 1),
      actualMinutes: (current?.actualMinutes ?? 0) + (occurrence.actualDurationMinutes ?? 0),
      lessons: Array.from(lessons.values()).sort((a, b) => a.date.localeCompare(b.date)),
    });
  }
  return Array.from(grouped.values()).sort((a, b) => b.count - a.count || a.blockName.localeCompare(b.blockName, "ja"));
}

function getSelectedColumn(report: LessonCoverageReport, selected: SelectedCell) {
  return selected.mode === "lesson"
    ? report.lessons.find((lesson) => lesson.lessonRecordId === selected.columnKey) ?? null
    : report.months.find((month) => month.monthKey === selected.columnKey) ?? null;
}

function selectedColumnLabel(column: LessonCoverageLessonColumn | LessonCoverageMonthColumn, mode: MatrixMode) {
  if (mode === "lesson" && "lessonRecordId" in column) return `${formatJapaneseDate(column.date)} ${column.lessonName}`;
  return (column as LessonCoverageMonthColumn).label;
}

function columnKey(column: LessonCoverageLessonColumn | LessonCoverageMonthColumn) {
  return "lessonRecordId" in column ? column.lessonRecordId : column.monthKey;
}

function columnAriaLabel(column: LessonCoverageLessonColumn | LessonCoverageMonthColumn) {
  return "lessonRecordId" in column ? `${formatJapaneseDate(column.date)} ${column.lessonName}` : column.label;
}

function heatmapBackground(color: string, count: number, maxCount: number) {
  if (!count || !maxCount) return "#f7f6f2";
  const alpha = 0.16 + 0.5 * Math.sqrt(count / maxCount);
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function formatJapaneseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [year, month, day] = value.split("-").map(Number);
  return `${year}/${month}/${day}`;
}
