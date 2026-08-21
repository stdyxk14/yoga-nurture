import Link from "next/link";
import { AlertTriangle, ArrowRight, BookOpen, CalendarDays, Pencil, Printer } from "lucide-react";
import { LessonRecordFlowList } from "@/components/yoga/lesson-record-flow-list";
import {
  WorkspaceAction,
  WorkspacePageHeader,
  WorkspacePanel,
  WorkspaceSection,
  WorkspaceStatus,
} from "@/components/yoga/workspace-kit";
import type { LessonRecordDetailData, LessonRecordDetailStudent } from "@/lib/lesson-records";
import { cn } from "@/lib/utils";

const pageSections = [
  { href: "#overview", label: "概要" },
  { href: "#execution-flow", label: "実施フロー" },
  { href: "#student-records", label: "生徒ごとの記録" },
  { href: "#reflection", label: "全体の振り返り" },
] as const;

export function LessonRecordDetail({ data }: { data: LessonRecordDetailData }) {
  const executedItemCount = data.blocks.filter((block) => block.done === true).length;
  const minuteDifference = data.executionSummary.actualMinutes - data.executionSummary.plannedMinutes;
  const flowBadges = [
    { label: "予定どおり", value: data.diffSummary.asPlanned, tone: "green" as const },
    { label: "調整", value: data.diffSummary.adjusted, tone: "purple" as const },
    { label: "スキップ", value: data.diffSummary.skipped, tone: "coral" as const },
    { label: "置き換え", value: data.diffSummary.replaced, tone: "sand" as const },
    { label: "予定外追加", value: data.diffSummary.added, tone: "purple" as const },
  ].filter((item) => item.value > 0);
  const reflections = {
    overall: data.record.overallMemo.trim(),
    reaction: data.record.overallReaction.trim(),
    improvement: data.record.improvementPoints.trim(),
  };
  const hasReflection = Boolean(reflections.overall || reflections.reaction || reflections.improvement);

  return (
    <div className="min-w-0 space-y-4 overflow-x-clip">
      <WorkspacePageHeader
        title="実施後記録"
        backLink={{ href: "/lessons?tab=records", label: "レッスンカルテへ戻る" }}
        meta={(
          <>
            <WorkspaceStatus tone="green" className="whitespace-nowrap">{data.record.statusLabel}</WorkspaceStatus>
            <span className="text-[12px]">保存済みの記録です</span>
          </>
        )}
        actions={(
          <div className="flex max-w-full flex-wrap gap-2 lg:max-w-[480px] lg:justify-end">
            <WorkspaceAction href={`/lessons/${data.schedule.id}/record?edit=1`} icon={Pencil} variant="primary" className="whitespace-nowrap">記録を編集</WorkspaceAction>
            <WorkspaceAction href={`/schedules/${data.schedule.id}`} icon={CalendarDays} className="whitespace-nowrap">予定詳細</WorkspaceAction>
            {data.schedule.lessonPlanId ? <WorkspaceAction href={`/schedules/${data.schedule.id}/script`} icon={Printer} className="whitespace-nowrap">原稿を見る</WorkspaceAction> : null}
            {data.schedule.lessonPlanId ? <WorkspaceAction href={`/lessons/${data.schedule.lessonPlanId}`} icon={BookOpen} className="whitespace-nowrap">使用プランを見る</WorkspaceAction> : null}
          </div>
        )}
      >
        <dl className="grid min-w-0 gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-[minmax(210px,1.35fr)_repeat(5,minmax(0,1fr))]">
          <HeaderDetailField label="レッスン名" value={data.schedule.lessonName} className="sm:col-span-2 xl:col-span-1" prominent />
          <HeaderDetailField label="実施日" value={data.schedule.dateLabel} />
          <HeaderDetailField label="時間" value={`${data.schedule.startTimeLabel}–${data.schedule.endTimeLabel}`} />
          <HeaderDetailField label="場所" value={data.schedule.place || "未設定"} />
          <HeaderDetailField label="使用プラン" value={data.schedule.lessonPlanName} />
          <HeaderDetailField label="最終更新" value={data.record.updatedAtLabel} />
        </dl>
      </WorkspacePageHeader>

      <div id="overview" className="scroll-mt-20">
        <WorkspacePanel as="div">
          <WorkspaceSection title="概要" description="実施フロー、時間、出欠を保存済みデータから集計しています。">
            <div className="grid min-w-0 gap-3 lg:grid-cols-[1.45fr_0.9fr_1fr]">
              <OverviewGroup title="実施フロー">
                <div className="grid grid-cols-2 gap-4">
                  <OverviewNumber label="予定ブロック数" value={`${data.executionSummary.plannedCount}件`} tone="green" />
                  <OverviewNumber label="実施された項目数" value={`${executedItemCount}件`} tone="purple" />
                </div>
                {flowBadges.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {flowBadges.map((item) => (
                      <WorkspaceStatus key={item.label} tone={item.tone} className="min-h-6 whitespace-nowrap px-2 text-[12px]">
                        {item.label} {item.value}
                      </WorkspaceStatus>
                    ))}
                  </div>
                ) : null}
                {data.diffSummary.legacy > 0 || data.diffSummary.unconfirmed > 0 ? (
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-[#fff6e8] px-2.5 py-2 text-[12px] font-medium text-[#8b704c]">
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {data.diffSummary.legacy > 0 ? <span>旧形式／未分類 {data.diffSummary.legacy}件</span> : null}
                    {data.diffSummary.unconfirmed > 0 ? <span>未確認 {data.diffSummary.unconfirmed}件</span> : null}
                  </div>
                ) : null}
              </OverviewGroup>

              <OverviewGroup title="時間">
                <div className="flex items-end justify-between gap-2">
                  <OverviewNumber label="予定" value={`${data.executionSummary.plannedMinutes}分`} tone="green" />
                  <ArrowRight className="mb-1 h-5 w-5 shrink-0 text-[#9aa098]" aria-hidden="true" />
                  <OverviewNumber label="実施" value={`${data.executionSummary.actualMinutes}分`} tone="purple" align="right" />
                </div>
                <p className={cn(
                  "mt-3 inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold",
                  minuteDifference === 0
                    ? "bg-[#f0f1ed] text-[#697068]"
                    : minuteDifference > 0
                      ? "bg-[#f1edfa] text-[#7568a7]"
                      : "bg-[#fff1ed] text-[#bd5d50]",
                )}>
                  {formatMinuteDifference(minuteDifference)}
                </p>
              </OverviewGroup>

              <OverviewGroup title="出欠">
                <dl className="grid grid-cols-3 gap-2">
                  <AttendanceMetric label="参加" value={data.attendanceSummary.present} tone="green" />
                  <AttendanceMetric label="キャンセル" value={data.attendanceSummary.cancelled} tone="coral" />
                  <AttendanceMetric label="無断欠席" value={data.attendanceSummary.noShow} tone="purple" />
                </dl>
              </OverviewGroup>
            </div>
          </WorkspaceSection>
        </WorkspacePanel>
      </div>

      <nav aria-label="ページ内ナビゲーション" className="sticky top-3 z-20 rounded-xl border border-[var(--yn-border)] bg-[#fffdf9]/95 px-2.5 py-2 shadow-[0_5px_18px_rgba(66,60,48,0.07)] backdrop-blur">
        <div className="flex flex-wrap gap-1">
          {pageSections.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="inline-flex min-h-8 items-center rounded-lg px-2.5 text-[12px] font-semibold text-[#5b6659] transition hover:bg-[#edf4ea] hover:text-[#356540] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--yn-focus)]"
            >
              {section.label}
            </a>
          ))}
        </div>
      </nav>

      <div id="execution-flow" className="scroll-mt-20">
        <WorkspacePanel as="div">
          <WorkspaceSection title="STEP 1 実施フロー" description="保存時のスナップショットを、実際の実施順で表示しています。">
            {data.blocks.length ? <LessonRecordFlowList blocks={data.blocks} /> : <EmptyRecord text="実施フローの保存内容はありません" />}
          </WorkspaceSection>
        </WorkspacePanel>
      </div>

      <div id="student-records" className="scroll-mt-20">
        <WorkspacePanel as="div">
          <WorkspaceSection title="STEP 2 生徒ごとの記録" description="記録時に保存された生徒と出欠・観察内容です。">
            {data.students.length ? (
              <div className="grid min-w-0 gap-3 lg:grid-cols-2">
                {data.students.map((student) => <StudentRecordCard key={student.id} student={student} />)}
              </div>
            ) : <EmptyRecord text="生徒ごとの保存内容はありません" />}
          </WorkspaceSection>
        </WorkspacePanel>
      </div>

      <div id="reflection" className="scroll-mt-20">
        <WorkspacePanel as="div">
          <WorkspaceSection title="STEP 3 全体の振り返り" description="入力された振り返りを、そのまま表示しています。">
            {hasReflection ? (
              <div className="grid min-w-0 gap-3 xl:grid-cols-2">
                {reflections.overall ? <ReflectionBlock title="全体メモ" value={data.record.overallMemo} className="xl:col-span-2" /> : null}
                {reflections.reaction ? <ReflectionBlock title="生徒の反応・観察" value={data.record.overallReaction} /> : null}
                {reflections.improvement ? <ReflectionBlock title="次回への改善ポイント" value={data.record.improvementPoints} /> : null}
              </div>
            ) : <EmptyRecord text="全体の振り返りは記録されていません" />}
          </WorkspaceSection>
        </WorkspacePanel>
      </div>
    </div>
  );
}

