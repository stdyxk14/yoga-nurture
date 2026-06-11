import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, ChevronRight, ClipboardCheck, FilePenLine, ListTodo, Plus, Sparkles, UserPlus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { students } from "@/components/yoga/records";
import type { LessonStatus } from "@/components/yoga/records";

const todayTasks = [
  { time: "10:00", title: "基礎バランスフロー", note: "原稿出力済み", status: "事前準備済み" as const, href: "/lessons/basic-flow-20250520/script", action: "原稿を見る" },
  { time: "13:30", title: "肩こり改善ヨガ", note: "ブロック評価が必要", status: "記録待ち" as const, href: "/lessons/restorative-20250511/record", action: "記録を書く" },
  { time: "次回", title: "佐藤 美咲さん", note: "膝の違和感を確認", status: "要フォロー" as const, href: "/students/sato-misaki", action: "生徒カルテを見る" },
  { time: "今週", title: "陰ヨガ", note: "ブロックを組んでプラン作成", status: "予定" as const, href: "/lessons/new", action: "プラン作成" },
];

const monthDays = Array.from({ length: 35 }, (_, index) => {
  const day = index - 2;
  const lessons: Array<{ time: string; title: string; status: LessonStatus; href: string }> = [];
  if (day === 11) lessons.push({ time: "10:30", title: "リストラティブ", status: "記録待ち", href: "/lessons/restorative-20250511/record" });
  if (day === 19) lessons.push({ time: "13:30", title: "リラックス", status: "事前準備済み", href: "/lessons/relax-yoga-20250519" });
  if (day === 20) lessons.push({ time: "10:00", title: "基礎バランス", status: "記録済み", href: "/lessons/basic-flow-20250520" });
  if (day === 23) lessons.push({ time: "18:30", title: "陰ヨガ", status: "予定", href: "/lessons/new" });
  if (day === 24) lessons.push({ time: "10:00", title: "ベーシック", status: "事前準備中", href: "/lessons/basic-flow-20250520/edit" });
  return { day, lessons };
});

const aiSuggestions = [
  "13:30の肩こり改善ヨガは、首のストレッチブロックを先に入れると安心です。",
  "リストラティブヨガは記録待ちです。ブロックごとの反応が薄れる前にメモを残しましょう。",
  "完全呼吸法は反応が良いブロックです。次回の導入にも候補として使えます。",
];

