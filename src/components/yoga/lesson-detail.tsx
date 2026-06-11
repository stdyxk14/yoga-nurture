import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Goal,
  ListChecks,
  MapPin,
  MessageSquareText,
  Search,
  Tag,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { lessonFlow, lessons, students } from "@/components/yoga/records";
import type { LessonRecord } from "@/components/yoga/records";

export function LessonDetail({ lesson }: { lesson: LessonRecord }) {
  return (
    <>
      <PageHeader title="レッスンカルテ詳細" subtitle="各レッスンの内容・気づき・改善点を記録" />

      <div className="mb-3 flex justify-end gap-2">
        <Link
          href="/lessons"
          className="inline-flex h-8 items-center rounded-lg border border-[#d8e3d4] bg-white px-3 text-[13px] font-bold text-[#4f7b58]"
        >
          一覧に戻る
        </Link>
        <Link
          href={`/lessons/${lesson.id}/edit`}
          className="inline-flex h-8 items-center rounded-lg bg-[#5d956d] px-4 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(64,113,77,0.2)]"
        >
          編集する
        </Link>
      </div>

      <SoftCard className="p-4">
        <SectionTitle icon={CalendarDays} title="今回のレッスン" />
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_280px] gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <h1 className="mb-3 text-[24px] font-extrabold leading-tight">{lesson.title}</h1>
            <div className="grid grid-cols-3 gap-x-4 gap-y-3 text-[13px]">
              <Info icon={CalendarDays} label="日時" value={lesson.date} />
              <Info icon={Clock3} label="時間" value={`${lesson.startTime}-${lesson.endTime}（${lesson.duration}）`} />
              <Info icon={UsersRound} label="形式" value={lesson.format} />
              <Info icon={MapPin} label="場所" value={lesson.place} />
              <Info icon={Goal} label="目的・テーマ" value={lesson.theme} wide />
            </div>
            <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 shrink-0 text-[#4f7b58]" />
              <span className="text-[13px] font-bold">タグ</span>
              {lesson.tags.map((tag) => (
                <Pill key={tag}>{tag}</Pill>
              ))}
              <span className="rounded-full border border-[#d8e3d4] bg-white px-3 py-1 text-[12px] font-bold text-[#4f7b58]">
                + タグを追加
              </span>
            </div>
          </div>

          <div className="min-w-0 rounded-xl border border-[#eee3d7] bg-white/75 p-3.5 shadow-[0_8px_18px_rgba(91,76,53,0.05)]">
            <p className="text-[13px] font-bold">参加者数</p>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-[42px] font-extrabold leading-none text-[#4f875a]">{lesson.participants}</span>
              <span className="pb-1 text-[13px] font-bold">名</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d9d1c6] bg-[#f8f6f1] text-[#a49b91]">
                  <UserRound className="h-[18px] w-[18px]" />
                </div>
              ))}
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d9d1c6] bg-[#f1eee9] text-[11px] font-bold">+{Math.max(lesson.participants - 6, 0)}</div>
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

      <section className="mt-3 grid grid-cols-[minmax(0,1.45fr)_minmax(270px,0.8fr)] gap-3">
        <SoftCard className="p-4">
          <SectionTitle icon={ListChecks} title="実施内容" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {lessonFlow.map(([time, title, note]) => (
              <div key={title} className="grid min-w-0 grid-cols-[42px_minmax(0,1fr)] gap-2 rounded-xl border border-[#eee4d8] bg-white/66 px-3 py-2">
                <span className="text-[12px] font-extrabold text-[#5d8e67]">{time}</span>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold leading-5">{title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[12px] font-medium leading-5 text-[#5f665c]">{note}</p>
                </div>
              </div>
            ))}
          </div>
        </SoftCard>

        <div className="grid gap-3">
          <SoftCard className="p-3.5">
            <SectionTitle icon={MessageSquareText} title="生徒の反応・観察" />
            <div className="space-y-2 text-[13px] font-medium leading-5">
              <p><span className="font-bold">全体の反応</span><br />集中力が高く、呼吸を意識しながら丁寧に動けていた。</p>
              <p><span className="font-bold">特に印象的だった様子</span><br />佐藤さんは戦士IIIで軸が安定。鈴木さんは前屈の柔軟性が向上。</p>
            </div>
          </SoftCard>

          <SoftCard className="p-3.5">
            <SectionTitle icon={CheckCircle2} title="次回への改善ポイント" />
            <div className="space-y-2">
              {[
                "バランスポーズの時間配分を少し短くし、休息を増やす",
                "ツイスト前に肩まわりのほぐしを追加する",
                "後半の疲労を見てシャバーサナを5分に延長",
                "体幹安定を高めるコアワークを導入検討",
              ].map((text) => (
                <div key={text} className="flex gap-2 text-[13px] font-medium leading-5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#629268]" />
                  {text}
                </div>
              ))}
            </div>
          </SoftCard>
        </div>
      </section>

      <SoftCard id="participants" className="mt-3 p-3.5">
        <SectionTitle icon={UserRound} title="参加生徒" subtitle="このレッスンに参加した生徒と記録へのリンク" action={`${lesson.participants}名`} />
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
        <SectionTitle icon={Search} title="関連レッスンを探す" subtitle="タグやテーマから過去の関連レッスンを検索" action="すべての記録を見る" />
        <div className="mb-2 flex flex-wrap gap-2">
          {["すべて", ...lesson.tags, "#柔軟性向上", "#リストラティブ"].map((tag, index) => (
            <Pill key={`${tag}-${index}`} active={index === 0}>{tag}</Pill>
          ))}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 text-[12px]">日時</TableHead>
              <TableHead className="h-8 text-[12px]">レッスン名</TableHead>
              <TableHead className="h-8 text-[12px]">テーマ</TableHead>
              <TableHead className="h-8 text-[12px]">参加者数</TableHead>
              <TableHead className="h-8 text-right text-[12px]">記録</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons.map((related) => (
              <TableRow key={related.id} className="soft-table-row">
                <TableCell>{related.date}</TableCell>
                <TableCell>{related.title}</TableCell>
                <TableCell>{related.theme}</TableCell>
                <TableCell>{related.participants}名</TableCell>
                <TableCell className="text-right">
                  <Link href={`/lessons/${related.id}`} className="font-bold text-[#5d956d]">詳細へ</Link>
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
  wide,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2 min-w-0" : "min-w-0"}>
      <div className="mb-0.5 flex items-center gap-1.5 text-[12px] font-bold">
        <Icon className="h-4 w-4 shrink-0 text-[#56605a]" strokeWidth={1.8} />
        {label}
      </div>
      <p className="pl-5 text-[13px] font-medium leading-5 [word-break:keep-all]">{value}</p>
    </div>
  );
}