function HeaderDetailField({
  label,
  value,
  className,
  prominent = false,
}: {
  label: string;
  value: string;
  className?: string;
  prominent?: boolean;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[11px] font-medium text-[var(--yn-text-muted)]">{label}</dt>
      <dd className={cn(
        "mt-0.5 break-words font-semibold text-[var(--yn-text)] [overflow-wrap:anywhere]",
        prominent ? "text-[17px] leading-6" : "text-[13px] leading-5",
      )}>{value}</dd>
    </div>
  );
}

function OverviewGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-lg bg-[#f8f7f2] px-3.5 py-3">
      <h3 className="text-[13px] font-semibold text-[#4d594c]">{title}</h3>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function OverviewNumber({
  label,
  value,
  tone,
  align = "left",
}: {
  label: string;
  value: string;
  tone: "green" | "purple";
  align?: "left" | "right";
}) {
  return (
    <div className={cn("min-w-0", align === "right" && "text-right")}>
      <p className="text-[11px] text-[var(--yn-text-muted)]">{label}</p>
      <p className={cn("mt-0.5 text-[24px] font-semibold tracking-[-0.025em]", tone === "green" ? "text-[#477b52]" : "text-[#7568a7]")}>{value}</p>
    </div>
  );
}

function AttendanceMetric({ label, value, tone }: { label: string; value: number; tone: "green" | "purple" | "coral" }) {
  const colorClass = tone === "green" ? "text-[#477b52]" : tone === "coral" ? "text-[#bd5d50]" : "text-[#7568a7]";
  return (
    <div className="min-w-0 text-center">
      <dt className="text-[11px] leading-4 text-[var(--yn-text-muted)]">{label}</dt>
      <dd className={cn("mt-1 text-[20px] font-semibold", value === 0 ? "text-[#92978f]" : colorClass)}>{value}<span className="ml-0.5 text-[11px] font-medium">名</span></dd>
    </div>
  );
}

function StudentRecordCard({ student }: { student: LessonRecordDetailStudent }) {
  const hasNotes = Boolean(student.condition.trim() || student.memo.trim() || student.nextFollow.trim());
  const showFollowStatus = Boolean(student.followUpStatus && student.followUpStatus !== "none");
  const attendanceTone = student.attendanceStatus === "present" ? "green" : student.attendanceStatus === "cancelled" ? "coral" : "purple";
  return (
    <article className={cn(
      "min-w-0 rounded-lg border px-3.5 py-3",
      student.attendanceStatus === "present"
        ? "border-[#dbe4d8] bg-white"
        : student.attendanceStatus === "cancelled"
          ? "border-[#ecd5cf] bg-[#fff8f5]"
          : "border-[#ddd6eb] bg-[#faf8fd]",
    )}>
      <header className="flex flex-wrap items-center gap-2 border-b border-[var(--yn-border-subtle)] pb-2.5">
        <Link href={`/students/${student.studentId}`} className="break-words text-[15px] font-semibold text-[var(--yn-text)] hover:text-[var(--yn-primary-strong)] hover:underline">{student.name}</Link>
        <WorkspaceStatus tone={attendanceTone} className="min-h-6 whitespace-nowrap px-2 text-[12px]">{attendanceLabel(student.attendanceStatus)}</WorkspaceStatus>
      </header>
      {hasNotes || showFollowStatus ? (
        <dl className="mt-3 grid min-w-0 gap-3">
          {student.condition ? <DetailField label="今日の様子" value={student.condition} /> : null}
          {student.memo ? <DetailField label="個別メモ" value={student.memo} /> : null}
          {student.nextFollow ? <DetailField label="次回フォロー" value={student.nextFollow} /> : null}
          {showFollowStatus ? (
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--yn-text-muted)]">
              <dt>フォロー</dt>
              <dd><WorkspaceStatus tone={followUpTone(student.followUpStatus)} className="min-h-6 whitespace-nowrap px-2 text-[12px]">{followUpStatusLabel(student.followUpStatus)}</WorkspaceStatus></dd>
            </div>
          ) : null}
        </dl>
      ) : <p className="mt-3 text-[13px] text-[var(--yn-text-muted)]">追加記録なし</p>}
    </article>
  );
}

