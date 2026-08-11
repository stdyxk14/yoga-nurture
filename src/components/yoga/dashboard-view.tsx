"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CalendarPlus2,
  ChartNoAxesCombined,
  ChevronRight,
  CircleAlert,
  Clock3,
  FilePenLine,
  Layers3,
  Lightbulb,
  ListChecks,
  MapPin,
  NotebookPen,
  Search,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import type { ContinueItem, DashboardData } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

export function DashboardView({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-5 pb-10" data-dashboard="discovery-cockpit">
      <CockpitTopBar data={data} />

      {data.error ? (
        <div className="liquid-panel flex items-start gap-3 rounded-2xl border-[#edc9bd] bg-[#fff7f3]/90 p-4 text-[13px] font-semibold leading-5 text-[#875347]">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>一部の情報を取得できませんでした。主要機能への操作は利用できます。</span>
        </div>
      ) : null}

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <TodayFocus data={data} />
        <ActionDock />
        <TeachingInsights insights={data.insights} hasContinueItems={data.continueItems.length > 0} />
        {data.continueItems.length ? <ContinueFrom items={data.continueItems} /> : null}
        <NextActionRail actions={data.nextActions} />
      </div>
    </div>
  );
}

function CockpitTopBar({ data }: { data: DashboardData }) {
  return (
    <header className="liquid-topbar flex min-h-16 flex-col gap-3 rounded-[22px] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5" data-dashboard-section="topbar">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-[linear-gradient(145deg,rgba(229,243,226,.92),rgba(255,255,255,.62))] text-[#4b7958] shadow-[inset_0_1px_0_rgba(255,255,255,.95),0_7px_18px_rgba(71,111,80,.11)]">
          <Sparkles className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-[15px] font-black text-[#2d4335]">{data.greeting}</p>
            <span className="text-[12px] font-bold tracking-[0.04em] text-[#7b738d]">指導コックピット</span>
          </div>
          <p className="mt-0.5 text-[12px] font-semibold text-[#68736d]">{data.todayLabel}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("yoga:open-command-palette"))}
          className="liquid-control liquid-lift inline-flex h-10 items-center gap-2 rounded-xl px-3 text-[12px] font-black text-[#526159]"
          aria-label="全体検索を開く"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span>全体検索</span>
          <kbd className="hidden rounded-md border border-white/80 bg-white/52 px-1.5 py-0.5 text-[10px] text-[#7b817b] xl:inline">⌘ K</kbd>
        </button>
        <Link href="/schedules/new" className="liquid-lift inline-flex h-10 items-center gap-2 rounded-xl border border-white/75 bg-[linear-gradient(145deg,#5d8b68,#477456)] px-3.5 text-[12px] font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,.28),0_9px_22px_rgba(65,111,78,.2)]">
          <CalendarPlus2 className="h-4 w-4" aria-hidden="true" />予定を登録
        </Link>
      </div>
    </header>
  );
}

function TodayFocus({ data }: { data: DashboardData }) {
  const lesson = data.brief.nextLesson;
  return (
    <section className="liquid-panel min-w-0 overflow-hidden rounded-[30px] lg:col-span-8" data-dashboard-section="today-focus">
      <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
        <div>
          <p className="text-[11px] font-black tracking-[0.14em] text-[#718274]">TODAY&apos;S FOCUS</p>
          <div className="mt-1.5 flex items-center gap-2.5">
            <CalendarDays className="h-5 w-5 text-[#557a60]" aria-hidden="true" />
            <h1 className="text-[21px] font-black tracking-[-0.025em] text-[#293e31]">今日のフォーカス</h1>
          </div>
        </div>
        <span className="rounded-full border border-white/80 bg-white/58 px-3 py-1.5 text-[11px] font-black text-[#657169] shadow-sm">
          {lesson ? `${lesson.dateLabel} ${lesson.timeLabel}` : "次回予定なし"}
        </span>
      </div>

      {lesson ? <NextLessonFocus lesson={lesson} /> : <NoLessonFocus data={data} />}

      <div className="grid border-t border-[#e4e8e1]/85 md:grid-cols-2">
        <BriefStream
          icon={UserRoundCheck}
          title="未完了フォロー"
          count={data.brief.pendingFollowupCount}
          items={data.brief.pendingFollowups}
          empty="今日確認するフォローはありません。"
          allHref="/students?filter=followup"
        />
        <BriefStream
          icon={FilePenLine}
          title="未記録レッスン"
          count={data.brief.unrecordedCount}
          items={data.brief.unrecordedLessons}
          empty="記録待ちのレッスンはありません。"
          allHref="/lessons?status=record_pending"
          className="border-t border-[#e4e8e1]/85 md:border-l md:border-t-0"
        />
      </div>
    </section>
  );
}

