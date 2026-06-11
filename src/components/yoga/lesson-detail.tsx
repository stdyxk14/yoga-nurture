import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Clock3,
  FilePenLine,
  Goal,
  Layers3,
  ListChecks,
  MapPin,
  MessageSquareText,
  Search,
  Sparkles,
  Tag,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { lessons, students } from "@/components/yoga/records";
import type { LessonRecord, LessonStatus } from "@/components/yoga/records";

export function LessonDetail({ lesson }: { lesson: LessonRecord }) {
  return (
    <>
      <PageHeader title="レッスンカルテ詳細" subtitle="事前準備から実施後の振り返りまで一つのカルテで管理" />

      <div className="mb-3 flex justify-end gap-2">
        <Link
          href="/lessons"
          className="inline-flex h-8 items-center rounded-lg border border-[#d8e3d4] bg-white px-3 text-[13px] font-bold text-[#4f7b58]"
        >
          一覧に戻る
        </Link>
        <Link
          href={`/lessons/${lesson.id}/record`}
          className="inline-flex h-8 items-center rounded-lg border border-[#e7c8bd] bg-[#fff4ef] px-3 text-[13px] font-bold text-[#d96c55]"
        >
          記録を書く
        </Link>
        <Link
          href={`/lessons/${lesson.id}/edit`}
          className="inline-flex h-8 items-center rounded-lg bg-[#5d956d] px-4 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(64,113,77,0.2)]"
        >
          編集する
        </Link>
      </div>

      <SoftCard className="p-4">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_280px] gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <SectionTitle icon={CalendarDays} title="レッスン概要" />
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h1 className="mr-2 text-[24px] font-extrabold leading-tight">{lesson.title}</h1>
              <StatusBadge status={lesson.status} />
            </div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-3 text-[13px]">
              <Info icon={CalendarDays} label="日時" value={lesson.date} />
              <Info icon={Clock3} label="時間" value={`${lesson.startTime}-${lesson.endTime}（${lesson.duration}）`} />
              <Info icon={UsersRound} label="形式" value={lesson.format} />
              <Info icon={MapPin} label="場所" value={lesson.place} />
              <Info icon={Layers3} label="使用テンプレート" value={lesson.templateName} />
              <Info icon={Goal} label="目的・テーマ" value={lesson.theme} />
            </div>
            <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 shrink-0 text-[#4f7b58]" />
              <span className="text-[13px] font-bold">タグ</span>
              {lesson.tags.map((tag) => (
                <Pill key={tag}>{tag}</Pill>
              ))}
            </div>
          </div>

          <div className="min-w-0 rounded-xl border border-[#eee3d7] bg-white/75 p-3.5 shadow-[0_8px_18px_rgba(91,76,53,0.05)]">
            <p className="text-[13px] font-bold">参加者数</p>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-[42px] font-extrabold leading-none text-[#4f875a]">{lesson.participants}</span>
              <span className="pb-1 text-[13px] font-bold">名</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1">
              {Array.from({ length: Math.min(lesson.participants, 6) }).map((_, i) => (
                <div
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d9d1c6] bg-[#f8f6f1] text-[#a49b91]"
                >
                  <UserRound className="h-[18px] w-[18px]" />
                </div>
              ))}
              {lesson.participants > 6 ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d9d1c6] bg-[#f1eee9] text-[11px] font-bold">
                  +{lesson.participants - 6}
                </div>
              ) : null}
            </div>
            <Link
              href="#participants"
              className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-lg border border-[#d8e3d4] bg-white text-[12px] font-bold text-[#4f875a]"
            >
              参加生徒を確認する
            </Link>
          </div>
        </div>
      </SoftCard>

      <section className="mt-3 grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-3">
        <SoftCard className="p-4">
          <SectionTitle icon={ListChecks} title="レッスン前の準備" subtitle="事前プラン" />
          <TextBlock title="事前のレッスン構成" value={lesson.prePlan} large />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <TextBlock title="事前に意識したいこと" value={lesson.preFocus} />
            <TextBlock title="生徒ごとの配慮ポイント" value={lesson.studentCare} />
          </div>
          <button className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-[#5d956d] px-4 text-[13px] font-bold text-white">
            <Sparkles className="h-4 w-4" />
            この事前プランについてAIメンターに相談
          </button>
        </SoftCard>

        <SoftCard className="p-4">
          <SectionTitle icon={FilePenLine} title="レッスン後の記録" subtitle="実施メモ" />
          <TextBlock title="実際に行った内容" value={lesson.actualContent || "レッスン後に追記できます。"} />
          <TextBlock title="生徒の反応・観察" value={lesson.reaction || "表情、呼吸、姿勢、集中度などを記録します。"} />
          <TextBlock title="参加生徒ごとの個別メモ" value={lesson.individualMemos || "生徒ごとの変化や次回配慮を追記します。"} />
          <TextBlock title="次回への改善ポイント" value={lesson.improvement || "次回の構成や声かけの改善点を整理します。"} />
          <button className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-[#ef6f5b] px-4 text-[13px] font-bold text-white">
            <MessageSquareText className="h-4 w-4" />
            この振り返りをAIメンターに相談
          </button>
        </SoftCard>
      </section>

      <SoftCard id="participants" className="mt-3 p-3.5">
        <SectionTitle
          icon={UserRound}
          title="参加生徒"
          subtitle="このレッスンに参加した生徒とカルテへのリンク"
          action={`${lesson.participants}名`}
        />
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {students.slice(0, 8).map((student) => (
            <div key={student.id} className="min-w-0 rounded-lg border border-[#e8dfd4] bg-white/70 p-2.5">
              <div className="flex min-w-0 gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d9d1c6] bg-[#f8f6f1] text-[#8b806f]">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold">{student.name} さん</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-4">{student.memo}</p>
                </div>
              </div>
              <Link
                href={`/students/${student.id}`}
                className="mt-2 inline-flex h-7 w-full items-center justify-center rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] text-[12px] font-bold text-[#5d956d]"
              >
                生徒カルテを見る
              </Link>
            </div>
          ))}
        </div>
      </SoftCard>

      <SoftCard className="mt-3 p-3.5">
        <SectionTitle
          icon={Search}
          title="関連レッスンを探す"
          subtitle="タグやテーマから過去の関連レッスンを確認"
          action="すべての記録を見る"
        />
        <div className="mb-2 flex flex-wrap gap-2">
          {["すべて", ...lesson.tags, "#柔軟性向上", "#リストラティブ"].map((tag, index) => (
            <Pill key={`${tag}-${index}`} active={index === 0}>
              {tag}
            </Pill>
          ))}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 text-[12px]">日時</TableHead>
              <TableHead className="h-8 text-[12px]">レッスン名</TableHead>
              <TableHead className="h-8 text-[12px]">テーマ</TableHead>
              <TableHead className="h-8 text-[12px]">状態</TableHead>
              <TableHead className="h-8 text-right text-[12px]">記録</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons.map((related) => (
              <TableRow key={related.id} className="soft-table-row">
                <TableCell>{related.date}</TableCell>
                <TableCell>{related.title}</TableCell>
                <TableCell>{related.theme}</TableCell>
                <TableCell>
                  <StatusBadge status={related.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/lessons/${related.id}`} className="font-bold text-[#5d956d]">
                    詳細へ
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SoftCard>
    </>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-0.5 flex items-center gap-1.5 text-[12px] font-bold">
        <Icon className="h-4 w-4 shrink-0 text-[#56605a]" strokeWidth={1.8} />
        {label}
      </div>
      <p className="pl-5 text-[13px] font-medium leading-5 [word-break:keep-all]">{value}</p>
    </div>
  );
}

function TextBlock({ title, value, large = false }: { title: string; value: string; large?: boolean }) {
  return (
    <div className={large ? "rounded-xl border border-[#eee4d8] bg-white/68 p-3" : "mb-2 rounded-xl border border-[#eee4d8] bg-white/68 p-3"}>
      <p className="mb-1 text-[12px] font-bold text-[#4f7b58]">{title}</p>
      <p className={large ? "text-[13px] font-medium leading-6 text-[#50584e]" : "line-clamp-3 text-[12px] font-medium leading-5 text-[#50584e]"}>
        {value}
      </p>
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

  return (
    <span className={`inline-flex h-7 items-center justify-center rounded-full border px-2 text-[11px] font-bold ${className}`}>
      {status}
    </span>
  );
}
