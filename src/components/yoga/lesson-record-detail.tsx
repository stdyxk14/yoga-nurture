import Link from "next/link";
import { BookOpen, CalendarDays, FileText, Pencil, Printer } from "lucide-react";
import {
  WorkspaceAction,
  WorkspaceActionBar,
  WorkspacePageHeader,
  WorkspacePanel,
  WorkspaceSection,
  WorkspaceStatus,
} from "@/components/yoga/workspace-kit";
import { lessonRecordChangeReasons } from "@/lib/lesson-record-flow";
import type {
  LessonRecordDetailBlock,
  LessonRecordDetailData,
  LessonRecordDetailStudent,
} from "@/lib/lesson-records";
import { cn } from "@/lib/utils";

export function LessonRecordDetail({ data }: { data: LessonRecordDetailData }) {
  const blockBySchedulePlanItemId = new Map(
    data.blocks.flatMap((block) => block.schedulePlanItemId ? [[block.schedulePlanItemId, block] as const] : []),
  );
  const replacementBySchedulePlanItemId = new Map(
    data.blocks.flatMap((block) => block.replacesSchedulePlanItemId ? [[block.replacesSchedulePlanItemId, block] as const] : []),
  );
  const overview = [
    { label: "予定ブロック数", value: `${data.executionSummary.plannedCount}件`, tone: "green" as const },
    { label: "予定どおり", value: `${data.diffSummary.asPlanned}件`, tone: "green" as const },
    { label: "調整", value: `${data.diffSummary.adjusted}件`, tone: "purple" as const },
    { label: "スキップ", value: `${data.diffSummary.skipped}件`, tone: "coral" as const },
    { label: "置き換え", value: `${data.diffSummary.replaced}件`, tone: "sand" as const },
    { label: "予定外追加", value: `${data.diffSummary.added}件`, tone: "purple" as const },
    { label: "旧形式／未分類", value: `${data.diffSummary.legacy}件`, tone: "sand" as const },
    ...(data.diffSummary.unconfirmed > 0
      ? [{ label: "未確認", value: `${data.diffSummary.unconfirmed}件`, tone: "coral" as const }]
      : []),
    { label: "予定合計時間", value: `${data.executionSummary.plannedMinutes}分`, tone: "green" as const },
    { label: "実施合計時間", value: `${data.executionSummary.actualMinutes}分`, tone: "purple" as const },
    { label: "参加人数", value: `${data.attendanceSummary.present}名`, tone: "green" as const },
    { label: "キャンセル人数", value: `${data.attendanceSummary.cancelled}名`, tone: "coral" as const },
    { label: "無断欠席人数", value: `${data.attendanceSummary.noShow}名`, tone: "purple" as const },
  ];

  return (
    <div className="min-w-0 space-y-4 overflow-x-clip">
      <WorkspacePageHeader
        eyebrow="LESSON RECORD / READ ONLY"
        title="実施後記録詳細"
        description={data.schedule.lessonName}
        backLink={{ href: "/lessons?tab=records", label: "レッスンカルテへ戻る" }}
        meta={(
          <>
            <WorkspaceStatus tone="green">{data.record.statusLabel}</WorkspaceStatus>
            <WorkspaceStatus tone="neutral">読み取り専用</WorkspaceStatus>
            <WorkspaceStatus tone="sand">{data.schedule.dateLabel}</WorkspaceStatus>
          </>
        )}
      />

      <WorkspaceActionBar sticky={false}>
        <WorkspaceAction href={`/lessons/${data.schedule.id}/record?edit=1`} icon={Pencil} variant="primary">記録を編集</WorkspaceAction>
        <WorkspaceAction href={`/schedules/${data.schedule.id}`} icon={CalendarDays}>予定詳細</WorkspaceAction>
        {data.schedule.lessonPlanId ? <WorkspaceAction href={`/schedules/${data.schedule.id}/script`} icon={Printer}>原稿を見る</WorkspaceAction> : null}
        {data.schedule.lessonPlanId ? <WorkspaceAction href={`/lessons/${data.schedule.lessonPlanId}`} icon={BookOpen}>使用プランを見る</WorkspaceAction> : null}
        <WorkspaceAction href="/lessons?tab=records" icon={FileText} variant="ghost">レッスンカルテへ戻る</WorkspaceAction>
      </WorkspaceActionBar>

      <WorkspacePanel>
        <WorkspaceSection title="記録情報" description="保存済みの実施後記録を読み取り専用で表示しています。">
          <dl className="grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
            <DetailField label="レッスン名" value={data.schedule.lessonName} />
            <DetailField label="実施日" value={data.schedule.dateLabel} />
            <DetailField label="開始・終了時間" value={`${data.schedule.startTimeLabel}–${data.schedule.endTimeLabel}`} />
            <DetailField label="場所" value={data.schedule.place || "未設定"} />
            <DetailField label="使用プラン" value={data.schedule.lessonPlanName} />
            <DetailField label="記録ステータス" value={data.record.statusLabel} />
            <DetailField label="最終更新日時" value={data.record.updatedAtLabel} />
          </dl>
        </WorkspaceSection>
      </WorkspacePanel>

      <WorkspacePanel>
        <WorkspaceSection title="概要" description="予定との差分、時間、出欠を保存済みデータから集計しています。">
          <div className="grid min-w-0 grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
            {overview.map((item) => <OverviewMetric key={item.label} {...item} />)}
          </div>
        </WorkspaceSection>
      </WorkspacePanel>

      <WorkspacePanel>
        <WorkspaceSection title="STEP 1 実施フロー" description="保存時のスナップショットを、実際の実施順で表示しています。">
          {data.blocks.length ? (
            <div className="grid min-w-0 gap-3">
              {data.blocks.map((block, index) => (
                <ExecutionBlock
                  key={block.id}
                  block={block}
                  index={index}
                  replacement={block.schedulePlanItemId ? replacementBySchedulePlanItemId.get(block.schedulePlanItemId) : undefined}
                  replacementSource={block.replacesSchedulePlanItemId ? blockBySchedulePlanItemId.get(block.replacesSchedulePlanItemId) : undefined}
                />
              ))}
            </div>
          ) : <EmptyRecord text="実施フローの保存内容はありません" />}
        </WorkspaceSection>
      </WorkspacePanel>

      <WorkspacePanel>
        <WorkspaceSection title="STEP 2 生徒ごとの記録" description="記録時に保存された生徒と出欠・観察内容です。">
          {data.students.length ? (
            <div className="grid min-w-0 gap-3 lg:grid-cols-2">
              {data.students.map((student) => <StudentRecordCard key={student.id} student={student} />)}
            </div>
          ) : <EmptyRecord text="生徒ごとの保存内容はありません" />}
        </WorkspaceSection>
      </WorkspacePanel>

      <WorkspacePanel>
        <WorkspaceSection title="STEP 3 全体の振り返り" description="入力された振り返りを、そのまま表示しています。">
          <div className="grid min-w-0 gap-3 xl:grid-cols-3">
            <ReflectionCard title="全体メモ" value={data.record.overallMemo} />
            <ReflectionCard title="生徒の反応・観察" value={data.record.overallReaction} />
            <ReflectionCard title="次回への改善ポイント" value={data.record.improvementPoints} />
          </div>
        </WorkspaceSection>
      </WorkspacePanel>
    </div>
  );
}

