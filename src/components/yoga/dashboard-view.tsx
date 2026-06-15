"use client";

import Link from "next/link";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, Blocks, BookOpenText, CalendarDays, ChevronRight, ClipboardCheck, FilePenLine, HeartHandshake, LibraryBig, ListTodo, Plus, Sparkles, UserPlus, UserRound } from "lucide-react";
import { importStarterBlockAction } from "@/app/dashboard/actions";
import { updateFollowUpStatusAction } from "@/app/follow-ups/actions";
import { SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import type { DashboardData, DashboardSchedule, DashboardTask } from "@/lib/dashboard";
import { formatDateKeyJa } from "@/lib/date-format";
import { cn } from "@/lib/utils";

export function DashboardView({ data }: { data: DashboardData }) {
  const [selectedDate, setSelectedDate] = useState(data.todayKey);
  const selectedSchedules = data.schedulesByDate[selectedDate] ?? [];
  const todaySchedules = data.schedulesByDate[data.todayKey] ?? [];
  const library = buildLibrarySummary(data);
  const showFirstFlow = data.totals.blocks === 0 || data.totals.lessonPlans === 0 || data.totals.schedules === 0 || data.totals.records === 0;

  return (
    <div className="mx-auto w-full max-w-full space-y-4 overflow-x-hidden">
      <DashboardHeader greeting={data.greeting} todayLabel={data.todayLabel} />

      {data.error ? (
        <SoftCard className="border-[#f2c7be] bg-[#fff0ea] p-4 text-[13px] font-bold leading-6 text-[#c4523d]">
          {data.error}
        </SoftCard>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(310px,0.9fr)]">
        <div className="grid gap-4">
          <HeroLessonCard data={data} todaySchedules={todaySchedules} />
          <TodayTasks data={data} />
          <LessonSeeds />
          <GuidanceLibrary items={library} />
          {showFirstFlow ? <FirstFlow /> : null}
          <RecentInsights insights={data.recentInsights} />
          <MonthCalendar
            monthLabel={data.monthLabel}
            days={data.calendarDays}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
            selectedSchedules={selectedSchedules}
          />
        </div>
        <div className="grid content-start gap-4">
          <NextFollow students={data.attentionStudents} />
          <AttentionStudents students={data.attentionStudents} />
          <Shortcuts />
        </div>
      </section>
    </div>
  );
}

function DashboardHeader({ greeting, todayLabel }: { greeting: string; todayLabel: string }) {
  return (
    <header className="flex flex-col gap-3 rounded-[24px] border border-[#eee4d8] bg-white/72 p-4 shadow-[0_10px_24px_rgba(91,76,53,0.06)] md:flex-row md:items-start md:justify-between md:border-0 md:bg-transparent md:p-0 md:shadow-none">
      <div>
        <p className="mb-1 text-[14px] font-bold text-[#4f7b58]">{greeting}</p>
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:gap-4">
          <h1 className="text-[24px] font-extrabold leading-tight">今日、指導をひとつ育てましょう</h1>
          <p className="max-w-2xl text-[13px] font-semibold leading-6 text-[#5d5d58] md:pb-1 md:text-[14px]">生徒の変化、前回の気づき、次の準備がここに集まっています。</p>
        </div>
        <p className="mt-2 inline-flex h-8 items-center gap-2 rounded-xl bg-white/80 px-3 text-[13px] font-semibold text-[#30362f]">
          <CalendarDays className="h-4 w-4" />
          {todayLabel}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:flex md:shrink-0">
        <QuickButton href="/schedules/new" icon={Plus} label="予定を登録" />
        <QuickButton href="/lessons/new" icon={Plus} label="プランを作成" />
        <QuickButton href="/lessons?tab=records" icon={Plus} label="記録を書く" />
      </div>
    </header>
  );
}

function HeroLessonCard({ data, todaySchedules }: { data: DashboardData; todaySchedules: DashboardSchedule[] }) {
  const pending = data.recordPendingSchedules[0];
  const today = todaySchedules[0];
  const next = data.upcomingSchedules.find((schedule) => schedule.dateKey > data.todayKey);
  const isStarter = data.totals.blocks < 5 || data.totals.lessonPlans === 0 || data.totals.schedules === 0 || data.totals.records === 0;

  const variant = pending
    ? buildPendingHero(pending)
    : today
      ? buildTodayHero(today, data.attentionStudents.filter((student) => today.participantIds.includes(student.id)).length)
      : next
        ? buildNextHero(next)
        : isStarter
          ? buildStarterHero()
          : buildNormalHero();

  return (
    <SoftCard className="overflow-hidden border-[#d9e7d3] bg-gradient-to-br from-[#f7fbf3] via-[#fffdf8] to-[#f7f0f5] p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <p className="mb-2 inline-flex rounded-full bg-white/80 px-3 py-1 text-[12px] font-extrabold text-[#5d956d]">{variant.eyebrow}</p>
          <h2 className="text-[24px] font-extrabold leading-tight text-[#253022]">{variant.title}</h2>
          <p className="mt-2 max-w-3xl text-[13px] font-semibold leading-6 text-[#596257]">{variant.description}</p>
          {variant.meta ? <p className="mt-3 rounded-2xl border border-[#eee4d8] bg-white/70 px-3 py-2 text-[12px] font-bold leading-5 text-[#4c554a]">{variant.meta}</p> : null}
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:w-[360px] lg:grid-cols-1">
          {variant.actions.map((action, index) => (
            <ActionLink key={action.label} href={action.href} label={action.label} primary={index === 0} />
          ))}
        </div>
      </div>
    </SoftCard>
  );
}

function LessonSeeds() {
  return (
    <SoftCard id="lesson-seeds" className="p-4">
      <SectionTitle icon={Sparkles} title="レッスンの種" subtitle="よく使う流れや声かけを、あなたのブロックとして育てられます。" />
      <div className="grid gap-3 lg:grid-cols-3">
        {starterBlocks.map((seed) => (
          <article key={seed.name} className="flex min-h-[230px] flex-col rounded-2xl border border-[#eee4d8] bg-white/76 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#8b704c]">{seed.category} / {seed.durationMinutes}分</p>
                <h3 className="mt-1 line-clamp-2 text-[15px] font-extrabold text-[#253022]">{seed.name}</h3>
              </div>
              <span className="shrink-0 rounded-full bg-[#edf5ef] px-2 py-1 text-[10px] font-bold text-[#4f875a]">ブロック</span>
            </div>
            <p className="mt-2 line-clamp-2 text-[12px] font-semibold leading-5 text-[#596257]">{seed.purpose}</p>
            <p className="mt-2 line-clamp-2 text-[11px] font-medium leading-5 text-[#6b7468]">使いどころ: {seed.useCase}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {seed.tags.map((tag) => <span key={tag} className="rounded-full border border-[#dbe4d6] bg-[#fbfaf6] px-2 py-0.5 text-[10px] font-bold text-[#4f7b58]">{tag}</span>)}
            </div>
            <form action={importStarterBlockAction} className="mt-auto pt-3">
              <input type="hidden" name="name" value={seed.name} />
              <input type="hidden" name="duration_minutes" value={seed.durationMinutes} />
              <input type="hidden" name="purpose" value={seed.purpose} />
              <input type="hidden" name="cautions" value={seed.cautions} />
              <input type="hidden" name="script" value={seed.script} />
              <input type="hidden" name="memo" value="YOGA NURTUREのスターター例から取り込みました。必要に応じて自分の言葉に編集してください。" />
              {seed.tags.map((tag) => <input key={tag} type="hidden" name="tags" value={tag} />)}
              <button type="submit" className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-[#5d956d] px-3 text-[12px] font-bold text-white">
                このブロックを取り込む
              </button>
            </form>
          </article>
        ))}
      </div>
      <div className="mt-3 grid gap-2 lg:grid-cols-2">
        {starterPlans.map((plan) => (
          <article key={plan.name} className="rounded-2xl border border-[#eee4d8] bg-[#fbfaf6] p-3">
            <p className="text-[11px] font-bold text-[#8b704c]">{plan.minutes}分 / プラン例</p>
            <h3 className="mt-1 text-[15px] font-extrabold">{plan.name}</h3>
            <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-5 text-[#596257]">{plan.purpose}</p>
            <p className="mt-2 line-clamp-1 text-[11px] font-bold text-[#6b7468]">含まれるブロック例: {plan.blocks.join(" / ")}</p>
            <Link href={`/lessons/new?starter=${encodeURIComponent(plan.name)}`} className="mt-3 inline-flex h-9 items-center justify-center rounded-xl border border-[#cfe1ca] bg-white px-3 text-[12px] font-bold text-[#5d956d]">
              このプラン例を見る
            </Link>
          </article>
        ))}
      </div>
    </SoftCard>
  );
}

function GuidanceLibrary({ items }: { items: Array<{ label: string; value: string; description: string; href: string; icon: LucideIcon }> }) {
  return (
    <SoftCard className="p-4">
      <SectionTitle icon={LibraryBig} title="あなたの指導ライブラリ" subtitle="記録が増えるほど、次のレッスン準備が楽になります。" />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href} className="rounded-2xl border border-[#eee4d8] bg-white/76 p-3 transition hover:bg-[#f8fcf6]">
              <Icon className="mb-2 h-5 w-5 text-[#5d956d]" />
              <p className="line-clamp-1 text-[11px] font-bold text-[#6b7468]">{item.label}</p>
              <p className="mt-1 text-[23px] font-extrabold text-[#34533b]">{item.value}</p>
              <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-4 text-[#6b7468]">{item.description}</p>
            </Link>
          );
        })}
      </div>
    </SoftCard>
  );
}

function TodayTasks({ data }: { data: DashboardData }) {
  const items = buildTodayActionItems(data);
  return (
    <SoftCard id="today-tasks" className="p-4">
      <SectionTitle icon={ListTodo} title="今日やること" subtitle="前回の気づきと今日の予定から、必要な行動だけを並べます。" />
      {items.length ? (
        <div className="grid gap-2">
          {items.map((task) => (
            <article key={task.id} className="grid gap-3 rounded-xl border border-[#eee4d8] bg-white/72 px-3 py-3 md:grid-cols-[82px_minmax(0,1fr)_112px_132px] md:items-center md:py-2.5">
              <span className="text-[12px] font-extrabold text-[#4c554a]">{task.time}</span>
              <div className="min-w-0">
                <p className="line-clamp-1 text-[14px] font-extrabold">{task.title}</p>
                <p className="mt-0.5 line-clamp-2 text-[12px] font-medium text-[#6b7468]">{task.note}</p>
              </div>
              <TaskBadge label={task.statusLabel} tone={task.tone} />
              <Link href={task.href} className="inline-flex h-9 items-center justify-center rounded-lg bg-[#5d956d] px-3 text-[12px] font-bold text-white">
                {task.actionLabel}
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="今日やることはありません。"
          text="新しい予定を登録するか、レッスンプランや生徒カルテを準備しましょう。"
          actions={[
            { href: "/schedules/new", label: "予定を登録" },
            { href: "/lessons/new", label: "レッスンプランを作成" },
            { href: "/students/new", label: "生徒を登録" },
          ]}
        />
      )}
    </SoftCard>
  );
}

function MonthCalendar({
  monthLabel,
  days,
  selectedDate,
  selectedSchedules,
  onSelect,
}: {
  monthLabel: string;
  days: DashboardData["calendarDays"];
  selectedDate: string;
  selectedSchedules: DashboardSchedule[];
  onSelect: (date: string) => void;
}) {
  return (
    <SoftCard className="p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle icon={CalendarDays} title={`${monthLabel}カレンダー`} subtitle="予定がある日を選ぶと詳細を確認できます" />
        <Link href="/schedules/new" className="inline-flex h-8 w-fit items-center gap-1.5 rounded-lg bg-[#5d956d] px-3 text-[12px] font-bold text-white">
          <Plus className="h-3.5 w-3.5" />
          予定を登録
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {["月", "火", "水", "木", "金", "土", "日"].map((day) => (
          <div key={day} className="text-center text-[11px] font-bold text-[#7c8476]">{day}</div>
        ))}
        {days.map((cell) => {
          const hasSchedules = cell.schedules.length > 0;
          const selected = selectedDate === cell.key;
          return (
            <button
              key={cell.key}
              type="button"
              disabled={!cell.inMonth}
              onClick={() => onSelect(cell.key)}
              className={cn(
                "min-h-[58px] rounded-xl border p-1.5 text-left transition md:min-h-[86px]",
                cell.inMonth ? "border-[#eee4d8] bg-white/66 hover:bg-[#f8fcf6]" : "border-transparent bg-white/20 opacity-40",
                selected ? "border-[#5d956d] bg-[#f2f8f1]" : "",
              )}
            >
              <span className={cn("inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[11px] font-extrabold", cell.isToday ? "bg-[#5d956d] text-white" : "text-[#343b32]")}>
                {cell.day ?? ""}
              </span>
              {hasSchedules ? (
                <div className="mt-1 space-y-1">
                  <div className="flex gap-1">
                    {cell.schedules.slice(0, 3).map((schedule) => (
                      <span key={schedule.id} className={cn("h-1.5 w-1.5 rounded-full", statusDotClass(schedule.status))} />
                    ))}
                  </div>
                  <p className="hidden truncate text-[10px] font-bold text-[#4f7b58] md:block">{cell.schedules[0].startTime} {displayScheduleName(cell.schedules[0])}</p>
                  {cell.schedules.length > 1 ? <p className="hidden text-[10px] font-bold text-[#8b704c] md:block">ほか{cell.schedules.length - 1}件</p> : null}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
      <SelectedSchedules dateKey={selectedDate} schedules={selectedSchedules} />
    </SoftCard>
  );
}

function SelectedSchedules({ dateKey, schedules }: { dateKey: string; schedules: DashboardSchedule[] }) {
  return (
    <div className="mt-4 rounded-2xl border border-[#eee4d8] bg-white/72 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-[14px] font-extrabold">選択日の予定</h3>
        <span className="text-[11px] font-bold text-[#8b704c]">{formatDateKeyJa(dateKey)}</span>
      </div>
      {schedules.length ? <ScheduleCards schedules={schedules} /> : <p className="rounded-xl border border-dashed border-[#d8e3d4] bg-[#f8fcf6] p-3 text-[12px] font-semibold leading-5 text-[#657064]">この日に予定はありません。</p>}
    </div>
  );
}

function RecentInsights({ insights }: { insights: DashboardData["recentInsights"] }) {
  return (
    <SoftCard className="p-4">
      <SectionTitle icon={FilePenLine} title="最近の記録・気づき" subtitle="前回の気づきが、次のレッスンにつながります。" />
      {insights.length ? (
        <div className="grid gap-2">
          {insights.map((insight) => (
            <article key={insight.id} className="rounded-2xl border border-[#eee4d8] bg-white/74 p-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="line-clamp-1 text-[14px] font-extrabold">{insight.lessonName}</p>
                <span className="text-[11px] font-bold text-[#8b704c]">{formatDateKeyJa(insight.dateKey)}</span>
              </div>
              <p className="mt-1 text-[12px] font-bold text-[#5d956d]">{insight.studentName} さん</p>
              {insight.todayNote ? <InfoLine label="今日の様子" value={insight.todayNote} /> : null}
              {insight.personalMemo ? <InfoLine label="個別メモ" value={insight.personalMemo} /> : null}
              {insight.nextFollow ? <InfoLine label="次回フォロー" value={insight.nextFollow} /> : null}
              <Link href={insight.href} className="mt-2 inline-flex h-8 items-center rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-2 text-[11px] font-bold text-[#5d956d]">
                記録を見る
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="まだ記録はありません。"
          text="レッスン後に気づきを残すと、生徒カルテや次回プランに活かせます。"
          actions={[
            { href: "/lessons?tab=records", label: "記録を見る" },
            { href: "/schedules/new", label: "予定を登録" },
          ]}
        />
      )}
    </SoftCard>
  );
}

function NextFollow({ students }: { students: DashboardData["attentionStudents"] }) {
  const follow = students.find((student) => student.nextFollow);
  return (
    <SoftCard id="next-follow" className="p-4">
      <SectionTitle icon={HeartHandshake} title="次回フォロー" subtitle="このひとことが、次の安心につながります。" />
      {follow ? (
        <div className="rounded-2xl border border-[#f1d8dd] bg-[#fff7f8] p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="line-clamp-1 text-[15px] font-extrabold">{follow.name} さん</p>
              {follow.followDate || follow.followLessonName ? (
                <p className="mt-0.5 line-clamp-1 text-[11px] font-bold text-[#8b704c]">
                  {follow.followDate ? formatDateKeyJa(follow.followDate.slice(0, 10)) : ""}
                  {follow.followLessonName ? ` / ${follow.followLessonName}` : ""}
                </p>
              ) : null}
            </div>
            <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[#d95c70]">要フォロー</span>
          </div>
          <p className="mt-3 line-clamp-3 text-[13px] font-semibold leading-6 text-[#4c554a]">{follow.nextFollow}</p>
          <div className="mt-3 grid gap-2">
            <Link href={`/students/${follow.id}#next-follow`} className="inline-flex h-9 items-center justify-center rounded-xl bg-[#5d956d] px-3 text-[12px] font-bold text-white">
              生徒カルテを見る
            </Link>
            {follow.followUpId ? (
              <form action={updateFollowUpStatusAction} className="grid gap-2">
                <input type="hidden" name="follow_up_id" value={follow.followUpId} />
                <input type="hidden" name="student_id" value={follow.id} />
                <input type="hidden" name="schedule_id" value={follow.followScheduleId ?? ""} />
                <input type="hidden" name="status" value="completed" />
                <input type="text" name="note" placeholder="対応メモ（任意）" className="h-9 rounded-xl border border-[#ead7d2] bg-white/80 px-3 text-[12px] font-semibold outline-none" />
                <button className="inline-flex h-9 items-center justify-center rounded-xl border border-[#ead7d2] bg-white px-3 text-[12px] font-bold text-[#b65c4b]">
                  対応済みにする
                </button>
              </form>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-[#d8e3d4] bg-[#f8fcf6] p-3 text-[12px] font-semibold leading-5 text-[#657064]">
          次回フォローはありません。レッスン後記録で残したメモがここに表示されます。
        </p>
      )}
    </SoftCard>
  );
}

function ScheduleCards({ schedules }: { schedules: DashboardSchedule[] }) {
  return (
    <div className="grid gap-2">
      {schedules.map((schedule) => (
        <article key={schedule.id} className="rounded-2xl border border-[#eee4d8] bg-white/78 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[12px] font-extrabold text-[#5d956d]">{schedule.startTime} - {schedule.endTime}</p>
              <p className="line-clamp-1 text-[14px] font-extrabold">{displayScheduleName(schedule)}</p>
              <p className="mt-1 text-[11px] font-bold text-[#6b7468]">{schedule.place} / 参加予定 {schedule.participantCount}名</p>
            </div>
            <TaskBadge label={schedule.statusLabel} tone={scheduleTone(schedule.status)} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <ActionLink href={schedule.lessonPlanId ? `/lessons/${schedule.lessonPlanId}` : null} label="プラン" />
            <ActionLink href={schedule.lessonPlanId ? `/lessons/${schedule.lessonPlanId}/script` : null} label="原稿" />
            <ActionLink href={`/lessons/${schedule.id}/record`} label="記録" primary />
          </div>
        </article>
      ))}
    </div>
  );
}

function Shortcuts() {
  const shortcuts = [
    { href: "/schedules/new", icon: CalendarDays, label: "予定を登録" },
    { href: "/lessons/new", icon: ClipboardCheck, label: "レッスンプランを作成" },
    { href: "/blocks/new", icon: Blocks, label: "ブロックを登録" },
    { href: "/students/new", icon: UserPlus, label: "生徒を登録" },
    { href: "/reports", icon: FilePenLine, label: "レポートを見る" },
    { href: "/settings/knowledge/upload", icon: BookOpenText, label: "学習メモを追加" },
  ];
  return (
    <SoftCard className="p-3.5">
      <SectionTitle icon={ChevronRight} title="すぐ使うショートカット" />
      <div className="grid grid-cols-2 gap-2">
        {shortcuts.map((shortcut) => (
          <Shortcut key={shortcut.href} {...shortcut} />
        ))}
      </div>
    </SoftCard>
  );
}

function FirstFlow() {
  const steps = [
    { label: "1. ブロックを登録", href: "/blocks/new" },
    { label: "2. プランを作成", href: "/lessons/new" },
    { label: "3. 予定を登録", href: "/schedules/new" },
    { label: "4. 記録を見る", href: "/lessons?tab=records" },
  ];
  return (
    <SoftCard className="p-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[13px] font-extrabold text-[#34533b]">はじめての流れ</p>
          <p className="mt-0.5 text-[12px] font-semibold text-[#6b7468]">ブロック登録 → レッスンプラン作成 → 予定登録 → レッスン後記録の順に進めます。</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:shrink-0">
          {steps.map((step) => (
            <Link key={step.href} href={step.href} className="inline-flex h-8 items-center justify-center rounded-lg border border-[#d8e3d4] bg-white px-2 text-[11px] font-bold text-[#4f7b58]">
              {step.label}
            </Link>
          ))}
        </div>
      </div>
    </SoftCard>
  );
}

function AttentionStudents({ students }: { students: DashboardData["attentionStudents"] }) {
  return (
    <SoftCard id="attention-students" className="p-3.5">
      <SectionTitle icon={UserRound} title="注意が必要な生徒" />
      {students.length ? (
        <div className="grid gap-2">
          {students.map((student) => (
            <article key={student.id} className="rounded-xl border border-[#eee4d8] bg-white/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="line-clamp-1 text-[14px] font-extrabold">{student.name} さん</p>
                <span className="shrink-0 rounded-full bg-[#f1f6ee] px-2 py-1 text-[10px] font-bold text-[#4f875a]">{student.ageGroup} / {student.gender}</span>
              </div>
              {student.caution ? <InfoLine label="ケガなどの注意点" value={student.caution} /> : null}
              {student.memo ? <InfoLine label="配慮" value={student.memo} /> : null}
              <Link href={`/students/${student.id}#next-follow`} className="mt-2 inline-flex h-8 items-center rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-2 text-[11px] font-bold text-[#5d956d]">
                生徒カルテを見る
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-[#d8e3d4] bg-[#f8fcf6] p-3 text-[12px] font-semibold leading-5 text-[#657064]">
          注意が必要な生徒はまだありません。
        </p>
      )}
    </SoftCard>
  );
}

function EmptyState({ title, text, actions }: { title: string; text: string; actions: Array<{ href: string; label: string }> }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d8e3d4] bg-[#f8fcf6] p-4">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#5d956d]" />
        <div className="min-w-0">
          <p className="text-[14px] font-extrabold">{title}</p>
          <p className="mt-1 text-[12px] font-semibold leading-5 text-[#657064]">{text}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {actions.map((action) => (
          <Link key={action.href} href={action.href} className="inline-flex h-9 items-center justify-center rounded-xl border border-[#cfe1ca] bg-white px-3 text-[12px] font-bold text-[#4f7b58]">
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function QuickButton({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link href={href} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#5d956d] px-3 text-[12px] font-bold text-white">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

function Shortcut({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link href={href} className="flex min-h-[62px] flex-col justify-between rounded-xl border border-[#eee4d8] bg-white/70 p-2 hover:bg-[#f8fcf6]">
      <Icon className="h-5 w-5 text-[#5d956d]" />
      <span className="text-[12px] font-extrabold leading-4">{label}</span>
    </Link>
  );
}

function ActionLink({ href, label, primary = false }: { href: string | null; label: string; primary?: boolean }) {
  if (!href) return null;
  return (
    <Link href={href} className={cn("inline-flex h-9 items-center justify-center rounded-xl text-[11px] font-bold", primary ? "bg-[#5d956d] text-white" : "border border-[#cfe1ca] bg-[#f8fcf6] text-[#5d956d]")}>
      {label}
    </Link>
  );
}

function TaskBadge({ label, tone }: { label: string; tone: DashboardTask["tone"] }) {
  const className = {
    gray: "border-[#e1ddd5] bg-[#f8f6f1] text-[#6b7468]",
    beige: "border-[#ead8b8] bg-[#fff8e8] text-[#9b7338]",
    green: "border-[#cfe1ca] bg-[#edf5ef] text-[#4f875a]",
    orange: "border-[#f2c9bd] bg-[#fff0ea] text-[#ec6f5d]",
    pink: "border-[#f2b7c0] bg-[#fff0f3] text-[#d95c70]",
  }[tone];
  return <span className={cn("inline-flex h-7 w-fit items-center justify-center rounded-full border px-2 text-[11px] font-bold md:w-full", className)}>{label}</span>;
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-4"><span className="font-bold text-[#8b704c]">{label}: </span>{value}</p>;
}

function statusDotClass(status: DashboardSchedule["status"]) {
  if (status === "record_pending") return "bg-[#ec907d]";
  if (status === "recorded") return "bg-[#5d956d]";
  if (status === "prepared") return "bg-[#7ea06f]";
  if (status === "preparing") return "bg-[#d6a16f]";
  return "bg-[#a8aaa2]";
}

function scheduleTone(status: DashboardSchedule["status"]): DashboardTask["tone"] {
  if (status === "record_pending") return "orange";
  if (status === "recorded" || status === "prepared") return "green";
  if (status === "preparing") return "beige";
  return "gray";
}

function displayScheduleName(schedule: DashboardSchedule) {
  return schedule.lessonPlanId ? schedule.lessonPlanName : schedule.lessonName;
}

type TodayActionItem = DashboardTask;

type HeroVariant = {
  eyebrow: string;
  title: string;
  description: string;
  meta?: string;
  actions: Array<{ href: string | null; label: string }>;
};

function buildPendingHero(schedule: DashboardSchedule): HeroVariant {
  return {
    eyebrow: "今日の主役",
    title: "前回の気づきを、次のレッスンにつなげましょう。",
    description: "記録待ちのレッスンがあります。忘れないうちに、生徒の反応や改善点を残しておきましょう。",
    meta: `${formatDateKeyJa(schedule.dateKey)} / ${displayScheduleName(schedule)} / 参加予定 ${schedule.participantCount}名 / ${schedule.statusLabel}`,
    actions: [
      { href: `/lessons/${schedule.id}/record`, label: "記録を書く" },
      { href: `/schedules/${schedule.id}`, label: "レッスンを見る" },
    ],
  };
}

function buildTodayHero(schedule: DashboardSchedule, attentionCount: number): HeroVariant {
  return {
    eyebrow: "今日の主役",
    title: "今日のレッスンを安心して届けましょう。",
    description: "原稿と参加予定生徒を確認して、前回の気づきを今日の声かけに活かしましょう。",
    meta: `${schedule.startTime} ${displayScheduleName(schedule)} / 参加予定 ${schedule.participantCount}名 / 注意あり ${attentionCount}名`,
    actions: [
      { href: schedule.lessonPlanId ? `/lessons/${schedule.lessonPlanId}/script` : null, label: "原稿を見る" },
      { href: `/schedules/${schedule.id}`, label: "参加生徒を確認" },
      { href: `/lessons/${schedule.id}/record`, label: "記録を書く" },
    ],
  };
}

function buildNextHero(schedule: DashboardSchedule): HeroVariant {
  return {
    eyebrow: "次の準備",
    title: "次のレッスンに向けて準備しましょう。",
    description: "前回メモや生徒の注意点を見ながら、次のレッスンを少しずつ整えられます。",
    meta: `次回: ${formatDateKeyJa(schedule.dateKey)} ${schedule.startTime} ${displayScheduleName(schedule)}`,
    actions: [
      { href: `/schedules/${schedule.id}`, label: "次回の予定を見る" },
      { href: schedule.lessonPlanId ? `/lessons/${schedule.lessonPlanId}/script` : null, label: "原稿を見る" },
      { href: `/schedules/${schedule.id}`, label: "参加生徒を確認" },
    ],
  };
}

function buildStarterHero(): HeroVariant {
  return {
    eyebrow: "はじめの一歩",
    title: "まずは、レッスンの土台をひとつ作りましょう。",
    description: "ブロックを登録すると、レッスンプランをゼロから作らなくても、自分の言葉や流れを再利用できるようになります。",
    actions: [
      { href: "#lesson-seeds", label: "スターターブロックを見る" },
      { href: "#lesson-seeds", label: "レッスンプラン例を見る" },
      { href: "/blocks/new", label: "ブロックを登録" },
    ],
  };
}

function buildNormalHero(): HeroVariant {
  return {
    eyebrow: "今日の育てどころ",
    title: "次のレッスンに使える準備を育てましょう。",
    description: "ブロックを整えたり、手書きメモを登録しておくと、次のレッスン準備がもっと楽になります。",
    actions: [
      { href: "/blocks/new", label: "ブロックを登録" },
      { href: "/lessons/new", label: "プランを作成" },
      { href: "/settings/knowledge/upload", label: "学習メモを追加" },
    ],
  };
}

function buildLibrarySummary(data: DashboardData): Array<{ label: string; value: string; description: string; href: string; icon: LucideIcon }> {
  return [
    { label: "生徒カルテ", value: `${data.totals.students}人`, description: "一人ひとりの変化を記録", href: "/students", icon: UserRound },
    { label: "ブロック", value: `${data.totals.blocks}個`, description: "再利用できるレッスンパーツ", href: "/lessons?tab=blocks", icon: Blocks },
    { label: "レッスンプラン", value: `${data.totals.lessonPlans}本`, description: "組み立てたレッスン原稿", href: "/lessons?tab=plans", icon: ClipboardCheck },
    { label: "学習メモ", value: `${data.totals.knowledgeDocuments}件`, description: "AIが参考にする指導ノート", href: "/settings/knowledge", icon: BookOpenText },
    { label: "AI提案", value: `${data.totals.aiSuggestions}件`, description: "記録から生まれた改善ヒント", href: "#today-tasks", icon: Sparkles },
  ];
}

function buildTodayActionItems(data: DashboardData): TodayActionItem[] {
  const items: TodayActionItem[] = [...data.tasks];
  const hasPlanTask = items.some((task) => task.kind === "prepare");
  const hasFollowTask = items.some((task) => task.kind === "follow");

  if (data.totals.lessonPlans < 2 && !hasPlanTask) {
    items.push({
      id: "hint-plan",
      kind: "prepare",
      time: "準備",
      title: "レッスンプランの土台を作る",
      note: "スターター例から1本下書きのイメージをつかんでみましょう。",
      statusLabel: "育てる",
      tone: "beige",
      href: "#lesson-seeds",
      actionLabel: "レッスンの種を見る",
    });
  }

  if (data.totals.knowledgeDocuments === 0) {
    items.push({
      id: "hint-knowledge",
      kind: "prepare",
      time: "メモ",
      title: "学習メモがまだありません",
      note: "手書きメモを追加すると、AI提案がもっとあなたらしくなります。",
      statusLabel: "おすすめ",
      tone: "green",
      href: "/settings/knowledge/upload",
      actionLabel: "学習メモを追加",
    });
  }

  if (data.totals.blocks === 0) {
    items.push({
      id: "hint-block",
      kind: "prepare",
      time: "最初に",
      title: "ブロックを登録しましょう",
      note: "よく使う誘導セリフやレッスンパートが、プラン作成の材料になります。",
      statusLabel: "はじめる",
      tone: "gray",
      href: "/blocks/new",
      actionLabel: "ブロックを登録",
    });
  }

  if (!hasFollowTask && data.attentionStudents.some((student) => student.nextFollow)) {
    const student = data.attentionStudents.find((row) => row.nextFollow);
    if (student) {
      items.push({
        id: `hint-follow-${student.id}`,
        kind: "follow",
        time: "フォロー",
        title: `${student.name}さんの次回フォロー`,
        note: student.nextFollow,
        statusLabel: "要フォロー",
        tone: "pink",
        href: `/students/${student.id}#next-follow`,
        actionLabel: "生徒カルテを見る",
      });
    }
  }

  return items.slice(0, 3);
}

const starterBlocks = [
  {
    name: "スターター：呼吸を整える導入",
    category: "導入",
    durationMinutes: 5,
    purpose: "レッスン冒頭で呼吸と姿勢に意識を向け、落ち着いて始めるための導入。",
    useCase: "初回参加や緊張がありそうなクラスの冒頭",
    cautions: "息を深めようとしすぎず、苦しさがあれば自然な呼吸に戻るよう案内します。",
    script: "楽な姿勢で座り、背骨をすっと長くします。肩の力を抜いて、まずは今の呼吸をそのまま感じましょう。吸う息で胸の内側に少し広がりを感じ、吐く息で肩や表情の力をゆるめます。呼吸を無理に変えようとせず、今日の体の状態に気づく時間にしていきます。",
    tags: ["#呼吸", "#導入", "#初心者向け"],
  },
  {
    name: "スターター：肩まわりをほぐすウォームアップ",
    category: "ウォーミングアップ",
    durationMinutes: 8,
    purpose: "首肩まわりをやさしく動かし、上半身の緊張に気づくためのウォームアップ。",
    useCase: "肩こりが出やすい生徒やデスクワーク後のクラス",
    cautions: "首や肩に痛みがある場合は可動域を小さくし、強く伸ばさないようにします。",
    script: "吸う息で肩を耳に近づけ、吐く息で肩を後ろから下へゆっくり下ろします。動きの大きさよりも、どこに力が入りやすいかを観察しましょう。次に両手を肩に添え、肘で小さな円を描きます。呼吸が止まらない範囲で、肩甲骨まわりにやさしく空間を作ります。",
    tags: ["#肩こり改善", "#ウォームアップ", "#やさしい"],
  },
  {
    name: "スターター：シャバーサナ前の声かけ",
    category: "クールダウン",
    durationMinutes: 4,
    purpose: "最後の休息に入りやすくするため、体の力を抜く準備を整える声かけ。",
    useCase: "リラックス系レッスンや夜のクラスの終盤",
    cautions: "腰や首に違和感がある場合は膝下や頭の高さを調整するよう促します。",
    script: "仰向けになったら、足幅を少し開き、手のひらを楽な向きにします。腰や首に違和感があれば、膝を立てたり、頭の下に高さを入れても大丈夫です。吐く息ごとに、床に体を預けていきます。今日動かしたところ、がんばったところに、やさしく休む許可を出していきましょう。",
    tags: ["#クールダウン", "#リラックス", "#シャバーサナ"],
  },
] as const;

const starterPlans = [
  {
    name: "やさしい呼吸とリラックスヨガ 60分",
    minutes: 60,
    purpose: "呼吸・肩まわり・クールダウンを中心に、落ち着いて体を整えるプラン例。",
    blocks: ["呼吸を整える導入", "肩まわりウォームアップ", "シャバーサナ前の声かけ"],
  },
  {
    name: "肩まわりをゆるめるベーシックフロー",
    minutes: 60,
    purpose: "上半身の緊張に気づきながら、やさしい立位と呼吸を組み合わせるプラン例。",
    blocks: ["肩まわりウォームアップ", "ベーシック立位", "クールダウン"],
  },
] as const;
