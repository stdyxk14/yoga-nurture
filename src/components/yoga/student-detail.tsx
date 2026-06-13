import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownUp, BarChart3, Dumbbell, HeartHandshake, NotebookPen, Sparkles, Target, UserRound } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import type { StudentAttendanceStats, StudentLessonHistory, StudentObservation, StudentRecord } from "@/components/yoga/records";
import { StudentAiButton } from "@/components/yoga/student-ai-button";
import { StudentAiSuggestionPanel } from "@/components/yoga/student-ai-suggestion-panel";
import type { StudentAiSuggestionState } from "@/lib/ai-suggestions";

export function StudentDetail({
  student,
  observations,
  lessonHistory,
  stats,
  aiSuggestionState,
}: {
  student: StudentRecord;
  observations: StudentObservation[];
  lessonHistory: StudentLessonHistory[];
  stats: StudentAttendanceStats;
  aiSuggestionState: StudentAiSuggestionState;
}) {
  const profileItems = [
    ["ヨガ他経験", student.experience, Dumbbell],
    ["ケガなどの注意点", student.caution, HeartHandshake],
    ["その他メモ", student.memo, NotebookPen],
  ] as const;
  const latestFollow = observations.find((memo) => memo.nextFollow.trim());

  return (
    <>
        <div className="md:hidden">
        <MobileStudentDetail student={student} observations={observations} lessonHistory={lessonHistory} stats={stats} aiSuggestionState={aiSuggestionState} />
      </div>

      <div className="hidden md:block">
        <PageHeader title="生徒カルテ詳細" subtitle="レッスン後コメントと連動して生徒の変化を確認" />

        <div className="mb-3 flex justify-end gap-2">
          <Link href="/students" className="inline-flex h-8 items-center rounded-lg border border-[#d8e3d4] bg-white px-3 text-[13px] font-bold text-[#4f7b58]">一覧に戻る</Link>
          <Link href={`/students/${student.id}/edit`} className="inline-flex h-8 items-center rounded-lg bg-[#5d956d] px-4 text-[13px] font-bold text-white">編集する</Link>
        </div>

        <SoftCard className="p-4">
          <div className="grid grid-cols-[160px_minmax(0,1fr)] gap-5">
            <div className="flex flex-col items-center justify-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-[#edf4ea] text-[#4f875a] shadow-inner">
                <UserRound className="h-20 w-20" strokeWidth={1.35} />
              </div>
              <p className="mt-3 text-[13px] font-bold text-[#657064]">{student.ageGroup} / {student.gender}</p>
            </div>
            <div className="min-w-0">
              <div className="mb-3 flex items-end gap-4 border-b border-[#ebe3d8] pb-2">
                <h1 className="text-[28px] font-extrabold leading-tight">{student.name}</h1>
                <p className="pb-1 text-[13px] font-semibold">{student.kana}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {profileItems.map(([label, value, Icon]) => (
                  <div key={label} className="min-h-[96px] rounded-xl border border-[#eee4d8] bg-white/72 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0 text-[#8b6138]" strokeWidth={1.8} />
                      <span className="text-[13px] font-bold">{label}</span>
                    </div>
                    <p className="text-[13px] font-medium leading-5 text-[#33372f]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SoftCard>

        <div className="mt-4 grid grid-cols-6 gap-2">
          <SummaryCard label="受講回数" value={`${stats.attendedCount}回`} />
          <SummaryCard label="キャンセル" value={`${stats.cancelCount}回`} tone="orange" />
          <SummaryCard label="無断欠席" value={`${stats.noShowCount}回`} tone="coral" />
          <SummaryCard label="キャンセル率" value={`${stats.cancelRate}%`} tone="orange" />
          <SummaryCard label="最終受講日" value={stats.lastAttendedDate} compact />
          <SummaryCard label="次回予定日" value={stats.nextScheduledDate} compact />
        </div>

        {latestFollow ? <NextFollowCard memo={latestFollow} /> : null}

        <section id="observations" className="mt-4 grid grid-cols-[1.15fr_1fr] gap-4">
          <SoftCard>
            <SectionTitle icon={NotebookPen} title="最近の変化・観察メモ" subtitle="レッスン後記録の生徒別コメントから蓄積" />
            <div className="space-y-2">
              {observations.length ? (
                observations.slice(0, 3).map((memo) => (
                  <ObservationRow key={`${memo.date}-${memo.lessonTitle}`} memo={memo} />
                ))
              ) : (
                <EmptyHistoryMessage text="レッスン後記録が保存されると、ここに観察メモが蓄積されます。" />
              )}
            </div>
            {observations.length ? (
              <details className="mt-3 rounded-xl border border-[#d8e3d4] bg-[#f8fcf6] p-3">
                <summary className="cursor-pointer text-[13px] font-bold text-[#4f7b58]">すべての観察メモを見る</summary>
                <div className="mt-3 space-y-2">
                  {observations.map((memo) => (
                    <ObservationRow key={`all-${memo.date}-${memo.lessonTitle}`} memo={memo} />
                  ))}
                </div>
              </details>
            ) : null}
          </SoftCard>

          <SoftCard>
            <StudentAiSuggestionPanel student={student} aiSuggestionState={aiSuggestionState} />
          </SoftCard>
        </section>

        <SoftCard className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle icon={ArrowDownUp} title="受講レッスン履歴" subtitle="参加・キャンセル・記録メモをまとめて確認" />
            <Link href="/lessons" className="text-[13px] font-bold text-[#5d956d]">レッスンカルテ一覧へ</Link>
          </div>
          {lessonHistory.length ? (
            <>
              <LessonHistoryTable histories={lessonHistory.slice(0, 5)} />
              <details className="mt-3 rounded-xl border border-[#d8e3d4] bg-[#f8fcf6] p-3">
                <summary className="cursor-pointer text-[13px] font-bold text-[#4f7b58]">すべてのレッスン履歴を見る</summary>
                <div className="mt-3">
                  <LessonHistoryTable histories={lessonHistory} />
                </div>
              </details>
            </>
          ) : (
            <EmptyHistoryMessage text="まだ受講レッスン履歴はありません。今後、予定や実施後記録と連動して表示します。" />
          )}
        </SoftCard>

        <SoftCard className="mt-4">
          <SectionTitle icon={BarChart3} title="この生徒の受講傾向" />
          <EmptyHistoryMessage text="受講履歴が蓄積されると、受講頻度・よく受けるクラス・反応の傾向が表示されます。" />
        </SoftCard>
      </div>
    </>
  );
}

function MobileStudentDetail({
  student,
  observations,
  lessonHistory,
  stats,
  aiSuggestionState,
}: {
  student: StudentRecord;
  observations: StudentObservation[];
  lessonHistory: StudentLessonHistory[];
  stats: StudentAttendanceStats;
  aiSuggestionState: StudentAiSuggestionState;
}) {
  const infoItems = [
    ["ヨガ他経験", student.experience, Dumbbell],
    ["ケガなどの注意点", student.caution, HeartHandshake],
    ["その他メモ", student.memo, NotebookPen],
  ] as const;
  const latestFollow = observations.find((memo) => memo.nextFollow.trim());

  return (
    <div className="mx-auto max-w-[430px] space-y-4 overflow-x-hidden">
      <section className="rounded-[24px] border border-[#eee4d8] bg-white/84 p-4 shadow-[0_12px_26px_rgba(122,104,80,0.08)]">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#edf4ea] text-[#4f875a]">
            <UserRound className="h-8 w-8" strokeWidth={1.4} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[22px] font-extrabold">{student.name}</h1>
            <p className="text-[12px] font-semibold text-[#6d7469]">{student.kana}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#f1f6ee] px-3 py-1 text-[11px] font-bold text-[#4f875a]">{student.ageGroup}・{student.gender}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link href="/students" className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d8e3d4] bg-white text-[13px] font-bold text-[#4f7b58]">一覧に戻る</Link>
          <Link href={`/students/${student.id}/edit`} className="inline-flex h-10 items-center justify-center rounded-xl bg-[#5d956d] text-[13px] font-bold text-white">編集する</Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <SummaryCard label="受講回数" value={`${stats.attendedCount}回`} />
        <SummaryCard label="キャンセル" value={`${stats.cancelCount}回`} tone="orange" />
        <SummaryCard label="無断欠席" value={`${stats.noShowCount}回`} tone="coral" />
        <SummaryCard label="キャンセル率" value={`${stats.cancelRate}%`} tone="orange" />
        <SummaryCard label="最終受講日" value={stats.lastAttendedDate} compact />
        <SummaryCard label="次回予定日" value={stats.nextScheduledDate} compact />
      </section>

      {latestFollow ? <NextFollowCard memo={latestFollow} mobile /> : null}

      <section className="space-y-3">
        {infoItems.map(([label, value, Icon]) => (
          <article key={label} className="rounded-[22px] border border-[#eee4d8] bg-white/84 p-4 shadow-[0_8px_18px_rgba(122,104,80,0.06)]">
            <div className="mb-2 flex items-center gap-2">
              <Icon className="h-5 w-5 shrink-0 text-[#8b6138]" />
              <h2 className="text-[14px] font-extrabold">{label}</h2>
            </div>
            <p className="break-words text-[13px] font-medium leading-6 text-[#394238]">{value}</p>
          </article>
        ))}
      </section>

      <MobileSection title="最近の変化・観察メモ">
        <div className="grid gap-3">
          {observations.length ? observations.slice(0, 3).map((memo) => (
            <ObservationRow key={`${memo.date}-${memo.lessonTitle}`} memo={memo} />
          )) : <EmptyHistoryMessage text="レッスン後記録が保存されると、ここに観察メモが蓄積されます。" />}
        </div>
        {observations.length ? (
          <details className="mt-3 rounded-2xl border border-[#d8e3d4] bg-[#f8fcf6] p-3">
            <summary className="cursor-pointer text-[13px] font-bold text-[#4f7b58]">すべての観察メモを見る</summary>
            <div className="mt-3 grid gap-2">
              {observations.map((memo) => (
                <ObservationRow key={`mobile-all-${memo.date}-${memo.lessonTitle}`} memo={memo} />
              ))}
            </div>
          </details>
        ) : null}
      </MobileSection>

      <MobileSection title="AIメンターからの次回提案">
        <StudentAiSuggestionPanel student={student} aiSuggestionState={aiSuggestionState} compact />
      </MobileSection>

      <MobileSection title="受講レッスン履歴">
        <div className="grid gap-2">
          {lessonHistory.length ? lessonHistory.slice(0, 5).map((history) => (
            <LessonHistoryCard key={`${history.lessonId}-${history.date}`} history={history} />
          )) : <EmptyHistoryMessage text="まだ受講レッスン履歴はありません。" />}
        </div>
        {lessonHistory.length ? (
          <details className="mt-3 rounded-2xl border border-[#d8e3d4] bg-[#f8fcf6] p-3">
            <summary className="cursor-pointer text-[13px] font-bold text-[#4f7b58]">すべてのレッスン履歴を見る</summary>
            <div className="mt-3 grid gap-2">
              {lessonHistory.map((history) => (
                <LessonHistoryCard key={`all-${history.lessonId}-${history.date}`} history={history} />
              ))}
            </div>
          </details>
        ) : null}
      </MobileSection>

      <MobileSection title="この生徒の受講傾向">
        <EmptyHistoryMessage text="受講履歴が蓄積されると、受講頻度・よく受けるクラス・反応の傾向が表示されます。" />
      </MobileSection>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "green",
  compact = false,
}: {
  label: string;
  value: string;
  tone?: "green" | "orange" | "coral";
  compact?: boolean;
}) {
  const color = tone === "coral" ? "text-[#d96c55]" : tone === "orange" ? "text-[#9b7338]" : "text-[#4f875a]";
  return (
    <div className="min-w-0 rounded-2xl border border-[#eee4d8] bg-white/78 p-3 text-center shadow-[0_8px_18px_rgba(122,104,80,0.05)]">
      <p className="truncate text-[11px] font-bold text-[#7c8476]">{label}</p>
      <p className={`mt-1 break-words font-extrabold leading-tight ${compact ? "text-[13px]" : "text-[22px]"} ${color}`}>{value}</p>
    </div>
  );
}

function EmptyHistoryMessage({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d8e3d4] bg-[#f8fcf6] p-4 text-[13px] font-semibold leading-6 text-[#657064]">
      {text}
    </div>
  );
}

function NextFollowCard({ memo, mobile = false }: { memo: StudentObservation; mobile?: boolean }) {
  return (
    <section id="next-follow" className={`${mobile ? "rounded-[24px]" : "mt-4 rounded-2xl"} border border-[#efd3a7] bg-[#fffaf0] p-4 shadow-[0_10px_24px_rgba(122,104,80,0.06)]`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-[#9b7338]">次回フォロー</p>
          <h2 className="mt-1 break-words text-[16px] font-extrabold text-[#30362f]">{memo.nextFollow}</h2>
          <div className="mt-2 grid gap-1 text-[12px] font-semibold leading-5 text-[#62695f] md:grid-cols-3">
            <span>最終記録日：{memo.date}</span>
            <span>関連レッスン：{memo.lessonTitle}</span>
            <span>個別メモ：{memo.memo || "記録なし"}</span>
          </div>
        </div>
        {memo.lessonId ? (
          <Link href={`/lessons/${memo.lessonId}/record`} className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-[#5d956d] px-3 text-[12px] font-bold text-white">
            関連する記録を見る
          </Link>
        ) : null}
      </div>
    </section>
  );
}

// Legacy static placeholder kept while the new AI panel lives in a dedicated component.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function AiSuggestionPanel({
  suggestions,
  compact = false,
}: {
  suggestions: string[];
  compact?: boolean;
}) {
  return (
    <div className="min-w-0">
      <SectionTitle
        icon={Sparkles}
        title="AIメンターからの次回提案"
        subtitle="生徒情報・受講履歴・観察メモをもとに、次回レッスンの配慮ポイントを提案します。"
      />
      <div className="rounded-2xl border border-[#eee4d8] bg-[#fbf8f1] p-3">
        <p className="text-[13px] font-bold leading-6 text-[#657064]">
          まだ受講履歴が少ないため、AI提案は生徒の基本情報をもとに準備中です。
        </p>
        <div className="mt-3 grid gap-2">
          {suggestions.length ? suggestions.map((point) => (
            <div key={point} className="flex items-start gap-2 text-[13px] font-semibold leading-5 text-[#394238]">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-[#629268]" />
              <p className="min-w-0 break-words">{point}</p>
            </div>
          )) : (
            <p className="text-[12px] font-semibold leading-5 text-[#6b7468]">
              ヨガ他経験・ケガなどの注意点・その他メモを登録すると、次回の配慮ポイントを準備しやすくなります。
            </p>
          )}
        </div>
        <div className={compact ? "mt-3" : "mt-4"}>
          <StudentAiButton />
        </div>
      </div>
      <div className="mt-3 rounded-2xl border border-dashed border-[#d8e3d4] bg-white/60 p-3 text-[11px] font-semibold leading-5 text-[#7a7f73]">
        将来的には、年代・性別・ヨガ他経験・注意点・観察メモ・受講履歴・ブロック評価をAI提案の材料にします。
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getBasicInfoSuggestions(student: StudentRecord) {
  const suggestions: string[] = [];

  if (student.caution.trim()) {
    suggestions.push(`${student.caution}に配慮し、痛みや違和感が出る動きは無理に進めない。`);
  }

  if (student.memo.trim()) {
    suggestions.push(`その他メモを確認し、可動域や体調を見ながらゆっくり進める。`);
  }

  if (student.experience.trim()) {
    suggestions.push(`ヨガ他経験を踏まえ、説明量とポーズの難度を調整する。`);
  }

  return suggestions.slice(0, 3);
}

function LessonHistoryTable({ histories }: { histories: StudentLessonHistory[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>レッスン日</TableHead>
          <TableHead>レッスン名</TableHead>
          <TableHead>レッスンプラン名</TableHead>
          <TableHead>参加</TableHead>
          <TableHead>今日の様子</TableHead>
          <TableHead>個別メモ / 次回フォロー</TableHead>
          <TableHead className="text-right">導線</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {histories.map((history) => (
          <TableRow key={`${history.lessonId}-${history.date}`} className="soft-table-row">
            <TableCell className="whitespace-nowrap">{history.date}</TableCell>
            <TableCell className="font-bold">{history.lessonTitle}</TableCell>
            <TableCell>{history.planName}</TableCell>
            <TableCell><AttendanceBadge status={history.attendanceStatus} /></TableCell>
            <TableCell className="max-w-[220px]"><span className="line-clamp-2">{history.observation}</span></TableCell>
            <TableCell className="max-w-[260px]"><span className="line-clamp-2">{history.memo} / {history.nextFollow}</span></TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1.5">
                <Link href={`/lessons/${history.lessonId}`} className="inline-flex h-8 items-center justify-center rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-2 text-[12px] font-bold text-[#5d956d]">詳細</Link>
                <Link href={`/lessons/${history.lessonId}/record`} className="inline-flex h-8 items-center justify-center rounded-lg bg-[#5d956d] px-2 text-[12px] font-bold text-white">記録</Link>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function LessonHistoryCard({ history }: { history: StudentLessonHistory }) {
  return (
    <article className="rounded-2xl border border-[#eee4d8] bg-white/76 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-extrabold">{history.lessonTitle}</p>
          <p className="mt-1 text-[11px] font-bold text-[#5d956d]">{history.date}</p>
        </div>
        <AttendanceBadge status={history.attendanceStatus} />
      </div>
      <p className="mt-2 text-[11px] font-bold text-[#8b704c]">プラン：{history.planName}</p>
      <p className="mt-2 line-clamp-2 text-[12px] font-medium leading-5 text-[#50584e]">今日の様子：{history.observation}</p>
      <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-5 text-[#50584e]">個別メモ：{history.memo}</p>
      <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-5 text-[#50584e]">次回フォロー：{history.nextFollow}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href={`/lessons/${history.lessonId}`} className="inline-flex h-9 items-center justify-center rounded-xl border border-[#cfe1ca] bg-[#f8fcf6] px-2 text-[12px] font-bold text-[#5d956d]">詳細を見る</Link>
        <Link href={`/lessons/${history.lessonId}/record`} className="inline-flex h-9 items-center justify-center rounded-xl bg-[#5d956d] px-2 text-[12px] font-bold text-white">記録を見る</Link>
      </div>
    </article>
  );
}

function ObservationRow({ memo }: { memo: StudentObservation }) {
  return (
    <div className="rounded-xl border border-[#eee4d8] bg-white/72 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[13px] font-extrabold">{memo.date} {memo.lessonTitle}</p>
        <AttendanceBadge status={memo.attendanceStatus} />
      </div>
      <div className="mt-3 grid gap-2">
        <PlainMemo label="今日の様子" value={memo.condition} />
        <PlainMemo label="個別メモ" value={memo.memo ?? "記録なし"} />
        <PlainMemo label="次回フォロー" value={memo.nextFollow} />
      </div>
      {memo.lessonId ? (
        <Link href={`/lessons/${memo.lessonId}/record`} className="mt-2 inline-flex h-7 items-center rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-2 text-[11px] font-bold text-[#5d956d]">関連するレッスン記録へ</Link>
      ) : null}
    </div>
  );
}

function PlainMemo({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-[12px] font-medium leading-5 text-[#50584e]">
      <span className="font-bold text-[#8b704c]">{label}：</span>
      <span className="break-words">{value}</span>
    </div>
  );
}

function AttendanceBadge({ status }: { status: StudentLessonHistory["attendanceStatus"] }) {
  const className =
    status === "参加"
      ? "border-[#cfe1ca] bg-[#edf5ef] text-[#4f875a]"
      : status === "キャンセル"
        ? "border-[#efd3a7] bg-[#fff7e8] text-[#9b7338]"
        : "border-[#f2c9bd] bg-[#fff0ea] text-[#d96c55]";
  return <span className={`inline-flex h-7 shrink-0 items-center justify-center rounded-full border px-2 text-[11px] font-bold ${className}`}>{status}</span>;
}

function MobileSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[24px] border border-[#eee4d8] bg-white/84 p-4 shadow-[0_10px_24px_rgba(122,104,80,0.06)]">
      <h2 className="mb-3 text-[16px] font-extrabold">{title}</h2>
      {children}
    </section>
  );
}
