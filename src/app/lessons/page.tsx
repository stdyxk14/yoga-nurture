import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  FileText,
  Layers3,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageHeader, Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { getBlockCategories, getBlocks, getBlockTags, type BlockCategory, type DbBlockTemplate } from "@/lib/blocks";
import { getLessonPlans, type DbLessonPlan } from "@/lib/lesson-plans";
import { getLessonRecords, type DbLessonRecord } from "@/lib/lesson-records";
import { getSchedules, type DbSchedule } from "@/lib/schedules";

type LessonTab = "schedule" | "plans" | "blocks" | "records" | "analysis";
type AnalysisAxis = "usage" | "good" | "unused" | "improvement";

const tabs: Array<{ id: LessonTab; label: string; href: string; icon: LucideIcon }> = [
  { id: "schedule", label: "スケジュール", href: "/lessons", icon: CalendarDays },
  { id: "plans", label: "レッスンプラン", href: "/lessons?tab=plans", icon: ClipboardList },
  { id: "blocks", label: "ブロックテンプレート", href: "/lessons?tab=blocks", icon: Layers3 },
  { id: "records", label: "実施後記録", href: "/lessons?tab=records", icon: FileText },
  { id: "analysis", label: "ブロック分析", href: "/lessons?tab=analysis", icon: BarChart3 },
];

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; category?: string; subcategory?: string; tag?: string; sort?: string; analysis?: string }>;
}) {
  const params = await searchParams;
  const { tab } = params;
  const activeTab: LessonTab =
    tab === "plans" || tab === "blocks" || tab === "records" || tab === "analysis" ? tab : "schedule";
  const activeAnalysis: AnalysisAxis =
    params.analysis === "good" || params.analysis === "unused" || params.analysis === "improvement" ? params.analysis : "usage";
  const [blocks, categories, tags, plans, schedules, records] = await Promise.all([
    getBlocks(params),
    getBlockCategories(),
    getBlockTags(),
    getLessonPlans(),
    getSchedules(),
    getLessonRecords(),
  ]);

  return (
    <>
      <div className="md:hidden">
        <MobileLessonsPage activeTab={activeTab} activeAnalysis={activeAnalysis} blocks={blocks} categories={categories} tags={tags.map((tag) => tag.name)} plans={plans} schedules={schedules} records={records} />
      </div>
      <div className="hidden md:block">
      <PageHeader
        title="レッスンカルテ"
        subtitle="ブロック原稿を組み合わせて、準備・出力・振り返りまで管理"
      />

      <SoftCard className="mb-3 p-2.5">
        <div className="grid grid-cols-5 gap-2">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={
                  active
                    ? "flex h-10 items-center justify-center gap-2 rounded-xl bg-[#5d956d] text-[12px] font-bold text-white shadow-[0_8px_18px_rgba(64,113,77,0.18)]"
                    : "flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dbe4d6] bg-white/72 text-[12px] font-bold text-[#4f7b58]"
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </SoftCard>

      {activeTab === "schedule" ? <ScheduleTab schedules={schedules} /> : null}
      {activeTab === "plans" ? <PlansTab plans={plans} /> : null}
      {activeTab === "blocks" ? <BlocksTab blocks={blocks} categories={categories} tags={tags.map((tag) => tag.name)} /> : null}
      {activeTab === "records" ? <RecordsTab records={records} /> : null}
      {activeTab === "analysis" ? <AnalysisTab blocks={blocks} activeAxis={activeAnalysis} /> : null}
      </div>
    </>
  );
}

export const dynamic = "force-dynamic";

function MobileLessonsPage({
  activeTab,
  activeAnalysis,
  blocks,
  categories,
  tags,
  plans,
  schedules,
  records,
}: {
  activeTab: LessonTab;
  activeAnalysis: AnalysisAxis;
  blocks: DbBlockTemplate[];
  categories: BlockCategory[];
  tags: string[];
  plans: DbLessonPlan[];
  schedules: DbSchedule[];
  records: DbLessonRecord[];
}) {
  return (
    <div className="mx-auto max-w-[430px] space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={activeTab === tab.id ? "shrink-0 rounded-full bg-[#7ea06f] px-4 py-2 text-[12px] font-bold text-white" : "shrink-0 rounded-full border border-[#e1d9ce] bg-white/80 px-4 py-2 text-[12px] font-bold text-[#5d6b58]"}
          >
            {tab.id === "schedule" ? "予定" : tab.id === "plans" ? "プラン" : tab.id === "blocks" ? "ブロック" : tab.id === "records" ? "記録" : "分析"}
          </Link>
        ))}
      </div>

      {activeTab === "schedule" ? <MobileScheduleTab schedules={schedules} /> : null}
      {activeTab === "plans" ? <MobilePlansTab plans={plans} /> : null}
      {activeTab === "blocks" ? <MobileBlocksList blocks={blocks} categories={categories} tags={tags} /> : null}
      {activeTab === "records" ? <MobileRecordsTab records={records} /> : null}
      {activeTab === "analysis" ? <MobileAnalysisTab blocks={blocks} activeAxis={activeAnalysis} /> : null}
    </div>
  );
}