export default function DashboardPage() {
  return (
    <>
      <div className="md:hidden">
        <MobileDashboard />
      </div>
      <div className="hidden md:block">
      <header className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[14px] font-bold text-[#4f7b58]">おはようございます</p>
          <div className="flex items-end gap-4">
            <h1 className="text-[24px] font-extrabold leading-tight">今日のホーム</h1>
            <p className="pb-1 text-[14px] font-semibold text-[#5d5d58]">今日の準備・原稿・記録待ちを確認しましょう。</p>
          </div>
          <p className="mt-2 inline-flex h-8 items-center gap-2 rounded-xl bg-white/70 px-3 text-[13px] font-semibold text-[#30362f]">
            <CalendarDays className="h-4 w-4" />2025年5月20日（火）
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <QuickButton href="/schedules/new" icon={Plus} label="予定を登録" />
          <QuickButton href="/students/new" icon={Plus} label="生徒を登録" />
          <QuickButton href="/lessons/new" icon={Plus} label="プランを作成" />
        </div>
      </header>

      <section className="grid grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)] gap-3">
        <SoftCard className="p-4">
          <SectionTitle icon={ListTodo} title="今日やること" subtitle="次に動くことだけを表示" />
          <div className="grid gap-2">
            {todayTasks.map((task) => (
              <div key={`${task.time}-${task.title}`} className="grid grid-cols-[58px_minmax(0,1fr)_110px_120px] items-center gap-3 rounded-xl border border-[#eee4d8] bg-white/70 px-3 py-2.5">
                <span className="text-[13px] font-extrabold text-[#4c554a]">{task.time}</span>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-extrabold">{task.title}</p>
                  <p className="mt-0.5 truncate text-[12px] font-medium text-[#6b7468]">{task.note}</p>
                </div>
                <TaskBadge status={task.status} />
                <Link href={task.href} className="inline-flex h-8 items-center justify-center rounded-lg bg-[#5d956d] px-3 text-[12px] font-bold text-white">{task.action}</Link>
              </div>
            ))}
          </div>
        </SoftCard>

        <SoftCard className="p-4">
          <SectionTitle icon={Sparkles} title="今日のAI提案" subtitle="ブロックと記録のヒント" />
          <div className="space-y-2">
            {aiSuggestions.map((suggestion) => (
              <div key={suggestion} className="rounded-xl border border-[#eee4d8] bg-white/70 p-2.5">
                <p className="text-[12px] font-medium leading-5 text-[#50584e]">{suggestion}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2">
            <Button className="h-8 rounded-lg bg-[#5d956d] text-[11px] font-bold text-white shadow-none hover:bg-[#4f835d]">AIメンターにまとめて相談</Button>
            <Button className="h-8 rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] text-[11px] font-bold text-[#4f7b58] shadow-none hover:bg-[#eef7ee]">今日の準備を相談</Button>
          </div>
        </SoftCard>
      </section>

      <section className="mt-3 grid grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)] gap-3">
        <SoftCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle icon={CalendarDays} title="2025年5月カレンダー" subtitle="月表示で予定とカルテ状態を確認" />
            <Link href="/schedules/new" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#5d956d] px-3 text-[12px] font-bold text-white"><Plus className="h-3.5 w-3.5" />予定を登録</Link>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {["月", "火", "水", "木", "金", "土", "日"].map((day) => <div key={day} className="text-center text-[11px] font-bold text-[#7c8476]">{day}</div>)}
            {monthDays.map((cell, index) => (
              <div key={index} className={`min-h-[86px] rounded-xl border p-1.5 ${cell.day === 20 ? "border-[#5d956d] bg-[#f2f8f1]" : "border-[#eee4d8] bg-white/66"}`}>
                <p className="text-[11px] font-extrabold">{cell.day > 0 && cell.day <= 31 ? cell.day : ""}</p>
                <div className="mt-1 space-y-1">
                  {cell.lessons.map((lesson) => (
                    <Link key={`${cell.day}-${lesson.time}`} href={lesson.href} className="block rounded-lg border border-[#dbe4d6] bg-[#f8fcf6] px-1.5 py-1">
                      <p className="text-[10px] font-extrabold text-[#4f7b58]">{lesson.time}</p>
                      <p className="truncate text-[11px] font-bold">{lesson.title}</p>
                      <p className="truncate text-[10px] font-bold text-[#9b7338]">{lesson.status}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SoftCard>

        <div className="grid gap-3">
          <SoftCard className="p-3.5">
            <SectionTitle icon={ChevronRight} title="すぐ使うショートカット" />
            <div className="grid grid-cols-2 gap-2">
              <Shortcut href="/schedules/new" icon={CalendarDays} label="予定を登録" />
              <Shortcut href="/lessons/new" icon={ClipboardCheck} label="プラン作成" />
              <Shortcut href="/lessons/restorative-20250511/record" icon={FilePenLine} label="記録を書く" />
              <Shortcut href="/students/new" icon={UserPlus} label="生徒を登録" />
            </div>
          </SoftCard>
          <SoftCard className="p-3.5">
            <SectionTitle icon={UserRound} title="注意が必要な生徒" />
            <div className="grid gap-2">
              {students.slice(0, 2).map((student) => (
                <div key={student.id} className="rounded-xl border border-[#eee4d8] bg-white/70 p-3">
                  <p className="text-[14px] font-extrabold">{student.name} さん</p>
                  <InfoLine label="ヨガ他経験" value={student.experience} />
                  <InfoLine label="注意点" value={student.caution} />
                  <InfoLine label="その他メモ" value={student.memo} />
                  <Link href={`/students/${student.id}`} className="mt-2 inline-flex h-7 items-center rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-2 text-[11px] font-bold text-[#5d956d]">生徒カルテを見る</Link>
                </div>
              ))}
            </div>
          </SoftCard>
        </div>
      </section>
      </div>
    </>
  );
}

function MobileDashboard() {
  const mobileTasks = [
    { time: "10:00", title: "グループレッスン", note: "基礎バランスフロー（60分）", status: "準備済み", href: "/lessons/basic-flow-20250520/script", action: "見る" },
    { time: "14:00", title: "プライベートセッション", note: "肩こり改善プラン", status: "準備する", href: "/lessons/new", action: "準備" },
    { time: "16:00", title: "レッスンプランを作成", note: "6/15 グループレッスン", status: "作成する", href: "/lessons/new", action: "作成" },
  ];
  const plannedDays = new Set([11, 19, 20, 23, 24]);
  const days = Array.from({ length: 35 }, (_, index) => index - 2);

  return (
    <div className="mx-auto max-w-[430px] space-y-4 px-1">
      <section className="rounded-3xl bg-white/70 p-4 shadow-[0_10px_24px_rgba(91,76,53,0.06)]">
        <p className="text-[13px] font-bold text-[#5d956d]">おはようございます</p>
        <h1 className="mt-1 text-[22px] font-extrabold leading-tight">今日も素敵な一日をつくりましょう</h1>
        <p className="mt-2 text-[12px] font-medium text-[#6b7468]">レッスン準備と記録待ちを、ゆっくり確認します。</p>
      </section>

      <section className="rounded-3xl border border-[#eee4d8] bg-white/78 p-4 shadow-[0_10px_24px_rgba(91,76,53,0.06)]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-extrabold">2025年5月</h2>
          <div className="flex gap-2 text-[#8b704c]">
            <ChevronRight className="h-4 w-4 rotate-180" />
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
            <p key={day} className="py-1 text-[11px] font-bold text-[#9a8f82]">{day}</p>
          ))}
          {days.map((day, index) => {
            const inMonth = day > 0 && day <= 31;
            const today = day === 20;
            return (
              <div key={index} className="flex h-10 flex-col items-center justify-center">
                <span className={today ? "flex h-7 w-7 items-center justify-center rounded-full bg-[#7ea06f] text-[12px] font-extrabold text-white" : "text-[12px] font-bold text-[#4c514b]"}>
                  {inMonth ? day : ""}
                </span>
                {inMonth && plannedDays.has(day) ? <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#d6a16f]" /> : <span className="mt-0.5 h-1.5 w-1.5" />}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-[#eee4d8] bg-white/78 p-4 shadow-[0_10px_24px_rgba(91,76,53,0.06)]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-extrabold">今日やること</h2>
          <span className="text-[11px] font-bold text-[#9a8f82]">5月20日（火）</span>
        </div>
        <div className="grid gap-3">
          {mobileTasks.map((task) => (
            <Link key={`${task.time}-${task.title}`} href={task.href} className="grid grid-cols-[54px_1fr_64px] items-center gap-3 rounded-2xl border border-[#eee4d8] bg-white/72 p-3">
              <span className="text-[13px] font-extrabold text-[#5d956d]">{task.time}</span>
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-extrabold">{task.title}</span>
                <span className="block truncate text-[11px] font-medium text-[#6b7468]">{task.note}</span>
              </span>
              <span className="rounded-full bg-[#edf5ef] px-2 py-1 text-center text-[11px] font-bold text-[#5d956d]">{task.action}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[#e6dff2] bg-[#faf7ff] p-4 shadow-[0_10px_24px_rgba(91,76,53,0.05)]">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#9b7bc7]" />
          <h2 className="text-[16px] font-extrabold">AIからの提案</h2>
        </div>
        <p className="text-[13px] font-medium leading-6 text-[#56505f]">午後の肩こり改善ヨガは、首まわりの可動域確認を最初に入れると安心です。</p>
        <Link href="/lessons/new" className="mt-3 inline-flex h-9 items-center justify-center rounded-xl bg-[#9b7bc7] px-4 text-[12px] font-bold text-white">提案を見る</Link>
      </section>

      <section className="rounded-3xl border border-[#eee4d8] bg-white/78 p-4 shadow-[0_10px_24px_rgba(91,76,53,0.06)]">
        <h2 className="mb-3 text-[16px] font-extrabold">ショートカット</h2>
        <div className="grid grid-cols-4 gap-3">
          <MobileShortcut href="/lessons/new" icon={Plus} label="プラン作成" />
          <MobileShortcut href="/lessons?tab=blocks" icon={ClipboardCheck} label="ブロック一覧" />
          <MobileShortcut href="/students" icon={UserRound} label="生徒一覧" />
          <MobileShortcut href="/reports" icon={ListTodo} label="レポート" />
        </div>
      </section>
    </div>
  );
}

function MobileShortcut({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link href={href} className="flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-2xl border border-[#eee4d8] bg-white/75 p-2 text-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ede7f8] text-[#9b7bc7]">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-[10px] font-bold leading-4">{label}</span>
    </Link>
  );
}

function QuickButton({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return <Link href={href} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#5d956d] px-3 text-[12px] font-bold text-white"><Icon className="h-3.5 w-3.5" />{label}</Link>;
}

function Shortcut({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return <Link href={href} className="flex min-h-[60px] flex-col justify-between rounded-xl border border-[#eee4d8] bg-white/70 p-2 hover:bg-[#f8fcf6]"><Icon className="h-5 w-5 text-[#5d956d]" /><span className="text-[12px] font-extrabold leading-4">{label}</span></Link>;
}

function TaskBadge({ status }: { status: LessonStatus | "要フォロー" }) {
  const className = status === "記録待ち" ? "border-[#f2c9bd] bg-[#fff0ea] text-[#ec6f5d]" : status === "事前準備済み" ? "border-[#cfe1ca] bg-[#edf5ef] text-[#4f875a]" : status === "要フォロー" ? "border-[#f2b7c0] bg-[#fff0f3] text-[#d95c70]" : "border-[#d8d1ef] bg-[#f2efff] text-[#6b61b8]";
  return <span className={`inline-flex h-7 items-center justify-center rounded-full border px-2 text-[11px] font-bold ${className}`}>{status}</span>;
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-4"><span className="font-bold text-[#8b704c]">{label}：</span>{value}</p>;
}
