"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CalendarPlus2,
  ChartNoAxesCombined,
  ChevronLeft,
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
import { TodayAiSuggestionPanel } from "@/components/yoga/daily-suggestion-panel";
import type { DailySuggestionState } from "@/lib/daily-suggestions/queries";
import type {
  DashboardCalendarEvent,
  DashboardCalendarEventState,
  DashboardData,
} from "@/lib/dashboard";
import { cn } from "@/lib/utils";

const weekdays = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function DashboardView({ data, dailySuggestionState }: { data: DashboardData; dailySuggestionState: DailySuggestionState }) {
  return (
    <main className="min-w-0 space-y-6 pb-10">
      <CompactHomeHeader data={data} />

      {data.error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[#edc9bd] bg-[#fff7f3] p-4 text-[13px] font-semibold leading-5 text-[#875347]">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>一部の情報を取得できませんでした。主要機能への操作は利用できます。</span>
        </div>
      ) : null}

      <MonthlyLessonCalendar data={data} />

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-8"><TodayAiSuggestionPanel state={dailySuggestionState} /></div>
        <div className="min-w-0 xl:col-span-4"><QuickActions /></div>
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

function MonthlyLessonCalendar({ data }: { data: DashboardData }) {
  const [selectedDateKey, setSelectedDateKey] = useState(data.calendar.selectedDateKey);
  const selectedDay = data.calendar.days.find((day) => day.dateKey === selectedDateKey) ?? data.calendar.days[0];

  return (
    <section className="min-w-0 overflow-hidden rounded-[26px] border border-[#dce5d9] bg-white shadow-[0_14px_45px_rgba(57,76,58,0.07)]">
      <div className="flex flex-col gap-3 border-b border-[#e5e9e2] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-[10px] font-black tracking-[0.12em] text-[#708074]">MONTHLY LESSONS</p>
          <div className="mt-1 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#5e7a63]" aria-hidden="true" />
            <h2 className="text-[20px] font-black tracking-[-0.02em] text-[#344238]">月間レッスンカレンダー</h2>
            <span className="rounded-full bg-[#edf3ea] px-2.5 py-1 text-[11px] font-black text-[#58705d]">{data.calendar.monthLabel}</span>
          </div>
        </div>
        <nav aria-label="カレンダーの月移動" className="flex items-center gap-2">
          <Link href={`/dashboard?month=${data.calendar.previousMonthKey}`} aria-label="前月" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#d9ddd6] bg-white text-[#5d6860] hover:bg-[#f4f7f2]">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link href="/dashboard" className="inline-flex h-9 items-center justify-center rounded-xl border border-[#d9ddd6] bg-white px-3 text-[11px] font-black text-[#5d6860] hover:bg-[#f4f7f2]">今月へ戻る</Link>
          <Link href={`/dashboard?month=${data.calendar.nextMonthKey}`} aria-label="次月" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#d9ddd6] bg-white text-[#5d6860] hover:bg-[#f4f7f2]">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </nav>
      </div>

      <div className="grid min-w-0 xl:grid-cols-12">
        <div className="min-w-0 border-b border-[#e5e9e2] xl:col-span-8 xl:border-b-0 xl:border-r">
          <div className="grid grid-cols-7 border-b border-[#e5e9e2] bg-[#f6f7f3]">
            {weekdays.map((weekday, index) => (
              <div key={weekday} className={cn("py-2 text-center text-[11px] font-black", index === 0 ? "text-[#b36759]" : index === 6 ? "text-[#557c8a]" : "text-[#69736b]")}>{weekday}</div>
            ))}
          </div>
          <div className="grid min-w-0 grid-cols-7">
            {data.calendar.days.map((day, index) => {
              const selected = day.dateKey === selectedDay?.dateKey;
              return (
                <div
                  key={day.dateKey}
                  className={cn(
                    "relative min-h-[92px] min-w-0 border-b border-r border-[#eceee9] bg-white p-1.5 sm:min-h-[104px] sm:p-2",
                    index % 7 === 6 && "border-r-0 xl:border-r",
                    index >= 35 && "border-b-0",
                    !day.isCurrentMonth && "bg-[#fafaf8]",
                    selected && "bg-[#f1f7ef] ring-2 ring-inset ring-[#6f9a76]",
                  )}
                >
                  <button
                    type="button"
                    className="absolute inset-0 z-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4f8058]"
                    onClick={() => setSelectedDateKey(day.dateKey)}
                    aria-label={`${day.dateLabel}を選択`}
                    aria-pressed={selected}
                    aria-current={day.isToday ? "date" : undefined}
                  />
                  <div className="pointer-events-none relative z-10">
                    <div className="flex items-center justify-between gap-1">
                      <span className={cn(
                        "inline-flex h-6 min-w-6 items-center justify-center rounded-full text-[11px] font-black",
                        !day.isCurrentMonth && "text-[#a1a59f]",
                        day.isToday && "bg-[#52775a] text-white",
                        !day.isToday && day.isCurrentMonth && "text-[#525d54]",
                      )}>{day.dayNumber}</span>
                      {day.isToday ? <span className="hidden text-[9px] font-black text-[#52775a] sm:inline">今日</span> : null}
                    </div>
                    <div className="mt-1.5 space-y-1">
                      {day.events.slice(0, 2).map((event) => (
                        <CalendarEventChip key={event.id} event={event} onSelect={() => setSelectedDateKey(day.dateKey)} />
                      ))}
                      {day.events.length > 2 ? <button type="button" onClick={() => setSelectedDateKey(day.dateKey)} className="pointer-events-auto block w-full truncate text-left text-[9px] font-black text-[#657068] sm:text-[10px]">＋{day.events.length - 2}件</button> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <SelectedDayPanel
          day={selectedDay}
          pendingFollowupCount={data.brief.pendingFollowupCount}
        />
      </div>
    </section>
  );
}

function CalendarEventChip({ event, onSelect }: { event: DashboardCalendarEvent; onSelect: () => void }) {
  return (
    <Link
      href={`/schedules/${event.id}`}
      onClick={onSelect}
      className={cn(
        "pointer-events-auto block min-w-0 truncate rounded-md border px-1.5 py-1 text-[8px] font-black leading-tight transition hover:brightness-95 sm:text-[10px]",
        calendarEventClasses(event.state),
      )}
      aria-label={`${event.timeLabel} ${event.lessonName} ${event.stateLabel}`}
    >
      <span className="mr-1">{event.stateLabel}</span>
      <span className="hidden sm:inline">{event.timeLabel.split("–")[0]} {event.lessonName}</span>
    </Link>
  );
}

function SelectedDayPanel({ day, pendingFollowupCount }: { day: DashboardData["calendar"]["days"][number] | undefined; pendingFollowupCount: number }) {
  const events = day?.events ?? [];
  const unrecordedCount = events.filter((event) => event.state === "record_pending").length;
  const registerHref = `/schedules/new?date=${day?.dateKey ?? ""}`;
  return (
    <aside className="min-w-0 bg-[#fbfcfa] p-4 sm:p-5 xl:col-span-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black tracking-[0.12em] text-[#708074]">SELECTED DAY / 今日の実務</p>
          <h3 className="mt-1 text-[18px] font-black text-[#344238]">{day?.dateLabel ?? "選択日"}</h3>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-[#677269] shadow-sm">{events.length}件</span>
      </div>

      {events.length ? (
        <div className="mt-4 space-y-3">
          {events.map((event) => <SelectedDayEvent key={event.id} event={event} />)}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-[#cad7c6] bg-white p-5 text-center">
          <CalendarPlus2 className="mx-auto h-6 w-6 text-[#6e8a73]" />
          <p className="mt-3 text-[14px] font-black text-[#405046]">この日の予定はありません</p>
          <Link href={registerHref} className="mt-4 inline-flex h-9 items-center rounded-xl bg-[#527e5b] px-4 text-[11px] font-black text-white hover:bg-[#436d4c]">この日に予定を登録</Link>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <BriefCount icon={FilePenLine} label="選択日の未記録" count={unrecordedCount} href="/lessons?status=record_pending" />
        <BriefCount icon={UserRoundCheck} label="未完了フォロー" count={pendingFollowupCount} href="/students?filter=followup" />
      </div>
      {events.length ? <Link href={registerHref} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#d6dfd3] bg-white px-3 py-2.5 text-[11px] font-black text-[#58705d] hover:border-[#bfcfbb]"><CalendarPlus2 className="h-4 w-4" />この日に予定を登録</Link> : null}
    </aside>
  );
}

function SelectedDayEvent({ event }: { event: DashboardCalendarEvent }) {
  return (
    <article className={cn("rounded-2xl border bg-white p-3.5", event.state === "unconfirmed" && "border-dashed border-[#c9aa73] bg-[#fffaf0]", event.state === "closed" && "border-[#ddd9d1] bg-[#f7f6f3]", event.state !== "unconfirmed" && event.state !== "closed" && "border-[#e1e6df]")}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn("rounded-full border px-2 py-1 text-[9px] font-black", calendarEventClasses(event.state))}>{event.stateLabel}</span>
        <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#657068]"><Clock3 className="h-3.5 w-3.5" />{event.timeLabel}</span>
      </div>
      <h4 className="mt-2 text-[14px] font-black leading-5 text-[#36443a]">{event.lessonName}</h4>
      <p className="mt-1 text-[11px] font-semibold text-[#5d765f]">{event.lessonPlanName}</p>
      <div className="mt-2 grid gap-1 text-[11px] font-medium text-[#707870]">
        <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#78907b]" />{event.place}</span>
        <span className="inline-flex items-center gap-1.5"><UsersRound className="h-3.5 w-3.5 text-[#78907b]" />参加予定 {event.participantCount}名</span>
      </div>
      <div className="mt-3 rounded-xl bg-[#f8f6f1] p-2.5">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#6b5b4f]"><ShieldCheck className="h-3.5 w-3.5 text-[#a66c58]" />安全面の注意</p>
        {event.safetyNotes.length ? (
          <ul className="mt-1.5 space-y-1">
            {event.safetyNotes.slice(0, 3).map((note) => <li key={note.id} className="line-clamp-2 text-[10px] font-medium leading-4 text-[#756d66]">{note.label}: {note.detail}</li>)}
          </ul>
        ) : <p className="mt-1 text-[10px] font-medium leading-4 text-[#7b817b]">登録済みの注意事項はありません。</p>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={`/schedules/${event.id}`} className="inline-flex h-8 items-center rounded-lg bg-[#527d5b] px-3 text-[10px] font-black text-white hover:bg-[#456d4e]">予定詳細</Link>
        {event.state === "unconfirmed" ? <Link href={`/schedules/${event.id}/edit`} className="inline-flex h-8 items-center rounded-lg border border-[#cdb482] bg-white px-3 text-[10px] font-black text-[#80663c]">プランを設定</Link> : null}
      </div>
    </article>
  );
}

function calendarEventClasses(state: DashboardCalendarEventState) {
  if (state === "unconfirmed") return "border-dashed border-[#c5a66f] bg-[#fbf3df] text-[#7d6337]";
  if (state === "closed") return "border-[#d7d3cb] bg-[#eeece8] text-[#716e68]";
  if (state === "record_pending") return "border-[#e4b4a8] bg-[#f9e9e4] text-[#955c4e]";
  if (state === "recorded") return "border-[#bcd3ba] bg-[#e8f2e6] text-[#4f7354]";
  return "border-[#c9d3e5] bg-[#edf2f8] text-[#536a86]";
}

function BriefCount({ icon: Icon, label, count, href }: { icon: typeof UserRoundCheck; label: string; count: number; href: string }) {
  return <Link href={href} className="flex min-w-0 items-center gap-2 rounded-xl border border-[#e4e7df] bg-white p-3 transition hover:border-[#c9d7c5]"><span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e9f0e6] text-[#638069]"><Icon className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-[17px] font-bold text-[#3d4c41]">{count}</span><span className="block text-[10px] leading-4 text-[#707971]">{label}</span></span></Link>;
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
          <Link key={action.href} href={action.href} className="group flex min-h-[86px] flex-col justify-between rounded-2xl border border-white/80 bg-white p-3 shadow-[0_4px_18px_rgba(72,64,52,0.05)] transition hover:-translate-y-0.5 hover:border-[#d7ddcf] hover:shadow-md">
            <span className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-xl",
              action.tone === "sage" && "bg-[#e8f1e5] text-[#53755a]",
              action.tone === "sand" && "bg-[#f5ead8] text-[#8d6b3f]",
              action.tone === "rose" && "bg-[#f7e5df] text-[#a46452]",
              action.tone === "sky" && "bg-[#e4eef1] text-[#527681]",
            )}><action.icon className="h-4 w-4" /></span>
            <span>
              <span className="block text-[11px] font-black text-[#3f453e]">{action.label}</span>
              <span className="mt-0.5 block text-[9px] font-semibold leading-4 text-[#85877f]">{action.description}</span>
            </span>
          </Link>
        ))}
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
