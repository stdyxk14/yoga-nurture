import Link from "next/link";
import { BarChart3, CalendarDays, ClipboardList, PieChart, Repeat2, UsersRound } from "lucide-react";
import { CircleBadge, MetricCard, MiniBar, PageHeader, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { getReportData, normalizeReportPeriod, type BlockReportRow, type ClassReportRow, type PlanReportRow, type RatioRow, type ReportPeriodKey } from "@/lib/reports";

export const dynamic = "force-dynamic";

const periodTabs: Array<{ key: ReportPeriodKey; label: string }> = [
  { key: "week", label: "今週" },
  { key: "month", label: "今月" },
  { key: "3months", label: "3か月" },
  { key: "half", label: "半年" },
  { key: "year", label: "1年" },
  { key: "custom", label: "カスタム" },
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const activePeriod = normalizeReportPeriod(params.period);
  const report = await getReportData(activePeriod);

  return (
    <div className="mx-auto w-full max-w-full space-y-4 overflow-x-hidden">
      <div className="hidden md:block">
        <PageHeader title="レポート" subtitle="生徒属性・出席状況・レッスンプラン・ブロック実績を実データで振り返る" />
      </div>

      <section className="rounded-[24px] border border-[#eee4d8] bg-white/84 p-4 shadow-[0_12px_26px_rgba(122,104,80,0.08)] md:hidden">
        <h1 className="text-[22px] font-extrabold tracking-normal">レポート</h1>
        <p className="mt-1 text-[12px] font-semibold leading-5 text-[#6d7469]">実データから、出席・属性・ブロックの傾向を確認します。</p>
      </section>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:p-1">
          {periodTabs.map((period) => (
            <Link
              key={period.key}
              href={`/reports?period=${period.key}`}
              className={`inline-flex h-9 shrink-0 items-center justify-center rounded-full px-4 text-[12px] font-bold md:rounded-lg ${
                period.key === report.period.key ? "bg-[#6e9870] text-white" : "border border-[#e6ded3] bg-white/78 text-[#5b5d57]"
              }`}
            >
              {period.label}
            </Link>
          ))}
        </div>
        <div className="flex h-10 w-fit items-center gap-2 rounded-xl border border-[#e2d7ca] bg-white/75 px-4 text-[12px] font-semibold md:text-[13px]">
          <CalendarDays className="h-4 w-4" />
          {formatDate(report.period.startDate)} - {formatDate(report.period.endDate)}
        </div>
      </div>

      {report.error ? (
        <SoftCard className="border-[#f2c7be] bg-[#fff0ea] p-4 text-[13px] font-bold leading-6 text-[#c4523d]">
          {report.error}
        </SoftCard>
      ) : null}

      {!report.hasAnyData ? (
        <EmptyReport />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricCard icon={CalendarDays} label="総レッスン数" value={String(report.summary.totalLessons)} unit="件" detail={`記録済み ${report.summary.recordedLessons}件`} />
            <MetricCard icon={UsersRound} label="延べ参加人数" value={String(report.summary.totalParticipants)} unit="名" detail={`ユニーク ${report.summary.uniqueStudents}名`} />
            <MetricCard icon={Repeat2} label="キャンセル率" value={String(report.summary.cancelRate)} unit="%" tone="purple" detail={`キャンセル ${report.summary.cancelCount}件 / 無断欠席 ${report.summary.noShowCount}件`} />
            <MetricCard icon={ClipboardList} label="予定参加枠" value={String(report.summary.plannedParticipants)} unit="件" tone="beige" detail="予定・記録から集計" />
          </section>

          <section className="grid gap-3 xl:grid-cols-[280px_minmax(0,1fr)]">
            <SoftCard className="p-4">
              <SectionTitle icon={PieChart} title="生徒属性サマリー" />
              <AttributeBars title="男女比率" rows={report.attributes.genderRows} />
              <div className="mt-4">
                <AttributeBars title="年代比率" rows={report.attributes.ageRows} tone="purple" />
              </div>
            </SoftCard>

            <div className="grid gap-3 lg:grid-cols-2">
              <SoftCard className="p-4">
                <SectionTitle title="クラス種別ごとの属性分析" />
                <ClassRows rows={report.classRows} />
              </SoftCard>
              <SoftCard className="p-4">
                <SectionTitle title="出席・キャンセル分析" />
                <AttendanceSummary
                  present={report.attendance.present}
                  cancelled={report.attendance.cancelled}
                  noShow={report.attendance.noShow}
                  cancelRate={report.attendance.cancelRate}
                  noShowRate={report.attendance.noShowRate}
                />
              </SoftCard>
            </div>
          </section>

          <SoftCard className="p-4">
            <SectionTitle icon={ClipboardList} title="レッスンプラン別の分析" />
            <PlanRows rows={report.planRows} />
          </SoftCard>

          <SoftCard className="p-4">
            <SectionTitle icon={BarChart3} title="ブロック分析" subtitle="実施後記録から使用回数・反応・改善メモを集計" />
            <div className="grid gap-3 xl:grid-cols-4">
              <BlockRanking title="よく使うブロック" rows={report.blockAnalysis.mostUsed} emptyText="まだ使用実績がありません。" />
              <BlockRanking title="反応が良いブロック" rows={report.blockAnalysis.goodReaction} emptyText="まだ反応評価がありません。" />
              <BlockRanking title="最近使っていないブロック" rows={report.blockAnalysis.unused} emptyText="未使用ブロックはありません。" />
              <BlockRanking title="改善メモが多いブロック" rows={report.blockAnalysis.improvementHeavy} emptyText="改善メモはまだありません。" />
            </div>
          </SoftCard>

          <SoftCard className="p-4">
            <SectionTitle title="自動集計ヒント" />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {report.hints.map((hint, index) => (
                <div key={hint} className="flex gap-3 rounded-2xl border border-[#eee4d8] bg-[#fbfaf3] p-3">
                  <CircleBadge className="h-7 w-7 shrink-0 text-[12px]">{index + 1}</CircleBadge>
                  <p className="min-w-0 text-[13px] font-bold leading-6">{hint}</p>
                </div>
              ))}
            </div>
          </SoftCard>
        </>
      )}
    </div>
  );
}

function EmptyReport() {
  return (
    <SoftCard className="p-8 text-center">
      <p className="text-[17px] font-extrabold">まだ集計できるデータがありません。</p>
      <p className="mx-auto mt-2 max-w-[620px] text-[13px] font-semibold leading-6 text-[#6b7468]">
        生徒・予定・実施後記録が蓄積されると、ここにレポートが表示されます。まずは生徒登録、ブロック登録、レッスンプラン作成、予定登録、実施後記録の保存を進めてください。
      </p>
      <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
        <Link href="/students/new" className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58]">
          生徒を登録
        </Link>
        <Link href="/lessons/new" className="inline-flex h-10 items-center justify-center rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white">
          レッスンプランを作成
        </Link>
      </div>
    </SoftCard>
  );
}

