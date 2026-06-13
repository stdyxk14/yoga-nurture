"use client";

import Link from "next/link";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, Blocks, CalendarDays, ChevronRight, ClipboardCheck, FilePenLine, ListTodo, Plus, Sparkles, UserPlus, UserRound } from "lucide-react";
import { SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import type { DashboardData, DashboardSchedule, DashboardTask } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

export function DashboardView({ data }: { data: DashboardData }) {
  const [selectedDate, setSelectedDate] = useState(data.todayKey);
  const selectedSchedules = data.schedulesByDate[selectedDate] ?? [];

  return (
    <div className="mx-auto w-full max-w-full space-y-4 overflow-x-hidden">
      <DashboardHeader todayLabel={data.todayLabel} />

      {data.error ? (
        <SoftCard className="border-[#f2c7be] bg-[#fff0ea] p-4 text-[13px] font-bold leading-6 text-[#c4523d]">
          {data.error}
        </SoftCard>
      ) : null}

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <TodayTasks tasks={data.tasks} />
        <RuleBasedSuggestions suggestions={data.suggestions} />
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <MonthCalendar
          monthLabel={data.monthLabel}
          days={data.calendarDays}
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          selectedSchedules={selectedSchedules}
        />
        <div className="grid gap-3">
          <Shortcuts />
          <AttentionStudents students={data.attentionStudents} />
        </div>
      </section>
    </div>
  );
}

function DashboardHeader({ todayLabel }: { todayLabel: string }) {
  return (
    <header className="flex flex-col gap-3 rounded-[24px] border border-[#eee4d8] bg-white/72 p-4 shadow-[0_10px_24px_rgba(91,76,53,0.06)] md:flex-row md:items-start md:justify-between md:border-0 md:bg-transparent md:p-0 md:shadow-none">
      <div>
        <p className="mb-1 text-[14px] font-bold text-[#4f7b58]">おはようございます</p>
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:gap-4">
          <h1 className="text-[24px] font-extrabold leading-tight">今日のホーム</h1>
          <p className="text-[13px] font-semibold text-[#5d5d58] md:pb-1 md:text-[14px]">今日の予定・準備・記録待ちを確認しましょう。</p>
        </div>
        <p className="mt-2 inline-flex h-8 items-center gap-2 rounded-xl bg-white/80 px-3 text-[13px] font-semibold text-[#30362f]">
          <CalendarDays className="h-4 w-4" />
          {todayLabel}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:flex md:shrink-0">
        <QuickButton href="/schedules/new" icon={Plus} label="予定を登録" />
        <QuickButton href="/students/new" icon={Plus} label="生徒を登録" />
        <QuickButton href="/lessons/new" icon={Plus} label="プランを作成" />
      </div>
    </header>
  );
}

function TodayTasks({ tasks }: { tasks: DashboardTask[] }) {
  return (
    <SoftCard className="p-4">
      <SectionTitle icon={ListTodo} title="今日やること" subtitle="実データから次の行動だけを表示" />
      {tasks.length ? (
        <div className="grid gap-2">
          {tasks.map((task) => (
            <article key={task.id} className="grid gap-3 rounded-xl border border-[#eee4d8] bg-white/72 px-3 py-3 md:grid-cols-[78px_minmax(0,1fr)_112px_132px] md:items-center md:py-2.5">
              <span className="text-[13px] font-extrabold text-[#4c554a]">{task.time}</span>
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

function RuleBasedSuggestions({ suggestions }: { suggestions: string[] }) {
  return (
    <SoftCard className="p-4">
      <SectionTitle icon={Sparkles} title="AIメンターからの今日の提案" subtitle="実データからの簡易ヒント" />
      {suggestions.length ? (
        <div className="space-y-2">
          {suggestions.slice(0, 4).map((suggestion) => (
            <div key={suggestion} className="rounded-xl border border-[#eee4d8] bg-white/70 p-3">
              <p className="line-clamp-3 text-[12px] font-medium leading-5 text-[#50584e]">{suggestion}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-[#d8e3d4] bg-[#f8fcf6] p-3 text-[12px] font-semibold leading-5 text-[#657064]">
          データが蓄積されると、今日の準備・記録・フォローに関する提案が表示されます。
        </p>
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
                  <p className="hidden truncate text-[10px] font-bold text-[#4f7b58] md:block">{cell.schedules[0].startTime} {cell.schedules[0].lessonPlanName}</p>
                  {cell.schedules.length > 1 ? <p className="hidden text-[10px] font-bold text-[#8b704c] md:block">ほか {cell.schedules.length - 1}件</p> : null}
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
        <span className="text-[11px] font-bold text-[#8b704c]">{dateKey}</span>
      </div>
      {schedules.length ? (
        <div className="grid gap-2">
          {schedules.map((schedule) => (
            <article key={schedule.id} className="rounded-2xl border border-[#eee4d8] bg-white/78 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[12px] font-extrabold text-[#5d956d]">{schedule.startTime} - {schedule.endTime}</p>
                  <p className="line-clamp-1 text-[14px] font-extrabold">{schedule.lessonPlanName !== "未設定" ? schedule.lessonPlanName : schedule.lessonName}</p>
                  <p className="mt-1 text-[11px] font-bold text-[#6b7468]">{schedule.place} / 参加予定 {schedule.participantCount}名</p>
                </div>
                <TaskBadge label={schedule.statusLabel} tone={scheduleTone(schedule.status)} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <ActionLink href={schedule.lessonPlanId ? `/lessons/${schedule.lessonPlanId}` : `/schedules/${schedule.id}`} label="プラン" />
                <ActionLink href={schedule.lessonPlanId ? `/lessons/${schedule.lessonPlanId}/script` : null} label="原稿" />
                <ActionLink href={`/lessons/${schedule.id}/record`} label="記録" primary />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-[#d8e3d4] bg-[#f8fcf6] p-3 text-[12px] font-semibold leading-5 text-[#657064]">
          この日に予定はありません。
        </p>
      )}
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

function AttentionStudents({ students }: { students: DashboardData["attentionStudents"] }) {
  return (
    <SoftCard className="p-3.5">
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
              {student.memo ? <InfoLine label="その他メモ" value={student.memo} /> : null}
              {student.nextFollow ? <InfoLine label="次回フォロー" value={student.nextFollow} /> : null}
              <Link href={`/students/${student.id}`} className="mt-2 inline-flex h-8 items-center rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-2 text-[11px] font-bold text-[#5d956d]">
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
  if (!href) {
    return (
      <span className="inline-flex h-9 items-center justify-center rounded-xl border border-[#e1ddd5] bg-[#f4f1eb] text-[11px] font-bold text-[#9a9287]">
        {label}
      </span>
    );
  }
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
