"use client";

import Link from "next/link";
import { ArrowUpRight, Grid3X3 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  summarizeRecentLessonCoverage,
  type LessonCoverageDefinition,
  type LessonCoverageKey,
  type LessonCoverageOccurrence,
  type LessonCoverageReport,
} from "@/lib/lesson-coverage";

type SelectedCell = {
  lessonRecordId: string;
  coverageKey: LessonCoverageKey;
};

type DetailBlock = {
  key: string;
  blockTemplateId: string | null;
  blockName: string;
  count: number;
};

export function RecentLessonCoverage({ report }: { report: LessonCoverageReport }) {
  const [selected, setSelected] = useState<SelectedCell | null>(null);
  const recentSummary = useMemo(() => summarizeRecentLessonCoverage(report, 5), [report]);
  const selectedLesson = selected
    ? report.lessons.find((lesson) => lesson.lessonRecordId === selected.lessonRecordId) ?? null
    : null;
  const selectedDefinition = selected
    ? report.categoryDefinitions.find((definition) => definition.key === selected.coverageKey) ?? null
    : null;
  const selectedOccurrences = useMemo(
    () => selected
      ? report.occurrences.filter((occurrence) => occurrence.lessonRecordId === selected.lessonRecordId && occurrence.coverageKeys.includes(selected.coverageKey))
      : [],
    [report.occurrences, selected],
  );
  const selectedBlocks = useMemo(() => groupDetailBlocks(selectedOccurrences), [selectedOccurrences]);

  if (!report.lessons.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#cfd9ca] bg-[#f7faf5] px-5 py-8 text-center" data-testid="recent-lesson-coverage">
        <Grid3X3 className="mx-auto h-5 w-5 text-[#7b8379]" aria-hidden="true" />
        <p className="mt-2 text-[14px] font-semibold text-[#384338]">完了済みレッスンの実施記録がありません</p>
        <p className="mt-1 text-[12px] leading-5 text-[#6c756a]">記録済み・未クローズのレッスンができると、直近8回をここで振り返れます。</p>
      </div>
    );
  }

  const maxCount = report.lessons.reduce(
    (highest, lesson) => report.categoryDefinitions.reduce(
      (rowHighest, definition) => Math.max(rowHighest, lesson.counts[definition.key]),
      highest,
    ),
    0,
  );
  const tableMinWidth = Math.max(760, 168 + report.lessons.length * 104);

  return (
    <div className="min-w-0 max-w-full space-y-3" data-testid="recent-lesson-coverage">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="直近レッスンのカバレッジ傾向">
        <CompactFact
          label="最近多め"
          definitions={recentSummary.mostUsed}
          suffix={(definition) => `${"occurrenceCount" in definition ? definition.occurrenceCount : 0}回`}
          emptyLabel="実施記録なし"
          note={`直近${recentSummary.lessonCount}回`}
        />
        <CompactFact
          label="直近5回は未登場"
          definitions={recentSummary.absent}
          emptyLabel={recentSummary.lessonCount ? "すべて登場" : "判定対象なし"}
          note={recentSummary.lessonCount < 5 ? `直近${recentSummary.lessonCount}回で判定` : undefined}
        />
        <CompactFact
          label="3回連続"
          definitions={recentSummary.consecutive}
          suffix={(definition) => `${"lessonCount" in definition ? definition.lessonCount : 0}回`}
          emptyLabel="該当なし"
          note="直近から3回以上"
        />
        <article className="rounded-lg border border-[#e5ded4] bg-white/82 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-[#657064]">未分類</p>
          <p className="mt-1 text-[19px] font-semibold tabular-nums text-[#343c34]">{recentSummary.unclassifiedCount}<span className="ml-1 text-[11px] font-medium text-[#737a70]">ブロック</span></p>
          <p className="mt-1 text-[10px] text-[#7a8178]">直近{report.lessons.length}レッスン内</p>
        </article>
      </div>

      <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-[#ddd8cf] bg-white/90">
        <div className="max-w-full overflow-x-auto overscroll-x-contain" data-testid="recent-coverage-heatmap-scroll">
          <table className="border-separate border-spacing-0 text-left text-[12px]" style={{ minWidth: `${tableMinWidth}px`, width: "100%" }}>
            <caption className="sr-only">直近8レッスンのカバレッジ実施ブロック回数</caption>
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 z-20 w-[168px] min-w-[168px] border-b border-r border-[#e4ded5] bg-[#f5f3ee] px-3 py-2 font-semibold text-[#596158]">カバレッジ</th>
                {report.lessons.map((lesson) => (
                  <th key={lesson.lessonRecordId} scope="col" className="min-w-[104px] border-b border-[#e4ded5] bg-[#f5f3ee] px-2 py-2 align-bottom">
                    <span className="block whitespace-nowrap text-[10px] font-medium text-[#757c73]">{formatShortDate(lesson.date)}</span>
                    <span className="mt-0.5 block max-w-[94px] truncate text-[11px] font-semibold text-[#454d45]" title={lesson.lessonName}>{shortLessonName(lesson.lessonName)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.categoryDefinitions.map((definition) => (
                <tr key={definition.key}>
                  <th scope="row" className="sticky left-0 z-10 border-b border-r border-[#ece6de] bg-[#fffefa] px-3 py-1.5 font-semibold text-[#434b43]">
                    <span className="flex items-center gap-2 whitespace-nowrap"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: definition.color }} aria-hidden="true" />{definition.label}</span>
                  </th>
                  {report.lessons.map((lesson) => {
                    const count = lesson.counts[definition.key];
                    const isSelected = selected?.lessonRecordId === lesson.lessonRecordId && selected.coverageKey === definition.key;
                    return (
                      <td key={`${definition.key}-${lesson.lessonRecordId}`} className="border-b border-[#ece6de] p-1 text-center">
                        <button
                          type="button"
                          onClick={() => setSelected({ lessonRecordId: lesson.lessonRecordId, coverageKey: definition.key })}
                          aria-pressed={isSelected}
                          aria-controls="recent-coverage-cell-detail"
                          aria-label={`${formatShortDate(lesson.date)} ${lesson.lessonName}、${definition.label}、${count}回`}
                          className={`flex min-h-8 w-full min-w-[72px] items-center justify-center rounded-md border text-[12px] font-semibold tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#527b5a] focus-visible:ring-offset-1 ${isSelected ? "border-[#385f43] ring-2 ring-[#557e5f] ring-offset-1" : "border-transparent hover:border-[#7f9b83]"}`}
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

      {selected && selectedLesson && selectedDefinition ? (
        <section id="recent-coverage-cell-detail" className="rounded-xl border border-[#e2dcd2] bg-[#fbfaf6] p-3" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[#747b72]">{formatJapaneseDate(selectedLesson.date)}</p>
              <h3 className="mt-0.5 text-[14px] font-semibold text-[#394239]">{selectedLesson.lessonName}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-[#586158]"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: selectedDefinition.color }} aria-hidden="true" />{selectedDefinition.label}・実施 {selectedOccurrences.length}回</p>
            </div>
            <Link href={`/lessons/${selectedLesson.scheduleId}/record`} className="inline-flex min-h-8 items-center gap-1 rounded-md border border-[#cfdacb] bg-white px-2.5 text-[11px] font-semibold text-[#456d4c] hover:bg-[#f2f7f0] hover:underline">実施後記録を開く<ArrowUpRight className="h-3 w-3" aria-hidden="true" /></Link>
          </div>
          {selectedBlocks.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedBlocks.map((block) => (
                <div key={block.key} className="inline-flex min-h-8 items-center gap-2 rounded-lg border border-[#e2ddd4] bg-white px-2.5 py-1.5 text-[11px] text-[#555d54]">
                  <span className="font-semibold">{block.blockName}</span>
                  <span className="tabular-nums text-[#737a70]">{block.count}回</span>
                  {block.blockTemplateId ? <Link href={`/blocks/${block.blockTemplateId}`} className="font-semibold text-[#477050] hover:underline">ブロック詳細</Link> : <span className="text-[#8a8f88]">即興項目</span>}
                </div>
              ))}
            </div>
          ) : <p className="mt-3 text-[12px] text-[#777e74]">このセルに該当する実施ブロックはありません。</p>}
        </section>
      ) : null}
    </div>
  );
}

function CompactFact({
  label,
  definitions,
  suffix,
  emptyLabel,
  note,
}: {
  label: string;
  definitions: Array<LessonCoverageDefinition | (LessonCoverageDefinition & { occurrenceCount: number }) | (LessonCoverageDefinition & { lessonCount: number })>;
  suffix?: (definition: LessonCoverageDefinition | (LessonCoverageDefinition & { occurrenceCount: number }) | (LessonCoverageDefinition & { lessonCount: number })) => string;
  emptyLabel: string;
  note?: string;
}) {
  return (
    <article className="rounded-lg border border-[#e5ded4] bg-white/82 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-[#657064]">{label}</p>
        {note ? <span className="text-[10px] text-[#858b83]">{note}</span> : null}
      </div>
      {definitions.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {definitions.map((definition) => (
            <span key={definition.key} className="inline-flex items-center gap-1 rounded-full border border-[#e2ddd5] bg-[#faf9f5] px-2 py-1 text-[10px] font-medium text-[#555d54]">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: definition.color }} aria-hidden="true" />
              {definition.label}{suffix ? ` ${suffix(definition)}` : ""}
            </span>
          ))}
        </div>
      ) : <p className="mt-2 text-[11px] text-[#777e74]">{emptyLabel}</p>}
    </article>
  );
}

function groupDetailBlocks(occurrences: LessonCoverageOccurrence[]) {
  const grouped = new Map<string, DetailBlock>();
  for (const occurrence of occurrences) {
    const key = occurrence.blockTemplateId
      ? `block:${occurrence.blockTemplateId}`
      : `name:${occurrence.blockName.normalize("NFKC").toLocaleLowerCase("ja-JP")}`;
    const current = grouped.get(key);
    grouped.set(key, {
      key,
      blockTemplateId: occurrence.blockTemplateId,
      blockName: occurrence.blockName,
      count: (current?.count ?? 0) + 1,
    });
  }
  return Array.from(grouped.values()).sort((left, right) => right.count - left.count || left.blockName.localeCompare(right.blockName, "ja"));
}

function heatmapBackground(color: string, count: number, maxCount: number) {
  if (!count || !maxCount) return "#f7f6f2";
  const alpha = 0.16 + 0.5 * Math.sqrt(count / maxCount);
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function shortLessonName(value: string) {
  return value.length > 14 ? `${value.slice(0, 13)}…` : value;
}

function formatShortDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [, month, day] = value.split("-").map(Number);
  return `${month}/${day}`;
}

function formatJapaneseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [year, month, day] = value.split("-").map(Number);
  return `${year}/${month}/${day}`;
}
