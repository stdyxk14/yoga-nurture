"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CalendarPlus2,
  ChartNoAxesCombined,
  ChevronRight,
  CircleAlert,
  Clock3,
  FilePenLine,
  Lightbulb,
  ListChecks,
  MapPin,
  NotebookPen,
  Search,
  SearchCheck,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import type { DashboardData } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

export function DashboardView({ data }: { data: DashboardData }) {
  return (
    <main className="space-y-6 pb-10">
      <CompactHomeHeader data={data} />

      {data.error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[#edc9bd] bg-[#fff7f3] p-4 text-[13px] font-semibold leading-5 text-[#875347]">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>一部の情報を取得できませんでした。主要機能への操作は利用できます。</span>
        </div>
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.72fr)]">
        <TodayBrief data={data} />
        <QuickActions />
      </div>

      <TeachingInsights insights={data.insights} />

      <NextActions actions={data.nextActions} />
    </main>
  );
}

function CompactHomeHeader({ data }: { data: DashboardData }) {
  return (
    <header className="flex min-h-16 flex-col gap-3 rounded-2xl border border-[#dde3da] bg-white/88 px-4 py-3 shadow-[0_8px_28px_rgba(56,72,59,0.05)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="min-w-0">
        <p className="text-[15px] font-black text-[#314337]">{data.greeting}</p>
        <p className="mt-0.5 text-[12px] font-semibold text-[#727c74]">{data.todayLabel}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("yoga:open-command-palette"))}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#d9ddd6] bg-white px-3 text-[12px] font-black text-[#5d6860] transition hover:border-[#b9c8b6] hover:bg-[#f4f7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]"
          aria-label="全体検索を開く"
        >
          <Search className="h-4 w-4" aria-hidden="true" />検索
        </button>
        <Link href="/schedules/new" className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#54765b] px-3 text-[12px] font-black text-white transition hover:bg-[#45664d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]">
          <CalendarPlus2 className="h-4 w-4" aria-hidden="true" />予定を登録
        </Link>
      </div>
    </header>
  );
}

function TodayBrief({ data }: { data: DashboardData }) {
  const lesson = data.brief.nextLesson;
  return (
    <section className="rounded-[26px] border border-[#dce7d8] bg-white shadow-[0_14px_45px_rgba(57,76,58,0.07)]">
      <SectionHeader
        eyebrow="TODAY / 今日の実務"
        title="今日のブリーフ"
        icon={CalendarDays}
        aside={lesson ? `${lesson.dateLabel} ${lesson.timeLabel}` : "次回予定なし"}
      />
      <div className="p-4 pt-0 sm:p-5 sm:pt-0">
        {lesson ? <NextLesson lesson={lesson} /> : <NoNextLesson />}

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <BriefList
            icon={UserRoundCheck}
            title="未完了フォロー"
            count={data.brief.pendingFollowupCount}
            items={data.brief.pendingFollowups}
            empty="未完了のフォローはありません。"
            allHref="/students?filter=followup"
          />
          <BriefList
            icon={FilePenLine}
            title="未記録レッスン"
            count={data.brief.unrecordedCount}
            items={data.brief.unrecordedLessons}
            empty="未記録のレッスンはありません。"
            allHref="/lessons?status=record_pending"
          />
        </div>
      </div>
    </section>
  );
}

