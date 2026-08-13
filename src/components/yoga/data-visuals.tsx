import Link from "next/link";
import { cn } from "@/lib/utils";

export type MetricSegment = {
  label: string;
  value: number;
  color: string;
  href?: string;
  description?: string;
};

export function SegmentedMetricBar({
  segments,
  totalLabel,
  emptyLabel = "対象データなし",
  unit = "件",
  className,
}: {
  segments: MetricSegment[];
  totalLabel?: string;
  emptyLabel?: string;
  unit?: string;
  className?: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (!total) return <CompactEmptyState label={emptyLabel} />;

  return (
    <figure className={cn("min-w-0", className)}>
      {totalLabel ? <p className="mb-3 text-[12px] font-semibold text-[#687068]">{totalLabel}</p> : null}
      <div
        className="flex h-3.5 w-full overflow-hidden rounded-full bg-[#eceae4]"
        role="img"
        aria-label={segments.map((segment) => `${segment.label} ${segment.value}${unit} ${metricPercent(segment.value, total)}%`).join("、")}
      >
        {segments.map((segment) => {
          const percent = (segment.value / total) * 100;
          return segment.value ? (
            <span
              key={segment.label}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ width: `${percent}%`, backgroundColor: segment.color }}
              title={segmentTitle(segment, total, unit)}
            />
          ) : null;
        })}
      </div>
      <figcaption className="mt-3 grid min-w-0 grid-cols-2 gap-x-3 gap-y-2">
        {segments.map((segment) => (
          <SegmentLegendItem key={segment.label} segment={segment} total={total} unit={unit} />
        ))}
      </figcaption>
    </figure>
  );
}

export function DonutMetric({
  segments,
  totalLabel,
  emptyLabel = "対象データなし",
  unit = "件",
}: {
  segments: MetricSegment[];
  totalLabel: string;
  emptyLabel?: string;
  unit?: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (!total) return <CompactEmptyState label={emptyLabel} />;

  const arcs = segments.map((segment, index) => ({
    segment,
    percent: (segment.value / total) * 100,
    offset: segments.slice(0, index).reduce((sum, previous) => sum + (previous.value / total) * 100, 0),
  }));
  return (
    <figure className="grid min-w-0 grid-cols-[116px_minmax(0,1fr)] items-center gap-4">
      <div className="relative h-[116px] w-[116px]" role="img" aria-label={`${totalLabel} ${total}${unit}`}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#eceae4" strokeWidth="14" />
          {arcs.map(({ segment, percent, offset }) => {
            return segment.value ? (
              <circle
                key={segment.label}
                cx="50"
                cy="50"
                r="38"
                fill="none"
                pathLength="100"
                stroke={segment.color}
                strokeWidth="14"
                strokeDasharray={`${percent} ${100 - percent}`}
                strokeDashoffset={-offset}
              />
            ) : null;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[24px] font-semibold tracking-[-0.03em] text-[#384338]">{total}</span>
          <span className="text-[11px] font-medium text-[#737a70]">{totalLabel}</span>
        </div>
      </div>
      <figcaption className="grid min-w-0 gap-2.5">
        {segments.map((segment) => (
          <SegmentLegendItem key={segment.label} segment={segment} total={total} unit={unit} />
        ))}
      </figcaption>
    </figure>
  );
}

export function CompactEmptyState({ label }: { label: string }) {
  return <p className="rounded-lg border border-dashed border-[#d7dcd3] bg-[#fafaf7] px-3 py-4 text-center text-[13px] font-medium text-[#777e74]">{label}</p>;
}

function SegmentLegendItem({ segment, total, unit }: { segment: MetricSegment; total: number; unit: string }) {
  const content = (
    <>
      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: segment.color }} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold leading-4 text-[#4a534a]">{segment.label}</span>
        <span className="block text-[11px] leading-4 text-[#747b72]">
          {segment.value}{unit}・{metricPercent(segment.value, total)}%
        </span>
      </span>
    </>
  );
  const title = segmentTitle(segment, total, unit);
  const className = "flex min-w-0 items-start gap-2 rounded-md py-0.5 text-left";

  return segment.href ? (
    <Link href={segment.href} className={cn(className, "hover:bg-[#f3f7f1] hover:underline")} title={title}>{content}</Link>
  ) : (
    <span className={className} title={title}>{content}</span>
  );
}

function segmentTitle(segment: MetricSegment, total: number, unit: string) {
  const base = `${segment.label}: ${segment.value}${unit}（${metricPercent(segment.value, total)}%）`;
  return segment.description ? `${base} — ${segment.description}` : base;
}

function metricPercent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}
