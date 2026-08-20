import { Suspense } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Layers3,
  Plus,
  Search,
} from "lucide-react";
import { duplicateLessonPlanAction } from "@/app/lessons/lesson-plan-actions";
import { Input } from "@/components/ui/input";
import { RecentLessonCoverage } from "@/components/yoga/recent-lesson-coverage";
import { ScheduleClosureDialog } from "@/components/yoga/schedule-closure-dialog";
import {
  WorkspaceAction,
  WorkspaceEmptyState,
  WorkspacePageHeader,
  WorkspaceSection,
  WorkspaceStatus,
  WorkspaceSummaryCard,
  WorkspaceTableContainer,
  WorkspaceTabs,
  WorkspaceToolbar,
  type WorkspaceTabGroup,
} from "@/components/yoga/workspace-kit";
import { getBlockAnalysis, getBlockCategories, getBlocks, getBlockTags, type BlockCategory, type DbBlockTemplate } from "@/lib/blocks";
import { getLessonPlanSummaries, type DbLessonPlan } from "@/lib/lesson-plans";
import type { LessonCoverageReport } from "@/lib/lesson-coverage";
import { getLessonRecords, type DbLessonRecord, type LessonRecordDiffSummary } from "@/lib/lesson-records";
import { getRecentLessonCoverage } from "@/lib/reports";
import { getScheduleSummaries, type DbSchedule } from "@/lib/schedules";

type LessonTab = "schedule" | "plans" | "blocks" | "records" | "analysis";
type SearchParams = {
  tab?: string;
  q?: string;
  status?: string;
  period?: string;
  format?: string;
  place?: string;
  plan?: string;
  tag?: string;
  sort?: string;
  category?: string;
  subcategory?: string;
  view?: string;
  diff?: string;
  unconfirmed?: string;
};

const tabGroups: WorkspaceTabGroup<LessonTab>[] = [
  {
    label: "日常運用",
    items: [
      { id: "schedule", label: "予定", href: "/lessons", icon: CalendarDays, prefetch: false },
      { id: "records", label: "実施後記録", href: "/lessons?tab=records", icon: FileText, prefetch: false },
    ],
  },
  {
    label: "教材",
    items: [
      { id: "plans", label: "レッスンプラン", href: "/lessons?tab=plans", icon: ClipboardList, prefetch: false },
      { id: "blocks", label: "ブロック", href: "/lessons?tab=blocks", icon: Layers3, prefetch: false },
    ],
  },
  { label: "振り返り", items: [{ id: "analysis", label: "分析", href: "/lessons?tab=analysis", icon: BarChart3, prefetch: false }] },
];

const periodOptions = [
  ["all", "すべて"],
  ["week", "今週"],
  ["month", "今月"],
  ["past", "過去"],
  ["future", "今後"],
] as const;

export const dynamic = "force-dynamic";

export default async function LessonsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const activeTab = normalizeTab(params.tab);
  const schedulesPromise = getScheduleSummaries();
  const recentCoveragePromise = activeTab === "schedule" ? getRecentLessonCoverage(8) : null;

  let schedules: DbSchedule[] = [];
  let plans: DbLessonPlan[] = [];
  let blocks: DbBlockTemplate[] = [];
  let blockLibrary: DbBlockTemplate[] = [];
  let categories: BlockCategory[] = [];
  let tags: string[] = [];
  let records: DbLessonRecord[] = [];

  if (activeTab === "schedule") {
    schedules = await schedulesPromise;
  } else if (activeTab === "plans") {
    [schedules, plans] = await Promise.all([schedulesPromise, getLessonPlanSummaries()]);
  } else if (activeTab === "blocks") {
    const result = await Promise.all([schedulesPromise, getBlocks({}, { includeDrafts: true }), getBlockCategories(), getBlockTags()]);
    schedules = result[0];
    blockLibrary = result[1];
    blocks = filterBlockLibrary(blockLibrary, params);
    categories = result[2];
    tags = result[3].map((tag) => tag.name);
  } else if (activeTab === "records") {
    [schedules, records] = await Promise.all([schedulesPromise, getLessonRecords()]);
  } else {
    [schedules, blocks] = await Promise.all([schedulesPromise, getBlockAnalysis()]);
  }

  const now = await getCurrentTimestamp();
  const pendingSchedules = schedules.filter((schedule) => isRecordPending(schedule, now));
  const futureSchedules = schedules.filter((schedule) => Date.parse(schedule.startsAt) >= now && !isRecordPending(schedule, now));

  return (
    <div className="mx-auto w-full max-w-[1560px] space-y-5">
      <WorkspacePageHeader
        eyebrow="CORE WORKSPACE"
        title="レッスンカルテ"
        description="今日の予定、教材、実施後の差分を一つの流れで管理します。詳細は必要なときだけ開けます。"
        actions={
          <>
            <WorkspaceAction href="/schedules/new" icon={CalendarDays} primary={activeTab === "schedule"}>予定を登録</WorkspaceAction>
            <WorkspaceAction href="/lessons/new" icon={ClipboardList} primary={activeTab === "plans"}>プランを作成</WorkspaceAction>
            <WorkspaceAction href="/blocks/new" icon={Layers3} primary={activeTab === "blocks"}>ブロックを登録</WorkspaceAction>
            {pendingSchedules.length ? (
              <WorkspaceAction href="/lessons?status=record_pending" icon={ClipboardCheck} primary={activeTab === "records"}>未記録を見る</WorkspaceAction>
            ) : null}
            {activeTab === "analysis" ? <WorkspaceAction href="/reports?view=blocks" icon={BarChart3} primary>レポートへ</WorkspaceAction> : null}
          </>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
          <WorkspaceTabs groups={tabGroups} active={activeTab} />
          <div className="grid grid-cols-3 gap-2">
            <HeaderStat label="記録待ち" value={`${pendingSchedules.length}件`} tone="coral" />
            <HeaderStat label="今後" value={`${futureSchedules.length}件`} />
            <HeaderStat label="全予定" value={`${schedules.length}件`} tone="purple" />
          </div>
        </div>
      </WorkspacePageHeader>

      {activeTab === "schedule" && recentCoveragePromise ? <ScheduleWorkspace schedules={schedules} recentCoveragePromise={recentCoveragePromise} params={params} now={now} /> : null}
      {activeTab === "records" ? <RecordsWorkspace records={records} params={params} now={now} /> : null}
      {activeTab === "plans" ? <PlansWorkspace plans={plans} params={params} /> : null}
      {activeTab === "blocks" ? <BlocksWorkspace blocks={blocks} blockLibrary={blockLibrary} categories={categories} tags={tags} params={params} /> : null}
      {activeTab === "analysis" ? <AnalysisWorkspace blocks={blocks} /> : null}
    </div>
  );
}

