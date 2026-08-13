import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { AiTeachingReviewView } from "@/components/yoga/ai-teaching-review-view";
import {
  WorkspaceEmptyState,
  WorkspacePageHeader,
  WorkspaceSection,
  WorkspaceStatus,
  WorkspaceSummaryCard,
  WorkspaceTableContainer,
  WorkspaceToolbar,
} from "@/components/yoga/workspace-kit";
import {
  getReportData,
  normalizeReportPeriod,
  normalizeReportView,
  type AttendanceBreakdownRow,
  type BlockReportRow,
  type ComparisonValue,
  type PlanReportRow,
  type RankedTextRow,
  type RatioRow,
  type ReportData,
  type ReportPeriodKey,
  type ReportViewKey,
} from "@/lib/reports";
import { getTeachingReviewState, type TeachingReviewState } from "@/lib/ai-review/queries";
import type { ReviewScopeSelection } from "@/lib/ai-review/types";

type ReportSearchParams = {
  view?: string;
  period?: string;
  from?: string;
  to?: string;
  format?: string;
  plan?: string;
  place?: string;
  ai_mode?: string;
  ai_record?: string;
  ai_range?: string;
  ai_from?: string;
  ai_to?: string;
};

const reportViews: Array<{ key: ReportViewKey; label: string }> = [
  { key: "ai_review", label: "AI総合指導レビュー" },
  { key: "overview", label: "数値概要" },
  { key: "attendance", label: "出席" },
  { key: "students", label: "生徒" },
  { key: "plans", label: "プラン" },
  { key: "blocks", label: "ブロック" },
  { key: "execution", label: "予定と実際" },
  { key: "closures", label: "クローズ" },
];
const periods: Array<{ key: ReportPeriodKey; label: string }> = [
  { key: "week", label: "今週" },
  { key: "month", label: "今月" },
  { key: "3months", label: "3か月" },
  { key: "half", label: "半年" },
  { key: "year", label: "1年" },
  { key: "custom", label: "カスタム" },
];

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<ReportSearchParams> }) {
  const params = await searchParams;
  const view = normalizeReportView(params.view);
  const period = normalizeReportPeriod(params.period);
  const reviewSelection = parseReviewSelection(params);
  const [report, reviewState] = await Promise.all([
    getReportData({ period, from: params.from, to: params.to, format: params.format, plan: params.plan, place: params.place }),
    view === "ai_review" ? getTeachingReviewState(reviewSelection) : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1560px] space-y-5">
      <WorkspacePageHeader
        eyebrow="REPORT WORKSPACE"
        title="レポート"
        description="AI総合指導レビューを起点に、根拠となる記録へ戻りながら指導の強み・改善・次の行動を確認します。数値集計は別ビューで維持しています。"
      >
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="レポート表示">
          {reportViews.map((item) => (
            <Link
              key={item.key}
              href={buildReportHref(params, { view: item.key, period })}
              role="tab"
              aria-selected={view === item.key}
              className={view === item.key ? "inline-flex h-9 items-center rounded-lg bg-[#e6f0e3] px-3 text-[13px] font-semibold text-[#386b46]" : "inline-flex h-9 items-center rounded-lg px-3 text-[13px] font-semibold text-[#626a60] hover:bg-[#f4f1eb]"}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </WorkspacePageHeader>

      {view !== "ai_review" ? <WorkspaceToolbar>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div>
            <p className="mb-2 text-[12px] font-semibold text-[#656c63]">期間</p>
            <div className="flex flex-wrap gap-2">
              {periods.map((item) => (
                <Link key={item.key} href={buildReportHref(params, { period: item.key, view })} className={period === item.key ? "inline-flex h-9 items-center rounded-lg bg-[#5d8f68] px-3 text-[13px] font-semibold text-white" : "inline-flex h-9 items-center rounded-lg border border-[#ddd6cc] bg-white px-3 text-[13px] font-semibold text-[#626a60] hover:bg-[#f7f4ef]"}>{item.label}</Link>
              ))}
            </div>
          </div>
          <div className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#ddd6cc] bg-white px-3 text-[13px] font-medium text-[#4c534b]"><CalendarDays className="h-4 w-4 text-[#5d8f68]" />{formatDate(report.period.startDate)} – {formatDate(report.period.endDate)}</div>
        </div>

        {period === "custom" ? (
          <form action="/reports" className="mt-4 grid gap-3 border-t border-[#ece5db] pt-4 sm:grid-cols-[minmax(150px,220px)_minmax(150px,220px)_auto] sm:items-end">
            <input type="hidden" name="view" value={view} /><input type="hidden" name="period" value="custom" /><input type="hidden" name="format" value={params.format ?? "all"} /><input type="hidden" name="plan" value={params.plan ?? "all"} /><input type="hidden" name="place" value={params.place ?? "all"} />
            <DateField label="開始日" name="from" value={params.from} /><DateField label="終了日" name="to" value={params.to} />
            <button className="h-10 rounded-lg bg-[#5d8f68] px-4 text-[13px] font-semibold text-white">この期間で集計</button>
          </form>
        ) : null}

        <form action="/reports" className="mt-4 grid gap-3 border-t border-[#ece5db] pt-4 md:grid-cols-3 xl:grid-cols-[repeat(3,minmax(160px,1fr))_auto_auto] xl:items-end">
          <input type="hidden" name="view" value={view} /><input type="hidden" name="period" value={period} />
          {period === "custom" ? <><input type="hidden" name="from" value={params.from ?? ""} /><input type="hidden" name="to" value={params.to ?? ""} /></> : null}
          <SelectField label="形式" name="format" value={report.filters.format} options={[["all", "すべて"], ["group", "グループ"], ["personal", "パーソナル"], ["online", "オンライン"]]} />
          <SelectField label="レッスンプラン" name="plan" value={report.filters.plan} options={[["all", "すべて"], ...report.filters.plans.map((plan) => [plan.id, plan.name] as const)]} />
          <SelectField label="場所" name="place" value={report.filters.place} options={[["all", "すべて"], ...report.filters.places.map((place) => [place, place] as const)]} />
          <button className="h-10 rounded-lg bg-[#5d8f68] px-4 text-[13px] font-semibold text-white">フィルター適用</button>
          <Link href={buildReportHref({}, { view, period, from: period === "custom" ? params.from : undefined, to: period === "custom" ? params.to : undefined })} className="inline-flex h-10 items-center justify-center rounded-lg border border-[#ddd6cc] bg-white px-4 text-[13px] font-semibold text-[#626a60]">クリア</Link>
        </form>
      </WorkspaceToolbar> : null}

      {view !== "ai_review" && report.error ? <div className="rounded-xl border border-[#f0d0ca] bg-[#fff1ed] px-4 py-3 text-[13px] font-medium leading-6 text-[#a65348]">{report.error}</div> : null}

      {view !== "ai_review" && !report.error && !report.hasAnyData ? <WorkspaceEmptyState title="この条件で集計できるデータがありません" description="期間または共通フィルターを変更してください。全登録生徒の属性は生徒タブから確認できます。" /> : null}
      {view === "ai_review" || !report.error ? <ReportView view={view} report={report} reviewState={reviewState} /> : null}
      {view !== "ai_review" && !report.error ? <DataQuality report={report} /> : null}
    </div>
  );
}

function ReportView({ view, report, reviewState }: { view: ReportViewKey; report: ReportData; reviewState: TeachingReviewState | null }) {
  if (view === "ai_review" && reviewState) return <AiTeachingReviewView state={reviewState} />;
  if (view === "attendance") return <AttendanceView report={report} />;
  if (view === "students") return <StudentsView report={report} />;
  if (view === "plans") return <PlansView report={report} />;
  if (view === "blocks") return <BlocksView report={report} />;
  if (view === "execution") return <ExecutionView report={report} />;
  if (view === "closures") return <ClosuresView report={report} />;
  return <OverviewView report={report} />;
}

function OverviewView({ report }: { report: ReportData }) {
  const summary = report.summary;
  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        <WorkspaceSummaryCard label="総レッスン数" value={`${summary.totalLessons}件`} detail={`記録済み ${summary.recordedLessons}件・${comparisonText(summary.comparisons.totalLessons)}`} href="/lessons" />
        <WorkspaceSummaryCard label="実施後記録率" value={`${summary.recordRate}%`} detail={comparisonText(summary.comparisons.recordRate, true)} tone="green" href="/lessons?tab=records" />
        <WorkspaceSummaryCard label="延べ参加人数" value={`${summary.totalParticipants}名`} detail={comparisonText(summary.comparisons.totalParticipants)} tone="purple" />
        <WorkspaceSummaryCard label="ユニーク参加者" value={`${summary.uniqueStudents}名`} detail={comparisonText(summary.comparisons.uniqueStudents)} />
        <WorkspaceSummaryCard label="キャンセル率" value={`${summary.cancelRate}%`} detail={`${summary.cancelCount}件・${comparisonText(summary.comparisons.cancelRate, true)}`} tone="coral" />
        <WorkspaceSummaryCard label="予定変更率" value={summary.changeRate == null ? "データ不足" : `${summary.changeRate}%`} detail={`${summary.addedCount}件の追加・${comparisonText(summary.comparisons.changeRate, true)}`} tone="sand" href="/lessons?tab=records&diff=1" />
      </section>

      <WorkspaceSection title="今期間の気づき" description="AIを使わず、集計ルールに基づいて抽出しています。">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{report.hints.map((hint, index) => <div key={hint} className="flex gap-3 rounded-xl border border-[#e6ded3] bg-white/82 p-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f1e5] text-[12px] font-semibold text-[#4f8058]">{index + 1}</span><p className="text-[13px] leading-6 text-[#4e554d]">{hint}</p></div>)}</div>
      </WorkspaceSection>

      <div className="grid gap-4 xl:grid-cols-2">
        <WorkspaceSection title="出席の内訳"><AttendanceTotals report={report} /></WorkspaceSection>
        <WorkspaceSection title="予定と実際の要点"><ExecutionTotals report={report} compact /></WorkspaceSection>
      </div>
    </div>
  );
}

function AttendanceView({ report }: { report: ReportData }) {
  return (
    <div className="space-y-5">
      <AttendanceTotals report={report} />
      <WorkspaceSection title={`${report.attendance.trendGranularity === "day" ? "日別" : "週別"}の参加推移`} description="棒の長さに加えて、下の表でも件数を確認できます。">
        <SimpleBarChart rows={report.attendance.trend} />
        <BreakdownTable rows={report.attendance.trend} firstHeader={report.attendance.trendGranularity === "day" ? "日付" : "週"} />
      </WorkspaceSection>
      <div className="grid gap-5 xl:grid-cols-2"><WorkspaceSection title="形式別の参加状況"><BreakdownTable rows={report.attendance.byFormat} firstHeader="形式" /></WorkspaceSection><WorkspaceSection title="場所別の参加状況"><BreakdownTable rows={report.attendance.byPlace} firstHeader="場所" /></WorkspaceSection></div>
    </div>
  );
}

function StudentsView({ report }: { report: ReportData }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <AttributePanel title="全登録生徒の属性" description="期間に関係なく、アクティブな登録生徒を母集団にします。" total={report.students.all.total} genderRows={report.students.all.genderRows} ageRows={report.students.all.ageRows} />
      <AttributePanel title="選択期間内に参加した生徒の属性" description="期間内に attendance_status = present の記録があるユニーク生徒です。" total={report.students.participants.total} genderRows={report.students.participants.genderRows} ageRows={report.students.participants.ageRows} extra={`新規参加者相当 ${report.students.participants.newEquivalentCount}名（期間内登録かつ参加）`} />
    </div>
  );
}

function PlansView({ report }: { report: ReportData }) {
  return (
    <WorkspaceSection title="プラン別の実績" description="時間は算出できたレッスンだけを母数にし、件数を併記します。">
      {report.plans.length ? <WorkspaceTableContainer><table className="w-full min-w-[1180px] border-collapse text-left text-[13px]"><thead className="bg-[#f5f3ee] text-[12px] font-semibold text-[#666d63]"><tr><TableHead>プラン</TableHead><TableHead>実施回数</TableHead><TableHead>延べ参加</TableHead><TableHead>平均参加</TableHead><TableHead>キャンセル率</TableHead><TableHead>平均予定時間</TableHead><TableHead>平均実施時間</TableHead><TableHead>予定変更率</TableHead><TableHead>よく追加</TableHead><TableHead>最終実施日</TableHead></tr></thead><tbody className="divide-y divide-[#ece5db]">{report.plans.map((plan) => <PlanRow key={`${plan.id}-${plan.name}`} plan={plan} />)}</tbody></table></WorkspaceTableContainer> : <WorkspaceEmptyState title="プラン別データがありません" description="この期間・フィルター条件で対象となるレッスンがありません。" />}
    </WorkspaceSection>
  );
}

function BlocksView({ report }: { report: ReportData }) {
  const lists: Array<{ title: string; rows: BlockReportRow[]; metric: (row: BlockReportRow) => string }> = [
    { title: "よく使うブロック", rows: report.blocks.mostUsed, metric: (row) => `${row.usedCount}回` },
    { title: "反応が良いブロック", rows: report.blocks.goodReaction, metric: (row) => `${row.goodRate}%（評価${row.evaluatedCount}件）` },
    { title: "よくスキップされる", rows: report.blocks.mostSkipped, metric: (row) => `${row.skippedCount}回` },
    { title: "よく時間調整される", rows: report.blocks.mostAdjusted, metric: (row) => `${row.adjustedCount}回` },
    { title: "置き換えられやすい", rows: report.blocks.mostReplaced, metric: (row) => `${row.replacedCount}回` },
    { title: "改善メモが多い", rows: report.blocks.improvementHeavy, metric: (row) => `${row.improvementCount}件` },
    { title: "最近使っていない", rows: report.blocks.unused, metric: () => "期間内未使用" },
  ];
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{lists.map((list) => <BlockRanking key={list.title} {...list} />)}</div>;
}

function ExecutionView({ report }: { report: ReportData }) {
  const execution = report.execution;
  return (
    <div className="space-y-5">
      <ExecutionTotals report={report} />
      <div className="grid gap-4 xl:grid-cols-2"><RankedList title="変更理由" rows={execution.reasons} /><RankedList title="よく変更されるプラン" rows={execution.changedPlans} linkType="plan" /></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><RankedList title="よくスキップされる予定項目" rows={execution.skippedItems} /><RankedList title="現場で追加されたライブラリブロック" rows={execution.libraryAdditions} linkType="block" /><RankedList title="即興追加された内容" rows={execution.improvisedItems} /><RankedList title="テンプレート化された即興項目" rows={execution.templatedImprovisedItems} linkType="block" /></div>
    </div>
  );
}

function ClosuresView({ report }: { report: ReportData }) {
  const closures = report.closures;
  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <WorkspaceSummaryCard label="開催件数" value={`${closures.heldCount}件`} detail={comparisonText(closures.comparisons.heldCount)} tone="green" />
        <WorkspaceSummaryCard label="クローズ件数" value={`${closures.closedCount}件`} detail={comparisonText(closures.comparisons.closedCount)} tone="coral" />
        <WorkspaceSummaryCard label="クローズ率" value={closures.closeRate == null ? "データ不足" : `${closures.closeRate}%`} detail={comparisonText(closures.comparisons.closeRate, true)} tone="sand" />
        <WorkspaceSummaryCard label="未分類の過去予定" value={`${closures.unclassifiedPastCount}件`} detail={comparisonText(closures.comparisons.unclassifiedPastCount)} tone="purple" href="/lessons?status=record_pending" />
        <WorkspaceSummaryCard label="未来のクローズ" value={`${closures.futureClosedCount}件`} detail="正式な率の分母・分子には含めません" />
      </section>
      <p className="rounded-lg border border-[#e5ded4] bg-[#faf8f3] px-3 py-2 text-[12px] leading-5 text-[#6d746a]">
        正式なクローズ率 = クローズ件数 ÷（開催件数 + クローズ件数）。未来予定と、実施済みでもクローズ済みでもない過去予定は分母に含めません。クローズ済み予定の参加者statusは保持し、通常の出席集計から予定全体を除外します。
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <RankedList title="理由別" rows={closures.byReason} />
        <RankedList title="曜日別" rows={closures.byWeekday} />
        <RankedList title="時間帯別" rows={closures.byTimeBand} />
        <RankedList title="場所別" rows={closures.byPlace} />
        <RankedList title="レッスンプラン別" rows={closures.byPlan} linkType="plan" />
        <RankedList title="形式別" rows={closures.byFormat} />
      </div>

      <WorkspaceSection title="元の予定" description="クローズ理由から予定詳細へドリルダウンできます。">
        {closures.items.length ? (
          <WorkspaceTableContainer>
            <table className="w-full min-w-[860px] border-collapse text-left text-[13px]">
              <thead className="bg-[#f5f3ee] text-[12px] font-semibold text-[#666d63]"><tr><TableHead>予定日</TableHead><TableHead>レッスン</TableHead><TableHead>理由</TableHead><TableHead>場所／形式</TableHead><TableHead>プラン</TableHead><TableHead>対象区分</TableHead></tr></thead>
              <tbody className="divide-y divide-[#ece5db]">
                {closures.items.map((item) => (
                  <tr key={item.scheduleId}>
                    <TableCell className="whitespace-nowrap">{formatDateFromIso(item.startsAt)}</TableCell>
                    <TableCell><Link href={`/schedules/${item.scheduleId}`} className="font-semibold text-[#3f7048] hover:underline">{item.lessonName}</Link></TableCell>
                    <TableCell>{item.reason}</TableCell>
                    <TableCell>{item.place}／{item.format}</TableCell>
                    <TableCell>{item.planId ? <Link href={`/lessons/${item.planId}`} className="font-medium text-[#3f7048] hover:underline">{item.planName}</Link> : item.planName}</TableCell>
                    <TableCell><WorkspaceStatus tone={item.isFuture ? "purple" : "coral"}>{item.isFuture ? "未来（率から除外）" : "集計対象"}</WorkspaceStatus></TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </WorkspaceTableContainer>
        ) : <WorkspaceEmptyState title="クローズ記録はありません" description="この期間・フィルター条件に該当する有効なクローズ記録はありません。" />}
      </WorkspaceSection>
    </div>
  );
}

function AttendanceTotals({ report }: { report: ReportData }) {
  return <div className="space-y-2"><section className="grid grid-cols-2 gap-3 lg:grid-cols-5"><WorkspaceSummaryCard label="参加" value={`${report.attendance.present}件`} /><WorkspaceSummaryCard label="キャンセル" value={`${report.attendance.cancelled}件`} tone="coral" /><WorkspaceSummaryCard label="無断欠席" value={`${report.attendance.noShow}件`} tone="purple" /><WorkspaceSummaryCard label="キャンセル率" value={`${report.attendance.cancelRate}%`} tone="coral" /><WorkspaceSummaryCard label="無断欠席率" value={`${report.attendance.noShowRate}%`} tone="purple" /></section><p className="text-[12px] leading-5 text-[#737a70]">率の分母：期間内の出欠エントリ。実施後記録がある予定は記録側を優先し、二重計上しません。</p></div>;
}

function ExecutionTotals({ report, compact = false }: { report: ReportData; compact?: boolean }) {
  const execution = report.execution;
  const cards = [
    ["予定項目数", `${execution.plannedItems}件`, "green"], ["予定どおり", `${execution.asPlanned}件`, "green"], ["調整", `${execution.adjusted}件`, "purple"], ["スキップ", `${execution.skipped}件`, "coral"], ["置き換え", `${execution.replaced}件`, "sand"], ["ライブラリ追加", `${execution.libraryAdded}件`, "purple"], ["即興追加", `${execution.improvisedAdded}件`, "sand"], ["旧形式／未分類", `${execution.legacyUnclassified}件`, "coral"], ["予定合計時間", `${execution.plannedMinutes}分`, "green"], ["実施合計時間", `${execution.actualMinutes}分`, "purple"], ["平均時間差", execution.averageMinuteDifference == null ? "データ不足" : `${execution.averageMinuteDifference > 0 ? "+" : ""}${execution.averageMinuteDifference}分`, "sand"],
  ] as const;
  return <section className={`grid grid-cols-2 gap-3 ${compact ? "lg:grid-cols-3" : "lg:grid-cols-4 2xl:grid-cols-6"}`}>{cards.slice(0, compact ? 6 : cards.length).map(([label, value, tone]) => <WorkspaceSummaryCard key={label} label={label} value={value} detail={label === "平均時間差" ? `算出 ${execution.minuteDifferenceSamples}件` : undefined} tone={tone} />)}</section>;
}

function AttributePanel({ title, description, total, genderRows, ageRows, extra }: { title: string; description: string; total: number; genderRows: RatioRow[]; ageRows: RatioRow[]; extra?: string }) {
  return <section className="rounded-xl border border-[#e6ded3] bg-white/82 p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="text-[17px] font-semibold">{title}</h2><p className="mt-1 text-[13px] leading-5 text-[#70776e]">{description}</p></div><WorkspaceStatus tone="green">{total}名</WorkspaceStatus></div>{extra ? <p className="mt-3 rounded-lg bg-[#f7f5f0] px-3 py-2 text-[13px] text-[#5f675d]">{extra}</p> : null}<div className="mt-4 grid gap-5 md:grid-cols-2"><RatioTable title="性別" rows={genderRows} /><RatioTable title="年代" rows={ageRows} /></div></section>;
}

function RatioTable({ title, rows }: { title: string; rows: RatioRow[] }) {
  return <div><h3 className="text-[13px] font-semibold">{title}</h3>{rows.length ? <table className="mt-2 w-full text-[13px]"><thead><tr className="text-left text-[12px] text-[#747b71]"><th className="pb-2 font-medium">属性</th><th className="pb-2 text-right font-medium">人数</th><th className="pb-2 text-right font-medium">比率</th></tr></thead><tbody className="divide-y divide-[#ece5db]">{rows.map((row) => <tr key={row.label}><td className="py-2">{row.label}</td><td className="py-2 text-right">{row.count}名</td><td className="py-2 text-right">{row.percent}%</td></tr>)}</tbody></table> : <p className="mt-3 text-[13px] text-[#777e74]">データなし</p>}</div>;
}

function PlanRow({ plan }: { plan: PlanReportRow }) {
  return <tr className="hover:bg-[#fafcf8]"><TableCell>{plan.id ? <Link href={`/lessons/${plan.id}`} className="font-semibold text-[#3f7048] hover:underline">{plan.name}</Link> : <span className="font-semibold">{plan.name}</span>}</TableCell><TableCell>{plan.lessonCount}回</TableCell><TableCell>{plan.participants}名</TableCell><TableCell>{plan.averageParticipants}名</TableCell><TableCell>{plan.cancelRate}%</TableCell><TableCell>{formatSampledMinutes(plan.averagePlannedMinutes, plan.plannedMinutesSample)}</TableCell><TableCell>{formatSampledMinutes(plan.averageActualMinutes, plan.actualMinutesSample)}</TableCell><TableCell>{plan.changeRate == null ? "データ不足" : `${plan.changeRate}%`}</TableCell><TableCell>{plan.frequentAddedBlock}</TableCell><TableCell className="whitespace-nowrap">{plan.latestDate ? formatDateFromIso(plan.latestDate) : "未実施"}</TableCell></tr>;
}

function BlockRanking({ title, rows, metric }: { title: string; rows: BlockReportRow[]; metric: (row: BlockReportRow) => string }) {
  return <section className="rounded-xl border border-[#e6ded3] bg-white/82 p-4"><h2 className="text-[16px] font-semibold">{title}</h2>{rows.length ? <ol className="mt-3 divide-y divide-[#ece5db]">{rows.map((row, index) => <li key={row.id} className="flex items-center gap-3 py-2.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f1e5] text-[12px] font-semibold text-[#4f8058]">{index + 1}</span><div className="min-w-0 flex-1"><Link href={`/blocks/${row.id}`} className="block truncate text-[13px] font-semibold hover:text-[#4f8058] hover:underline">{row.name}</Link><p className="truncate text-[11px] text-[#777e74]">{row.category}</p></div><span className="shrink-0 text-[12px] text-[#5f675d]">{metric(row)}</span></li>)}</ol> : <p className="mt-4 text-[13px] text-[#777e74]">対象データなし</p>}</section>;
}

function RankedList({ title, rows, linkType }: { title: string; rows: RankedTextRow[]; linkType?: "plan" | "block" }) {
  return <section className="rounded-xl border border-[#e6ded3] bg-white/82 p-4"><h2 className="text-[16px] font-semibold">{title}</h2>{rows.length ? <ol className="mt-3 divide-y divide-[#ece5db]">{rows.slice(0, 10).map((row, index) => <li key={`${title}-${row.label}`} className="flex items-center gap-3 py-2.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0edf8] text-[12px] font-semibold text-[#7568a7]">{index + 1}</span><div className="min-w-0 flex-1">{row.id && linkType ? <Link href={linkType === "plan" ? `/lessons/${row.id}` : `/blocks/${row.id}`} className="block truncate text-[13px] font-semibold hover:text-[#4f8058] hover:underline">{row.label}</Link> : <p className="truncate text-[13px] font-semibold">{row.label}</p>}{row.detail ? <p className="text-[11px] text-[#777e74]">{row.detail}</p> : null}</div><span className="text-[13px] font-semibold text-[#5f675d]">{row.count}件</span></li>)}</ol> : <p className="mt-4 text-[13px] text-[#777e74]">対象データなし</p>}</section>;
}

function SimpleBarChart({ rows }: { rows: AttendanceBreakdownRow[] }) {
  if (!rows.length) return <WorkspaceEmptyState title="推移データがありません" description="期間内の参加・キャンセル記録がありません。" />;
  const max = Math.max(...rows.map((row) => row.total), 1);
  return <div className="rounded-xl border border-[#e6ded3] bg-white/82 p-4"><div className="flex h-[180px] items-end gap-2 overflow-x-auto pb-1">{rows.map((row) => <div key={row.label} className="flex min-w-[42px] flex-1 flex-col items-center justify-end gap-2"><span className="text-[11px] font-semibold text-[#4f8058]">{row.present}</span><div className="flex h-[130px] w-full max-w-[52px] items-end overflow-hidden rounded-t bg-[#f0eee8]"><div className="w-full bg-[#83a985]" style={{ height: `${Math.max(3, (row.present / max) * 100)}%` }} title={`${row.label}: 参加${row.present}件`} /></div><span className="whitespace-nowrap text-[11px] text-[#737a70]">{row.label}</span></div>)}</div></div>;
}

function BreakdownTable({ rows, firstHeader }: { rows: AttendanceBreakdownRow[]; firstHeader: string }) {
  return rows.length ? <WorkspaceTableContainer><table className="w-full min-w-[520px] border-collapse text-left text-[13px]"><thead className="bg-[#f5f3ee] text-[12px] font-semibold text-[#666d63]"><tr><TableHead>{firstHeader}</TableHead><TableHead>参加</TableHead><TableHead>キャンセル</TableHead><TableHead>無断欠席</TableHead><TableHead>合計</TableHead></tr></thead><tbody className="divide-y divide-[#ece5db]">{rows.map((row) => <tr key={row.label}><TableCell>{row.label}</TableCell><TableCell>{row.present}件</TableCell><TableCell>{row.cancelled}件</TableCell><TableCell>{row.noShow}件</TableCell><TableCell>{row.total}件</TableCell></tr>)}</tbody></table></WorkspaceTableContainer> : <WorkspaceEmptyState title="内訳データがありません" description="期間内に対象となる出欠記録がありません。" />;
}

function DataQuality({ report }: { report: ReportData }) {
  const quality = report.dataQuality;
  return <WorkspaceSection title="データの状態" description="エラーではなく、今回の分析結果を読むときの信頼度の目安です。"><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"><QualityItem label="期間内レッスン" value={`${quality.lessons}件`} /><QualityItem label="実施後記録済み" value={`${quality.recordedLessons}件`} /><QualityItem label="記録率" value={`${quality.recordRate}%`} /><QualityItem label="未評価ブロック" value={`${quality.unevaluatedBlocks}件`} /><QualityItem label="差分未分類の旧項目" value={`${quality.legacyUnclassifiedItems}件`} /><QualityItem label="実際時間が未入力" value={`${quality.missingActualMinutes}件`} /></div></WorkspaceSection>;
}

function QualityItem({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-[#e6ded3] bg-[#faf8f3] p-3"><p className="text-[12px] text-[#737a70]">{label}</p><p className="mt-1 text-[18px] font-semibold text-[#465047]">{value}</p></div>; }
function DateField({ label, name, value }: { label: string; name: string; value?: string }) { return <label><span className="mb-1.5 block text-[12px] font-semibold text-[#656c63]">{label}</span><input type="date" name={name} defaultValue={value ?? ""} required className="h-10 w-full rounded-lg border border-[#dcd6cc] bg-white px-3 text-[13px]" /></label>; }
function SelectField({ label, name, value, options }: { label: string; name: string; value: string; options: ReadonlyArray<readonly [string, string]> }) { return <label><span className="mb-1.5 block text-[12px] font-semibold text-[#656c63]">{label}</span><select name={name} defaultValue={value} className="h-10 w-full rounded-lg border border-[#dcd6cc] bg-white px-3 text-[13px]">{options.map(([optionValue, optionLabel]) => <option key={`${name}-${optionValue}`} value={optionValue}>{optionLabel}</option>)}</select></label>; }
function TableHead({ children }: { children: React.ReactNode }) { return <th scope="col" className="whitespace-nowrap px-3 py-3">{children}</th>; }
function TableCell({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <td className={`px-3 py-3 align-middle text-[#3e453d] ${className}`}>{children}</td>; }

function buildReportHref(current: ReportSearchParams, patch: Partial<ReportSearchParams> & { view?: ReportViewKey; period?: ReportPeriodKey }) {
  const query = new URLSearchParams();
  const values = { ...current, ...patch };
  const view = normalizeReportView(values.view);
  const period = normalizeReportPeriod(values.period);
  query.set("view", view);
  query.set("period", period);
  if (period === "custom") { if (values.from) query.set("from", values.from); if (values.to) query.set("to", values.to); }
  if (values.format && values.format !== "all") query.set("format", values.format);
  if (values.plan && values.plan !== "all") query.set("plan", values.plan);
  if (values.place && values.place !== "all") query.set("place", values.place);
  if (values.ai_mode === "lesson" || values.ai_mode === "period") query.set("ai_mode", values.ai_mode);
  if (values.ai_record) query.set("ai_record", values.ai_record);
  if (["recent3", "recent5", "month", "custom"].includes(values.ai_range ?? "")) query.set("ai_range", values.ai_range!);
  if (values.ai_from) query.set("ai_from", values.ai_from);
  if (values.ai_to) query.set("ai_to", values.ai_to);
  return `/reports?${query.toString()}`;
}

function parseReviewSelection(params: ReportSearchParams): ReviewScopeSelection {
  if (params.ai_mode !== "period") return { mode: "lesson", recordId: params.ai_record };
  if (params.ai_range === "recent5") return { mode: "period", range: "recent5" };
  if (params.ai_range === "month") return { mode: "period", range: "month" };
  if (params.ai_range === "custom") return { mode: "period", range: "custom", from: params.ai_from, to: params.ai_to };
  return { mode: "period", range: "recent3" };
}

function comparisonText(value: ComparisonValue, points = false) { if (value.previous == null || value.delta == null) return "比較データなし"; const sign = value.delta > 0 ? "+" : ""; return `前期間比 ${sign}${value.delta}${points ? "pt" : ""}`; }
function formatSampledMinutes(value: number | null, sample: number) { return value == null ? "データ不足" : `${value}分（${sample}件）`; }
function formatDate(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || "未指定"; return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "numeric", day: "numeric", timeZone: "Asia/Tokyo" }).format(new Date(`${value}T00:00:00+09:00`)); }
function formatDateFromIso(value: string) { return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "numeric", day: "numeric", timeZone: "Asia/Tokyo" }).format(new Date(value)); }