function NextLesson({ lesson }: { lesson: NonNullable<DashboardData["brief"]["nextLesson"]> }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#e5eadf] bg-[linear-gradient(135deg,#f7fbf5,#fffaf4)]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.62fr)]">
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#4f7f5b] px-3 py-1 text-[10px] font-black tracking-[0.08em] text-white">NEXT LESSON</span>
            <span className="text-[12px] font-bold text-[#667269]">参加予定 {lesson.participantCount}名</span>
          </div>
          <h3 className="mt-3 text-[21px] font-black tracking-[-0.025em] text-[#263b2c]">{lesson.lessonName}</h3>
          <p className="mt-1 text-[13px] font-bold text-[#55725b]">{lesson.lessonPlanName}</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12px] font-semibold text-[#69736b]">
            <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-[#709076]" />{lesson.dateLabel} {lesson.timeLabel}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[#709076]" />{lesson.place}</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {lesson.lessonPlanId ? <BriefAction href={`/schedules/${lesson.id}/script`} label="原稿を見る" primary /> : null}
            <BriefAction href={`/lessons/${lesson.id}/record`} label="記録を書く" />
            <BriefAction href={`/schedules/${lesson.id}`} label="予定・生徒" />
            {lesson.lessonPlanId ? <BriefAction href={`/lessons/${lesson.lessonPlanId}`} label="プラン" /> : null}
          </div>
        </div>
        <div className="border-t border-[#e4e9df] bg-white/65 p-4 lg:border-l lg:border-t-0 sm:p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#b66e58]" />
            <h4 className="text-[12px] font-black text-[#5d4a42]">安全面の確認</h4>
          </div>
          {lesson.safetyNotes.length ? (
            <ul className="mt-3 space-y-2">
              {lesson.safetyNotes.map((note) => (
                <li key={note.id} className="rounded-xl border border-[#eee2dc] bg-[#fffaf7] p-3">
                  <Link href={note.href} className="text-[11px] font-black text-[#8d5d50] hover:underline">{note.label}</Link>
                  <p className="mt-1 line-clamp-3 text-[11px] font-medium leading-4 text-[#6d625e]">{note.detail}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-[#dce5d8] bg-[#f7faf5] p-3 text-[11px] font-semibold leading-5 text-[#69736a]">
              登録済みの注意事項はありません。当日の様子も確認してください。
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function NoNextLesson() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-[#cfdccb] bg-[#f7fbf5] p-5 sm:p-6">
      <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-[#e4efe0]" />
      <div className="relative max-w-2xl">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#5c855f] shadow-sm"><CalendarPlus2 className="h-5 w-5" /></span>
        <h3 className="mt-4 text-[18px] font-black tracking-[-0.02em] text-[#2f4734]">次回の予定はまだありません</h3>
        <p className="mt-2 text-[12px] font-medium leading-5 text-[#68736a] sm:text-[13px]">
          予定を登録すると、参加予定生徒、安全面の注意、原稿・記録への導線がここにまとまります。
        </p>
        <Link href="/schedules/new" className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#527e5b] px-4 text-[12px] font-black text-white shadow-sm transition hover:bg-[#436d4c]">
          <CalendarPlus2 className="h-4 w-4" />予定を登録する
        </Link>
      </div>
    </div>
  );
}

function BriefList({
  icon: Icon,
  title,
  count,
  items,
  empty,
  allHref,
}: {
  icon: typeof UserRoundCheck;
  title: string;
  count: number;
  items: DashboardData["brief"]["pendingFollowups"];
  empty: string;
  allHref: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e6e8e1] bg-[#fbfcfa] p-3.5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-[12px] font-black text-[#3f5143]"><Icon className="h-4 w-4 text-[#67866d]" />{title}</h3>
        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-[#6a766c] shadow-sm">{count}件</span>
      </div>
      {items.length ? (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <Link key={item.id} href={item.href} className="group block rounded-xl border border-[#e9e8e2] bg-white p-3 transition hover:border-[#ccdcca] hover:shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-black text-[#344538]">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-4 text-[#737a74]">{item.detail}</p>
                  <p className="mt-1.5 text-[10px] font-bold text-[#8a918b]">{item.meta}</p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[#9aa49b] transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
          {count > items.length ? <Link href={allHref} className="inline-flex items-center gap-1 text-[11px] font-black text-[#5a7e61] hover:underline">すべて確認 <ArrowUpRight className="h-3 w-3" /></Link> : null}
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-[#dfe5dc] bg-white/70 p-3 text-[11px] font-semibold text-[#788079]">{empty}</p>
      )}
    </div>
  );
}

const quickActions = [
  { label: "予定を登録", description: "次回レッスン", href: "/schedules/new", icon: CalendarPlus2, tone: "sage" },
  { label: "プランを作る", description: "流れを組み立てる", href: "/lessons/new", icon: ListChecks, tone: "sand" },
  { label: "実施後記録", description: "現場の気づきを残す", href: "/lessons?tab=records", icon: NotebookPen, tone: "rose" },
  { label: "生徒を確認", description: "安全・フォロー", href: "/students", icon: UsersRound, tone: "sky" },
  { label: "レポート", description: "傾向を見つける", href: "/reports", icon: ChartNoAxesCombined, tone: "sage" },
  { label: "アイデアを残す", description: "Knowledgeへ保存", href: "/settings/knowledge/upload", icon: Lightbulb, tone: "sand" },
] as const;

function QuickActions() {
  return (
    <section className="rounded-[26px] border border-[#e5e1d8] bg-[#fbf8f2] p-4 shadow-[0_14px_45px_rgba(90,76,57,0.06)] sm:p-5">
      <div className="mb-4">
        <p className="text-[10px] font-black tracking-[0.12em] text-[#917d60]">QUICK ACTIONS</p>
        <h2 className="mt-1 text-[19px] font-black tracking-[-0.02em] text-[#433a2f]">すぐに始める</h2>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href} className="group flex min-h-[104px] flex-col justify-between rounded-2xl border border-white/80 bg-white p-3 shadow-[0_4px_18px_rgba(72,64,52,0.05)] transition hover:-translate-y-0.5 hover:border-[#d7ddcf] hover:shadow-md">
            <span className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-xl",
              action.tone === "sage" && "bg-[#e8f1e5] text-[#53755a]",
              action.tone === "sand" && "bg-[#f5ead8] text-[#8d6b3f]",
              action.tone === "rose" && "bg-[#f7e5df] text-[#a46452]",
              action.tone === "sky" && "bg-[#e4eef1] text-[#527681]",
            )}><action.icon className="h-4.5 w-4.5" /></span>
            <span>
              <span className="block text-[12px] font-black text-[#3f453e]">{action.label}</span>
              <span className="mt-0.5 block text-[10px] font-semibold leading-4 text-[#85877f]">{action.description}</span>
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-dashed border-[#ddd4c5] bg-white/55 p-3 text-[10px] font-semibold leading-4 text-[#7e7568]">
        将来の「AI土屋先生」も、ここから自然に相談へつながる設計です。
      </div>
    </section>
  );
}

function TeachingInsights({ insights }: { insights: DashboardData["insights"] }) {
  return (
    <section className="rounded-[26px] border border-[#dce6d9] bg-white shadow-[0_14px_45px_rgba(57,76,58,0.06)]">
      <SectionHeader eyebrow="MY PRACTICE" title="自分の現場からの発見" icon={SearchCheck} aside={`${insights.length}件`} />
      <div className="grid gap-3 p-4 pt-0 sm:grid-cols-2 sm:p-5 sm:pt-0">
        {insights.map((insight) => (
          <article key={insight.id} className={cn(
            "flex min-h-[210px] flex-col rounded-2xl border p-4",
            insight.tone === "sage" && "border-[#dce8d9] bg-[#f5faf3]",
            insight.tone === "sand" && "border-[#ece1d0] bg-[#fdf9f2]",
            insight.tone === "sky" && "border-[#d9e7eb] bg-[#f3f8fa]",
            insight.tone === "rose" && "border-[#edddd7] bg-[#fcf6f3]",
          )}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] font-black tracking-[0.09em] text-[#748077]">{insight.eyebrow}</p>
              <span className="shrink-0 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-black text-[#55665a] shadow-sm">{insight.metric}</span>
            </div>
            <h3 className="mt-3 text-[15px] font-black leading-6 tracking-[-0.015em] text-[#344239]">{insight.title}</h3>
            <p className="mt-2 flex-1 text-[11px] font-medium leading-[1.7] text-[#707871]">{insight.description}</p>
            <Link href={insight.href} className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-black text-[#527159] hover:underline">
              {insight.actionLabel}<ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </article>
        ))}
      </div>
      <p className="px-5 pb-5 text-[10px] font-semibold leading-4 text-[#838a84]">
        未分類・未評価・未確認の値は推測せず、集計対象から分けています。現場での変更は「失敗」ではなく適応として扱います。
      </p>
    </section>
  );
}

function NextActions({ actions }: { actions: DashboardData["nextActions"] }) {
  return (
    <section className="rounded-[26px] border border-[#dfe5dc] bg-[linear-gradient(90deg,#f5f9f3,#fffaf4)] p-4 shadow-[0_12px_35px_rgba(70,78,63,0.05)] sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="lg:w-48 lg:shrink-0">
          <p className="text-[10px] font-black tracking-[0.12em] text-[#718174]">NEXT STEP</p>
          <h2 className="mt-1 text-[18px] font-black text-[#36443a]">次に試せること</h2>
        </div>
        <div className="grid flex-1 gap-2.5 md:grid-cols-3">
          {actions.map((action, index) => (
            <Link key={action.id} href={action.href} className="group flex min-h-[96px] items-start gap-3 rounded-2xl border border-white bg-white/80 p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#d2ddcf]">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e7efe4] text-[10px] font-black text-[#55725b]">{index + 1}</span>
              <span className="min-w-0">
                <span className="block text-[12px] font-black text-[#3e4940]">{action.title}</span>
                <span className="mt-1 block text-[10px] font-semibold leading-4 text-[#7b817b]">{action.detail}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-black text-[#56745c]">{action.label}<ChevronRight className="h-3 w-3 transition group-hover:translate-x-0.5" /></span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, icon: Icon, aside }: { eyebrow: string; title: string; icon: typeof CalendarDays; aside: string }) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
      <div>
        <p className="text-[10px] font-black tracking-[0.12em] text-[#708074]">{eyebrow}</p>
        <div className="mt-1 flex items-center gap-2">
          <Icon className="h-5 w-5 text-[#5e7a63]" />
          <h2 className="text-[19px] font-black tracking-[-0.02em] text-[#344238]">{title}</h2>
        </div>
      </div>
      <span className="rounded-full bg-[#f3f6f1] px-3 py-1.5 text-[10px] font-black text-[#68736a]">{aside}</span>
    </div>
  );
}

function BriefAction({ href, label, primary = false }: { href: string; label: string; primary?: boolean }) {
  return (
    <Link href={href} className={cn("inline-flex h-9 items-center justify-center rounded-xl px-3 text-[11px] font-black transition", primary ? "bg-[#527d5b] text-white hover:bg-[#456d4e]" : "border border-[#d7e0d3] bg-white text-[#58705d] hover:border-[#bfcfbb]")}>{label}</Link>
  );
}