function ReflectionBlock({ title, value, className }: { title: string; value: string; className?: string }) {
  return (
    <article className={cn("min-w-0 rounded-lg bg-[#fbfaf7] px-4 py-3.5", className)}>
      <h3 className="text-[13px] font-semibold text-[#4d5b4c]">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-6 text-[var(--yn-text)] [overflow-wrap:anywhere]">{value}</p>
    </article>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-l-2 border-[#d9e5d5] pl-3">
      <dt className="text-[12px] font-medium text-[var(--yn-text-muted)]">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-[14px] font-medium leading-6 text-[var(--yn-text)] [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}

function EmptyRecord({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-[#d2dbcf] bg-[#f8faf6] px-4 py-5 text-center text-[13px] text-[var(--yn-text-muted)]">{text}</p>;
}

function formatMinuteDifference(value: number) {
  if (value === 0) return "差なし";
  return `${value > 0 ? "+" : ""}${value}分`;
}

function attendanceLabel(status: LessonRecordDetailStudent["attendanceStatus"]) {
  if (status === "cancelled") return "キャンセル";
  if (status === "no_show") return "無断欠席";
  return "出席";
}

function followUpStatusLabel(status: LessonRecordDetailStudent["followUpStatus"]) {
  if (status === "pending") return "未完了";
  if (status === "completed") return "確認済み";
  if (status === "dismissed") return "見送り";
  return "フォローなし";
}

function followUpTone(status: LessonRecordDetailStudent["followUpStatus"]): "green" | "sand" | "neutral" {
  if (status === "pending") return "sand";
  if (status === "completed") return "green";
  return "neutral";
}
