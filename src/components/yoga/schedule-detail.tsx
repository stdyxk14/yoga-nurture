import Link from "next/link";
import { Ban, FileText, Pencil, Printer, RotateCcw, Trash2, UsersRound } from "lucide-react";

import { deleteScheduleAction, reopenScheduleClosureAction } from "@/app/schedules/actions";
import { ConfirmSubmitButton } from "@/components/yoga/confirm-submit-button";
import { ScheduleClosureDialog } from "@/components/yoga/schedule-closure-dialog";
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
            <WorkspaceStatus tone={schedule.activeClosure ? "coral" : "green"}>{schedule.activeClosure ? "クローズ済み" : schedule.statusLabel}</WorkspaceStatus>
            {!schedule.lessonPlanId ? <WorkspaceStatus tone="sand">プラン未確定</WorkspaceStatus> : null}
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
        {schedule.activeClosure ? (
          <WorkspaceAction icon={FileText} disabled title="クローズを解除すると実施後記録を編集できます">実施後記録（解除が必要）</WorkspaceAction>
        ) : !schedule.lessonPlanId ? (
          <WorkspaceAction icon={FileText} disabled title="予定を編集してレッスンプランを設定してください">実施後記録（プラン設定が必要）</WorkspaceAction>
        ) : (
          <WorkspaceAction href={`/lessons/${schedule.id}/record`} icon={FileText} variant="primary">実施後記録</WorkspaceAction>
        )}
        <WorkspaceAction href={`/schedules/${schedule.id}/edit`} icon={Pencil}>編集</WorkspaceAction>
        <ScheduleClosureDialog
          scheduleId={schedule.id}
          activeClosure={schedule.activeClosure}
          hasDraftRecord={schedule.hasDraftRecord}
          disabled={schedule.hasCompletedRecord}
        />
      </WorkspaceActionBar>

      {error ? <WorkspaceFeedback tone="error">{error}</WorkspaceFeedback> : null}

      {schedule.hasCompletedRecord ? <WorkspaceFeedback tone="info">完了済みの実施後記録があるため、この予定はクローズできません。</WorkspaceFeedback> : null}

      {!schedule.lessonPlanId && !schedule.activeClosure ? (
        <WorkspaceFeedback tone="info">
          <span>プラン未確定の予定です。原稿の表示と実施後記録の開始にはレッスンプランが必要です。 </span>
          <Link href={`/schedules/${schedule.id}/edit`} className="font-semibold underline underline-offset-2">予定を編集してプランを設定</Link>
        </WorkspaceFeedback>
      ) : null}

      {schedule.activeClosure ? (
        <WorkspacePanel className="border-[#e8cfc7] bg-[#fff9f6]">
          <WorkspaceSection title="クローズ済み" description="参加者個人の出欠とは分けて、レッスン全体が実施されなかった記録として保持しています。">
            <dl className="grid gap-x-6 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
              <Info label="理由" value={schedule.activeClosure.reasonLabel} />
              <Info label="補足メモ" value={schedule.activeClosure.note || "なし"} />
              <Info label="次回への引き継ぎ" value={schedule.activeClosure.handoffNote || "なし"} />
            </dl>
            <form action={reopenScheduleClosureAction.bind(null, schedule.id)} className="mt-4">
              <ConfirmSubmitButton
                title="クローズを解除しますか？"
                message="現在のクローズ記録は履歴として残ります。解除後は実施後記録を作成・編集できます。"
                confirmLabel="クローズを解除"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#d4ddd0] bg-white px-3.5 text-[13px] font-semibold text-[#456d4c]"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                クローズを解除
              </ConfirmSubmitButton>
            </form>
          </WorkspaceSection>
        </WorkspacePanel>
      ) : null}

      {schedule.closureHistory.some((closure) => closure.revokedAt) ? (
        <WorkspacePanel>
          <WorkspaceSection title="過去のクローズ履歴" description="解除済みの記録は削除せず保持します。">
            <div className="space-y-2">
              {schedule.closureHistory.filter((closure) => closure.revokedAt).map((closure) => (
                <div key={closure.id} className="flex flex-col gap-1 rounded-lg border border-[#e6ded3] bg-[#faf8f3] p-3 text-[13px] md:flex-row md:items-center md:justify-between">
                  <span className="inline-flex items-center gap-2 font-semibold"><Ban className="h-4 w-4 text-[#a9584d]" aria-hidden="true" />{closure.reasonLabel}</span>
                  <span className="text-[#6f766c]">解除済み</span>
                </div>
              ))}
            </div>
          </WorkspaceSection>
        </WorkspacePanel>
      ) : null}

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