function ScheduleWorkspace({ schedules, recentCoveragePromise, params, now }: { schedules: DbSchedule[]; recentCoveragePromise: Promise<LessonCoverageReport>; params: SearchParams; now: number }) {
  const quickFilter = params.status === "record_pending"
    ? "record_pending"
    : params.status === "closed"
      ? "closed"
      : params.period === "future"
        ? "future"
        : Object.entries(params).some(([key, value]) => key !== "tab" && Boolean(value))
          ? null
          : "all";
  const allWaiting = schedules.filter((schedule) => isRecordPending(schedule, now));
  const allClosed = schedules.filter((schedule) => Boolean(schedule.activeClosure));
  const allFuture = schedules.filter((schedule) => !schedule.activeClosure && !isRecordPending(schedule, now) && Date.parse(schedule.startsAt) >= now);
  const filtered = schedules.filter((schedule) => {
    const q = params.q?.trim().toLowerCase();
    if (q && ![schedule.lessonName, schedule.lessonPlanName, schedule.place, schedule.formatLabel].join(" ").toLowerCase().includes(q)) return false;
    if (params.status && params.status !== "all") {
      if (params.status === "record_pending") {
        if (!isRecordPending(schedule, now)) return false;
      } else if (params.status === "closed") {
        if (!schedule.activeClosure) return false;
      } else if (schedule.status !== params.status || schedule.activeClosure) return false;
    }
    if (params.format && params.format !== "all" && schedule.format !== params.format) return false;
    if (params.place && params.place !== "all" && schedule.place !== params.place) return false;
    if (params.plan && params.plan !== "all" && schedule.lessonPlanId !== params.plan) return false;
    return matchesPeriod(schedule.startsAt, params.period, now);
  });

  const waiting = filtered.filter((schedule) => isRecordPending(schedule, now)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const future = filtered.filter((schedule) => !schedule.activeClosure && !isRecordPending(schedule, now) && Date.parse(schedule.startsAt) >= now).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = filtered.filter((schedule) => Boolean(schedule.activeClosure) || (!isRecordPending(schedule, now) && Date.parse(schedule.startsAt) < now)).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const places = unique(schedules.map((schedule) => schedule.place).filter(Boolean));
  const plans = uniqueBy(schedules.filter((schedule) => schedule.lessonPlanId), (schedule) => schedule.lessonPlanId!);

  return (
    <div className="space-y-5">
      <WorkspaceToolbar>
        <form key={JSON.stringify([params.q, params.status, params.period, params.format, params.place, params.plan])} action="/lessons" className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(190px,1.6fr)_repeat(5,minmax(118px,0.75fr))_auto_auto] xl:items-end">
          <FilterField label="キーワード">
            <div className="flex h-10 items-center gap-2 rounded-lg border border-[#dcd6cc] bg-white px-3">
              <Search className="h-4 w-4 text-[#777e74]" />
              <Input name="q" defaultValue={params.q ?? ""} placeholder="レッスン・プラン・場所" className="h-8 border-0 px-0 text-[14px] shadow-none focus-visible:ring-0" />
            </div>
          </FilterField>
          <FilterSelect label="状態" name="status" value={params.status} options={[["all", "すべて"], ["record_pending", "記録待ち"], ["closed", "クローズ済み"], ["scheduled", "予定"], ["preparing", "準備中"], ["prepared", "準備済み"], ["recorded", "記録済み"]]} />
          <FilterSelect label="期間" name="period" value={params.period} options={periodOptions} />
          <FilterSelect label="形式" name="format" value={params.format} options={[["all", "すべて"], ["group", "グループ"], ["personal", "パーソナル"], ["online", "オンライン"]]} />
          <FilterSelect label="場所" name="place" value={params.place} options={[["all", "すべて"], ...places.map((place) => [place, place] as const)]} />
          <FilterSelect label="プラン" name="plan" value={params.plan} options={[["all", "すべて"], ...plans.map((plan) => [plan.lessonPlanId!, plan.lessonPlanName] as const)]} />
          <button className="h-10 rounded-lg bg-[#5d8f68] px-4 text-[13px] font-semibold text-white">適用</button>
          <Link href="/lessons" className="inline-flex h-10 items-center justify-center rounded-lg border border-[#ddd6cc] bg-white px-4 text-[13px] font-semibold text-[#626a60] hover:bg-[#f7f4ef]">クリア</Link>
        </form>
      </WorkspaceToolbar>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <WorkspaceSummaryCard label="すべて" value={`${schedules.length}件`} detail="すべての予定" href="/lessons" active={quickFilter === "all"} />
        <WorkspaceSummaryCard label="記録待ち" value={`${allWaiting.length}件`} detail="古い予定から表示" tone="coral" href="/lessons?status=record_pending" active={quickFilter === "record_pending"} />
        <WorkspaceSummaryCard label="今後の予定" value={`${allFuture.length}件`} detail="近い予定から表示" tone="purple" href="/lessons?period=future" active={quickFilter === "future"} />
        <WorkspaceSummaryCard label="クローズ済み" value={`${allClosed.length}件`} detail="通常の出席集計から除外" tone="sand" href="/lessons?status=closed" active={quickFilter === "closed"} />
      </div>

      <ScheduleGroup title="記録待ち" description="実施後記録が未完了のレッスン。古い順です。" schedules={waiting} kind="waiting" />
      <ScheduleGroup title="今後の予定" description="これから実施するレッスン。近い順です。" schedules={future} kind="future" />
      <Suspense fallback={<RecentCoverageSkeleton />}>
        <RecentCoverageSection reportPromise={recentCoveragePromise} />
      </Suspense>
      <PastScheduleGroups schedules={past} />
    </div>
  );
}

async function RecentCoverageSection({ reportPromise }: { reportPromise: Promise<LessonCoverageReport> }) {
  return (
    <WorkspaceSection
      title="直近レッスン・カバレッジ"
      description="完了済み・未クローズの直近8レッスンで、実施した身体領域と指導テーマを振り返ります。"
      action={<Link href="/reports?view=coverage" prefetch={false} className="text-[12px] font-semibold text-[#477050] hover:underline">詳しいカバレッジマップを見る</Link>}
    >
      <RecentLessonCoverage report={await reportPromise} />
    </WorkspaceSection>
  );
}