function MobileTabIntro({ title, body, primaryHref, primaryLabel }: { title: string; body: string; primaryHref: string; primaryLabel: string }) {
  return (
    <section className="rounded-3xl border border-[#eee4d8] bg-white/78 p-4 shadow-[0_10px_24px_rgba(91,76,53,0.06)]">
      <h1 className="text-[20px] font-extrabold">{title}</h1>
      <p className="mt-1 text-[12px] font-medium leading-5 text-[#6b7468]">{body}</p>
      <Link href={primaryHref} className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#7ea06f] text-[12px] font-bold text-white">{primaryLabel}</Link>
    </section>
  );
}

function MobileScheduleTab({ schedules }: { schedules: DbSchedule[] }) {
  return (
    <div className="space-y-3">
      <MobileTabIntro title="レッスン予定" body="登録済みの予定を確認します。" primaryHref="/schedules/new" primaryLabel="予定を登録" />
      {schedules.length ? schedules.map((schedule) => (
        <article key={schedule.id} className="rounded-3xl border border-[#eee4d8] bg-white/78 p-4 shadow-[0_8px_18px_rgba(91,76,53,0.05)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-extrabold">{schedule.lessonName}</h2>
              <p className="mt-1 text-[12px] font-bold text-[#5d956d]">{schedule.dateLabel} {schedule.startTimeLabel}-{schedule.endTimeLabel}</p>
              <p className="mt-1 truncate text-[11px] font-medium text-[#6b7468]">{schedule.lessonPlanName} / {schedule.place || "場所未設定"} / {schedule.participantCount}名</p>
            </div>
            <ScheduleStatusBadge label={schedule.statusLabel} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Link href={`/schedules/${schedule.id}`} className="inline-flex h-9 items-center justify-center rounded-xl border border-[#cfe1ca] bg-[#f8fcf6] text-[12px] font-bold text-[#5d956d]">詳細</Link>
            {schedule.lessonPlanId ? (
              <Link href={`/lessons/${schedule.lessonPlanId}/script`} className="inline-flex h-9 items-center justify-center rounded-xl border border-[#e6dff2] bg-[#faf7ff] text-[12px] font-bold text-[#7469bf]">原稿</Link>
            ) : (
              <span className="inline-flex h-9 items-center justify-center rounded-xl border border-[#e7dfd4] bg-[#f4f1ea] text-[12px] font-bold text-[#9b8c7b]">原稿なし</span>
            )}
            <Link href={`/lessons/${schedule.id}/record`} className="inline-flex h-9 items-center justify-center rounded-xl bg-[#ef6f5b] text-[12px] font-bold text-white">記録</Link>
          </div>
        </article>
      )) : <SchedulesEmptyState />}
    </div>
  );
}

function MobilePlansTab({ plans }: { plans: DbLessonPlan[] }) {
  return (
    <div className="space-y-3">
      <MobileTabIntro title="レッスンプラン" body="保存済みのレッスンプランを確認します。" primaryHref="/lessons/new" primaryLabel="レッスンプランを作成" />
      {plans.length ? plans.map((plan) => (
        <article key={plan.id} className="rounded-3xl border border-[#eee4d8] bg-white/78 p-4 shadow-[0_8px_18px_rgba(91,76,53,0.05)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-extrabold">{plan.name}</h2>
              <p className="mt-1 text-[12px] font-bold text-[#5d956d]">{plan.theme || "テーマ未設定"}</p>
              <p className="mt-1 truncate text-[11px] font-medium text-[#6b7468]">{plan.blockCount}ブロック / {plan.totalMinutes}分 / 更新 {formatShortDate(plan.updatedAt)}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#edf5ef] px-2 py-1 text-[11px] font-bold text-[#4f875a]">{plan.statusLabel}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {plan.tags.length ? plan.tags.slice(0, 3).map((tag) => <Pill key={tag}>{tag}</Pill>) : <Pill>タグ未設定</Pill>}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Link href={`/lessons/${plan.id}`} className="inline-flex h-9 items-center justify-center rounded-xl border border-[#cfe1ca] bg-[#f8fcf6] text-[12px] font-bold text-[#5d956d]">詳細</Link>
            <Link href={`/lessons/${plan.id}/script`} className="inline-flex h-9 items-center justify-center rounded-xl border border-[#e6dff2] bg-[#faf7ff] text-[12px] font-bold text-[#7469bf]">原稿</Link>
            <Link href={`/lessons/${plan.id}/edit`} className="inline-flex h-9 items-center justify-center rounded-xl bg-[#7ea06f] text-[12px] font-bold text-white">編集</Link>
          </div>
        </article>
      )) : <PlansEmptyState />}
    </div>
  );
}

