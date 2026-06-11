import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  FilePenLine,
  Layers3,
  ListTodo,
  Plus,
  Sparkles,
  UserPlus,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { students } from "@/components/yoga/records";
import type { LessonStatus } from "@/components/yoga/records";

const todayTasks = [
  {
    id: "task-plan-ready",
    time: "10:00",
    title: "ベーシックフロー",
    note: "事前準備済み",
    status: "事前準備済み" as const,
    href: "/lessons/basic-flow-20250520",
    action: "事前プランを見る",
  },
  {
    id: "task-prepare",
    time: "13:00",
    title: "肩こり改善ヨガ",
    note: "カルテ準備が必要",
    status: "事前準備中" as const,
    href: "/lessons/new",
    action: "カルテを準備",
  },
  {
    id: "task-record",
    time: "昨日",
    title: "リラックスヨガ",
    note: "レッスン後の記録待ち",
    status: "記録待ち" as const,
    href: "/lessons/restorative-20250511/record",
    action: "記録を書く",
  },
  {
    id: "task-follow",
    time: "次回",
    title: "佐藤 美咲さん",
    note: "膝の違和感を確認",
    status: "要フォロー" as const,
    href: "/students/sato-misaki",
    action: "生徒カルテを見る",
  },
];

const weekCalendar = [
  {
    day: "月",
    date: "5/19",
    lessons: [
      { time: "13:30", title: "リラックスヨガ", count: 6, status: "記録済み" as LessonStatus, href: "/lessons/relax-yoga-20250519" },
    ],
  },
  {
    day: "火",
    date: "5/20",
    lessons: [
      { time: "10:00", title: "ベーシックフロー", count: 9, status: "記録済み" as LessonStatus, href: "/lessons/basic-flow-20250520" },
      { time: "13:30", title: "肩こり改善ヨガ", count: 6, status: "記録待ち" as LessonStatus, href: "/lessons/restorative-20250511/record" },
    ],
  },
  {
    day: "水",
    date: "5/21",
    lessons: [
      { time: "10:00", title: "リラックスヨガ", count: 4, status: "事前準備済み" as LessonStatus, href: "/lessons/relax-yoga-20250519" },
    ],
  },
  { day: "木", date: "5/22", lessons: [] },
  {
    day: "金",
    date: "5/23",
    lessons: [
      { time: "18:30", title: "陰ヨガ", count: 8, status: "予定" as LessonStatus, href: "/lessons/new" },
    ],
  },
  {
    day: "土",
    date: "5/24",
    lessons: [
      { time: "10:00", title: "ベーシックフロー", count: 5, status: "事前準備中" as LessonStatus, href: "/lessons/basic-flow-20250520/edit" },
    ],
  },
  { day: "日", date: "5/25", lessons: [] },
];

const aiSuggestions = [
  "13:00の肩こり改善ヨガは、首肩まわりの可動域確認を最初に入れると良さそうです。",
  "昨日のリラックスヨガは記録待ちです。生徒の反応が薄れる前にメモを残しましょう。",
  "佐藤 美咲さんは膝の違和感があるため、深い後屈を避ける提案を入れてください。",
  "ベーシックフローのテンプレートは、休息の選択肢を追記すると使いやすくなります。",
];

const shortcuts: Array<{ label: string; href: string; icon: LucideIcon; tone: "green" | "coral" | "purple" | "beige" }> = [
  { label: "予定を登録", href: "/schedules/new", icon: CalendarDays, tone: "green" },
  { label: "カルテを準備", href: "/lessons/new", icon: ClipboardCheck, tone: "purple" },
  { label: "記録を書く", href: "/lessons/restorative-20250511/record", icon: FilePenLine, tone: "coral" },
  { label: "生徒を登録", href: "/students/new", icon: UserPlus, tone: "green" },
  { label: "生徒カルテを見る", href: "/students", icon: UserRound, tone: "beige" },
  { label: "テンプレートを作成", href: "/templates/new", icon: Layers3, tone: "purple" },
];

const attentionStudents = [
  {
    student: students[0],
    next: "次回は膝の違和感と後屈時の安心感を確認",
  },
  {
    student: students[1],
    next: "首まわりの緊張と急なツイストへの反応を確認",
  },
];