function RecentCoverageSkeleton() {
  return (
    <WorkspaceSection
      title="直近レッスン・カバレッジ"
      description="完了済み・未クローズの直近8レッスンで、実施した身体領域と指導テーマを振り返ります。"
      action={<Link href="/reports?view=coverage" prefetch={false} className="text-[12px] font-semibold text-[#477050] hover:underline">詳しいカバレッジマップを見る</Link>}
    >
      <div aria-label="直近レッスン・カバレッジを読み込み中" className="grid animate-pulse gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="h-56 rounded-xl border border-[#e6ded3] bg-white/70" />
        <div className="h-56 rounded-xl border border-[#e6ded3] bg-[#f7faf5]" />
      </div>
    </WorkspaceSection>
  );
}

type ScheduleGroupKind = "waiting" | "future" | "past";

function ScheduleGroup({ title, description, schedules, kind }: { title: string; description: string; schedules: DbSchedule[]; kind: ScheduleGroupKind }) {
  return (
    <WorkspaceSection title={title} description={description}>
      {schedules.length ? <ScheduleList schedules={schedules} kind={kind} /> : <WorkspaceEmptyState title={`${title}はありません`} description="現在の検索・フィルター条件に該当する予定はありません。" />}
    </WorkspaceSection>
  );
}

function PastScheduleGroups({ schedules }: { schedules: DbSchedule[] }) {
  const grouped = Array.from(groupBy(schedules, (schedule) => tokyoMonthKey(schedule.startsAt)).entries());
  return (
    <WorkspaceSection title="過去の予定" description="実施済みとクローズ済みを月ごとに、新しい順で表示します。クローズ済みは通常の出席・テーマ集計に含めません。">
      {grouped.length ? (
        <div className="space-y-6">
          {grouped.map(([monthKey, monthSchedules]) => (
            <section key={monthKey} id={`past-${monthKey}`} className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-3"><h3 className="text-[17px] font-semibold text-[#34453a]">{formatMonthHeading(monthKey)}</h3><span className="rounded-full bg-[#f1eee8] px-2.5 py-1 text-[11px] font-semibold text-[#6c736a]">{monthSchedules.length}件</span></div>
              <ScheduleList schedules={monthSchedules} kind="past" />
            </section>
          ))}
        </div>
      ) : <WorkspaceEmptyState title="過去の予定はありません" description="現在の検索・フィルター条件に該当する予定はありません。" />}
    </WorkspaceSection>
  );
}

function ScheduleList({ schedules, kind }: { schedules: DbSchedule[]; kind: ScheduleGroupKind }) {
  return (
    <>
      <div className="hidden md:block">
        <WorkspaceTableContainer>
          <table className="w-full min-w-[930px] border-collapse text-left text-[14px]">
            <thead className="bg-[#f5f3ee] text-[12px] font-semibold text-[#666d63]">
              <tr>
                <TableHead>日付</TableHead><TableHead>時間</TableHead><TableHead>レッスン名</TableHead><TableHead>使用プラン</TableHead><TableHead>場所／形式</TableHead><TableHead>参加予定</TableHead><TableHead>状態</TableHead><TableHead className="text-right">操作</TableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ece5db]">
              {schedules.map((schedule) => <ScheduleRow key={schedule.id} schedule={schedule} kind={kind} />)}
            </tbody>
          </table>
        </WorkspaceTableContainer>
      </div>
      <div className="grid gap-3 md:hidden">
        {schedules.map((schedule) => <ScheduleCard key={schedule.id} schedule={schedule} kind={kind} />)}
      </div>
    </>
  );
}

function ScheduleRow({ schedule, kind }: { schedule: DbSchedule; kind: ScheduleGroupKind }) {
  return (
    <tr className="transition hover:bg-[#fafcf8] focus-within:bg-[#fafcf8]">
      <TableCell className="whitespace-nowrap font-medium">{schedule.dateLabel}</TableCell>
      <TableCell className="whitespace-nowrap">{schedule.startTimeLabel}–{schedule.endTimeLabel}</TableCell>
      <TableCell>
        <Link href={`/schedules/${schedule.id}`} className="font-semibold text-[#34453a] hover:text-[#4f8058] hover:underline">{schedule.lessonName}</Link>
        {schedule.activeClosure ? <span className="mt-1 block text-[12px] text-[#8a6258]">理由：{schedule.activeClosure.reasonLabel}</span> : null}
      </TableCell>
      <TableCell>{schedule.lessonPlanId ? schedule.lessonPlanName : <WorkspaceStatus tone="sand">プラン未確定</WorkspaceStatus>}</TableCell>
      <TableCell><span className="block">{schedule.place || "場所未設定"}</span><span className="text-[12px] text-[#747b71]">{schedule.formatLabel}</span></TableCell>
      <TableCell>{schedule.participantCount}名</TableCell>
      <TableCell><ScheduleStatus schedule={schedule} kind={kind} /></TableCell>
      <TableCell className="text-right"><ScheduleActions schedule={schedule} kind={kind} /></TableCell>
    </tr>
  );
}

function ScheduleCard({ schedule, kind }: { schedule: DbSchedule; kind: ScheduleGroupKind }) {
  return (
    <article className="rounded-xl border border-[#e6ded3] bg-white/82 p-4">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="text-[15px] font-semibold">{schedule.lessonName}</h3><p className="mt-1 text-[13px] text-[#5d765f]">{schedule.dateLabel} {schedule.startTimeLabel}–{schedule.endTimeLabel}</p></div><ScheduleStatus schedule={schedule} kind={kind} /></div>
      {schedule.activeClosure ? <p className="mt-2 text-[12px] font-medium text-[#8a6258]">理由：{schedule.activeClosure.reasonLabel}</p> : null}
      <dl className="mt-3 grid grid-cols-2 gap-2 text-[13px]"><div><dt className="text-[#7b8178]">プラン</dt><dd>{schedule.lessonPlanId ? schedule.lessonPlanName : <WorkspaceStatus tone="sand">プラン未確定</WorkspaceStatus>}</dd></div><div><dt className="text-[#7b8178]">場所／形式</dt><dd>{schedule.place || "場所未設定"}／{schedule.formatLabel}</dd></div></dl>
      <div className="mt-4"><ScheduleActions schedule={schedule} kind={kind} /></div>
    </article>
  );
}

function ScheduleStatus({ schedule, kind }: { schedule: DbSchedule; kind: ScheduleGroupKind }) {
  if (schedule.activeClosure) return <WorkspaceStatus tone="coral">クローズ済み</WorkspaceStatus>;
  if (!schedule.lessonPlanId) return <WorkspaceStatus tone="sand">プラン未確定</WorkspaceStatus>;
  if (kind === "waiting") return <WorkspaceStatus tone="coral">記録待ち</WorkspaceStatus>;
  if (schedule.status === "recorded") return <WorkspaceStatus tone="green">記録済み</WorkspaceStatus>;
  if (schedule.status === "prepared") return <WorkspaceStatus tone="purple">準備済み</WorkspaceStatus>;
  if (schedule.status === "preparing") return <WorkspaceStatus tone="sand">準備中</WorkspaceStatus>;
  return <WorkspaceStatus>{schedule.statusLabel}</WorkspaceStatus>;
}

function ScheduleActions({ schedule, kind }: { schedule: DbSchedule; kind: ScheduleGroupKind }) {
  const primaryHref = schedule.activeClosure
    ? `/schedules/${schedule.id}`
    : !schedule.lessonPlanId
    ? `/schedules/${schedule.id}/edit`
    : kind === "waiting"
      ? `/lessons/${schedule.id}/record`
      : `/schedules/${schedule.id}`;
  const primaryLabel = schedule.activeClosure ? "詳細" : !schedule.lessonPlanId ? "プランを設定" : kind === "waiting" ? "記録を書く" : "詳細";
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link href={primaryHref} className="inline-flex h-9 items-center rounded-lg bg-[#5d8f68] px-3 text-[12px] font-semibold text-white hover:bg-[#4e805a]">{primaryLabel}</Link>
      <details className="group text-left">
        <summary className="inline-flex h-9 cursor-pointer list-none items-center gap-1 rounded-lg border border-[#dcd6cc] bg-white px-3 text-[12px] font-semibold text-[#626a60] hover:bg-[#f7f4ef]">その他 <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" /></summary>
        <div className="mt-2 flex flex-wrap justify-end gap-1.5 rounded-lg border border-[#e2dbd1] bg-[#fbfaf7] p-2">
          <Link href={`/schedules/${schedule.id}`} className="secondary-row-action">詳細</Link>
          {schedule.lessonPlanId ? <Link href={`/schedules/${schedule.id}/script`} className="secondary-row-action">原稿</Link> : <span className="secondary-row-action opacity-50">原稿なし</span>}
          {!schedule.activeClosure && schedule.lessonPlanId ? <Link href={`/lessons/${schedule.id}/record`} className="secondary-row-action">{schedule.hasCompletedRecord ? "実施後記録詳細" : "実施後記録"}</Link> : null}
          <Link href={`/schedules/${schedule.id}/edit`} className="secondary-row-action">編集</Link>
          {!schedule.activeClosure && !schedule.hasCompletedRecord ? <ScheduleClosureDialog scheduleId={schedule.id} activeClosure={null} hasDraftRecord={schedule.hasDraftRecord} disabled={false} /> : null}
        </div>
      </details>
    </div>
  );
}

