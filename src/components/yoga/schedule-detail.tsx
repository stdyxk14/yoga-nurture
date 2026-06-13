import Link from "next/link";
import { ArrowLeft, FileText, Pencil, Printer, UsersRound } from "lucide-react";
import { PageHeader, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import type { DbSchedule } from "@/lib/schedules";

export function ScheduleDetail({ schedule }: { schedule: DbSchedule }) {
  return (
    <div className="space-y-4">
      <PageHeader title={schedule.lessonName} subtitle="登録済みレッスン予定の詳細" />

      <SoftCard className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#edf5ef] px-3 py-1 text-[12px] font-bold text-[#4f875a]">{schedule.statusLabel}</span>
              <span className="rounded-full bg-[#fff7e8] px-3 py-1 text-[12px] font-bold text-[#9b7338]">{schedule.dateLabel}</span>
              <span className="rounded-full bg-[#f3eefb] px-3 py-1 text-[12px] font-bold text-[#7469bf]">{schedule.startTimeLabel}-{schedule.endTimeLabel}</span>
            </div>
            <dl className="mt-4 grid gap-3 text-[13px] font-semibold text-[#4d554b] sm:grid-cols-2 lg:grid-cols-4">
              <Info label="使用レッスンプラン" value={schedule.lessonPlanName} />
              <Info label="場所" value={schedule.place || "未設定"} />
              <Info label="形式" value={schedule.formatLabel} />
              <Info label="参加予定人数" value={`${schedule.participantCount}名`} />
            </dl>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[420px]">
            <Link href="/lessons" className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-[#d8e3d4] bg-white px-3 text-[12px] font-bold text-[#4f7b58]">
              <ArrowLeft className="h-3.5 w-3.5" />
              一覧
            </Link>
            {schedule.lessonPlanId ? (
              <Link href={`/lessons/${schedule.lessonPlanId}/script`} className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-[#5d956d] px-3 text-[12px] font-bold text-white">
                <Printer className="h-3.5 w-3.5" />
                原稿
              </Link>
            ) : (
              <span className="inline-flex h-9 items-center justify-center rounded-xl border border-[#e7dfd4] bg-[#f4f1ea] px-3 text-[12px] font-bold text-[#9b8c7b]">原稿なし</span>
            )}
            <Link href={`/lessons/${schedule.id}/record`} className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-[#f2c9bd] bg-[#fff4ef] px-3 text-[12px] font-bold text-[#d96c55]">
              <FileText className="h-3.5 w-3.5" />
              記録を書く
            </Link>
            <Link href={`/schedules/${schedule.id}/edit`} className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-[#d8e3d4] bg-white px-3 text-[12px] font-bold text-[#4f7b58]">
              <Pencil className="h-3.5 w-3.5" />
              編集する
            </Link>
          </div>
        </div>
      </SoftCard>

      <SoftCard className="p-4">
        <SectionTitle icon={UsersRound} title="参加予定生徒" subtitle="予定登録時に選択された生徒です。" />
        {schedule.participants.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {schedule.participants.map((student) => (
              <article key={student.participantId} className="rounded-2xl border border-[#eee4d8] bg-white/75 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-[14px] font-extrabold">{student.name}</h2>
                    <p className="mt-1 text-[11px] font-bold text-[#5d956d]">{student.attendanceLabel}</p>
                  </div>
                  <Link href={`/students/${student.id}`} className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-[#d8e3d4] bg-white px-3 text-[11px] font-bold text-[#4f7b58]">
                    生徒カルテ
                  </Link>
                </div>
                <p className="mt-2 line-clamp-2 text-[12px] font-medium leading-5 text-[#6b7468]">注意点: {student.caution || "未登録"}</p>
                <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-5 text-[#6b7468]">メモ: {student.memo || "未登録"}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-[#d8e3d4] bg-white/60 p-5 text-center text-[13px] font-medium text-[#6b7468]">
            参加予定生徒はまだ登録されていません。
          </p>
        )}
      </SoftCard>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#eee4d8] bg-white/65 p-3">
      <dt className="text-[11px] font-bold text-[#7c8476]">{label}</dt>
      <dd className="mt-1 break-words text-[13px] font-extrabold">{value}</dd>
    </div>
  );
}
