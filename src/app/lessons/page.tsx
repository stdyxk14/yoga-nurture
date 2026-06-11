import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Layers3,
  MapPin,
  Plus,
  UsersRound,
} from "lucide-react";
import { PageHeader, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { lessonRecordSummaries, lessonSchedules, lessonTemplates } from "@/components/yoga/records";

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
      <PageHeader title="レッスンカルテ" subtitle="予定・記録・テンプレートをまとめて管理" />

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
          <Metric title="今月の予定" value="32" unit="件" icon={UsersRound} />
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
        <SectionTitle icon={CalendarDays} title="スケジュール" subtitle="予定から記録作成までの流れを確認" />
        <div className="grid gap-2">
          {lessonSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className="grid grid-cols-[116px_88px_minmax(120px,1fr)_78px_54px_74px_178px] items-center gap-2 rounded-xl border border-[#eee4d8] bg-white/72 px-3 py-3"
            >
              <p className="text-[12px] font-bold">{schedule.date}</p>
              <p className="text-[12px] font-bold">{schedule.time}</p>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-extrabold">{schedule.lessonName}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#6b7468]">
                  <MapPin className="h-3 w-3" />
                  {schedule.place}
                </p>
              </div>
              <p className="text-[12px] font-bold">{schedule.format}</p>
              <p className="text-[12px] font-bold text-[#4f875a]">{schedule.participantCount}名</p>
              <StatusBadge status={schedule.status} />
              <div className="flex justify-end gap-1.5">
                <Link
                  href="/lessons/new"
                  className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg bg-[#5d956d] px-2.5 text-[12px] font-bold text-white"
                >
                  カルテを書く
                </Link>
                <Link
                  href={schedule.lessonId ? `/lessons/${schedule.lessonId}` : "/lessons?tab=records"}
                  className="inline-flex h-8 items-center whitespace-nowrap rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-2.5 text-[12px] font-bold text-[#5d956d]"
                >
                  詳細を見る
                </Link>
              </div>
            </div>
          ))}
        </div>
      </SoftCard>
    </>
  );
}

function RecordsTab() {
  return (
    <SoftCard className="p-3.5">
      <SectionTitle icon={FileText} title="実施済みレッスンカルテ" subtitle="レッスン後に書いた記録を一覧で確認" />
      <div className="grid gap-2">
        {lessonRecordSummaries.map((record) => (
          <article key={record.id} className="rounded-xl border border-[#eee4d8] bg-white/72 p-3">
            <div className="grid grid-cols-[110px_minmax(124px,0.78fr)_48px_minmax(104px,0.92fr)_minmax(104px,0.92fr)_minmax(104px,0.92fr)_90px] items-center gap-2">
              <p className="text-[12px] font-bold">{record.date}</p>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-extrabold">{record.lessonName}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {record.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full border border-[#dbe4d6] bg-[#f4f8f1] px-2 py-0.5 text-[11px] font-bold text-[#4f7b58]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-[12px] font-bold text-[#4f875a]">{record.participantCount}名</p>
              <p className="line-clamp-2 text-[12px] font-medium leading-5">{record.summary}</p>
              <p className="line-clamp-2 text-[12px] font-medium leading-5">{record.reaction}</p>
              <p className="line-clamp-2 text-[12px] font-medium leading-5">{record.improvement}</p>
              <Link
                href={`/lessons/${record.id}`}
                className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-2.5 text-[12px] font-bold text-[#5d956d]"
              >
                詳細を見る
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
                <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-5 text-[#5f665c]">{template.theme}</p>
              </div>
              <Layers3 className="h-5 w-5 shrink-0 text-[#6b61b8]" />
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {template.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-[#dbe4d6] bg-[#f4f8f1] px-2 py-0.5 text-[11px] font-bold text-[#4f7b58]">
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
      <p className={tone === "purple" ? "text-[34px] font-extrabold leading-none text-[#6b61b8]" : "text-[34px] font-extrabold leading-none text-[#4f875a]"}>
        {value}
        <span className="ml-1 text-sm">{unit}</span>
      </p>
    </SoftCard>
  );
}

function StatusBadge({ status }: { status: "予定" | "記録待ち" | "記録済み" }) {
  const className =
    status === "記録済み"
      ? "border-[#cfe1ca] bg-[#edf5ef] text-[#4f875a]"
      : status === "記録待ち"
        ? "border-[#f2c9bd] bg-[#fff0ea] text-[#ec6f5d]"
        : "border-[#d8d1ef] bg-[#f2efff] text-[#6b61b8]";

  return <span className={`inline-flex h-7 items-center justify-center rounded-full border px-2 text-[11px] font-bold ${className}`}>{status}</span>;
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 rounded-xl border border-[#eee4d8] bg-white/62 p-2.5">
      <p className="text-[12px] font-bold text-[#4f7b58]">{label}</p>
      <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-5 text-[#50584e]">{value}</p>
    </div>
  );
}