function RecordsWorkspace({ records, params, now }: { records: DbLessonRecord[]; params: SearchParams; now: number }) {
  const filtered = records.filter((record) => {
    const q = params.q?.trim().toLowerCase();
    if (q && ![record.lessonName, record.lessonPlanName].join(" ").toLowerCase().includes(q)) return false;
    if (params.status && params.status !== "all" && record.status !== params.status) return false;
    if (params.plan && params.plan !== "all" && record.lessonPlanId !== params.plan) return false;
    if (params.diff === "1" && !record.hasDifference) return false;
    if (params.unconfirmed === "1" && !record.hasUnconfirmed) return false;
    return matchesPeriod(record.recordDateIso, params.period, now);
  });
  const plans = uniqueBy(records.filter((record) => record.lessonPlanId), (record) => record.lessonPlanId!);

  return (
    <div className="space-y-5">
      <WorkspaceToolbar>
        <form action="/lessons" className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(190px,1.5fr)_repeat(5,minmax(120px,0.8fr))_auto_auto] xl:items-end">
          <input type="hidden" name="tab" value="records" />
          <FilterField label="キーワード"><Input name="q" defaultValue={params.q ?? ""} placeholder="レッスン・プラン" className="h-10 bg-white text-[14px]" /></FilterField>
          <FilterSelect label="記録状態" name="status" value={params.status} options={[["all", "すべて"], ["completed", "記録済み"], ["draft", "下書き"]]} />
          <FilterSelect label="期間" name="period" value={params.period} options={periodOptions} />
          <FilterSelect label="差分" name="diff" value={params.diff} options={[["", "すべて"], ["1", "差分あり"]]} />
          <FilterSelect label="未確認" name="unconfirmed" value={params.unconfirmed} options={[["", "すべて"], ["1", "未確認あり"]]} />
          <FilterSelect label="使用プラン" name="plan" value={params.plan} options={[["all", "すべて"], ...plans.map((record) => [record.lessonPlanId!, record.lessonPlanName] as const)]} />
          <button className="h-10 rounded-lg bg-[#5d8f68] px-4 text-[13px] font-semibold text-white">適用</button>
          <Link href="/lessons?tab=records" className="inline-flex h-10 items-center justify-center rounded-lg border border-[#ddd6cc] bg-white px-4 text-[13px] font-semibold text-[#626a60]">クリア</Link>
        </form>
      </WorkspaceToolbar>

      <WorkspaceSection title="実施後記録" description={`${filtered.length}件を表示。旧形式の項目は予定どおりへ推測せず、差分未分類として表示します。`}>
        {filtered.length ? (
          <WorkspaceTableContainer>
            <table className="w-full min-w-[980px] border-collapse text-left text-[14px]">
              <thead className="bg-[#f5f3ee] text-[12px] font-semibold text-[#666d63]"><tr><TableHead>実施日</TableHead><TableHead>レッスン名</TableHead><TableHead>使用プラン</TableHead><TableHead>参加</TableHead><TableHead>記録状態</TableHead><TableHead>差分サマリー</TableHead><TableHead className="text-right">操作</TableHead></tr></thead>
              <tbody className="divide-y divide-[#ece5db]">
                {filtered.map((record) => (
                  <tr key={record.id} className="hover:bg-[#fafcf8]">
                    <TableCell className="whitespace-nowrap">{record.recordDate}</TableCell>
                    <TableCell className="font-semibold">{record.lessonName}</TableCell>
                    <TableCell>{record.lessonPlanName}</TableCell>
                    <TableCell>{record.participantCount}名</TableCell>
                    <TableCell><WorkspaceStatus tone={record.status === "completed" ? "green" : "sand"}>{record.statusLabel}</WorkspaceStatus></TableCell>
                    <TableCell><DiffSummary summary={record.diffSummary} /></TableCell>
                    <TableCell className="text-right"><RecordActions record={record} /></TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </WorkspaceTableContainer>
        ) : <WorkspaceEmptyState title="該当する実施後記録はありません" description="検索条件を変更するか、記録待ちの予定から実施後記録を作成してください。" />}
      </WorkspaceSection>
    </div>
  );
}

function DiffSummary({ summary }: { summary: LessonRecordDiffSummary }) {
  const items = [
    ["予定どおり", summary.asPlanned, "green"],
    ["調整", summary.adjusted, "purple"],
    ["スキップ", summary.skipped, "coral"],
    ["置き換え", summary.replaced, "sand"],
    ["追加", summary.added, "purple"],
    ["未確認", summary.unconfirmed, "coral"],
    ["旧形式／未分類", summary.legacy, "neutral"],
  ] as const;
  return <div className="flex max-w-[430px] flex-wrap gap-1.5">{items.filter(([, count]) => count > 0).map(([label, count, tone]) => <WorkspaceStatus key={label} tone={tone}>{label} {count}</WorkspaceStatus>)}{items.every(([, count]) => count === 0) ? <span className="text-[13px] text-[#777e74]">差分なし</span> : null}</div>;
}

function RecordActions({ record }: { record: DbLessonRecord }) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {record.scheduleId ? <Link href={`/lessons/${record.scheduleId}/record`} className="inline-flex h-9 items-center rounded-lg bg-[#5d8f68] px-3 text-[12px] font-semibold text-white">{record.status === "completed" ? "詳細を見る" : "記録を続ける"}</Link> : <span className="text-[12px] text-[#7b8178]">予定未連携</span>}
      {record.lessonPlanId ? <Link href={`/lessons/${record.lessonPlanId}`} className="secondary-row-action">使用プラン</Link> : null}
      {record.scheduleId ? <Link href={`/schedules/${record.scheduleId}`} className="secondary-row-action">予定詳細</Link> : null}
    </div>
  );
}

