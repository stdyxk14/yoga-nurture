import Link from "next/link";
import { FileText, ListChecks, MessageSquareText, Printer, UserRound } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { getLessonBlocks, getStudent, lessons } from "@/components/yoga/records";
import type { LessonRecord, LessonStatus } from "@/components/yoga/records";

export function LessonDetail({ lesson }: { lesson: LessonRecord }) {
  const blocks = getLessonBlocks(lesson);
  const plannedStudents = lesson.plannedStudentIds.map(getStudent);
  const attended = lesson.participants.filter((item) => item.status === "参加").length;
  const canceled = lesson.participants.filter((item) => item.status === "キャンセル").length;
  const noShow = lesson.participants.filter((item) => item.status === "無断欠席").length;

  return (
    <>
      <PageHeader title="レッスンプラン詳細" subtitle="ブロック原稿・参加予定・実施後評価を確認" />

      <div className="mb-3 flex justify-end gap-2">
        <Link href="/lessons?tab=plans" className="inline-flex h-8 items-center rounded-lg border border-[#d8e3d4] bg-white px-3 text-[13px] font-bold text-[#4f7b58]">
          一覧に戻る
        </Link>
        <Link href={`/lessons/${lesson.id}/script`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-3 text-[13px] font-bold text-[#5d956d]">
          <Printer className="h-4 w-4" />原稿
        </Link>
        <Link href={`/lessons/${lesson.id}/record`} className="inline-flex h-8 items-center rounded-lg border border-[#e7c8bd] bg-[#fff4ef] px-3 text-[13px] font-bold text-[#d96c55]">
          記録を書く
        </Link>
        <Link href={`/lessons/${lesson.id}/edit`} className="inline-flex h-8 items-center rounded-lg bg-[#5d956d] px-4 text-[13px] font-bold text-white">
          編集する
        </Link>
      </div>

      <SoftCard className="p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_280px] gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-extrabold leading-tight">{lesson.title}</h1>
              <StatusBadge status={lesson.status} />
            </div>
            <div className="grid grid-cols-4 gap-3 text-[13px] font-semibold">
              <Info label="日時" value={`${lesson.date} ${lesson.startTime}-${lesson.endTime}`} />
              <Info label="場所" value={lesson.place} />
              <Info label="形式" value={lesson.format} />
              <Info label="合計時間" value={lesson.duration} />
            </div>
            <p className="mt-3 text-[13px] font-medium leading-5 text-[#50584e]">{lesson.theme}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {lesson.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}
            </div>
          </div>
          <div className="rounded-xl border border-[#eee4d8] bg-white/72 p-3">
            <p className="text-[12px] font-bold text-[#7c8476]">出席サマリー</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <MiniStat label="参加" value={`${attended}名`} />
              <MiniStat label="キャンセル" value={`${canceled}名`} tone="coral" />
              <MiniStat label="無断欠席" value={`${noShow}名`} tone="purple" />
            </div>
          </div>
        </div>
      </SoftCard>

      <section className="mt-3 grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-3">
        <SoftCard className="p-4">
          <SectionTitle icon={ListChecks} title="使用ブロック一覧" subtitle="大カテゴリー・小カテゴリー・原稿の流れ" />
          <div className="grid gap-2">
            {blocks.map((block, index) => (
              <div key={block.id} className="rounded-xl border border-[#eee4d8] bg-white/70 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#edf5ef] text-[12px] font-extrabold text-[#4f875a]">{index + 1}</span>
                  <h3 className="text-[15px] font-extrabold">{block.name}</h3>
                  <span className="rounded-full bg-[#fff7e8] px-2 py-0.5 text-[11px] font-bold text-[#9b7338]">{block.majorCategory}</span>
                  <span className="text-[12px] font-bold text-[#5d956d]">{block.minorCategory}</span>
                  <span className="ml-auto text-[12px] font-bold text-[#6b7468]">{block.duration}</span>
                </div>
                <p className="line-clamp-3 text-[12px] font-medium leading-5 text-[#50584e]">{block.script}</p>
                <p className="mt-1 text-[11px] font-bold text-[#d96c55]">注意：{block.cautions}</p>
              </div>
            ))}
          </div>
        </SoftCard>

        <div className="grid gap-3">
          <SoftCard className="p-3.5">
            <SectionTitle icon={UserRound} title="参加予定者" />
            <div className="grid gap-2">
              {plannedStudents.map((student) => (
                <div key={student.id} className="rounded-lg border border-[#eee4d8] bg-white/70 p-2">
                  <p className="text-[13px] font-bold">{student.name}</p>
                  <p className="line-clamp-1 text-[11px] font-medium text-[#6b7468]">{student.caution}</p>
                </div>
              ))}
            </div>
          </SoftCard>

          <SoftCard className="p-3.5">
            <SectionTitle icon={MessageSquareText} title="レッスン後の記録" />
            <Info label="全体メモ" value={lesson.actualContent || "レッスン後に追記します"} />
            <Info label="反応・観察" value={lesson.reaction || "ブロックごとに評価します"} />
            <Info label="次回改善" value={lesson.improvement || "改善点を次回プランへ反映します"} />
          </SoftCard>
        </div>
      </section>

      <SoftCard className="mt-3 p-3.5">
        <SectionTitle icon={FileText} title="関連レッスン" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日付</TableHead>
              <TableHead>レッスン名</TableHead>
              <TableHead>テーマ</TableHead>
              <TableHead>状態</TableHead>
              <TableHead className="text-right">詳細</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons.map((related) => (
              <TableRow key={related.id} className="soft-table-row">
                <TableCell>{related.date}</TableCell>
                <TableCell>{related.title}</TableCell>
                <TableCell>{related.theme}</TableCell>
                <TableCell><StatusBadge status={related.status} /></TableCell>
                <TableCell className="text-right"><Link href={`/lessons/${related.id}`} className="font-bold text-[#5d956d]">詳細へ</Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SoftCard>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#eee4d8] bg-white/62 p-2.5">
      <p className="text-[11px] font-bold text-[#8b704c]">{label}</p>
      <p className="mt-1 text-[12px] font-medium leading-5 text-[#394238]">{value}</p>
    </div>
  );
}

function MiniStat({ label, value, tone = "green" }: { label: string; value: string; tone?: "green" | "coral" | "purple" }) {
  const color = tone === "coral" ? "text-[#ef6f5b]" : tone === "purple" ? "text-[#7469bf]" : "text-[#4f875a]";
  return (
    <div className="rounded-lg border border-[#eee4d8] bg-white/70 p-2">
      <p className="text-[11px] font-bold text-[#7c8476]">{label}</p>
      <p className={`text-[22px] font-extrabold ${color}`}>{value}</p>
    </div>
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
