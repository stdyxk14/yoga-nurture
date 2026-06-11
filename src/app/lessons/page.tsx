import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Layers3,
  MapPin,
  PenLine,
  Plus,
} from "lucide-react";
import { PageHeader, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import {
  getLessonTemplate,
  lessonRecordSummaries,
  lessonSchedules,
  lessonTemplates,
} from "@/components/yoga/records";
import type { LessonSchedule, LessonStatus } from "@/components/yoga/records";

type LessonTab = "schedule" | "records" | "templates";

const tabs: Array<{ id: LessonTab; label: string; href: string; icon: LucideIcon }> = [
  { id: "schedule", label: "スケジュール", href: "/lessons", icon: CalendarDays },
  { id: "records", label: "レッスン記録", href: "/lessons?tab=records", icon: FileText },
  { id: "templates", label: "テンプレート", href: "/lessons?tab=templates", icon: Layers3 },
];

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab: LessonTab = tab === "records" || tab === "templates" ? tab : "schedule";

  return (
    <>
      <PageHeader title="レッスンカルテ" subtitle="予定・事前準備・実施後記録・テンプレートをまとめて管理" />

      <SoftCard className="mb-3 p-3">
        <div className="grid grid-cols-3 gap-2">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={
                  active
                    ? "flex h-10 items-center justify-center gap-2 rounded-xl bg-[#5d956d] text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(64,113,77,0.18)]"
                    : "flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dbe4d6] bg-white/72 text-[13px] font-bold text-[#4f7b58]"
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
      {activeTab === "records" ? <RecordsTab /> : null}
      {activeTab === "templates" ? <TemplatesTab /> : null}
    </>
  );
}

function ScheduleTab() {
  return (
    <>
      <section className="mb-3 grid grid-cols-[1fr_auto] items-center gap-3">
        <div className="grid grid-cols-3 gap-3">
          <Metric title="今日の予定" value="2" unit="件" icon={CalendarDays} />
          <Metric title="今週の予定" value="8" unit="件" icon={ClipboardList} tone="purple" />
          <Metric title="準備中カルテ" value="3" unit="件" icon={PenLine} />
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
        <SectionTitle
          icon={CalendarDays}
          title="スケジュール"
          subtitle="予定からレッスンカルテ準備、実施後記録まで進めます"
        />
        <div className="grid gap-2">
          <div className="grid grid-cols-[76px_70px_minmax(104px,0.9fr)_84px_44px_82px_minmax(105px,1fr)_112px] gap-2 px-3 text-[11px] font-bold text-[#7c8476]">
            <span>日付</span>
            <span>時間</span>
            <span>レッスン名</span>
            <span>テンプレート</span>
            <span>人数</span>
            <span>ステータス</span>
            <span>次にやること</span>
            <span className="text-right">アクション</span>
          </div>
          {lessonSchedules.map((schedule) => {
            const action = scheduleAction(schedule);
            const template = getLessonTemplate(schedule.templateId);

            return (
              <div
                key={schedule.id}
                className="grid grid-cols-[76px_70px_minmax(104px,0.9fr)_84px_44px_82px_minmax(105px,1fr)_112px] items-center gap-2 rounded-xl border border-[#eee4d8] bg-white/72 px-3 py-2.5"
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
                <p className="truncate text-[12px] font-bold text-[#5f665c]">{template.name}</p>
                <p className="text-[12px] font-bold text-[#4f875a]">{schedule.participantCount}名</p>
                <StatusBadge status={schedule.status} />
                <p className="line-clamp-2 text-[12px] font-medium leading-5 text-[#50584e]">{schedule.nextAction}</p>
                <div className="grid gap-1">
                  <Link
                    href={action.href}
                    className="inline-flex h-7 items-center justify-center whitespace-nowrap rounded-lg bg-[#5d956d] px-2 text-[11px] font-bold text-white"
                  >
                    {action.label}
                  </Link>
                  <Link
                    href={schedule.lessonId ? `/lessons/${schedule.lessonId}` : "/lessons/new"}
                    className="inline-flex h-7 items-center justify-center whitespace-nowrap rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-2 text-[11px] font-bold text-[#5d956d]"
                  >
                    詳細
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

function RecordsTab() {
  return (
    <SoftCard className="p-3.5">
      <SectionTitle
        icon={FileText}
        title="レッスン記録"
        subtitle="事前準備済みカルテと実施後記録を一覧で確認"
      />
      <div className="grid gap-2">
        <div className="grid grid-cols-[104px_minmax(118px,0.75fr)_54px_82px_minmax(102px,0.9fr)_minmax(102px,0.9fr)_minmax(102px,0.9fr)_84px] gap-2 px-3 text-[11px] font-bold text-[#7c8476]">
          <span>実施日</span>
          <span>レッスン名</span>
          <span>人数</span>
          <span>状態</span>
          <span>実施内容</span>
          <span>生徒の反応</span>
          <span>改善ポイント</span>
          <span className="text-right">操作</span>
        </div>
        {lessonRecordSummaries.map((record) => (
          <article key={record.id} className="rounded-xl border border-[#eee4d8] bg-white/72 p-3">
            <div className="grid grid-cols-[104px_minmax(118px,0.75fr)_54px_82px_minmax(102px,0.9fr)_minmax(102px,0.9fr)_minmax(102px,0.9fr)_84px] items-center gap-2">
              <p className="text-[12px] font-bold">{record.date}</p>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-extrabold">{record.lessonName}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {record.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#dbe4d6] bg-[#f4f8f1] px-2 py-0.5 text-[11px] font-bold text-[#4f7b58]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-[12px] font-bold text-[#4f875a]">{record.participantCount}名</p>
              <StatusBadge status={record.status} />
              <p className="line-clamp-2 text-[12px] font-medium leading-5">{record.summary}</p>
              <p className="line-clamp-2 text-[12px] font-medium leading-5">{record.reaction}</p>
              <p className="line-clamp-2 text-[12px] font-medium leading-5">{record.improvement}</p>
              <Link
                href={`/lessons/${record.id}`}
                className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-2.5 text-[12px] font-bold text-[#5d956d]"
              >
                詳細
              </Link>
            </div>
          </article>
        ))}
      </div>
    </SoftCard>
  );
}

function TemplatesTab() {
  return (
    <>
      <div className="mb-3 flex justify-end">
        <Link
          href="/templates/new"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(64,113,77,0.2)]"
        >
          <Plus className="h-4 w-4" />
          テンプレートを作成
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {lessonTemplates.map((template) => (
          <SoftCard key={template.id} className="p-3.5">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-[16px] font-extrabold">{template.name}</h2>
                <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-5 text-[#5f665c]">
                  {template.theme}
                </p>
              </div>
              <Layers3 className="h-5 w-5 shrink-0 text-[#6b61b8]" />
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#dbe4d6] bg-[#f4f8f1] px-2 py-0.5 text-[11px] font-bold text-[#4f7b58]"
                >
                  {tag}
                </span>
              ))}
            </div>
            <InfoBlock label="基本構成" value={template.structure} />
            <InfoBlock label="注意点" value={template.cautions} />
            <Link
              href={`/schedules/new?template=${template.id}`}
              className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-lg bg-[#5d956d] px-3 text-[12px] font-bold text-white"
            >
              このテンプレートで予定を作成
            </Link>
          </SoftCard>
        ))}
      </div>
    </>
  );
}

function scheduleAction(schedule: LessonSchedule) {
  if (schedule.status === "予定") return { label: "カルテを準備", href: "/lessons/new" };
  if (schedule.status === "事前準備中") return { label: "準備を続ける", href: schedule.lessonId ? `/lessons/${schedule.lessonId}/edit` : "/lessons/new" };
  if (schedule.status === "事前準備済み") return { label: "事前プランを見る", href: schedule.lessonId ? `/lessons/${schedule.lessonId}` : "/lessons/new" };
  if (schedule.status === "記録待ち") return { label: "記録を書く", href: schedule.lessonId ? `/lessons/${schedule.lessonId}/record` : "/lessons/new" };
  return { label: "詳細を見る", href: schedule.lessonId ? `/lessons/${schedule.lessonId}` : "/lessons?tab=records" };
}

function Metric({
  title,
  value,
  unit,
  icon: Icon,
  tone = "green",
}: {
  title: string;
  value: string;
  unit: string;
  icon: LucideIcon;
  tone?: "green" | "purple";
}) {
  return (
    <SoftCard className="p-3">
      <SectionTitle icon={Icon} title={title} />
      <p
        className={
          tone === "purple"
            ? "text-[34px] font-extrabold leading-none text-[#6b61b8]"
            : "text-[34px] font-extrabold leading-none text-[#4f875a]"
        }
      >
        {value}
        <span className="ml-1 text-sm">{unit}</span>
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

  return (
    <span className={`inline-flex h-7 items-center justify-center rounded-full border px-2 text-[11px] font-bold ${className}`}>
      {status}
    </span>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 rounded-xl border border-[#eee4d8] bg-white/62 p-2.5">
      <p className="text-[12px] font-bold text-[#4f7b58]">{label}</p>
      <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-5 text-[#50584e]">{value}</p>
    </div>
  );
}
