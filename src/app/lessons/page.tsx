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
import { lessonStudents, relatedLessons } from "@/components/yoga/data";

const tags = ["#ベーシックフロー", "#肩こり改善", "#呼吸", "#リラックス", "#体幹強化"];

const lessonFlow = [
  ["5分", "センタリング・呼吸法", "座位で呼吸を観察し、吐く息を長くする意識づけ。"],
  ["8分", "肩甲骨まわりのウォームアップ", "肩・首・胸まわりをほどき、背中の緊張をゆるめる。"],
  ["10分", "太陽礼拝A（2周）", "呼吸と動きの連動を確認しながら、全身を温める。"],
  ["12分", "立位ポーズ", "戦士II、三角のポーズ、椅子のポーズで土台と姿勢を調整。"],
  ["8分", "バランスポーズ", "木のポーズ、戦士III。体幹の安定と目線の置き方を確認。"],
  ["7分", "ツイスト・前屈・開脚系", "背骨を長く保ち、無理なく股関節まわりをゆるめる。"],
  ["5分", "クールダウン", "仰向けで腰まわりを解放し、呼吸を落ち着かせる。"],
  ["5分", "シャバーサナ・呼吸の観察", "余韻を味わい、レッスン後の心身の変化を確認。"],
];

export default function LessonsPage() {
  return (
    <>
      <PageHeader title="レッスンカルテ" subtitle="各レッスンの内容・気づき・改善点を記録" />

      <SoftCard className="p-4">
        <SectionTitle icon={CalendarDays} title="今回のレッスン" />
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_280px] gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <h1 className="mb-3 text-[24px] font-extrabold leading-tight">ベーシックフロー</h1>
            <div className="grid grid-cols-3 gap-x-4 gap-y-3 text-[13px]">
              <Info icon={CalendarDays} label="日時" value="2025/5/20（火）" />
              <Info icon={Clock3} label="時間" value="10:00-11:00（60分）" />
              <Info icon={UsersRound} label="形式" value="グループレッスン" />
              <Info icon={MapPin} label="場所" value="スタジオA" />
              <Info icon={Goal} label="目的・テーマ" value="体幹強化・柔軟性向上・呼吸の安定" wide />
            </div>
            <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 shrink-0 text-[#4f7b58]" />
              <span className="text-[13px] font-bold">タグ</span>
              {tags.map((tag) => (
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
              <span className="text-[42px] font-extrabold leading-none text-[#4f875a]">9</span>
              <span className="pb-1 text-[13px] font-bold">名</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d9d1c6] bg-[#f8f6f1] text-[#a49b91]">
                  <UserRound className="h-[18px] w-[18px]" />
                </div>
              ))}
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d9d1c6] bg-[#f1eee9] text-[11px] font-bold">+4</div>
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
        <SectionTitle icon={UserRound} title="参加生徒" subtitle="このレッスンに参加した生徒と記録へのリンク" action="9名" />
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {lessonStudents.map(([name, memo]) => (
            <div key={name} className="min-w-0 rounded-lg border border-[#e8dfd4] bg-white/70 p-2.5">
              <div className="flex min-w-0 gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d9d1c6] bg-[#f8f6f1] text-[#8b806f]">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold">{name} さん</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-4">{memo}</p>
                </div>
              </div>
              <Link
                href="/students"
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
          {["すべて", ...tags, "#柔軟性向上", "#リストラティブ"].map((tag, index) => (
            <Pill key={tag} active={index === 0}>{tag}</Pill>
          ))}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 text-[12px]">日時</TableHead>
              <TableHead className="h-8 text-[12px]">レッスン名</TableHead>
              <TableHead className="h-8 text-[12px]">テーマ</TableHead>
              <TableHead className="h-8 text-[12px]">参加者数</TableHead>
              <TableHead className="h-8 text-[12px]">主な気づき・改善点</TableHead>
              <TableHead className="h-8 text-right text-[12px]">記録</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {relatedLessons.map((row) => (
              <TableRow key={row[0]} className="soft-table-row">
                {row.map((cell) => (
                  <TableCell key={cell}>{cell}</TableCell>
                ))}
                <TableCell className="text-right">
                  <Link href="/lessons" className="font-bold text-[#5d956d]">詳細へ</Link>
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
