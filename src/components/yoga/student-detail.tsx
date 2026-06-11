import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownUp, BarChart3, Dumbbell, HeartHandshake, NotebookPen, Target, UserRound } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MiniBar, PageHeader, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { lessons, studentObservations } from "@/components/yoga/records";
import type { StudentRecord } from "@/components/yoga/records";

export function StudentDetail({ student }: { student: StudentRecord }) {
  const profileItems = [
    ["ヨガ他経験", student.experience, Dumbbell],
    ["ケガなどの注意点", student.caution, HeartHandshake],
    ["その他メモ", student.memo, NotebookPen],
  ] as const;
  const observations = studentObservations[student.id] ?? [];

  return (
    <>
      <div className="md:hidden">
        <MobileStudentDetail student={student} observations={observations} />
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

        <section className="mt-4 grid grid-cols-[1.15fr_1fr] gap-4">
          <SoftCard>
            <SectionTitle icon={NotebookPen} title="最近の変化・観察メモ" subtitle="レッスン後記録の生徒別コメントから蓄積" />
            <div className="space-y-2">
              {observations.map((memo) => (
                <div key={`${memo.date}-${memo.lessonTitle}`} className="rounded-xl border border-[#eee4d8] bg-white/70 p-3">
                  <p className="text-[13px] font-extrabold">{memo.date} {memo.lessonTitle}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[12px] font-medium leading-5">
                    <Info label="今日の様子" value={memo.condition} />
                    <Info label="身体面の変化" value={memo.bodyChange} />
                    <Info label="次回確認" value={memo.nextCheck} />
                  </div>
                </div>
              ))}
            </div>
          </SoftCard>

          <SoftCard>
            <SectionTitle icon={Target} title="次回レッスンに向けたポイント" />
            <div className="space-y-3">
              {[student.caution, "ブロック評価で反応が良かった呼吸法を導入に使う", "参加ステータスとキャンセル理由も確認する"].map((point) => (
                <div key={point} className="flex items-start gap-2 text-[14px] font-medium">
                  <Target className="mt-0.5 h-5 w-5 shrink-0 text-[#629268]" />
                  {point}
                </div>
              ))}
            </div>
          </SoftCard>
        </section>

        <SoftCard className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle icon={ArrowDownUp} title="紐づくレッスン履歴" subtitle="この生徒が参加予定または参加したレッスン" />
            <Link href="/lessons" className="text-[13px] font-bold text-[#5d956d]">レッスンカルテ一覧へ</Link>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日付</TableHead>
                <TableHead>レッスン名</TableHead>
                <TableHead>場所</TableHead>
                <TableHead>テーマ</TableHead>
                <TableHead className="text-right">導線</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessons.map((lesson) => (
                <TableRow key={lesson.id} className="soft-table-row">
                  <TableCell>{lesson.date}</TableCell>
                  <TableCell>{lesson.title}</TableCell>
                  <TableCell>{lesson.place}</TableCell>
                  <TableCell>{lesson.theme}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/lessons/${lesson.id}`} className="inline-flex h-8 items-center justify-center rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-3 text-[13px] font-bold text-[#5d956d]">
                      レッスンカルテを見る
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SoftCard>

        <SoftCard className="mt-4">
          <SectionTitle icon={BarChart3} title="この生徒の受講傾向" />
          <div className="grid grid-cols-[170px_1fr_170px_1.2fr_1fr] gap-4">
            <div className="border-r border-[#eee3d7] pr-4">
              <p className="text-sm font-bold">受講頻度</p>
              <p className="mt-4 text-3xl font-extrabold text-[#4f875a]">3.8<span className="ml-1 text-sm">回</span></p>
              <p className="mt-2 text-[12px] font-semibold text-[#677064]">月平均。安定して通われています</p>
            </div>
            <div className="border-r border-[#eee3d7] pr-4">
              <p className="mb-3 text-sm font-bold">よく受けるクラス</p>
              {[["リラックス系", 60], ["ベーシックフロー", 30], ["陰ヨガ", 10]].map(([label, value]) => (
                <div key={label} className="mb-3 grid grid-cols-[110px_1fr_36px] items-center gap-2 text-[12px] font-semibold">
                  <span>{label}</span>
                  <MiniBar value={Number(value)} />
                  <span>{value}%</span>
                </div>
              ))}
            </div>
            <Info label="属性" value={`${student.ageGroup} / ${student.gender}`} />
            <Info label="反応の傾向" value="呼吸法とゆったりした誘導で変化が出やすいタイプ。" />
            <Info label="次のフォーカス" value={student.caution} />
          </div>
        </SoftCard>
      </div>
    </>
  );
}

function MobileStudentDetail({
  student,
  observations,
}: {
  student: StudentRecord;
  observations: Array<{ date: string; lessonTitle: string; condition: string; bodyChange: string; nextCheck: string }>;
}) {
  const infoItems = [
    ["ヨガ他経験", student.experience, Dumbbell],
    ["ケガなどの注意点", student.caution, HeartHandshake],
    ["その他メモ", student.memo, NotebookPen],
  ] as const;

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
          {observations.map((memo) => (
            <div key={`${memo.date}-${memo.lessonTitle}`} className="rounded-2xl border border-[#eee4d8] bg-white/76 p-3">
              <p className="text-[13px] font-extrabold">{memo.date} {memo.lessonTitle}</p>
              <div className="mt-2 grid gap-2">
                <Info label="今日の様子" value={memo.condition} />
                <Info label="身体面の変化" value={memo.bodyChange} />
                <Info label="次回確認" value={memo.nextCheck} />
              </div>
            </div>
          ))}
        </div>
      </MobileSection>

      <MobileSection title="次回レッスンに向けたポイント">
        <div className="grid gap-2">
          {[student.caution, "反応が良かった呼吸法を導入に使う", "参加ステータスとキャンセル理由も確認"].map((point) => (
            <div key={point} className="flex gap-2 rounded-2xl border border-[#eee4d8] bg-white/76 p-3 text-[13px] font-semibold leading-5">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-[#629268]" />
              <p className="min-w-0 break-words">{point}</p>
            </div>
          ))}
        </div>
      </MobileSection>

      <MobileSection title="紐づくレッスン履歴">
        <div className="grid gap-2">
          {lessons.slice(0, 4).map((lesson) => (
            <Link key={lesson.id} href={`/lessons/${lesson.id}`} className="block rounded-2xl border border-[#eee4d8] bg-white/76 p-3">
              <p className="truncate text-[13px] font-extrabold">{lesson.title}</p>
              <p className="mt-1 text-[11px] font-bold text-[#5d956d]">{lesson.date} / {lesson.place}</p>
              <p className="mt-1 line-clamp-2 text-[12px] font-medium text-[#5f665c]">{lesson.theme}</p>
            </Link>
          ))}
        </div>
      </MobileSection>

      <MobileSection title="この生徒の受講傾向">
        <div className="grid gap-3">
          <div className="rounded-2xl border border-[#eee4d8] bg-white/76 p-3">
            <p className="text-[12px] font-bold text-[#8b704c]">受講頻度</p>
            <p className="mt-1 text-[28px] font-extrabold text-[#4f875a]">3.8<span className="ml-1 text-sm">回/月</span></p>
          </div>
          {[["リラックス系", 60], ["ベーシックフロー", 30], ["陰ヨガ", 10]].map(([label, value]) => (
            <div key={label} className="grid grid-cols-[96px_1fr_36px] items-center gap-2 text-[12px] font-semibold">
              <span>{label}</span>
              <MiniBar value={Number(value)} />
              <span>{value}%</span>
            </div>
          ))}
        </div>
      </MobileSection>
    </div>
  );
}

function MobileSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[24px] border border-[#eee4d8] bg-white/84 p-4 shadow-[0_10px_24px_rgba(122,104,80,0.06)]">
      <h2 className="mb-3 text-[16px] font-extrabold">{title}</h2>
      {children}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#eee4d8] bg-white/68 p-2">
      <p className="text-[11px] font-bold text-[#8b704c]">{label}</p>
      <p className="mt-1 text-[12px] font-medium leading-5">{value}</p>
    </div>
  );
}
