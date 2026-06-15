"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, Blocks, BookOpenText, CalendarDays, ChevronRight, ClipboardCheck, FilePenLine, HeartHandshake, LibraryBig, ListChecks, ListTodo, Plus, Sparkles, UserPlus, UserRound } from "lucide-react";
import { SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import type { DashboardData, DashboardSchedule, DashboardTask } from "@/lib/dashboard";
import { formatDateKeyJa } from "@/lib/date-format";
import { cn } from "@/lib/utils";

export function DashboardView({ data }: { data: DashboardData }) {
  const [selectedDate, setSelectedDate] = useState(data.todayKey);
  const selectedSchedules = data.schedulesByDate[selectedDate] ?? [];
  const todaySchedules = data.schedulesByDate[data.todayKey] ?? [];
  const weekDays = useMemo(() => {
    return data.calendarDays
      .filter((day) => day.key >= data.todayKey)
      .slice(0, 7);
  }, [data.calendarDays, data.todayKey]);
  const library = buildLibrarySummary(data);
  const checks = buildPreparationChecks(data, todaySchedules);
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
          <HeroLessonCard schedules={todaySchedules} totals={data.totals} />
          <TodayTasks data={data} />
          <GuidanceLibrary items={library} />
          <WeekFlow days={weekDays} todayKey={data.todayKey} />
          <MonthCalendar
            monthLabel={data.monthLabel}
            days={data.calendarDays}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
            selectedSchedules={selectedSchedules}
          />
          {showFirstFlow ? <FirstFlow /> : null}
        </div>
        <div className="grid content-start gap-4">
          <NextFollow students={data.attentionStudents} />
          <PreparationCheck checks={checks} hasTodaySchedules={todaySchedules.length > 0} />
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
          <h1 className="text-[24px] font-extrabold leading-tight">今日のレッスンを整えましょう</h1>
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

function HeroLessonCard({ schedules, totals }: { schedules: DashboardSchedule[]; totals: DashboardData["totals"] }) {
  const mainSchedule = schedules[0];
  if (!mainSchedule) {
    return (
      <SoftCard className="overflow-hidden border-[#d9e7d3] bg-gradient-to-br from-[#f7fbf3] via-[#fffdf8] to-[#f7f0f5] p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="mb-2 inline-flex rounded-full bg-white/80 px-3 py-1 text-[12px] font-extrabold text-[#5d956d]">今日の主役</p>
            <h2 className="text-[24px] font-extrabold leading-tight text-[#253022]">今日はレッスン予定がありません。</h2>
            <p className="mt-2 max-w-2xl text-[13px] font-semibold leading-6 text-[#596257]">次のレッスンに向けて、プランやブロック、手書きメモを少し育てておきましょう。記録が増えるほど、次の準備が楽になります。</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:w-[360px] lg:grid-cols-1">
            <ActionLink href="/lessons/new" label="プランを作成" primary />
            <ActionLink href="/blocks/new" label="ブロックを登録" />
            <ActionLink href="/settings/knowledge/upload" label="学習メモを追加" />
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <LibraryMini label="生徒カルテ" value={`${totals.students}人`} />
          <LibraryMini label="ブロック" value={`${totals.blocks}個`} />
          <LibraryMini label="プラン" value={`${totals.lessonPlans}本`} />
        </div>
      </SoftCard>
    );
  }

  return (
    <SoftCard className="overflow-hidden border-[#d9e7d3] bg-gradient-to-br from-[#f7fbf3] via-[#fffdf8] to-[#f7f0f5] p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <p className="mb-2 inline-flex rounded-full bg-white/80 px-3 py-1 text-[12px] font-extrabold text-[#5d956d]">今日のレッスン</p>
          <h2 className="text-[24px] font-extrabold leading-tight text-[#253022]">{mainSchedule.startTime} {displayScheduleName(mainSchedule)}</h2>
          <p className="mt-2 text-[13px] font-semibold leading-6 text-[#596257]">
            参加予定 {mainSchedule.participantCount}名 / {mainSchedule.place} / {mainSchedule.statusLabel}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:w-[360px] lg:grid-cols-1">
          <ActionLink href={mainSchedule.lessonPlanId ? `/lessons/${mainSchedule.lessonPlanId}/script` : null} label="原稿を見る" primary />
          <ActionLink href={`/schedules/${mainSchedule.id}`} label="参加生徒を確認" />
          <ActionLink href={`/lessons/${mainSchedule.id}/record`} label="記録を書く" />
        </div>
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

function LibraryMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#eee4d8] bg-white/70 p-3">
      <p className="text-[11px] font-bold text-[#6b7468]">{label}</p>
      <p className="mt-1 text-[20px] font-extrabold text-[#34533b]">{value}</p>
    </div>
  );
}

function PreparationCheck({ checks, hasTodaySchedules }: { checks: PreparationCheckItem[]; hasTodaySchedules: boolean }) {
  return (
    <SoftCard id="prep-check" className="p-4">
      <SectionTitle icon={ListChecks} title="今日のレッスン準備" subtitle={hasTodaySchedules ? "レッスン前に確認しておきたいこと" : "今日は予定がないので、次の準備を少し整えられます"} />
      <div className="grid gap-2">
        {checks.map((check) => (
          <article key={check.label} className="grid gap-2 rounded-2xl border border-[#eee4d8] bg-white/76 p-3 sm:grid-cols-[92px_minmax(0,1fr)_112px] sm:items-center">
            <CheckStatus status={check.status} />
            <div className="min-w-0">
              <p className="line-clamp-1 text-[13px] font-extrabold text-[#30362f]">{check.label}</p>
              <p className="mt-0.5 line-clamp-2 text-[12px] font-semibold leading-5 text-[#6b7468]">{check.detail}</p>
            </div>
            {check.href ? <ActionLink href={check.href} label={check.actionLabel} /> : null}
          </article>
        ))}
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

function WeekFlow({ days, todayKey }: { days: DashboardData["calendarDays"]; todayKey: string }) {
  return (
    <SoftCard className="p-4">
      <SectionTitle icon={CalendarDays} title="今週の流れ" subtitle="直近の予定と記録の流れを確認できます。" />
      <div className="grid gap-2">
        {days.map((day) => (
          <article key={day.key} className="rounded-2xl border border-[#eee4d8] bg-white/70 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[12px] font-extrabold text-[#8b704c]">
                {formatShortDate(day.key)}
                {day.key === todayKey ? <span className="ml-2 rounded-full bg-[#edf5ef] px-2 py-0.5 text-[10px] text-[#4f875a]">今日</span> : null}
              </p>
              <span className="text-[11px] font-bold text-[#7c8476]">{day.schedules.length ? `${day.schedules.length}件` : "予定なし"}</span>
            </div>
            {day.schedules.length ? (
              <div className="grid gap-2">
                {day.schedules.map((schedule) => (
                  <div key={schedule.id} className="grid gap-2 rounded-xl bg-[#fbfaf6] p-2.5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-[13px] font-extrabold">{schedule.startTime} {displayScheduleName(schedule)}</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-[#6b7468]">参加予定 {schedule.participantCount}名 / {schedule.statusLabel}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 lg:w-[180px]">
                      <ActionLink href={schedule.lessonPlanId ? `/lessons/${schedule.lessonPlanId}` : null} label="プラン" />
                      <ActionLink href={schedule.lessonPlanId ? `/lessons/${schedule.lessonPlanId}/script` : null} label="原稿" />
                      <ActionLink href={`/lessons/${schedule.id}/record`} label="記録" primary />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-[#d8e3d4] bg-[#f8fcf6] p-3 text-[12px] font-semibold leading-5 text-[#657064]">
                レッスン予定はありません。プランやブロックを整える時間にできます。
              </p>
            )}
          </article>
        ))}
      </div>
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
          <Link href={`/students/${follow.id}#next-follow`} className="mt-3 inline-flex h-9 items-center justify-center rounded-xl bg-[#5d956d] px-3 text-[12px] font-bold text-white">
            生徒カルテを見る
          </Link>
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

function CheckStatus({ status }: { status: PreparationCheckItem["status"] }) {
  const className = status === "OK" ? "border-[#cfe1ca] bg-[#edf5ef] text-[#4f875a]" : status === "要確認" ? "border-[#efd3a7] bg-[#fff7e8] text-[#9b7338]" : "border-[#f2c9bd] bg-[#fff0ea] text-[#b75b48]";
  return <span className={cn("inline-flex h-7 w-fit items-center justify-center rounded-full border px-2 text-[11px] font-bold", className)}>{status}</span>;
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

type PreparationCheckItem = {
  label: string;
  detail: string;
  status: "OK" | "要確認" | "未設定";
  href: string | null;
  actionLabel: string;
};

type TodayActionItem = DashboardTask;

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
      title: "レッスンプランを少し増やしておきましょう",
      note: "よく使うブロックから1本作ると、次の予定登録が楽になります。",
      statusLabel: "育てる",
      tone: "beige",
      href: "/lessons/new",
      actionLabel: "プランを作成",
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

  return items.slice(0, 6);
}

function buildPreparationChecks(data: DashboardData, todaySchedules: DashboardSchedule[]): PreparationCheckItem[] {
  const firstToday = todaySchedules[0];
  const firstPlanSchedule = todaySchedules.find((schedule) => schedule.lessonPlanId);
  const firstMissingPlan = todaySchedules.find((schedule) => !schedule.lessonPlanId || schedule.lessonPlanStatus === "draft");
  const firstNoParticipants = todaySchedules.find((schedule) => schedule.participantCount === 0);
  const pendingTask = data.tasks.find((task) => task.kind === "record_pending");
  const followStudent = data.attentionStudents.find((student) => student.nextFollow);

  return [
    {
      label: "レッスンプラン",
      status: todaySchedules.length === 0 ? "OK" : firstMissingPlan ? "要確認" : "OK",
      detail: todaySchedules.length === 0 ? "今日の予定はありません。次のプランを整える余白にできます。" : firstMissingPlan ? "プラン未設定、または下書きの予定があります。" : "今日の予定にプランが紐づいています。",
      href: firstMissingPlan ? `/schedules/${firstMissingPlan.id}` : firstPlanSchedule?.lessonPlanId ? `/lessons/${firstPlanSchedule.lessonPlanId}` : null,
      actionLabel: firstMissingPlan ? "予定を見る" : "プランを見る",
    },
    {
      label: "原稿確認",
      status: todaySchedules.length === 0 ? "OK" : firstPlanSchedule ? "OK" : "未設定",
      detail: firstPlanSchedule ? "レッスン前に流れと声かけを確認できます。" : todaySchedules.length === 0 ? "今日の原稿確認はありません。" : "原稿を出すにはプランの紐づけが必要です。",
      href: firstPlanSchedule?.lessonPlanId ? `/lessons/${firstPlanSchedule.lessonPlanId}/script` : null,
      actionLabel: "原稿を見る",
    },
    {
      label: "参加予定生徒",
      status: todaySchedules.length === 0 ? "OK" : firstNoParticipants ? "要確認" : "OK",
      detail: firstNoParticipants ? "参加予定生徒が未登録の予定があります。" : todaySchedules.length === 0 ? "今日の参加予定はありません。" : "生徒の注意点を事前に確認できます。",
      href: firstNoParticipants ? `/schedules/${firstNoParticipants.id}` : firstToday ? `/schedules/${firstToday.id}` : null,
      actionLabel: "予定を見る",
    },
    {
      label: "記録待ち",
      status: pendingTask ? "要確認" : "OK",
      detail: pendingTask ? "前回の気づきが薄れる前に残しておきましょう。" : "未処理の記録待ちはありません。",
      href: pendingTask?.href ?? null,
      actionLabel: "記録を書く",
    },
    {
      label: "次回フォロー",
      status: followStudent ? "要確認" : "OK",
      detail: followStudent ? "前回のメモから、次回声をかけたい内容があります。" : "次回フォローはありません。",
      href: followStudent ? `/students/${followStudent.id}#next-follow` : null,
      actionLabel: "生徒カルテ",
    },
  ];
}

function formatShortDate(dateKey: string) {
  const [, month, day] = dateKey.split("-");
  return `${Number(month)}/${Number(day)}`;
}
