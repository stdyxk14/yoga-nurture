import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  FileText,
  Layers3,
  MapPin,
  PenLine,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageHeader, Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import {
  blockAnalysis,
  blockTemplates,
  lessonRecordSummaries,
  lessonSchedules,
  lessons,
} from "@/components/yoga/records";
import type { LessonSchedule, LessonStatus } from "@/components/yoga/records";

type LessonTab = "schedule" | "plans" | "blocks" | "records" | "analysis";

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
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab: LessonTab =
    tab === "plans" || tab === "blocks" || tab === "records" || tab === "analysis" ? tab : "schedule";

  return (
    <>
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

      {activeTab === "schedule" ? <ScheduleTab /> : null}
      {activeTab === "plans" ? <PlansTab /> : null}
      {activeTab === "blocks" ? <BlocksTab /> : null}
      {activeTab === "records" ? <RecordsTab /> : null}
      {activeTab === "analysis" ? <AnalysisTab /> : null}
    </>
  );
}

function ScheduleTab() {
  return (
    <>
      <section className="mb-3 grid grid-cols-[1fr_auto] items-center gap-3">
        <div className="grid grid-cols-3 gap-3">
          <Metric title="今日の予定" value="2" unit="件" icon={CalendarDays} />
          <Metric title="原稿出力待ち" value="3" unit="件" icon={FileText} tone="purple" />
          <Metric title="記録待ち" value="1" unit="件" icon={PenLine} />
        </div>
        <Link
          href="/schedules/new"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(64,113,77,0.2)]"
        >
          <Plus className="h-4 w-4" />
          予定を登録
        </Link>
      </section>

      <SoftCard className="p-3.5">
        <SectionTitle icon={CalendarDays} title="スケジュール" subtitle="予定からプラン作成、原稿出力、実施後記録へ進みます" />
        <div className="grid gap-2">
          {lessonSchedules.map((schedule) => {
            const action = scheduleAction(schedule);
            return (
              <div
                key={schedule.id}
                className="grid grid-cols-[100px_82px_minmax(130px,1fr)_72px_82px_minmax(150px,1fr)_220px] items-center gap-2 rounded-xl border border-[#eee4d8] bg-white/72 px-3 py-2.5"
              >
                <p className="text-[12px] font-bold">{schedule.date}</p>
                <p className="text-[12px] font-bold">{schedule.time}</p>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-extrabold">{schedule.lessonName}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#6b7468]">
                    <MapPin className="h-3 w-3" />
                    {schedule.place} / {schedule.format}
                  </p>
                </div>
                <p className="text-[12px] font-bold text-[#4f875a]">{schedule.participantCount}名</p>
                <StatusBadge status={schedule.status} />
                <p className="line-clamp-2 text-[12px] font-medium leading-5 text-[#50584e]">{schedule.nextAction}</p>
                <div className="grid grid-cols-2 gap-1">
                  <Link href={action.href} className="inline-flex h-7 items-center justify-center rounded-lg bg-[#5d956d] px-2 text-[11px] font-bold text-white">
                    {action.label}
                  </Link>
                  <Link href={schedule.lessonId ? `/lessons/${schedule.lessonId}/script` : "/lessons/new"} className="inline-flex h-7 items-center justify-center rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-2 text-[11px] font-bold text-[#5d956d]">
                    原稿
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </SoftCard>
    </>
  );
}

function PlansTab() {
  return (
    <>
      <div className="mb-3 flex justify-end gap-2">
        <Link href="/lessons/new" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white">
          <Plus className="h-4 w-4" />
          レッスンプランを作成
        </Link>
      </div>
      <div className="grid gap-3">
        {lessons.map((lesson) => (
          <SoftCard key={lesson.id} className="p-3.5">
            <div className="grid grid-cols-[minmax(0,1fr)_130px_190px] items-center gap-3">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <h2 className="truncate text-[17px] font-extrabold">{lesson.title}</h2>
                  <StatusBadge status={lesson.status} />
                </div>
                <p className="text-[12px] font-semibold text-[#5f665c]">
                  {lesson.date} {lesson.startTime}-{lesson.endTime} / {lesson.place} / {lesson.format}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {lesson.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}
                </div>
              </div>
              <div className="rounded-xl border border-[#eee4d8] bg-white/65 p-2 text-center">
                <p className="text-[11px] font-bold text-[#7c8476]">使用ブロック</p>
                <p className="text-[28px] font-extrabold text-[#4f875a]">{lesson.blockIds.length}</p>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Link href={`/lessons/${lesson.id}`} className="inline-flex h-8 items-center justify-center rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-2 text-center text-[12px] font-bold text-[#5d956d]">詳細</Link>
                <Link href={`/lessons/${lesson.id}/edit`} className="inline-flex h-8 items-center justify-center rounded-lg border border-[#cfe1ca] bg-white text-[12px] font-bold text-[#5d956d]">編集</Link>
                <Link href={`/lessons/${lesson.id}/script`} className="col-span-2 inline-flex h-8 items-center justify-center rounded-lg bg-[#5d956d] text-[12px] font-bold text-white">原稿を表示・印刷</Link>
              </div>
            </div>
          </SoftCard>
        ))}
      </div>
    </>
  );
}

function BlocksTab() {
  const categoryFilters = ["すべて", "導入", "呼吸法", "ウォーミングアップ", "クールダウン", "未使用"];
  const sortFilters = ["使用頻度順", "評価が高い順", "最近使った順", "改善メモ多め"];

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#e7dfd4] bg-white/80 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-[#6b7468]" />
          <Input placeholder="ブロック名、カテゴリー、タグ、原稿内の言葉で検索" className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
        </div>
        <Link href="/lessons/blocks/new" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white">
          <Plus className="h-4 w-4" />
          ブロックを登録
        </Link>
      </div>

      <SoftCard className="mb-3 p-3">
        <div className="flex flex-wrap gap-2">
          {[...categoryFilters, ...sortFilters, "#呼吸", "#肩こり改善", "#リラックス"].map((item, index) => (
            <Pill key={item} active={index === 0}>{item}</Pill>
          ))}
        </div>
      </SoftCard>

      <div className="grid grid-cols-3 items-stretch gap-3">
        {blockTemplates.map((block) => (
          <SoftCard key={block.id} className="flex min-h-[305px] flex-col p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-[16px] font-extrabold">{block.name}</h2>
                <p className="mt-1 truncate text-[12px] font-bold text-[#5d956d]" title={`${block.majorCategory} / ${block.minorCategory}`}>{block.majorCategory} / {block.minorCategory}</p>
              </div>
              <span className="rounded-full bg-[#edf5ef] px-2 py-1 text-[11px] font-bold text-[#4f875a]">{block.duration}</span>
            </div>
            <p className="line-clamp-3 min-h-[60px] text-[12px] font-medium leading-5 text-[#50584e]">{block.script}</p>
            <p className="mt-1 line-clamp-1 min-h-5 text-[11px] font-bold text-[#d96c55]" title={block.cautions}>????{block.cautions}</p>
            <div className="mt-2 flex min-h-[30px] flex-wrap gap-1 overflow-hidden">
              {block.tags.slice(0, 3).map((tag) => <Pill key={tag}>{tag}</Pill>)}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <MiniStat label="使用" value={`${block.usageCount}回`} />
              <MiniStat label="評価" value={block.averageRating.toFixed(1)} />
              <MiniStat label="最近" value={block.lastUsed} />
            </div>
            <div className="mt-auto grid grid-cols-3 gap-1.5 pt-3">
              <Link href={`/blocks/${block.id}`} className="inline-flex h-8 items-center justify-center rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] text-[12px] font-bold text-[#5d956d]">詳細</Link>
              <Link href="/lessons/blocks/new" className="inline-flex h-8 items-center justify-center rounded-lg border border-[#e7dfd4] bg-white text-[12px] font-bold text-[#6b7468]">編集</Link>
              <Link href="/lessons/new" className="inline-flex h-8 items-center justify-center rounded-lg bg-[#5d956d] text-[12px] font-bold text-white">使う</Link>
            </div>
          </SoftCard>
        ))}
      </div>
    </>
  );
}

function RecordsTab() {
  return (
    <SoftCard className="p-3.5">
      <SectionTitle icon={FileText} title="実施後記録" subtitle="レッスン後にブロック評価と生徒コメントを入力" />
      <div className="grid gap-2">
        {lessonRecordSummaries.map((record) => (
          <div key={record.id} className="grid grid-cols-[110px_minmax(130px,0.8fr)_80px_90px_minmax(140px,1fr)_160px] items-center gap-2 rounded-xl border border-[#eee4d8] bg-white/72 p-3">
            <p className="text-[12px] font-bold">{record.date}</p>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-extrabold">{record.lessonName}</p>
              <p className="truncate text-[11px] font-medium text-[#6b7468]">{record.tags.join(" ")}</p>
            </div>
            <p className="text-[12px] font-bold text-[#4f875a]">{record.participantCount}名</p>
            <StatusBadge status={record.status} />
            <p className="line-clamp-2 text-[12px] font-medium leading-5">{record.summary}</p>
            <div className="grid grid-cols-2 gap-1.5">
              <Link href={`/lessons/${record.id}/record`} className="inline-flex h-8 items-center justify-center rounded-lg bg-[#ef6f5b] text-[12px] font-bold text-white">記録</Link>
              <Link href={`/lessons/${record.id}`} className="inline-flex h-8 items-center justify-center rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] text-[12px] font-bold text-[#5d956d]">詳細</Link>
            </div>
          </div>
        ))}
      </div>
    </SoftCard>
  );
}

function AnalysisTab() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_280px] gap-3">
      <SoftCard className="p-3.5">
        <SectionTitle icon={BarChart3} title="ブロック分析" subtitle="よく使う・反応が良い・改善が必要なブロックを確認" />
        <div className="grid grid-cols-4 gap-3">
          {blockAnalysis.map(([name, usage, rating, note]) => (
            <div key={name} className="rounded-xl border border-[#eee4d8] bg-white/70 p-3">
              <p className="text-[14px] font-extrabold">{name}</p>
              <p className="mt-2 text-[12px] font-bold text-[#5d956d]">使用 {usage}</p>
              <p className="text-[12px] font-bold text-[#7469bf]">平均評価 {rating}</p>
              <p className="mt-2 rounded-lg bg-[#fff7e8] px-2 py-1 text-[11px] font-bold text-[#9b7338]">{note}</p>
            </div>
          ))}
        </div>
      </SoftCard>
      <SoftCard className="p-3.5">
        <SectionTitle icon={SlidersHorizontal} title="分析軸" />
        <div className="grid gap-2">
          {["ブロック使用回数ランキング", "反応が良かったブロック", "最近使っていないブロック", "改善メモが多いブロック"].map((item) => (
            <div key={item} className="rounded-lg border border-[#eee4d8] bg-white/70 p-2 text-[12px] font-bold">{item}</div>
          ))}
        </div>
      </SoftCard>
    </div>
  );
}