function NextLessonFocus({ lesson }: { lesson: NonNullable<DashboardData["brief"]["nextLesson"]> }) {
  return (
    <div className="grid border-t border-[#e4e8e1]/85 bg-[linear-gradient(135deg,rgba(239,248,236,.88),rgba(255,250,241,.8))] min-[1280px]:grid-cols-[minmax(0,1.3fr)_minmax(260px,.7fr)]">
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/80 bg-[#4f7f5b] px-3 py-1 text-[11px] font-black tracking-[0.08em] text-white shadow-sm">NEXT LESSON</span>
          <span className="text-[12px] font-bold text-[#657269]">参加予定 {lesson.participantCount}名</span>
        </div>
        <h2 className="mt-3 text-[24px] font-black leading-tight tracking-[-0.035em] text-[#243a2a]">{lesson.lessonName}</h2>
        <p className="mt-1.5 text-[13px] font-bold text-[#55725b]">{lesson.lessonPlanName}</p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-semibold text-[#647068]">
          <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-[#709076]" aria-hidden="true" />{lesson.dateLabel} {lesson.timeLabel}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[#709076]" aria-hidden="true" />{lesson.place}</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {lesson.lessonPlanId ? <FocusAction href={`/schedules/${lesson.id}/script`} label="原稿" icon={BookOpenCheck} primary /> : null}
          <FocusAction href={`/lessons/${lesson.id}/record`} label="記録" icon={NotebookPen} />
          <FocusAction href={`/schedules/${lesson.id}`} label="生徒・予定" icon={UsersRound} />
          {lesson.lessonPlanId ? <FocusAction href={`/lessons/${lesson.lessonPlanId}`} label="プラン" icon={ListChecks} /> : null}
        </div>
      </div>
      <div className="border-t border-[#e5ded8]/75 bg-[#fffaf5]/82 px-5 py-5 min-[1280px]:border-l min-[1280px]:border-t-0 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f6e4dd] text-[#aa6555]"><ShieldCheck className="h-4 w-4" aria-hidden="true" /></span>
          <h3 className="text-[13px] font-black text-[#5d4a42]">安全面の確認</h3>
        </div>
        {lesson.safetyNotes.length ? (
          <ul className="mt-3 divide-y divide-[#eadfd8]">
            {lesson.safetyNotes.slice(0, 3).map((note) => (
              <li key={note.id} className="py-2.5 first:pt-0">
                <Link href={note.href} className="text-[12px] font-black text-[#8d5d50] hover:underline">{note.label}</Link>
                <p className="mt-0.5 line-clamp-2 text-[12px] font-medium leading-5 text-[#6d625e]">{note.detail}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[12px] font-semibold leading-5 text-[#69736a]">登録済みの注意事項はありません。当日の様子も確認してください。</p>
        )}
      </div>
    </div>
  );
}

function NoLessonFocus({ data }: { data: DashboardData }) {
  const latest = data.continueItems[0];
  return (
    <div className="border-t border-[#e4e8e1]/85 bg-[linear-gradient(135deg,rgba(240,247,237,.9),rgba(249,244,255,.68),rgba(255,249,239,.84))] px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-5 min-[1180px]:flex-row min-[1180px]:items-center min-[1180px]:justify-between">
        <div className="max-w-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/62 text-[#537a5d] shadow-sm"><CalendarPlus2 className="h-5 w-5" aria-hidden="true" /></span>
            <div>
              <h2 className="text-[19px] font-black tracking-[-0.02em] text-[#2f4734]">次の予定を置くところから</h2>
              <p className="mt-0.5 text-[12px] font-semibold text-[#6d776f]">準備、安全確認、記録への導線がひとつにつながります。</p>
            </div>
          </div>
          <Link href="/schedules/new" className="liquid-lift mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#527e5b] px-4 text-[12px] font-black text-white shadow-[0_8px_20px_rgba(67,109,76,.18)]">
            <CalendarPlus2 className="h-4 w-4" aria-hidden="true" />予定を登録する
          </Link>
        </div>
        <div className="grid min-w-0 gap-2 sm:grid-cols-3 min-[1180px]:w-[48%] min-[1180px]:grid-cols-1">
          <FocusDatum label="未記録" value={`${data.brief.unrecordedCount}件`} href="/lessons?status=record_pending" />
          <FocusDatum label="未完了フォロー" value={`${data.brief.pendingFollowupCount}件`} href="/students?filter=followup" />
          {latest ? <FocusDatum label="最近の続き" value={latest.title} href={latest.href} truncate /> : <FocusDatum label="次の準備" value="プランを作る" href="/lessons/new" />}
        </div>
      </div>
    </div>
  );
}

function FocusDatum({ label, value, href, truncate = false }: { label: string; value: string; href: string; truncate?: boolean }) {
  return (
    <Link href={href} className="liquid-lift flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/72 bg-white/48 px-3 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,.92)]">
      <span className="shrink-0 text-[11px] font-bold text-[#7a827b]">{label}</span>
      <span className={cn("text-[12px] font-black text-[#3b4b40]", truncate && "truncate")}>{value}</span>
    </Link>
  );
}

function BriefStream({
  icon: Icon,
  title,
  count,
  items,
  empty,
  allHref,
  className,
}: {
  icon: typeof UserRoundCheck;
  title: string;
  count: number;
  items: DashboardData["brief"]["pendingFollowups"];
  empty: string;
  allHref: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 px-5 py-4 sm:px-6", className)}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-[12px] font-black text-[#405145]"><Icon className="h-4 w-4 text-[#67866d]" aria-hidden="true" />{title}</h3>
        <span className="text-[11px] font-black text-[#79837b]">{count}件</span>
      </div>
      {items.length ? (
        <div className="mt-2 divide-y divide-[#e7e9e4]">
          {items.slice(0, 2).map((item) => (
            <Link key={item.id} href={item.href} className="group flex min-w-0 items-center gap-3 py-2.5 first:pt-1.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-black text-[#344538]">{item.title}</span>
                <span className="mt-0.5 block truncate text-[11px] font-semibold text-[#777f78]">{item.meta}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#9aa49b] transition group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          ))}
          {count > 2 ? <Link href={allHref} className="inline-flex items-center gap-1 py-2 text-[11px] font-black text-[#5a7e61] hover:underline">すべて確認 <ArrowUpRight className="h-3 w-3" aria-hidden="true" /></Link> : null}
        </div>
      ) : (
        <p className="mt-2 text-[12px] font-semibold text-[#788079]">{empty}</p>
      )}
    </div>
  );
}

const quickActions = [
  { label: "予定を登録", description: "次回の準備を始める", href: "/schedules/new", icon: CalendarPlus2, tone: "sage", featured: true },
  { label: "実施後記録", description: "現場の気づきを残す", href: "/lessons?tab=records", icon: NotebookPen, tone: "lilac", featured: true },
  { label: "プランを作る", description: "流れを組み立てる", href: "/lessons/new", icon: ListChecks, tone: "sand", featured: false },
  { label: "生徒を確認", description: "安全・フォロー", href: "/students", icon: UsersRound, tone: "sky", featured: false },
  { label: "レポート", description: "傾向を見る", href: "/reports", icon: ChartNoAxesCombined, tone: "sage", featured: false },
  { label: "アイデアを残す", description: "Knowledgeへ", href: "/settings/knowledge/upload", icon: Lightbulb, tone: "sand", featured: false },
] as const;

function ActionDock() {
  const featured = quickActions.filter((action) => action.featured);
  const secondary = quickActions.filter((action) => !action.featured);
  return (
    <section className="liquid-glass min-w-0 rounded-[30px] p-4 sm:p-5 lg:col-span-4" data-dashboard-section="action-dock">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-black tracking-[0.14em] text-[#7b708e]">ACTION DOCK</p>
          <h2 className="mt-1 text-[20px] font-black tracking-[-0.025em] text-[#353d37]">すぐに始める</h2>
        </div>
        <Sparkles className="h-5 w-5 text-[#8a7eaa]" aria-hidden="true" />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {featured.map((action) => <DockAction key={action.href} action={action} featured />)}
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        {secondary.map((action) => <DockAction key={action.href} action={action} />)}
      </div>
    </section>
  );
}

function DockAction({ action, featured = false }: { action: (typeof quickActions)[number]; featured?: boolean }) {
  const Icon = action.icon;
  return (
    <Link
      href={action.href}
      className={cn(
        "liquid-lift group flex min-w-0 border border-white/76 bg-white/48 shadow-[inset_0_1px_0_rgba(255,255,255,.95)]",
        featured ? "min-h-[126px] flex-col justify-between rounded-[22px] p-3.5" : "min-h-[78px] items-center gap-2.5 rounded-2xl p-3",
      )}
    >
      <span className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl border border-white/72 shadow-sm",
        featured ? "h-11 w-11" : "h-9 w-9 rounded-xl",
        action.tone === "sage" && "bg-[#e5f0e2] text-[#50745a]",
        action.tone === "lilac" && "bg-[#eee9f7] text-[#75689b]",
        action.tone === "sand" && "bg-[#f5ead8] text-[#8d6b3f]",
        action.tone === "sky" && "bg-[#e3eef2] text-[#527681]",
      )}><Icon className={featured ? "h-5 w-5" : "h-4 w-4"} aria-hidden="true" /></span>
      <span className="min-w-0">
        <span className="block text-[12px] font-black text-[#35433a]">{action.label}</span>
        <span className="mt-0.5 block truncate text-[11px] font-semibold leading-4 text-[#777f78]">{action.description}</span>
      </span>
    </Link>
  );
}

function TeachingInsights({ insights, hasContinueItems }: { insights: DashboardData["insights"]; hasContinueItems: boolean }) {
  const [primary, ...secondary] = insights;
  if (!primary) return null;
  return (
    <section className={cn("liquid-panel min-w-0 overflow-hidden rounded-[30px]", hasContinueItems ? "lg:col-span-8" : "lg:col-span-12")} data-dashboard-section="teaching-insights">
      <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6">
        <div>
          <p className="text-[11px] font-black tracking-[0.14em] text-[#708074]">MY PRACTICE</p>
          <div className="mt-1 flex items-center gap-2.5">
            <SearchCheck className="h-5 w-5 text-[#5e7a63]" aria-hidden="true" />
            <h2 className="text-[20px] font-black tracking-[-0.025em] text-[#344238]">自分の現場からの発見</h2>
          </div>
        </div>
        <span className="rounded-full border border-white/80 bg-white/56 px-3 py-1.5 text-[11px] font-black text-[#68736a] shadow-sm">{insights.length}件</span>
      </div>
      <div className="grid border-t border-[#e4e8e1]/85 min-[1180px]:grid-cols-[minmax(0,1.15fr)_minmax(260px,.85fr)]">
        <article className={cn("relative min-h-[250px] overflow-hidden px-5 py-5 sm:px-6 sm:py-6", insightTone(primary.tone))}>
          <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/24 blur-2xl" aria-hidden="true" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-start justify-between gap-4">
              <span className="text-[11px] font-black tracking-[0.1em] text-[#68756d]">{primary.eyebrow}</span>
              <span className="rounded-full border border-white/80 bg-white/62 px-3 py-1.5 text-[12px] font-black text-[#4c6253] shadow-sm">{primary.metric}</span>
            </div>
            <h3 className="mt-7 max-w-xl text-[22px] font-black leading-[1.35] tracking-[-0.025em] text-[#2d4034]">{primary.title}</h3>
            <p className="mt-3 max-w-2xl flex-1 text-[13px] font-medium leading-6 text-[#626f67]">{primary.description}</p>
            <Link href={primary.href} className="mt-5 inline-flex w-fit items-center gap-1.5 text-[12px] font-black text-[#496c53] hover:underline">
              {primary.actionLabel}<ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </article>
        <div className="divide-y divide-[#e3e7e1] border-t border-[#e3e7e1] bg-white/48 min-[1180px]:border-l min-[1180px]:border-t-0">
          {secondary.slice(0, 3).map((insight) => (
            <article key={insight.id} className="px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <span className={cn("mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4", insightDot(insight.tone))} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[11px] font-black tracking-[0.07em] text-[#758079]">{insight.eyebrow}</p>
                    <span className="shrink-0 text-[11px] font-black text-[#5d6c62]">{insight.metric}</span>
                  </div>
                  <h3 className="mt-1.5 text-[14px] font-black leading-5 text-[#35433a]">{insight.title}</h3>
                  <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-5 text-[#737b75]">{insight.description}</p>
                  <Link href={insight.href} className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-[#527159] hover:underline">{insight.actionLabel}<ChevronRight className="h-3 w-3" aria-hidden="true" /></Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <p className="border-t border-[#e4e8e1]/85 px-5 py-3 text-[11px] font-semibold leading-5 text-[#7d867f] sm:px-6">
        未分類・未評価・未確認の値は推測せず、現場での変更は「失敗」ではなく適応として扱います。
      </p>
    </section>
  );
}

function ContinueFrom({ items }: { items: ContinueItem[] }) {
  const iconByKind = { plan: Layers3, record: NotebookPen, block: BookOpenCheck } as const;
  return (
    <section className="liquid-glass min-w-0 overflow-hidden rounded-[30px] lg:col-span-4" data-dashboard-section="continue-from">
      <div className="px-5 pb-4 pt-5">
        <p className="text-[11px] font-black tracking-[0.14em] text-[#7c718f]">PICK UP WHERE YOU LEFT OFF</p>
        <h2 className="mt-1 text-[20px] font-black tracking-[-0.025em] text-[#3a3f3b]">続きから</h2>
      </div>
      <div className="divide-y divide-white/72 border-t border-white/72 bg-white/28">
        {items.map((item) => {
          const Icon = iconByKind[item.kind];
          return (
            <Link key={item.id} href={item.href} className="liquid-lift group flex min-w-0 items-center gap-3 px-5 py-4">
              <span className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/80 shadow-sm",
                item.kind === "plan" && "bg-[#e9f1e6] text-[#54745b]",
                item.kind === "record" && "bg-[#eee9f7] text-[#75689a]",
                item.kind === "block" && "bg-[#e5eef1] text-[#527681]",
              )}><Icon className="h-4.5 w-4.5" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-[11px] font-black text-[#69766e]">{item.kindLabel}</span>
                  <span className="text-[11px] font-semibold text-[#8a908b]">{item.dateLabel}</span>
                </span>
                <span className="mt-1 block truncate text-[14px] font-black text-[#344138]">{item.title}</span>
                <span className="mt-0.5 block truncate text-[12px] font-medium text-[#747c76]">{item.detail}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#98a199] transition group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function NextActionRail({ actions }: { actions: DashboardData["nextActions"] }) {
  if (!actions.length) return null;
  return (
    <section className="liquid-glass min-w-0 rounded-[28px] p-3 lg:col-span-12" data-dashboard-section="next-actions">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <div className="flex min-w-[180px] items-center gap-3 px-2 py-2 lg:px-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-[linear-gradient(145deg,#e6f1e3,rgba(255,255,255,.62))] text-[#52745b] shadow-sm"><Sparkles className="h-4.5 w-4.5" aria-hidden="true" /></span>
          <div><p className="text-[11px] font-black tracking-[0.1em] text-[#738076]">NEXT STEP</p><h2 className="text-[16px] font-black text-[#36443a]">次に試すこと</h2></div>
        </div>
        <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-3">
          {actions.map((action, index) => (
            <Link key={action.id} href={action.href} className="liquid-lift group flex min-w-0 items-center gap-3 rounded-2xl border border-white/74 bg-white/42 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.92)]">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e7efe4] text-[11px] font-black text-[#55725b]">{index + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-black text-[#3e4940]">{action.title}</span>
                <span className="mt-0.5 block truncate text-[11px] font-semibold text-[#7b817b]">{action.detail}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#879089] transition group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FocusAction({ href, label, icon: Icon, primary = false }: { href: string; label: string; icon: typeof BarChart3; primary?: boolean }) {
  return (
    <Link href={href} className={cn(
      "liquid-lift inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3.5 text-[12px] font-black",
      primary ? "border border-white/70 bg-[#527d5b] text-white shadow-[0_8px_18px_rgba(65,109,76,.18)]" : "border border-white/80 bg-white/62 text-[#526b58] shadow-sm",
    )}>
      <Icon className="h-4 w-4" aria-hidden="true" />{label}
    </Link>
  );
}

function insightTone(tone: string) {
  if (tone === "sand") return "bg-[linear-gradient(135deg,rgba(250,240,220,.9),rgba(255,251,243,.76))]";
  if (tone === "sky") return "bg-[linear-gradient(135deg,rgba(225,239,244,.9),rgba(247,252,252,.76))]";
  if (tone === "rose") return "bg-[linear-gradient(135deg,rgba(247,228,224,.9),rgba(255,248,245,.76))]";
  return "bg-[linear-gradient(135deg,rgba(228,241,225,.92),rgba(249,252,247,.76))]";
}

function insightDot(tone: string) {
  if (tone === "sand") return "bg-[#b48a55] ring-[#f4e8d5]";
  if (tone === "sky") return "bg-[#5f8792] ring-[#e2eef1]";
  if (tone === "rose") return "bg-[#ad6e5d] ring-[#f4e4df]";
  return "bg-[#5f8366] ring-[#e2eee0]";
}