function PlansWorkspace({ plans, params }: { plans: DbLessonPlan[]; params: SearchParams }) {
  let filtered = plans.filter((plan) => {
    const q = params.q?.trim().toLowerCase();
    if (q && ![plan.name, plan.theme, plan.tags.join(" ")].join(" ").toLowerCase().includes(q)) return false;
    if (params.status && params.status !== "all" && plan.status !== params.status) return false;
    if (params.format && params.format !== "all" && plan.format !== params.format) return false;
    if (params.tag && params.tag !== "all" && !plan.tags.includes(params.tag)) return false;
    return true;
  });
  if (params.sort === "name") filtered = filtered.sort((a, b) => a.name.localeCompare(b.name, "ja"));
  else if (params.sort === "usage") filtered = filtered.sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name, "ja"));
  else if (params.sort === "duration") filtered = filtered.sort((a, b) => b.totalMinutes - a.totalMinutes || a.name.localeCompare(b.name, "ja"));
  else filtered = filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const tags = unique(plans.flatMap((plan) => plan.tags));

  return (
    <div className="space-y-5">
      <WorkspaceToolbar>
        <form action="/lessons" className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(210px,1.5fr)_repeat(4,minmax(130px,0.8fr))_auto_auto] xl:items-end">
          <input type="hidden" name="tab" value="plans" />
          <FilterField label="キーワード"><Input name="q" defaultValue={params.q ?? ""} placeholder="プラン名・テーマ・タグ" className="h-10 bg-white text-[14px]" /></FilterField>
          <FilterSelect label="状態" name="status" value={params.status} options={[["all", "すべて"], ["ready", "準備済み"], ["draft", "下書き"]]} />
          <FilterSelect label="形式" name="format" value={params.format} options={[["all", "すべて"], ["group", "グループ"], ["personal", "パーソナル"], ["online", "オンライン"]]} />
          <FilterSelect label="タグ" name="tag" value={params.tag} options={[["all", "すべて"], ...tags.map((tag) => [tag, tag] as const)]} />
          <FilterSelect label="並び順" name="sort" value={params.sort} options={[["updated", "更新日"], ["name", "名前"], ["usage", "使用回数"], ["duration", "合計時間"]]} />
          <button className="h-10 rounded-lg bg-[#5d8f68] px-4 text-[13px] font-semibold text-white">適用</button>
          <Link href="/lessons?tab=plans" className="inline-flex h-10 items-center justify-center rounded-lg border border-[#ddd6cc] bg-white px-4 text-[13px] font-semibold text-[#626a60]">クリア</Link>
        </form>
      </WorkspaceToolbar>
      <WorkspaceSection title="レッスンプラン" description={`${filtered.length}件。準備済みプランは予定登録に使える状態です。`}>
        {filtered.length ? (
          <WorkspaceTableContainer>
            <table className="w-full min-w-[960px] border-collapse text-left text-[14px]">
              <thead className="bg-[#f5f3ee] text-[12px] font-semibold text-[#666d63]"><tr><TableHead>プラン名</TableHead><TableHead>テーマ</TableHead><TableHead>状態</TableHead><TableHead>形式</TableHead><TableHead>合計時間</TableHead><TableHead>ブロック</TableHead><TableHead>利用予定</TableHead><TableHead>最終更新</TableHead><TableHead className="text-right">操作</TableHead></tr></thead>
              <tbody className="divide-y divide-[#ece5db]">{filtered.map((plan) => <PlanRow key={plan.id} plan={plan} />)}</tbody>
            </table>
          </WorkspaceTableContainer>
        ) : <WorkspaceEmptyState title="該当するプランはありません" description="条件をクリアするか、新しいレッスンプランを作成してください。" action={<WorkspaceAction href="/lessons/new" icon={Plus} primary>プランを作成</WorkspaceAction>} />}
      </WorkspaceSection>
    </div>
  );
}

function PlanRow({ plan }: { plan: DbLessonPlan }) {
  return (
    <tr className="hover:bg-[#fafcf8]">
      <TableCell><Link href={`/lessons/${plan.id}`} className="font-semibold text-[#34453a] hover:text-[#4f8058] hover:underline">{plan.name}</Link>{plan.tags.length ? <p className="mt-1 line-clamp-1 text-[12px] text-[#777e74]">{plan.tags.join(" ")}</p> : null}</TableCell>
      <TableCell>{plan.theme || "未設定"}</TableCell>
      <TableCell><WorkspaceStatus tone={plan.status === "ready" ? "green" : "sand"}>{plan.statusLabel}</WorkspaceStatus></TableCell>
      <TableCell>{plan.formatLabel}</TableCell><TableCell>{plan.totalMinutes}分</TableCell><TableCell>{plan.blockCount}個</TableCell><TableCell>{plan.usageCount}件</TableCell><TableCell className="whitespace-nowrap">{formatShortDate(plan.updatedAt)}</TableCell>
      <TableCell className="text-right"><div className="flex flex-wrap justify-end gap-1.5"><Link href={`/lessons/${plan.id}`} className="secondary-row-action">詳細</Link><Link href={`/lessons/${plan.id}/script`} className="secondary-row-action">原稿</Link><Link href={`/lessons/${plan.id}/edit`} className="secondary-row-action">編集</Link><form action={duplicateLessonPlanAction.bind(null, plan.id)}><button className="secondary-row-action">複製</button></form></div></TableCell>
    </tr>
  );
}