function scheduleAction(schedule: LessonSchedule) {
  if (schedule.status === "予定") return { label: "プラン作成", href: "/lessons/new" };
  if (schedule.status === "事前準備中") return { label: "編集", href: schedule.lessonId ? `/lessons/${schedule.lessonId}/edit` : "/lessons/new" };
  if (schedule.status === "事前準備済み") return { label: "プランを見る", href: schedule.lessonId ? `/lessons/${schedule.lessonId}` : "/lessons/new" };
  if (schedule.status === "記録待ち") return { label: "記録を書く", href: schedule.lessonId ? `/lessons/${schedule.lessonId}/record` : "/lessons/new" };
  return { label: "詳細", href: schedule.lessonId ? `/lessons/${schedule.lessonId}` : "/lessons?tab=records" };
}

function Metric({ title, value, unit, icon: Icon, tone = "green" }: { title: string; value: string; unit: string; icon: LucideIcon; tone?: "green" | "purple" }) {
  return (
    <SoftCard className="p-3">
      <SectionTitle icon={Icon} title={title} />
      <p className={tone === "purple" ? "text-[34px] font-extrabold leading-none text-[#6b61b8]" : "text-[34px] font-extrabold leading-none text-[#4f875a]"}>
        {value}<span className="ml-1 text-sm">{unit}</span>
      </p>
    </SoftCard>
  );
}

function StatusBadge({ status }: { status: LessonStatus }) {
  const className =
    status === "記録済み"
      ? "border-[#cfe1ca] bg-[#edf5ef] text-[#4f875a]"
      : status === "記録待ち"
        ? "border-[#f2c9bd] bg-[#fff0ea] text-[#ec6f5d]"
        : status === "事前準備済み"
          ? "border-[#cfe1ca] bg-[#f4f8f1] text-[#4f875a]"
          : status === "事前準備中"
            ? "border-[#efd3a7] bg-[#fff7e8] text-[#9b7338]"
            : "border-[#d8d1ef] bg-[#f2efff] text-[#6b61b8]";

  return <span className={`inline-flex h-7 items-center justify-center rounded-full border px-2 text-[11px] font-bold ${className}`}>{status}</span>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#eee4d8] bg-white/66 p-1.5">
      <p className="text-[10px] font-bold text-[#7c8476]">{label}</p>
      <p className="truncate text-[12px] font-extrabold">{value}</p>
    </div>
  );
}