function AttributeBars({ title, rows, tone = "green" }: { title: string; rows: RatioRow[]; tone?: "green" | "purple" }) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-bold">{title}</p>
      {rows.length ? (
        <div className="grid gap-2">
          {rows.map((row) => (
            <div key={row.label} className="grid grid-cols-[82px_minmax(0,1fr)_42px] items-center gap-2 text-[12px] font-bold">
              <span className="min-w-0 truncate">{row.label}</span>
              <MiniBar value={row.percent} tone={tone} />
              <span className="text-right">{row.percent}%</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptySmall text="生徒データがありません。" />
      )}
    </div>
  );
}

function ClassRows({ rows }: { rows: ClassReportRow[] }) {
  if (!rows.length) return <EmptySmall text="まだクラス種別ごとの集計はありません。" />;
  return (
    <div className="grid gap-2">
      {rows.map((row) => (
        <div key={row.format} className="rounded-2xl border border-[#eee4d8] bg-white/70 p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[14px] font-extrabold">{row.format}</p>
            <span className="rounded-full bg-[#edf5ef] px-2 py-1 text-[11px] font-bold text-[#4f875a]">{row.participants}名</span>
          </div>
          <div className="mt-3 grid gap-2 text-[12px] font-semibold leading-5 text-[#50584e] sm:grid-cols-2">
            <p>女性比率: <span className="font-extrabold text-[#4f875a]">{row.femaleRate}%</span></p>
            <p>男性比率: <span className="font-extrabold text-[#7469bf]">{row.maleRate}%</span></p>
            <p>多い年代: <span className="font-extrabold">{row.topAgeGroup}</span></p>
            <p>キャンセル率: <span className="font-extrabold text-[#ef6f5b]">{row.cancelRate}%</span></p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AttendanceSummary({
  present,
  cancelled,
  noShow,
  cancelRate,
  noShowRate,
}: {
  present: number;
  cancelled: number;
  noShow: number;
  cancelRate: number;
  noShowRate: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <MiniNumber label="参加" value={`${present}件`} />
      <MiniNumber label="キャンセル" value={`${cancelled}件`} tone="coral" />
      <MiniNumber label="無断欠席" value={`${noShow}件`} tone="purple" />
      <MiniNumber label="キャンセル率" value={`${cancelRate}%`} tone="coral" />
      <MiniNumber label="無断欠席率" value={`${noShowRate}%`} tone="purple" />
    </div>
  );
}

function PlanRows({ rows }: { rows: PlanReportRow[] }) {
  if (!rows.length) return <EmptySmall text="まだレッスンプラン別の集計はありません。" />;
  return (
    <div className="grid gap-2">
      {rows.map((row) => (
        <div key={row.id} className="grid gap-2 rounded-2xl border border-[#eee4d8] bg-white/72 p-3 md:grid-cols-[minmax(0,1.5fr)_repeat(5,minmax(92px,0.7fr))] md:items-center">
          <Link href={row.id.includes(":") ? "/lessons" : `/lessons/${row.id}`} className="min-w-0 text-[14px] font-extrabold text-[#2f342e] hover:text-[#5d956d]">
            {row.name}
          </Link>
          <PlanMetric label="実施回数" value={`${row.lessonCount}回`} />
          <PlanMetric label="延べ参加" value={`${row.participants}名`} />
          <PlanMetric label="キャンセル率" value={`${row.cancelRate}%`} />
          <PlanMetric label="平均参加" value={`${row.averageParticipants}名`} />
          <PlanMetric label="最新実施日" value={row.latestDate} />
        </div>
      ))}
    </div>
  );
}

function BlockRanking({ title, rows, emptyText }: { title: string; rows: BlockReportRow[]; emptyText: string }) {
  return (
    <section className="rounded-2xl border border-[#eee4d8] bg-white/68 p-3">
      <h3 className="mb-3 text-[14px] font-extrabold">{title}</h3>
      {rows.length ? (
        <div className="grid gap-2">
          {rows.map((row, index) => (
            <div key={`${title}-${row.id}`} className="grid grid-cols-[30px_minmax(0,1fr)] gap-3 rounded-2xl border border-[#eee4d8] bg-white/76 p-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#edf5ef] text-[12px] font-extrabold text-[#4f875a]">{index + 1}</span>
              <div className="min-w-0">
                <Link href={`/blocks/${row.id}`} className="line-clamp-1 text-[13px] font-extrabold hover:text-[#5d956d]">{row.name}</Link>
                <p className="mt-1 line-clamp-1 text-[11px] font-bold text-[#5d956d]">{row.majorCategory} / {row.minorCategory}</p>
                <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] font-bold text-[#6b7468]">
                  <span>実施 {row.doneCount}回</span>
                  <span>良かった {row.goodRate}%</span>
                  <span>改善 {row.improvementCount}件</span>
                  <span>{row.latestDate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptySmall text={emptyText} />
      )}
    </section>
  );
}

function PlanMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#fbfaf6] px-3 py-2">
      <p className="text-[10px] font-bold text-[#7c8476]">{label}</p>
      <p className="mt-0.5 truncate text-[13px] font-extrabold">{value}</p>
    </div>
  );
}

function MiniNumber({ label, value, tone = "green" }: { label: string; value: string; tone?: "green" | "coral" | "purple" }) {
  const color = tone === "coral" ? "text-[#ef6f5b]" : tone === "purple" ? "text-[#7469bf]" : "text-[#4f875a]";
  return (
    <div className="rounded-xl border border-[#eee4d8] bg-white/70 p-3 text-center">
      <p className="text-[11px] font-bold text-[#7c8476]">{label}</p>
      <p className={`mt-1 text-[22px] font-extrabold ${color}`}>{value}</p>
    </div>
  );
}

function EmptySmall({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#d8e3d4] bg-[#f8fcf6] p-3 text-[12px] font-semibold leading-5 text-[#657064]">
      {text}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "numeric", day: "numeric", timeZone: "Asia/Tokyo" }).format(new Date(value));
}