function OverviewMetric({ label, value, tone }: { label: string; value: string; tone: "green" | "purple" | "coral" | "sand" }) {
  const valueClass = {
    green: "text-[#477b52]",
    purple: "text-[#7568a7]",
    coral: "text-[#bd5d50]",
    sand: "text-[#8b704c]",
  }[tone];
  return (
    <div className="min-w-0 rounded-lg border border-[var(--yn-border)] bg-[#fbfaf7] px-3 py-2.5">
      <p className="text-[12px] leading-5 text-[var(--yn-text-muted)]">{label}</p>
      <p className={cn("mt-0.5 text-[20px] font-semibold", valueClass)}>{value}</p>
    </div>
  );
}

function ExecutionBlock({
  block,
  index,
  replacement,
  replacementSource,
}: {
  block: LessonRecordDetailBlock;
  index: number;
  replacement?: LessonRecordDetailBlock;
  replacementSource?: LessonRecordDetailBlock;
}) {
  const visuallySkipped = block.changeType === "skipped" || block.changeType === "replaced" || block.done === false;
  const reasonLabels = block.changeReasonCodes.map((code) => lessonRecordChangeReasons.find((reason) => reason.code === code)?.label ?? code);

  return (
    <article className={cn("min-w-0 overflow-hidden rounded-lg border", visuallySkipped ? "border-[#d8d9d4] bg-[#f4f4f1]" : "border-[#dce3d9] bg-white")}>
      <div className="grid min-w-0 gap-3 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex min-h-7 min-w-7 items-center justify-center rounded-md bg-[#eaf1e7] px-1.5 text-[13px] font-semibold text-[#456d4c]">{index + 1}</span>
            <WorkspaceStatus tone={sourceTone(block.itemSource)}>{sourceLabel(block.itemSource)}</WorkspaceStatus>
            <WorkspaceStatus tone={changeTone(block.changeType)}>{changeLabel(block.changeType)}</WorkspaceStatus>
            <WorkspaceStatus tone={executionTone(block.done)}>{executionLabel(block.done)}</WorkspaceStatus>
          </div>
          {block.blockTemplateId ? (
            <Link href={`/blocks/${block.blockTemplateId}`} className={cn("mt-2 block break-words text-[16px] font-semibold leading-6 text-[var(--yn-text)] hover:text-[var(--yn-primary-strong)] hover:underline", visuallySkipped && "text-[#666d65] line-through")}>
              {block.name}
            </Link>
          ) : <h3 className={cn("mt-2 break-words text-[16px] font-semibold leading-6 text-[var(--yn-text)]", visuallySkipped && "text-[#666d65] line-through")}>{block.name}</h3>}
          <p className="mt-0.5 break-words text-[13px] leading-5 text-[var(--yn-text-muted)]">{block.majorCategory} / {block.minorCategory}</p>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-right md:min-w-[210px]">
          <CompactField label="予定時間" value={block.plannedMinutes === null ? "未入力" : `${block.plannedMinutes}分`} />
          <CompactField label="実際の時間" value={block.actualMinutes === null ? "未入力" : `${block.actualMinutes}分`} />
        </dl>
      </div>

      {replacement || replacementSource ? (
        <div className="mx-3 mb-3 rounded-lg border border-[#ddd5ee] bg-[#f7f3fc] px-3 py-2 text-[13px] leading-5 text-[#665c94]">
          {replacementSource ? <p><span className="font-semibold">置き換え元：</span>{replacementSource.name}</p> : null}
          {replacement ? <p><span className="font-semibold">置き換え先：</span>{replacement.name}</p> : null}
        </div>
      ) : null}

      <details className="group border-t border-[#e5e8e1] bg-white/80">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-[13px] font-semibold text-[#4e7454] marker:hidden group-open:border-b group-open:border-[#e5e8e1]">
          保存内容をすべて表示
        </summary>
        <dl className="grid min-w-0 gap-3 p-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailField label="変更理由" value={reasonLabels.length ? reasonLabels.join("、") : "記録なし"} />
          <DetailField label="変更理由メモ" value={block.changeReasonNote || "記録なし"} />
          <DetailField label="実際に行った内容" value={block.actualContentNote || "記録なし"} />
          <DetailField label="生徒の反応" value={reactionLabel(block.reaction)} />
          <DetailField label="講師メモ" value={block.teacherMemo || "記録なし"} />
          <DetailField label="改善メモ" value={block.improvementMemo || "記録なし"} />
          <DetailField label="また使いたいか" value={useAgainLabel(block.useAgain)} />
          <DetailField label="誘導セリフの修正案" value={block.scriptRevision || "記録なし"} />
        </dl>
      </details>
    </article>
  );
}

function StudentRecordCard({ student }: { student: LessonRecordDetailStudent }) {
  const hasNotes = Boolean(student.condition.trim() || student.memo.trim() || student.nextFollow.trim());
  const attendanceTone = student.attendanceStatus === "present" ? "green" : student.attendanceStatus === "cancelled" ? "coral" : "purple";
  return (
    <article className={cn(
      "min-w-0 rounded-lg border p-3",
      student.attendanceStatus === "present" ? "border-[#dbe4d8] bg-white" : student.attendanceStatus === "cancelled" ? "border-[#ecd5cf] bg-[#fff8f5]" : "border-[#ddd6eb] bg-[#faf8fd]",
    )}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--yn-border-subtle)] pb-2.5">
        <Link href={`/students/${student.studentId}`} className="break-words text-[15px] font-semibold text-[var(--yn-text)] hover:text-[var(--yn-primary-strong)] hover:underline">{student.name}</Link>
        <WorkspaceStatus tone={attendanceTone}>{attendanceLabel(student.attendanceStatus)}</WorkspaceStatus>
      </header>
      {hasNotes || student.followUpStatus ? (
        <dl className="mt-3 grid min-w-0 gap-3">
          {student.condition ? <DetailField label="今日の様子" value={student.condition} /> : null}
          {student.memo ? <DetailField label="個別メモ" value={student.memo} /> : null}
          {student.nextFollow ? <DetailField label="次回フォロー" value={student.nextFollow} /> : null}
          {student.followUpStatus ? <DetailField label="フォロー状態" value={followUpStatusLabel(student.followUpStatus)} /> : null}
        </dl>
      ) : <p className="mt-3 text-[13px] text-[var(--yn-text-muted)]">記録なし</p>}
    </article>
  );
}

function ReflectionCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="min-w-0 rounded-lg border border-[var(--yn-border)] bg-[#fbfaf7] p-3.5">
      <h3 className="text-[13px] font-semibold text-[#4d5b4c]">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-6 text-[var(--yn-text)] [overflow-wrap:anywhere]">{value || "記録なし"}</p>
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

function CompactField({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[11px] text-[var(--yn-text-muted)]">{label}</dt><dd className="mt-0.5 text-[14px] font-semibold text-[var(--yn-text)]">{value}</dd></div>;
}

function EmptyRecord({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-[#d2dbcf] bg-[#f8faf6] px-4 py-5 text-center text-[13px] text-[var(--yn-text-muted)]">{text}</p>;
}

function sourceLabel(source: LessonRecordDetailBlock["itemSource"]) {
  if (source === "library") return "ライブラリ追加";
  if (source === "improvised") return "即興追加";
  return "予定内";
}

function sourceTone(source: LessonRecordDetailBlock["itemSource"]): "green" | "purple" | "neutral" {
  if (source === "library") return "green";
  if (source === "improvised") return "purple";
  return "neutral";
}

function changeLabel(changeType: LessonRecordDetailBlock["changeType"]) {
  if (changeType === "as_planned") return "予定どおり";
  if (changeType === "adjusted") return "調整";
  if (changeType === "skipped") return "スキップ";
  if (changeType === "replaced") return "置き換え";
  if (changeType === "added") return "追加";
  return "旧形式／未分類";
}

function changeTone(changeType: LessonRecordDetailBlock["changeType"]): "green" | "purple" | "coral" | "sand" | "neutral" {
  if (changeType === "as_planned") return "green";
  if (changeType === "adjusted" || changeType === "added") return "purple";
  if (changeType === "skipped") return "coral";
  if (changeType === "replaced") return "sand";
  return "neutral";
}

function executionLabel(done: boolean | null) {
  if (done === true) return "実施済み";
  if (done === false) return "未実施";
  return "未確認";
}

function executionTone(done: boolean | null): "green" | "coral" | "neutral" {
  if (done === true) return "green";
  if (done === false) return "coral";
  return "neutral";
}

function reactionLabel(reaction: LessonRecordDetailBlock["reaction"]) {
  if (reaction === "good") return "良かった";
  if (reaction === "neutral") return "普通";
  if (reaction === "poor") return "いまひとつ";
  return "未評価";
}

function useAgainLabel(value: boolean | null) {
  if (value === true) return "次回も使いたい";
  if (value === false) return "今回は使わない";
  return "未選択";
}

function attendanceLabel(status: LessonRecordDetailStudent["attendanceStatus"]) {
  if (status === "cancelled") return "キャンセル";
  if (status === "no_show") return "無断欠席";
  return "出席";
}

function followUpStatusLabel(status: NonNullable<LessonRecordDetailStudent["followUpStatus"]>) {
  if (status === "pending") return "未完了";
  if (status === "completed") return "確認済み";
  if (status === "dismissed") return "見送り";
  return "フォローなし";
}