function BlocksWorkspace({
  blocks,
  blockLibrary,
  categories,
  tags,
  params,
}: {
  blocks: DbBlockTemplate[];
  blockLibrary: DbBlockTemplate[];
  categories: BlockCategory[];
  tags: string[];
  params: SearchParams;
}) {
  const view = params.view === "cards" || params.view === "categories" ? params.view : "list";
  const activeCategories = categories.filter((category) => !category.archived);
  const selectedCategory = activeCategories.find((category) => category.id === params.category);
  const subcategories = activeCategories.flatMap((category) => category.subcategories).filter((item) => !item.archived && (!params.category || item.category_id === params.category));
  const selectedSubcategories = selectedCategory?.subcategories.filter((subcategory) => !subcategory.archived) ?? [];
  const categoryCounts = countBlocksBy(blockLibrary, (block) => block.categoryId);
  const subcategoryCounts = countBlocksBy(blockLibrary, (block) => block.subcategoryId);

  return (
    <div className="space-y-5">
      <WorkspaceToolbar>
        <form action="/lessons" className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <input type="hidden" name="tab" value="blocks" />
          <input type="hidden" name="view" value={view} />
          {params.category ? <input type="hidden" name="category" value={params.category} /> : null}
          {params.subcategory ? <input type="hidden" name="subcategory" value={params.subcategory} /> : null}
          {params.tag ? <input type="hidden" name="tag" value={params.tag} /> : null}
          {params.sort ? <input type="hidden" name="sort" value={params.sort} /> : null}
          <div className="min-w-0 flex-1">
            <FilterField label="検索"><Input name="q" defaultValue={params.q ?? ""} placeholder="名前・タグ・原稿" className="h-10 bg-white text-[14px]" /></FilterField>
          </div>
          <button className="h-10 shrink-0 rounded-lg bg-[#5d8f68] px-5 text-[13px] font-semibold text-white hover:bg-[#4f8058]">検索</button>
          {params.q ? <Link href={blockListHref(params, { q: undefined })} className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-[#ddd6cc] bg-white px-4 text-[13px] font-semibold text-[#626a60] hover:bg-[#f7f4ef]">検索をクリア</Link> : null}
        </form>

        <div className="mt-4 border-t border-[#ece5db] pt-4">
          <p className="mb-2 text-[12px] font-semibold text-[#656c63]">大カテゴリー</p>
          <div className="flex min-w-0 flex-wrap gap-2" aria-label="大カテゴリー">
            <BlockFilterLink href={blockListHref(params, { category: undefined, subcategory: undefined })} label="すべて" count={blockLibrary.length} active={!params.category} />
            {activeCategories.map((category) => (
              <BlockFilterLink
                key={category.id}
                href={blockListHref(params, { category: category.id, subcategory: undefined })}
                label={category.name}
                count={categoryCounts.get(category.id) ?? 0}
                active={params.category === category.id}
              />
            ))}
          </div>
        </div>

        {selectedCategory && selectedSubcategories.length ? (
          <div className="mt-3 rounded-xl border border-[#e1e8dc] bg-[#f7faf5] p-3">
            <p className="mb-2 text-[12px] font-semibold text-[#656c63]">{selectedCategory.name}の小カテゴリー</p>
            <div className="flex min-w-0 flex-wrap gap-1.5" aria-label="小カテゴリー">
              <BlockFilterLink href={blockListHref(params, { subcategory: undefined })} label="すべて" count={categoryCounts.get(selectedCategory.id) ?? 0} active={!params.subcategory} small />
              {selectedSubcategories.map((subcategory) => (
                <BlockFilterLink
                  key={subcategory.id}
                  href={blockListHref(params, { subcategory: subcategory.id })}
                  label={subcategory.name}
                  count={subcategoryCounts.get(subcategory.id) ?? 0}
                  active={params.subcategory === subcategory.id}
                  small
                />
              ))}
            </div>
          </div>
        ) : null}

        <form action="/lessons" className="mt-4 grid gap-3 border-t border-[#ece5db] pt-4 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)_auto_auto] xl:items-end">
          <input type="hidden" name="tab" value="blocks" />
          <input type="hidden" name="view" value={view} />
          {params.q ? <input type="hidden" name="q" value={params.q} /> : null}
          {params.category ? <input type="hidden" name="category" value={params.category} /> : null}
          <FilterSelect label="小カテゴリー" name="subcategory" value={params.subcategory} options={[["", "すべて"], ...subcategories.map((subcategory) => [subcategory.id, subcategory.name] as const)]} />
          <FilterSelect label="タグ" name="tag" value={params.tag} options={[["", "すべて"], ...tags.map((tag) => [tag, tag] as const)]} />
          <FilterSelect label="並び順" name="sort" value={params.sort} options={[["updated", "更新日"], ["name", "名前"], ["duration", "時間"], ["usage", "使用回数"], ["good", "良かった率"], ["recent", "最終使用"]]} />
          <button className="h-10 rounded-lg bg-[#5d8f68] px-4 text-[13px] font-semibold text-white">適用</button>
          <Link href="/lessons?tab=blocks" className="inline-flex h-10 items-center justify-center rounded-lg border border-[#ddd6cc] bg-white px-4 text-[13px] font-semibold text-[#626a60]">クリア</Link>
        </form>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#ece5db] pt-4"><p className="text-[13px] font-medium text-[#5d685a]">{blocks.length}件を表示</p><div className="flex flex-wrap gap-1.5"><ViewLink label="一覧" view="list" active={view === "list"} params={params} /><ViewLink label="カード" view="cards" active={view === "cards"} params={params} /><ViewLink label="カテゴリー" view="categories" active={view === "categories"} params={params} /></div></div>
      </WorkspaceToolbar>

      {blocks.length ? view === "list" ? <BlockTable blocks={blocks} /> : view === "cards" ? <BlockCards blocks={blocks} /> : <BlockCategoryGroups blocks={blocks} categories={activeCategories} /> : <WorkspaceEmptyState title="該当するブロックはありません" description="検索条件をクリアするか、新しいブロックを登録してください。" />}
    </div>
  );
}

function BlockTable({ blocks }: { blocks: DbBlockTemplate[] }) {
  return (
    <WorkspaceTableContainer>
      <table className="w-full min-w-[920px] border-collapse text-left text-[14px]">
        <thead className="bg-[#f5f3ee] text-[12px] font-semibold text-[#666d63]"><tr><TableHead>名前</TableHead><TableHead>カテゴリー</TableHead><TableHead>時間</TableHead><TableHead>使用回数</TableHead><TableHead>良かった率</TableHead><TableHead>改善メモ</TableHead><TableHead>最終使用</TableHead><TableHead className="text-right">操作</TableHead></tr></thead>
        <tbody className="divide-y divide-[#ece5db]">{blocks.map((block) => <BlockRow key={block.id} block={block} />)}</tbody>
      </table>
    </WorkspaceTableContainer>
  );
}

function BlockRow({ block }: { block: DbBlockTemplate }) {
  return (
    <tr className="hover:bg-[#fafcf8]"><TableCell><div className="flex items-center gap-2"><Link href={`/blocks/${block.id}`} className="font-semibold text-[#34453a] hover:text-[#4f8058] hover:underline">{block.name}</Link>{block.isDraft ? <WorkspaceStatus tone="sand">AI下書き</WorkspaceStatus> : null}</div><p className="mt-1 line-clamp-1 text-[12px] text-[#777e74]">{block.tags.length ? block.tags.join(" ") : "タグ未設定"}</p></TableCell><TableCell>{block.majorCategory || "未分類"}<span className="block text-[12px] text-[#777e74]">{block.minorCategory || "未分類"}</span></TableCell><TableCell>{block.duration}</TableCell><TableCell>{block.usageCount}回</TableCell><TableCell>{block.goodRate == null ? <span className="text-[#777e74]">未評価</span> : <span>{block.goodRate}% <small className="text-[11px] text-[#777e74]">({block.reactionCount}件)</small></span>}</TableCell><TableCell>{block.improvementCount ?? 0}件</TableCell><TableCell>{block.lastUsed}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-1.5"><Link href={`/blocks/${block.id}`} className="secondary-row-action">詳細</Link><Link href={`/blocks/${block.id}/edit`} className="secondary-row-action">編集</Link><BlockUseAction block={block} /></div></TableCell></tr>
  );
}

function BlockCards({ blocks }: { blocks: DbBlockTemplate[] }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{blocks.map((block) => <article key={block.id} className="rounded-xl border border-[#e6ded3] bg-white/82 p-4"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Link href={`/blocks/${block.id}`} className="text-[15px] font-semibold hover:text-[#4f8058]">{block.name}</Link>{block.isDraft ? <WorkspaceStatus tone="sand">AI下書き</WorkspaceStatus> : null}</div><p className="mt-1 text-[12px] text-[#687068]">{block.majorCategory}／{block.minorCategory}</p></div><WorkspaceStatus tone="sand">{block.duration}</WorkspaceStatus></div><div className="mt-3 grid grid-cols-3 gap-2 text-center text-[12px]"><MiniMetric label="使用" value={`${block.usageCount}回`} /><MiniMetric label="反応" value={block.goodRate == null ? "未評価" : `${block.goodRate}%`} /><MiniMetric label="改善" value={`${block.improvementCount ?? 0}件`} /></div><div className="mt-4 flex justify-end gap-2"><Link href={`/blocks/${block.id}`} className="secondary-row-action">詳細</Link><BlockUseAction block={block} /></div></article>)}</div>;
}

function BlockUseAction({ block }: { block: DbBlockTemplate }) {
  return block.isDraft
    ? <span className="inline-flex h-8 items-center rounded-lg border border-[#e4d7bd] bg-[#fffaf0] px-2.5 text-[12px] font-semibold text-[#8a734c]">確定後に使用可</span>
    : <Link href={`/lessons/new?block=${block.id}`} className="inline-flex h-8 items-center rounded-lg bg-[#5d8f68] px-2.5 text-[12px] font-semibold text-white">使う</Link>;
}

function BlockCategoryGroups({ blocks, categories }: { blocks: DbBlockTemplate[]; categories: BlockCategory[] }) {
  const categoryOrder = new Map(categories.map((category, index) => [category.name, index]));
  const groups = groupBy(blocks, (block) => block.majorCategory || "未分類");
  const orderedGroups = Array.from(groups.entries()).sort(([left], [right]) => (categoryOrder.get(left) ?? Number.MAX_SAFE_INTEGER) - (categoryOrder.get(right) ?? Number.MAX_SAFE_INTEGER));

  return (
    <div className="space-y-5">
      {orderedGroups.map(([category, items]) => {
        const categoryDefinition = categories.find((item) => item.name === category);
        const subcategoryOrder = new Map((categoryDefinition?.subcategories ?? []).filter((item) => !item.archived).map((subcategory, index) => [subcategory.name, index]));
        const subcategoryGroups = Array.from(groupBy(items, (block) => block.minorCategory || "未分類").entries())
          .sort(([left], [right]) => (subcategoryOrder.get(left) ?? Number.MAX_SAFE_INTEGER) - (subcategoryOrder.get(right) ?? Number.MAX_SAFE_INTEGER));

        return (
          <WorkspaceSection key={category} title={category} description={`${items.length}件`}>
            <div className="space-y-4">
              {subcategoryGroups.map(([subcategory, subcategoryBlocks]) => (
                <section key={`${category}-${subcategory}`} className="rounded-xl border border-[#e8e2d8] bg-[#fbfaf7] p-3">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[14px] font-semibold text-[#445143]">{subcategory}</h3>
                    <span className="rounded-full bg-[#e6f0e3] px-2.5 py-1 text-[12px] font-semibold text-[#386b46]">{subcategoryBlocks.length}件</span>
                  </div>
                  <BlockTable blocks={subcategoryBlocks} />
                </section>
              ))}
            </div>
          </WorkspaceSection>
        );
      })}
    </div>
  );
}

function AnalysisWorkspace({ blocks }: { blocks: DbBlockTemplate[] }) {
  const mostUsed = [...blocks].filter((block) => block.usageCount > 0).sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);
  const good = [...blocks].filter((block) => block.goodRate != null).sort((a, b) => (b.goodRate ?? -1) - (a.goodRate ?? -1) || (b.reactionCount ?? 0) - (a.reactionCount ?? 0)).slice(0, 5);
  const unused = [...blocks].sort((a, b) => (a.lastUsedAt || "").localeCompare(b.lastUsedAt || "")).slice(0, 5);
  const improvement = [...blocks].filter((block) => (block.improvementCount ?? 0) > 0).sort((a, b) => (b.improvementCount ?? 0) - (a.improvementCount ?? 0)).slice(0, 5);
  const changed = [...blocks].filter((block) => (block.changeCount ?? 0) > 0).sort((a, b) => (b.changeCount ?? 0) - (a.changeCount ?? 0)).slice(0, 5);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AnalysisList title="よく使うブロック" rows={mostUsed} metric={(block) => `${block.usageCount}回`} />
        <AnalysisList title="反応が良いブロック" rows={good} metric={(block) => `${block.goodRate}%（評価${block.reactionCount ?? 0}件）`} />
        <AnalysisList title="最近使っていないブロック" rows={unused} metric={(block) => block.lastUsed} />
        <AnalysisList title="改善メモが多いブロック" rows={improvement} metric={(block) => `${block.improvementCount ?? 0}件`} />
        <AnalysisList title="予定から変更されやすいブロック" rows={changed} metric={(block) => `${block.changeCount ?? 0}件`} />
        <div className="flex min-h-[220px] flex-col justify-between rounded-xl border border-[#ded7e9] bg-[#f7f4fb] p-5"><div><BarChart3 className="h-6 w-6 text-[#7568a7]" /><h2 className="mt-3 text-[17px] font-semibold">詳細な分析はレポートへ</h2><p className="mt-2 text-[13px] leading-6 text-[#6d6877]">期間、形式、プラン、場所で絞り込み、出席と予定差分を横断して確認できます。</p></div><WorkspaceAction href="/reports?view=blocks" icon={BarChart3} primary>レポートを開く</WorkspaceAction></div>
      </div>
    </div>
  );
}

function AnalysisList({ title, rows, metric }: { title: string; rows: DbBlockTemplate[]; metric: (block: DbBlockTemplate) => string }) {
  return <section className="rounded-xl border border-[#e6ded3] bg-white/82 p-4"><h2 className="text-[16px] font-semibold">{title}</h2>{rows.length ? <ol className="mt-3 divide-y divide-[#ece5db]">{rows.map((block, index) => <li key={block.id} className="flex items-center gap-3 py-2.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef4eb] text-[12px] font-semibold text-[#4f8058]">{index + 1}</span><Link href={`/blocks/${block.id}`} className="min-w-0 flex-1 truncate text-[14px] font-medium hover:text-[#4f8058] hover:underline">{block.name}</Link><span className="shrink-0 text-[12px] text-[#6d746a]">{metric(block)}</span></li>)}</ol> : <p className="mt-4 text-[13px] text-[#777e74]">対象データがありません。</p>}</section>;
}

function BlockFilterLink({ href, label, count, active, small = false }: { href: string; label: string; count: number; active: boolean; small?: boolean }) {
  const sizeClass = small ? "min-h-8 px-2.5 py-1 text-[11px]" : "min-h-9 px-3 py-1.5 text-[12px]";
  const stateClass = active
    ? "border-[#6f9a76] bg-[#e5f0e2] text-[#2f623c] ring-1 ring-[#8caf91]"
    : "border-[#d8ded3] bg-white text-[#536150] hover:border-[#9db49b] hover:bg-[#f4f8f1] hover:text-[#3f7049]";
  const badgeClass = active ? "bg-[#c9dfc7] text-[#2f623c]" : "bg-[#f0f2ed] text-[#667062]";

  return (
    <Link
      href={href}
      prefetch={false}
      aria-current={active ? "page" : undefined}
      aria-label={`${label} ${count}件`}
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76] focus-visible:ring-offset-1 ${sizeClass} ${stateClass}`}
    >
      <span className="min-w-0 truncate">{label}</span>
      <span className={`inline-flex min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${badgeClass}`}>{count}</span>
    </Link>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block min-w-0"><span className="mb-1.5 block text-[12px] font-semibold text-[#656c63]">{label}</span>{children}</label>;
}

function FilterSelect({ label, name, value, options }: { label: string; name: string; value?: string; options: ReadonlyArray<readonly [string, string]> }) {
  return <FilterField label={label}><select name={name} defaultValue={value ?? options[0]?.[0] ?? ""} className="h-10 w-full min-w-0 rounded-lg border border-[#dcd6cc] bg-white px-3 text-[13px] text-[#3f463e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]">{options.map(([optionValue, optionLabel]) => <option key={`${name}-${optionValue}`} value={optionValue}>{optionLabel}</option>)}</select></FilterField>;
}

function TableHead({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <th scope="col" className={`whitespace-nowrap px-3 py-3 ${className}`}>{children}</th>; }
function TableCell({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <td className={`px-3 py-3 align-middle text-[#3e453d] ${className}`}>{children}</td>; }
function HeaderStat({ label, value, tone = "green" }: { label: string; value: string; tone?: "green" | "coral" | "purple" }) { const color = tone === "coral" ? "text-[#bd5d50]" : tone === "purple" ? "text-[#7568a7]" : "text-[#477b52]"; return <div className="rounded-lg bg-[#f7f5f0] px-2.5 py-2 text-center"><p className="text-[11px] text-[#7a8077]">{label}</p><p className={`mt-0.5 text-[15px] font-semibold ${color}`}>{value}</p></div>; }
function MiniMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-[#f7f5f0] p-2"><p className="text-[11px] text-[#777e74]">{label}</p><p className="mt-0.5 font-semibold">{value}</p></div>; }

function ViewLink({ label, view, active, params }: { label: string; view: string; active: boolean; params: SearchParams }) {
  return <Link href={blockListHref(params, { view })} aria-current={active ? "page" : undefined} className={active ? "inline-flex h-8 items-center rounded-lg border border-[#88a98b] bg-[#e6f0e3] px-3 text-[12px] font-semibold text-[#386b46]" : "inline-flex h-8 items-center rounded-lg border border-[#ddd6cc] bg-white px-3 text-[12px] font-semibold text-[#626a60] hover:bg-[#f7f4ef]"}>{label}</Link>;
}

type BlockListQueryKey = "q" | "category" | "subcategory" | "tag" | "sort" | "view";

function blockListHref(params: SearchParams, changes: Partial<Record<BlockListQueryKey, string | undefined>>) {
  const query = new URLSearchParams();
  query.set("tab", "blocks");
  const keys: BlockListQueryKey[] = ["q", "category", "subcategory", "tag", "sort", "view"];
  for (const key of keys) {
    const value = Object.prototype.hasOwnProperty.call(changes, key) ? changes[key] : params[key];
    if (value) query.set(key, value);
  }
  return `/lessons?${query.toString()}`;
}

function countBlocksBy(blocks: DbBlockTemplate[], key: (block: DbBlockTemplate) => string | null) {
  const counts = new Map<string, number>();
  for (const block of blocks) {
    const value = key(block);
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function filterBlockLibrary(blocks: DbBlockTemplate[], params: SearchParams) {
  const q = params.q?.trim().toLowerCase();
  const filtered = blocks.filter((block) => {
    if (q && ![block.name, block.script, block.purpose, block.cautions, block.memo, block.tags.join(" ")].join(" ").toLowerCase().includes(q)) return false;
    if (params.category && block.categoryId !== params.category) return false;
    if (params.subcategory && block.subcategoryId !== params.subcategory) return false;
    if (params.tag && !block.tags.includes(params.tag)) return false;
    return true;
  });

  if (params.sort === "duration") return filtered.sort((left, right) => left.durationMinutes - right.durationMinutes);
  if (params.sort === "name") return filtered.sort((left, right) => left.name.localeCompare(right.name, "ja"));
  if (params.sort === "usage") return filtered.sort((left, right) => right.usageCount - left.usageCount || left.name.localeCompare(right.name, "ja"));
  if (params.sort === "good") return filtered.sort((left, right) => (right.goodRate ?? -1) - (left.goodRate ?? -1) || right.usageCount - left.usageCount);
  if (params.sort === "recent") return filtered.sort((left, right) => (right.lastUsedAt || "").localeCompare(left.lastUsedAt || "") || left.name.localeCompare(right.name, "ja"));
  return filtered.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

async function getCurrentTimestamp() { return Date.now(); }
function tokyoMonthKey(value: string) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit" }).formatToParts(new Date(value));
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  return `${year}-${month}`;
}
function formatMonthHeading(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return Number.isFinite(year) && Number.isFinite(month) ? `${year}年${month}月` : "日付不明";
}
function normalizeTab(value?: string): LessonTab { return value === "plans" || value === "blocks" || value === "records" || value === "analysis" ? value : "schedule"; }
function isRecordPending(schedule: DbSchedule, now: number) { return !schedule.activeClosure && (schedule.status === "record_pending" || (Date.parse(schedule.startsAt) < now && schedule.status !== "recorded")); }
function matchesPeriod(value: string, period: string | undefined, now: number) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp) || !period || period === "all") return true;
  if (period === "past") return timestamp < now;
  if (period === "future") return timestamp >= now;
  const current = new Date(now);
  const tokyo = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(current);
  const [year, month, day] = tokyo.split("-").map(Number);
  const start = period === "month" ? new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+09:00`) : startOfTokyoWeek(year, month, day);
  const end = period === "month" ? new Date(new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+09:00`).setMonth(month)) : new Date(start.getTime() + 7 * 86_400_000);
  return timestamp >= start.getTime() && timestamp < end.getTime();
}
function startOfTokyoWeek(year: number, month: number, day: number) { const date = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+09:00`); const weekday = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" })).getDay(); date.setDate(date.getDate() - (weekday === 0 ? 6 : weekday - 1)); return date; }
function unique(values: string[]) { return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "ja")); }
function uniqueBy<T>(values: T[], key: (value: T) => string) { const map = new Map<string, T>(); for (const value of values) if (!map.has(key(value))) map.set(key(value), value); return Array.from(map.values()); }
function groupBy<T>(values: T[], key: (value: T) => string) { const map = new Map<string, T[]>(); for (const value of values) { const group = key(value); map.set(group, [...(map.get(group) ?? []), value]); } return map; }
function formatShortDate(value: string) { return new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value)); }