function MobileBlocksList({ blocks, categories, tags }: { blocks: DbBlockTemplate[]; categories: BlockCategory[]; tags: string[] }) {
  return (
    <div className="space-y-3">
      <MobileTabIntro title="ブロックテンプレート" body="原稿ブロックを検索し、プラン作成に再利用します。" primaryHref="/blocks/new" primaryLabel="＋ ブロックを登録" />
      <form action="/lessons" className="space-y-3">
        <input type="hidden" name="tab" value="blocks" />
        <div className="flex items-center gap-2 rounded-2xl border border-[#e7dfd4] bg-white/80 px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-[#6b7468]" />
        <Input name="q" placeholder="ブロック名・タグ・原稿を検索" className="h-9 border-0 bg-transparent px-0 text-[13px] shadow-none focus-visible:ring-0" />
        </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link href="/lessons?tab=blocks" className="shrink-0 rounded-full bg-[#7ea06f] px-4 py-2 text-[12px] font-bold text-white">すべて</Link>
        {categories.filter((category) => !category.archived).map((category) => (
          <Link key={category.id} href={`/lessons?tab=blocks&category=${category.id}`} className="shrink-0 rounded-full border border-[#e1d9ce] bg-white/80 px-4 py-2 text-[12px] font-bold text-[#5d6b58]">{category.name}</Link>
        ))}
      </div>
      <div className="grid grid-cols-[1fr_96px] gap-2">
        <select name="tag" className="h-10 rounded-xl border border-[#e1d9ce] bg-white/80 px-3 text-[12px] font-bold text-[#5d6b58]">
          <option value="">すべてのタグ</option>
          {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
        </select>
        <button className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d8e3d4] bg-white text-[12px] font-bold text-[#4f7b58]">検索</button>
      </div>
      </form>
      {blocks.length ? blocks.map((block, index) => (
        <MobileBlockListCard key={block.id} block={block} index={index} />
      )) : <BlocksEmptyState />}
    </div>
  );
}

function MobileBlockListCard({ block, index }: { block: DbBlockTemplate; index: number }) {
  const colors = ["bg-[#e5efdf] text-[#5d956d]", "bg-[#f6ead9] text-[#9b7338]", "bg-[#eee9fb] text-[#8b68bd]", "bg-[#fff0ea] text-[#d96c55]"];
  return (
    <article className="rounded-3xl border border-[#eee4d8] bg-white/80 p-3 shadow-[0_8px_18px_rgba(91,76,53,0.05)]">
      <div className="grid grid-cols-[42px_1fr_auto] gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${colors[index % colors.length]}`}>
          <Layers3 className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-extrabold">{block.name}</h2>
          <p className="truncate text-[11px] font-bold text-[#5d956d]">{block.majorCategory} / {block.minorCategory}</p>
        </div>
        <span className="rounded-full bg-[#fff7e8] px-2 py-1 text-[11px] font-bold text-[#9b7338]">{block.duration}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {block.tags.slice(0, 3).map((tag) => <Pill key={tag}>{tag}</Pill>)}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-center">
        <MiniStat label="使用" value={`${block.usageCount}回`} />
        <MiniStat label="良かった率" value={formatGoodRate(block)} />
        <MiniStat label="改善メモ" value={`${block.improvementCount ?? 0}件`} />
        <MiniStat label="最近" value={block.lastUsed} />
      </div>
      <p className="mt-2 line-clamp-2 text-[12px] font-medium leading-5 text-[#50584e]">{block.script}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Link href={`/blocks/${block.id}`} className="inline-flex h-9 items-center justify-center rounded-xl border border-[#d8e3d4] bg-white text-[12px] font-bold text-[#4f7b58]">詳細</Link>
        <Link href={`/blocks/${block.id}/edit`} className="inline-flex h-9 items-center justify-center rounded-xl border border-[#d8e3d4] bg-white text-[12px] font-bold text-[#4f7b58]">編集</Link>
        <Link href="/lessons/new" className="inline-flex h-9 items-center justify-center rounded-xl bg-[#7ea06f] text-[12px] font-bold text-white">使う</Link>
      </div>
    </article>
  );
}

function MobileRecordsTab({ records }: { records: DbLessonRecord[] }) {
  return (
    <div className="space-y-3">
      <MobileTabIntro title="実施後記録" body="保存済みのレッスン後記録を確認します。" primaryHref="/lessons" primaryLabel="予定から記録を書く" />
      {records.length ? records.map((record) => (
        <article key={record.id} className="rounded-3xl border border-[#eee4d8] bg-white/78 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-extrabold">{record.lessonName}</h2>
              <p className="mt-1 text-[12px] font-bold text-[#5d956d]">{record.recordDate} / {record.participantCount}名</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#edf5ef] px-2 py-1 text-[11px] font-bold text-[#4f875a]">{record.statusLabel}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-[12px] font-medium leading-5 text-[#50584e]">{record.overallMemo || record.overallReaction || "記録メモは未入力です。"}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {record.scheduleId ? <Link href={`/lessons/${record.scheduleId}/record#ai-reflection`} className="inline-flex h-9 items-center justify-center rounded-xl bg-[#5d956d] text-[12px] font-bold text-white">AI振り返り</Link> : null}
            {record.scheduleId ? <Link href={`/lessons/${record.scheduleId}/record`} className="inline-flex h-9 items-center justify-center rounded-xl bg-[#ef6f5b] text-[12px] font-bold text-white">記録を見る</Link> : null}
            {record.lessonPlanId ? <Link href={`/lessons/${record.lessonPlanId}`} className="inline-flex h-9 items-center justify-center rounded-xl border border-[#cfe1ca] bg-[#f8fcf6] text-[12px] font-bold text-[#5d956d]">プラン</Link> : null}
          </div>
        </article>
      )) : <RecordsEmptyState />}
    </div>
  );
}

function MobileAnalysisTab({ blocks, activeAxis }: { blocks: DbBlockTemplate[]; activeAxis: AnalysisAxis }) {
  const config = analysisConfig[activeAxis];
  const rows = buildAnalysisRows(blocks, activeAxis);
  return (
    <div className="space-y-3">
      <MobileTabIntro title="ブロック分析" body="よく使うブロック、反応が良いブロック、改善が必要なブロックを確認します。" primaryHref="/reports" primaryLabel="レポートを見る" />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {analysisAxes.map((axis) => (
          <Link key={axis.id} href={`/lessons?tab=analysis&analysis=${axis.id}`} className={axis.id === activeAxis ? "shrink-0 rounded-full bg-[#7ea06f] px-4 py-2 text-[12px] font-bold text-white" : "shrink-0 rounded-full border border-[#e1d9ce] bg-white/80 px-4 py-2 text-[12px] font-bold text-[#5d6b58]"}>
            {axis.shortLabel}
          </Link>
        ))}
      </div>
      <SoftCard className="p-4">
        <SectionTitle icon={BarChart3} title={config.title} subtitle={config.subtitle} />
        <div className="mt-3 grid gap-3">
          {rows.length ? rows.map((block, index) => <AnalysisBlockCard key={block.id} block={block} index={index} activeAxis={activeAxis} compact />) : <AnalysisEmpty axis={activeAxis} />}
        </div>
      </SoftCard>
    </div>
  );
}

function ScheduleTab({ schedules }: { schedules: DbSchedule[] }) {
  return (
    <>
      <section className="mb-3 flex justify-end">
        <Link
          href="/schedules/new"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(64,113,77,0.2)]"
        >
          <Plus className="h-4 w-4" />
          予定を登録
        </Link>
      </section>

      <SoftCard className="p-3.5">
        <SectionTitle icon={CalendarDays} title="スケジュール" subtitle="Supabaseに保存された予定だけを表示します。" />
        {schedules.length ? (
          <div className="mt-3 grid gap-2">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="grid grid-cols-[100px_95px_minmax(150px,1fr)_minmax(120px,0.8fr)_80px_90px_210px] items-center gap-2 rounded-xl border border-[#eee4d8] bg-white/72 px-3 py-2.5"
              >
                <p className="text-[12px] font-bold">{schedule.dateLabel}</p>
                <p className="text-[12px] font-bold">{schedule.startTimeLabel}-{schedule.endTimeLabel}</p>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-extrabold">{schedule.lessonName}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#6b7468]">
                    <MapPin className="h-3 w-3" />
                    {schedule.place || "場所未設定"} / {schedule.formatLabel}
                  </p>
                </div>
                <p className="truncate text-[12px] font-bold text-[#4f875a]">{schedule.lessonPlanName}</p>
                <p className="text-[12px] font-bold text-[#4f875a]">{schedule.participantCount}名</p>
                <ScheduleStatusBadge label={schedule.statusLabel} />
                <div className="grid grid-cols-3 gap-1">
                  <Link href={`/schedules/${schedule.id}`} className="inline-flex h-8 items-center justify-center rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-2 text-[11px] font-bold text-[#5d956d]">
                    詳細
                  </Link>
                  {schedule.lessonPlanId ? (
                    <Link href={`/lessons/${schedule.lessonPlanId}/script`} className="inline-flex h-8 items-center justify-center rounded-lg bg-[#5d956d] px-2 text-[11px] font-bold text-white">
                      原稿
                    </Link>
                  ) : (
                    <span className="inline-flex h-8 items-center justify-center rounded-lg border border-[#e7dfd4] bg-[#f4f1ea] px-2 text-[11px] font-bold text-[#9b8c7b]">
                      原稿なし
                  </span>
                  )}
                  <Link href={`/lessons/${schedule.id}/record`} className="inline-flex h-8 items-center justify-center rounded-lg bg-[#ef6f5b] px-2 text-[11px] font-bold text-white">
                    記録
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : <SchedulesEmptyState />}
      </SoftCard>
    </>
  );
}

function PlansTab({ plans }: { plans: DbLessonPlan[] }) {
  return (
    <>
      <div className="mb-3 flex justify-end gap-2">
        <Link href="/lessons/new" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white">
          <Plus className="h-4 w-4" />
          レッスンプランを作成
        </Link>
      </div>
      {plans.length ? (
        <div className="grid gap-3">
          {plans.map((plan) => (
            <SoftCard key={plan.id} className="p-3.5">
              <div className="grid grid-cols-[minmax(0,1fr)_130px_190px] items-center gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <h2 className="truncate text-[17px] font-extrabold">{plan.name}</h2>
                    <span className="shrink-0 rounded-full bg-[#edf5ef] px-2 py-1 text-[11px] font-bold text-[#4f875a]">{plan.statusLabel}</span>
                  </div>
                  <p className="text-[12px] font-semibold text-[#5f665c]">
                    {plan.theme || "テーマ未設定"} / {plan.place || "場所未設定"} / {plan.formatLabel} / 更新 {formatShortDate(plan.updatedAt)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {plan.tags.length ? plan.tags.map((tag) => <Pill key={tag}>{tag}</Pill>) : <Pill>タグ未設定</Pill>}
                  </div>
                </div>
                <div className="rounded-xl border border-[#eee4d8] bg-white/65 p-2 text-center">
                  <p className="text-[11px] font-bold text-[#7c8476]">使用ブロック</p>
                  <p className="text-[28px] font-extrabold text-[#4f875a]">{plan.blockCount}</p>
                  <p className="text-[11px] font-bold text-[#7c8476]">{plan.totalMinutes}分</p>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Link href={`/lessons/${plan.id}`} className="inline-flex h-8 items-center justify-center rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-2 text-center text-[12px] font-bold text-[#5d956d]">詳細</Link>
                  <Link href={`/lessons/${plan.id}/edit`} className="inline-flex h-8 items-center justify-center rounded-lg border border-[#cfe1ca] bg-white text-[12px] font-bold text-[#5d956d]">編集</Link>
                  <Link href={`/lessons/${plan.id}/script`} className="col-span-2 inline-flex h-8 items-center justify-center rounded-lg bg-[#5d956d] text-[12px] font-bold text-white">原稿を見る</Link>
                </div>
              </div>
            </SoftCard>
          ))}
        </div>
      ) : <PlansEmptyState />}
    </>
  );
}

function BlocksTab({ blocks, categories, tags }: { blocks: DbBlockTemplate[]; categories: BlockCategory[]; tags: string[] }) {
  return (
    <>
      <form action="/lessons" className="mb-3 grid grid-cols-[minmax(0,1fr)_150px_150px_140px_130px_auto_auto] items-center gap-2">
        <input type="hidden" name="tab" value="blocks" />
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#e7dfd4] bg-white/80 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-[#6b7468]" />
          <Input name="q" placeholder="ブロック名、タグ、原稿内の言葉で検索" className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
        </div>
        <select name="category" className="h-10 rounded-xl border border-[#e1d9ce] bg-white/80 px-3 text-[12px] font-bold text-[#5d6b58]">
          <option value="">大カテゴリー</option>
          {categories.filter((category) => !category.archived).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select name="subcategory" className="h-10 rounded-xl border border-[#e1d9ce] bg-white/80 px-3 text-[12px] font-bold text-[#5d6b58]">
          <option value="">小カテゴリー</option>
          {categories.flatMap((category) => category.subcategories).filter((subcategory) => !subcategory.archived).map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
        </select>
        <select name="tag" className="h-10 rounded-xl border border-[#e1d9ce] bg-white/80 px-3 text-[12px] font-bold text-[#5d6b58]">
          <option value="">タグ</option>
          {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
        </select>
        <select name="sort" className="h-10 rounded-xl border border-[#e1d9ce] bg-white/80 px-3 text-[12px] font-bold text-[#5d6b58]">
          <option value="updated">更新日順</option>
          <option value="duration">目安時間順</option>
          <option value="name">ブロック名順</option>
        </select>
        <button className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d8e3d4] bg-white px-4 text-[12px] font-bold text-[#4f7b58]">検索</button>
        <Link href="/blocks/new" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white">
          <Plus className="h-4 w-4" />
          ブロックを登録
        </Link>
      </form>

      <SoftCard className="mb-3 p-3">
        <div className="flex flex-wrap gap-2">
          <Pill active>実データ表示</Pill>
          <Pill>良かった率：レッスン後記録で「良かった」と記録された割合</Pill>
          <Pill>改善メモ数：ブロック改善候補の件数</Pill>
        </div>
      </SoftCard>

      {blocks.length ? (
        <div className="grid grid-cols-3 items-stretch gap-3">
        {blocks.map((block) => (
          <SoftCard key={block.id} className="flex min-h-[305px] flex-col p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-[16px] font-extrabold">{block.name}</h2>
                <p className="mt-1 truncate text-[12px] font-bold text-[#5d956d]" title={`${block.majorCategory} / ${block.minorCategory}`}>{block.majorCategory} / {block.minorCategory}</p>
              </div>
              <span className="rounded-full bg-[#edf5ef] px-2 py-1 text-[11px] font-bold text-[#4f875a]">{block.duration}</span>
            </div>
            <p className="line-clamp-3 min-h-[60px] text-[12px] font-medium leading-5 text-[#50584e]">{block.script}</p>
            <p className="mt-1 line-clamp-1 min-h-5 text-[11px] font-bold text-[#d96c55]" title={block.cautions}>注意：{block.cautions}</p>
            <div className="mt-2 flex min-h-[30px] flex-wrap gap-1 overflow-hidden">
              {block.tags.slice(0, 3).map((tag) => <Pill key={tag}>{tag}</Pill>)}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <MiniStat label="使用" value={`${block.usageCount}回`} />
              <MiniStat label="良かった率" value={formatGoodRate(block)} />
              <MiniStat label="改善メモ" value={`${block.improvementCount ?? 0}件`} />
              <MiniStat label="最近" value={block.lastUsed} />
            </div>
            <div className="mt-auto grid grid-cols-3 gap-1.5 pt-3">
              <Link href={`/blocks/${block.id}`} className="inline-flex h-8 items-center justify-center rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] text-[12px] font-bold text-[#5d956d]">詳細</Link>
              <Link href={`/blocks/${block.id}/edit`} className="inline-flex h-8 items-center justify-center rounded-lg border border-[#e7dfd4] bg-white text-[12px] font-bold text-[#6b7468]">編集</Link>
              <Link href="/lessons/new" className="inline-flex h-8 items-center justify-center rounded-lg bg-[#5d956d] text-[12px] font-bold text-white">使う</Link>
            </div>
          </SoftCard>
        ))}
        </div>
      ) : <BlocksEmptyState />}
    </>
  );
}

function BlocksEmptyState() {
  return (
    <SoftCard className="p-6 text-center">
      <Layers3 className="mx-auto h-10 w-10 text-[#5d956d]" />
      <p className="mt-3 text-[15px] font-extrabold">まだブロックテンプレートが登録されていません。</p>
      <p className="mt-1 text-[13px] font-semibold text-[#6b7468]">よく使う誘導セリフやレッスンパートを登録しましょう。</p>
      <div className="mt-4 flex justify-center gap-2">
        <Link href="/blocks/new" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white">
          <Plus className="h-4 w-4" />ブロックを登録
        </Link>
        <Link href="/settings#block-categories" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58]">
          カテゴリーを設定する
        </Link>
      </div>
    </SoftCard>
  );
}

function formatGoodRate(block: DbBlockTemplate) {
  return typeof block.goodRate === "number" ? `${block.goodRate}%` : "評価データなし";
}

function PlansEmptyState() {
  return (
    <SoftCard className="p-6 text-center">
      <ClipboardList className="mx-auto h-10 w-10 text-[#5d956d]" />
      <p className="mt-3 text-[15px] font-extrabold">まだレッスンプランがありません。</p>
      <p className="mx-auto mt-1 max-w-xl text-[13px] font-semibold leading-6 text-[#6b7468]">
        ブロックを組み合わせて、印刷できるレッスン原稿を作成しましょう。
      </p>
      <Link href="/lessons/new" className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white">
        <Plus className="h-4 w-4" />
        レッスンプランを作成
      </Link>
    </SoftCard>
  );
}

function SchedulesEmptyState() {
  return (
    <SoftCard className="mt-3 p-6 text-center">
      <CalendarDays className="mx-auto h-10 w-10 text-[#5d956d]" />
      <p className="mt-3 text-[15px] font-extrabold">まだ予定が登録されていません。</p>
      <p className="mx-auto mt-1 max-w-xl text-[13px] font-semibold leading-6 text-[#6b7468]">
        作成済みのレッスンプランを選んで予定を登録しましょう。
      </p>
      <Link href="/schedules/new" className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white">
        <Plus className="h-4 w-4" />
        予定を登録
      </Link>
    </SoftCard>
  );
}

function RecordsEmptyState() {
  return (
    <SoftCard className="mt-3 p-6 text-center">
      <FileText className="mx-auto h-10 w-10 text-[#5d956d]" />
      <p className="mt-3 text-[15px] font-extrabold">まだ実施後記録はありません。</p>
      <p className="mx-auto mt-1 max-w-xl text-[13px] font-semibold leading-6 text-[#6b7468]">
        レッスン後に記録を書くと、ブロック評価や生徒コメントがここに蓄積されます。
      </p>
      <Link href="/lessons" className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white">
        <CalendarDays className="h-4 w-4" />
        スケジュールを見る
      </Link>
    </SoftCard>
  );
}

function RecordsTab({ records }: { records: DbLessonRecord[] }) {
  return (
    <SoftCard className="p-3.5">
      <SectionTitle icon={FileText} title="実施後記録" subtitle="レッスン後にブロック評価と生徒コメントを入力" />
      {records.length ? (
        <div className="grid gap-2">
        {records.map((record) => (
          <div key={record.id} className="grid grid-cols-[110px_minmax(150px,0.9fr)_95px_90px_90px_minmax(140px,1fr)_250px] items-center gap-2 rounded-xl border border-[#eee4d8] bg-white/72 p-3">
            <p className="text-[12px] font-bold">{record.recordDate}</p>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-extrabold">{record.lessonName}</p>
              <p className="truncate text-[11px] font-medium text-[#6b7468]">{record.lessonPlanName}</p>
            </div>
            <p className="text-[12px] font-bold text-[#4f875a]">{record.participantCount}名</p>
            <span className="inline-flex h-7 items-center justify-center rounded-full border border-[#cfe1ca] bg-[#edf5ef] px-2 text-[11px] font-bold text-[#4f875a]">{record.statusLabel}</span>
            <p className="text-[12px] font-bold text-[#7469bf]">{record.blockCount}件</p>
            <p className="line-clamp-2 text-[12px] font-medium leading-5">{record.overallMemo || record.overallReaction || "記録メモは未入力です。"}</p>
            <div className="grid grid-cols-3 gap-1.5">
              {record.scheduleId ? <Link href={`/lessons/${record.scheduleId}/record#ai-reflection`} className="inline-flex h-8 items-center justify-center rounded-lg bg-[#5d956d] text-[12px] font-bold text-white">AI振り返り</Link> : <span />}
              {record.scheduleId ? <Link href={`/lessons/${record.scheduleId}/record`} className="inline-flex h-8 items-center justify-center rounded-lg bg-[#ef6f5b] text-[12px] font-bold text-white">編集</Link> : <span />}
              {record.lessonPlanId ? <Link href={`/lessons/${record.lessonPlanId}`} className="inline-flex h-8 items-center justify-center rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] text-[12px] font-bold text-[#5d956d]">プラン</Link> : <span />}
            </div>
          </div>
        ))}
        </div>
      ) : <RecordsEmptyState />}
    </SoftCard>
  );
}

function AnalysisTab({ blocks, activeAxis }: { blocks: DbBlockTemplate[]; activeAxis: AnalysisAxis }) {
  const config = analysisConfig[activeAxis];
  const rows = buildAnalysisRows(blocks, activeAxis);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_280px] gap-3">
      <SoftCard className="p-3.5">
        <SectionTitle icon={BarChart3} title={config.title} subtitle={config.subtitle} />
        <div className="mt-3 grid grid-cols-2 gap-3 2xl:grid-cols-3">
          {rows.length ? rows.map((block, index) => <AnalysisBlockCard key={block.id} block={block} index={index} activeAxis={activeAxis} />) : <AnalysisEmpty axis={activeAxis} />}
        </div>
      </SoftCard>
      <SoftCard className="p-3.5">
        <SectionTitle icon={SlidersHorizontal} title="分析軸" />
        <div className="grid gap-2">
          {analysisAxes.map((item) => (
            <Link
              key={item.id}
              href={`/lessons?tab=analysis&analysis=${item.id}`}
              className={item.id === activeAxis ? "rounded-lg bg-[#5d956d] p-2 text-[12px] font-bold text-white" : "rounded-lg border border-[#eee4d8] bg-white/70 p-2 text-[12px] font-bold text-[#4f7b58]"}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </SoftCard>
    </div>
  );
}

const analysisAxes: Array<{ id: AnalysisAxis; label: string; shortLabel: string }> = [
  { id: "usage", label: "ブロック使用回数ランキング", shortLabel: "使用回数" },
  { id: "good", label: "反応が良かったブロック", shortLabel: "良かった率" },
  { id: "unused", label: "最近使っていないブロック", shortLabel: "未使用" },
  { id: "improvement", label: "改善メモが多いブロック", shortLabel: "改善メモ" },
];

const analysisConfig: Record<AnalysisAxis, { title: string; subtitle: string }> = {
  usage: { title: "ブロック使用回数ランキング", subtitle: "実施後記録で「実施した」ブロックを使用回数順に表示します。" },
  good: { title: "反応が良かったブロック", subtitle: "生徒の反応が「良かった」と記録された割合が高い順です。" },
  unused: { title: "最近使っていないブロック", subtitle: "未使用ブロックと最近使用日が古いブロックを優先して表示します。" },
  improvement: { title: "改善メモが多いブロック", subtitle: "改善メモが多い順に、見直し候補を確認します。" },
};

function buildAnalysisRows(blocks: DbBlockTemplate[], axis: AnalysisAxis) {
  const rows = [...blocks];
  if (axis === "usage") return rows.filter((block) => block.usageCount > 0).sort((a, b) => b.usageCount - a.usageCount || (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? "")).slice(0, 12);
  if (axis === "good") return rows.filter((block) => block.goodRate !== null && block.goodRate !== undefined).sort((a, b) => (b.goodRate ?? -1) - (a.goodRate ?? -1) || b.usageCount - a.usageCount).slice(0, 12);
  if (axis === "improvement") return rows.filter((block) => (block.improvementCount ?? 0) > 0).sort((a, b) => (b.improvementCount ?? 0) - (a.improvementCount ?? 0) || b.usageCount - a.usageCount).slice(0, 12);
  return rows.sort((a, b) => {
    const aDate = a.lastUsedAt || "";
    const bDate = b.lastUsedAt || "";
    if (!aDate && bDate) return -1;
    if (aDate && !bDate) return 1;
    return aDate.localeCompare(bDate);
  }).slice(0, 12);
}

function AnalysisBlockCard({ block, index, activeAxis, compact = false }: { block: DbBlockTemplate; index: number; activeAxis: AnalysisAxis; compact?: boolean }) {
  const axisNote =
    activeAxis === "good" && (block.usageCount < 3 ? "評価データ少なめ" : "反応傾向あり");
  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-[#eee4d8] bg-white/70 p-3">
      <div className="flex items-start gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#edf5ef] text-[13px] font-extrabold text-[#5d956d]">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <Link href={`/blocks/${block.id}`} className="line-clamp-1 text-[14px] font-extrabold text-[#30362f] hover:text-[#5d956d]">{block.name}</Link>
          <p className="mt-1 truncate text-[11px] font-bold text-[#5d956d]">{block.majorCategory} / {block.minorCategory}</p>
        </div>
      </div>
      <div className={`mt-3 grid ${compact ? "grid-cols-2" : "grid-cols-3"} gap-2 text-center`}>
        <MiniStat label="使用" value={`${block.usageCount}回`} />
        <MiniStat label="良かった率" value={formatGoodRate(block)} />
        <MiniStat label="改善" value={`${block.improvementCount ?? 0}件`} />
        <MiniStat label="スキップ" value={`${block.skipCount ?? 0}回`} />
        <MiniStat label="最近" value={block.lastUsed} />
      </div>
      {axisNote ? <p className="mt-2 rounded-lg bg-[#fff7e8] px-2 py-1 text-[11px] font-bold text-[#9b7338]">{axisNote}</p> : null}
      <Link href={`/blocks/${block.id}`} className="mt-3 inline-flex h-8 items-center justify-center rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] text-[12px] font-bold text-[#5d956d]">詳細を見る</Link>
    </article>
  );
}

function AnalysisEmpty({ axis }: { axis: AnalysisAxis }) {
  const text =
    axis === "usage"
      ? "まだ実施済みブロックの記録がありません。"
      : axis === "good"
        ? "まだ反応を評価できる記録がありません。"
        : axis === "improvement"
          ? "改善メモがあるブロックはまだありません。"
          : "表示できるブロックがありません。";
  return <div className="rounded-xl border border-dashed border-[#d8e3d4] bg-[#f8fcf6] p-4 text-[13px] font-semibold text-[#657064]">{text}</div>;
}

function ScheduleStatusBadge({ label }: { label: string }) {
  const className =
    label === "記録済み"
      ? "border-[#cfe1ca] bg-[#edf5ef] text-[#4f875a]"
      : label === "記録待ち"
        ? "border-[#f2c9bd] bg-[#fff0ea] text-[#ec6f5d]"
        : label === "事前準備済み"
          ? "border-[#cfe1ca] bg-[#f4f8f1] text-[#4f875a]"
          : "border-[#d8d1ef] bg-[#f2efff] text-[#6b61b8]";

  return <span className={`inline-flex h-7 items-center justify-center rounded-full border px-2 text-[11px] font-bold ${className}`}>{label}</span>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#eee4d8] bg-white/66 p-1.5">
      <p className="text-[10px] font-bold text-[#7c8476]">{label}</p>
      <p className="truncate text-[12px] font-extrabold">{value}</p>
    </div>
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", timeZone: "Asia/Tokyo" }).format(new Date(value));
}
