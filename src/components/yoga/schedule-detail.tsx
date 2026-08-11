import Link from "next/link";
import { FileText, Pencil, Printer, Trash2, UsersRound } from "lucide-react";

import { deleteScheduleAction } from "@/app/schedules/actions";
import { ConfirmSubmitButton } from "@/components/yoga/confirm-submit-button";
import {
  WorkspaceAction,
  WorkspaceActionBar,
  WorkspaceEmptyState,
  WorkspaceFeedback,
  WorkspacePageHeader,
  WorkspacePanel,
  WorkspaceSection,
  WorkspaceStatus,
} from "@/components/yoga/workspace-kit";
import type { DbSchedule } from "@/lib/schedules";

export function ScheduleDetail({ schedule, error }: { schedule: DbSchedule; error?: string }) {
  return (
    <div className="space-y-4">
      <WorkspacePageHeader
        eyebrow="SCHEDULE"
        title={schedule.lessonName}
        description="開催情報、参加予定生徒、当日の注意事項をまとめて確認できます。"
        backLink={{ href: "/lessons", label: "レッスンカルテへ戻る" }}
        meta={(
          <>
            <WorkspaceStatus tone="green">{schedule.statusLabel}</WorkspaceStatus>
            <WorkspaceStatus tone="sand">{schedule.dateLabel}</WorkspaceStatus>
            <WorkspaceStatus tone="purple">{schedule.startTimeLabel}–{schedule.endTimeLabel}</WorkspaceStatus>
          </>
        )}
      />

      <WorkspaceActionBar
        danger={(
          <form action={deleteScheduleAction.bind(null, schedule.id)}>
            <ConfirmSubmitButton
              title="予定を削除しますか？"
              message="実施後記録がある場合、記録は残り、予定との紐づきだけ解除されます。"
              confirmLabel="予定を削除"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#efc9c0] bg-[#fff5f1] px-3.5 text-[13px] font-semibold text-[#bd5d50]"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              削除
            </ConfirmSubmitButton>
          </form>
        )}
      >
        {schedule.lessonPlanId ? <WorkspaceAction href={`/schedules/${schedule.id}/script`} icon={Printer}>原稿</WorkspaceAction> : null}
        <WorkspaceAction href={`/lessons/${schedule.id}/record`} icon={FileText} variant="primary">実施後記録</WorkspaceAction>
        <WorkspaceAction href={`/schedules/${schedule.id}/edit`} icon={Pencil}>編集</WorkspaceAction>
      </WorkspaceActionBar>

      {error ? <WorkspaceFeedback tone="error">{error}</WorkspaceFeedback> : null}

      <WorkspacePanel>
        <WorkspaceSection title="予定の要約" description="レッスン当日の基本情報です。">
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
            <Info label="使用レッスンプラン" value={schedule.lessonPlanName} />
            <Info label="場所" value={schedule.place || "未設定"} />
            <Info label="形式" value={schedule.formatLabel} />
            <Info label="参加予定人数" value={`${schedule.participantCount}名`} />
          </dl>
        </WorkspaceSection>
      </WorkspacePanel>

      {(schedule.scheduleCaution || schedule.scheduleMemo) ? (
        <WorkspacePanel>
          <WorkspaceSection title="この予定の確認メモ" description="原稿上部にも表示される、当日だけの注意事項です。">
            <dl className="grid gap-x-6 gap-y-4 md:grid-cols-2">
              {schedule.scheduleCaution ? <Info label="注意事項" value={schedule.scheduleCaution} /> : null}
              {schedule.scheduleMemo ? <Info label="メモ" value={schedule.scheduleMemo} /> : null}
            </dl>
          </WorkspaceSection>
        </WorkspacePanel>
      ) : null}

      <WorkspacePanel>
        <WorkspaceSection title="参加予定生徒" description="予定登録時に選択された生徒です。">
          {schedule.participants.length ? (
            <div className="divide-y divide-[var(--yn-border-subtle)]">
              {schedule.participants.map((student) => (
                <article key={student.participantId} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[15px] font-semibold text-[var(--yn-text)]">{student.name}</h3>
                      <WorkspaceStatus tone="green">{student.attendanceLabel}</WorkspaceStatus>
                    </div>
                    <p className="mt-2 text-[13px] leading-5 text-[var(--yn-text-muted)]">注意点: {student.caution || "未登録"}</p>
                    <p className="mt-1 text-[13px] leading-5 text-[var(--yn-text-muted)]">メモ: {student.memo || "未登録"}</p>
                  </div>
                  <Link href={`/students/${student.id}`} className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#d4ddd0] bg-white px-3 text-[13px] font-semibold text-[#456d4c] hover:bg-[#f3f8f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--yn-focus)]">
                    <UsersRound className="h-4 w-4" aria-hidden="true" />
                    生徒カルテ
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <WorkspaceEmptyState title="参加予定生徒は未登録です" description="予定を編集すると、生徒を追加できます。" />
          )}
        </WorkspaceSection>
      </WorkspacePanel>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-l-2 border-[#d9e5d5] pl-3">
      <dt className="text-[13px] font-medium text-[var(--yn-text-muted)]">{label}</dt>
      <dd className="mt-1 break-words text-[14px] font-semibold leading-6 text-[var(--yn-text)]">{value}</dd>
    </div>
  );
}