export default function DashboardPage() {
  return (
    <>
      <header className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[14px] font-bold text-[#4f7b58]">おはようございます</p>
          <div className="flex items-end gap-4">
            <h1 className="text-[24px] font-extrabold leading-tight tracking-normal">今日のホーム</h1>
            <p className="pb-1 text-[14px] font-semibold text-[#5d5d58]">
              今日のレッスン準備と記録待ちを確認しましょう。
            </p>
          </div>
          <p className="mt-2 inline-flex h-8 items-center gap-2 rounded-xl bg-white/70 px-3 text-[13px] font-semibold text-[#30362f]">
            <CalendarDays className="h-4 w-4" />
            2025年5月20日（火）
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <QuickButton href="/schedules/new" icon={Plus} label="予定を登録" />
          <QuickButton href="/students/new" icon={Plus} label="生徒を登録" />
          <QuickButton href="/lessons/new" icon={Plus} label="カルテを準備" />
        </div>
      </header>

      <section className="grid grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)] gap-3">
        <SoftCard className="p-4">
          <SectionTitle icon={ListTodo} title="今日やること" subtitle="次に動くことだけを表示" />
          <div className="grid gap-2">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className="grid grid-cols-[58px_minmax(0,1fr)_110px_132px] items-center gap-3 rounded-xl border border-[#eee4d8] bg-white/70 px-3 py-2.5"
              >
                <span className="text-[13px] font-extrabold text-[#4c554a]">{task.time}</span>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-extrabold">{task.title}</p>
                  <p className="mt-0.5 truncate text-[12px] font-medium text-[#6b7468]">{task.note}</p>
                </div>
                <TaskBadge status={task.status} />
                <Link
                  href={task.href}
                  className="inline-flex h-8 items-center justify-center rounded-lg bg-[#5d956d] px-3 text-[12px] font-bold text-white"
                >
                  {task.action}
                </Link>
              </div>
            ))}
          </div>
        </SoftCard>

        <SoftCard className="p-4">
          <SectionTitle icon={Sparkles} title="今日のAI提案" subtitle="準備と記録のヒント" />
          <div className="space-y-1.5">
            {aiSuggestions.map((suggestion) => (
              <div key={suggestion} className="rounded-xl border border-[#eee4d8] bg-white/70 px-2.5 py-2">
                <p className="text-[12px] font-medium leading-5 text-[#50584e]">{suggestion}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2">
            <Button className="h-8 rounded-lg bg-[#5d956d] px-2 text-[11px] font-bold text-white shadow-none hover:bg-[#4f835d]">
              AIメンターにまとめて相談
            </Button>
            <Button className="h-8 rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-2 text-[11px] font-bold text-[#4f7b58] shadow-none hover:bg-[#eef7ee]">
              今日の準備を相談
            </Button>
          </div>
        </SoftCard>
      </section>

      <section className="mt-3 grid grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)] gap-3">
        <SoftCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle icon={CalendarDays} title="今週のカレンダー" subtitle="予定とカルテ状態を週表示で確認" />
            <div className="flex gap-2">
              <Button variant="outline" className="h-8 rounded-lg border-[#cfe1ca] bg-white px-3 text-[12px] font-bold text-[#4f7b58]">
                今週
              </Button>
              <Button variant="outline" className="h-8 rounded-lg border-[#e5d9ca] bg-white px-3 text-[12px] font-bold text-[#6f685f]">
                来週
              </Button>
              <Link
                href="/schedules/new"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#5d956d] px-3 text-[12px] font-bold text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                予定を登録
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekCalendar.map((day) => (
              <div key={day.date} className="min-h-[150px] rounded-xl border border-[#eee4d8] bg-white/66 p-2">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-extrabold">{day.day}</p>
                    <p className="text-[11px] font-bold text-[#7c8476]">{day.date}</p>
                  </div>
                  {day.date === "5/20" ? (
                    <span className="rounded-full bg-[#5d956d] px-2 py-0.5 text-[10px] font-bold text-white">今日</span>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  {day.lessons.length > 0 ? (
                    day.lessons.map((lesson) => (
                      <Link
                        key={`${day.date}-${lesson.time}-${lesson.title}`}
                        href={lesson.href}
                        className="block rounded-lg border border-[#dbe4d6] bg-[#f8fcf6] p-1.5 hover:bg-[#eef7ee]"
                      >
                        <p className="text-[11px] font-extrabold text-[#4f7b58]">{lesson.time}</p>
                        <p className="mt-0.5 truncate text-[12px] font-bold leading-4">{lesson.title}</p>
                        <div className="mt-1 flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-[#6b7468]">{lesson.count}名</span>
                          <CalendarStatus status={lesson.status} />
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="rounded-lg border border-dashed border-[#e2d8cc] bg-[#fffdf9] p-1.5 text-[11px] font-medium leading-4 text-[#9a948b]">
                      予定なし
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SoftCard>

        <div className="grid gap-3">
          <SoftCard className="p-3.5">
            <SectionTitle icon={ChevronRight} title="すぐ使うショートカット" />
            <div className="grid grid-cols-2 gap-2">
              {shortcuts.map((shortcut) => {
                const Icon = shortcut.icon;

                return (
                  <Link
                    key={shortcut.label}
                    href={shortcut.href}
                    className="flex min-h-[60px] flex-col justify-between rounded-xl border border-[#eee4d8] bg-white/70 p-2 hover:bg-[#f8fcf6]"
                  >
                    <Icon className={`h-5 w-5 ${shortcutTone(shortcut.tone)}`} />
                    <span className="text-[12px] font-extrabold leading-4">{shortcut.label}</span>
                  </Link>
                );
              })}
            </div>
          </SoftCard>

          <SoftCard className="p-3.5">
            <SectionTitle icon={UserRound} title="注意が必要な生徒" />
            <div className="grid gap-2">
              {attentionStudents.map(({ student, next }) => (
                <div key={student.id} className="rounded-xl border border-[#eee4d8] bg-white/70 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-extrabold">{student.name} さん</p>
                      <p className="text-[11px] font-bold text-[#7c8476]">{student.age}歳</p>
                    </div>
                    <Link
                      href={`/students/${student.id}`}
                      className="shrink-0 rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-2.5 py-1.5 text-[11px] font-bold text-[#5d956d]"
                    >
                      生徒カルテを見る
                    </Link>
                  </div>
                  <InfoLine label="ヨガ他経験" value={student.experience} />
                  <InfoLine label="ケガなどの注意点" value={student.caution} />
                  <InfoLine label="その他メモ" value={student.memo} />
                  <p className="mt-2 rounded-lg bg-[#fff4ef] px-2 py-1.5 text-[11px] font-bold leading-4 text-[#d96c55]">
                    次回確認：{next}
                  </p>
                </div>
              ))}
            </div>
          </SoftCard>
        </div>
      </section>

      <div className="mt-3 flex justify-end pb-2">
        <Link href="/lessons" className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#cfe1ca] bg-white px-4 text-[13px] font-bold text-[#4f7b58]">
          レッスン管理を見る
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </>
  );
}

function QuickButton({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#5d956d] px-3 text-[12px] font-bold text-white shadow-[0_8px_18px_rgba(64,113,77,0.16)]"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

function TaskBadge({ status }: { status: LessonStatus | "要フォロー" }) {
  const className =
    status === "記録待ち"
      ? "border-[#f2c9bd] bg-[#fff0ea] text-[#ec6f5d]"
      : status === "事前準備済み"
        ? "border-[#cfe1ca] bg-[#edf5ef] text-[#4f875a]"
        : status === "事前準備中"
          ? "border-[#efd3a7] bg-[#fff7e8] text-[#9b7338]"
          : status === "要フォロー"
            ? "border-[#f2b7c0] bg-[#fff0f3] text-[#d95c70]"
            : "border-[#d8d1ef] bg-[#f2efff] text-[#6b61b8]";

  return (
    <span className={`inline-flex h-7 items-center justify-center rounded-full border px-2 text-[11px] font-bold ${className}`}>
      {status}
    </span>
  );
}

function CalendarStatus({ status }: { status: LessonStatus }) {
  return (
    <span className="max-w-[64px] truncate rounded-full border border-[#d8e3d4] bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#4f7b58]">
      {status}
    </span>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[78px_minmax(0,1fr)] gap-2 border-t border-[#eee8dd] py-1.5 first:border-t-0">
      <span className="text-[11px] font-bold text-[#8b704c]">{label}</span>
      <span className="line-clamp-2 text-[11px] font-medium leading-4 text-[#4c554a]">{value}</span>
    </div>
  );
}

function shortcutTone(tone: "green" | "coral" | "purple" | "beige") {
  if (tone === "coral") return "text-[#ef6f5b]";
  if (tone === "purple") return "text-[#7469bf]";
  if (tone === "beige") return "text-[#9b7338]";
  return "text-[#5d956d]";
}
