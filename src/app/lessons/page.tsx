import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { lessonStudents, relatedLessons } from "@/components/yoga/data";

export default function LessonsPage() {
  return (
    <>
      <PageHeader title="レッスンカルテ" subtitle="各レッスンの内容・気づき・改善点を記録" />

      <SoftCard className="p-5">
        <SectionTitle icon={CalendarDays} title="今回のレッスン" />
        <div className="grid grid-cols-[1fr_420px] gap-6">
          <div>
            <h1 className="mb-4 text-[30px] font-extrabold">ベーシックフロー</h1>
            <div className="grid grid-cols-3 gap-y-5">
              <Info icon={CalendarDays} label="日時" value="2025/5/20（火）" />
              <Info icon={Clock3} label="レッスン時間" value="10:00-11:00（60分）" />
              <Info icon={UsersRound} label="形式" value="グループレッスン" />
              <Info icon={MapPin} label="場所" value="スタジオA" />
              <Info icon={Goal} label="目的・テーマ" value="体幹強化・柔軟性向上・呼吸の安定" wide />
            </div>
            <div className="mt-5 flex items-center gap-3">
              <Tag className="h-5 w-5 text-[#4f7b58]" />
              <span className="text-sm font-bold">タグ</span>
              {["#ベーシックフロー", "#肩こり改善", "#呼吸", "#リラックス", "#体幹強化"].map((tag) => (
                <Pill key={tag}>{tag}</Pill>
              ))}
              <Button variant="outline" className="h-8 rounded-full border-[#d8e3d4] bg-white text-[#4f7b58]">タグを追加</Button>
            </div>
          </div>
          <div className="rounded-2xl border border-[#eee3d7] bg-white/75 p-5 shadow-[0_10px_20px_rgba(91,76,53,0.05)]">
            <p className="text-sm font-bold">参加者数</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-5xl font-extrabold text-[#4f875a]">9</span>
              <span className="pb-2 text-sm font-bold">名</span>
            </div>
            <div className="mt-4 flex items-center gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9d1c6] bg-[#f8f6f1] text-[#a49b91]">
                  <UserRound className="h-5 w-5" />
                </div>
              ))}
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9d1c6] bg-[#f1eee9] text-[12px] font-bold">+4</div>
            </div>
            <Link
              href="#participants"
              className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-xl border border-[#d8e3d4] bg-white text-[14px] font-bold text-[#4f875a]"
            >
              参加生徒を確認する
            </Link>
          </div>
        </div>
      </SoftCard>

      <section className="mt-4 grid grid-cols-3 gap-4">
        <SoftCard>
          <SectionTitle icon={ListChecks} title="実施内容" />
          <ul className="space-y-2 text-[14px] font-medium leading-6">
            {[
              "センタリング・呼吸法（5分）",
              "太陽礼拝A（2周）",
              "立位のポーズ（戦士II・三角のポーズ・椅子のポーズ）",
              "バランスポーズ（木のポーズ・戦士III）",
              "ツイスト・前屈・開脚系のポーズ",
              "リラックス（シャバーサナ・呼吸の観察）",
            ].map((text) => (
              <li key={text}>・ {text}</li>
            ))}
          </ul>
        </SoftCard>

        <SoftCard>
          <SectionTitle icon={MessageSquareText} title="生徒の反応・観察" />
          <div className="space-y-3 text-[14px] font-medium leading-6">
            <p><span className="font-bold">全体の反応</span><br />集中力が高く、呼吸を意識しながら丁寧に動けていた。</p>
            <p><span className="font-bold">特に印象的だった生徒の様子</span><br />佐藤 美咲さん：戦士IIIでの安定感が向上。軸がぶれにくくなっていた。</p>
          </div>
        </SoftCard>

        <SoftCard>
          <SectionTitle icon={CheckCircle2} title="次回への改善ポイント" />
          <div className="space-y-3">
            {[
              "バランスポーズの時間配分を少し短くし、休息を増やす",
              "ツイストの前に肩周りのほぐしを追加する",
              "後半の疲労を考慮し、シャバーサナを＋5分に延長",
              "体幹の安定を高めるコアエクササイズを導入検討",
            ].map((text) => (
              <div key={text} className="flex gap-2 text-[14px] font-medium leading-6">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#629268]" />
                {text}
              </div>
            ))}
          </div>
        </SoftCard>
      </section>

      <SoftCard id="participants" className="mt-4">
        <SectionTitle icon={UserRound} title="参加生徒" subtitle="このレッスンに参加した生徒と記録へのリンク" action="参加者 9名" />
        <div className="grid grid-cols-4 gap-3">
          {lessonStudents.map(([name, memo]) => (
            <div key={name} className="rounded-xl border border-[#e8dfd4] bg-white/70 p-3">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#d9d1c6] bg-[#f8f6f1] text-[#8b806f]">
                  <UserRound className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[14px] font-bold">{name} さん</p>
                  <p className="mt-1 min-h-[42px] text-[12px] font-medium leading-5">{memo}</p>
                </div>
              </div>
              <Link
                href="/students"
                className="mt-2 inline-flex h-8 w-full items-center justify-center rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] text-[13px] font-bold text-[#5d956d]"
              >
                生徒カルテを見る
              </Link>
            </div>
          ))}
        </div>
      </SoftCard>

      <SoftCard className="mt-4">
        <SectionTitle icon={Search} title="関連レッスンを探す" subtitle="タグやテーマから過去の関連レッスンを簡単に見つけられます" action="すべての記録を見る" />
        <div className="mb-3 flex flex-wrap gap-2">
          {["すべて", "#ベーシックフロー", "#肩こり改善", "#呼吸", "#リラックス", "#体幹強化", "#柔軟性向上", "#リストラティブ"].map((tag, index) => (
            <Pill key={tag} active={index === 0}>{tag}</Pill>
          ))}
          <Button variant="outline" className="h-8 rounded-full border-[#d8e3d4] bg-white text-[#4f7b58]">テーマで探す</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日時</TableHead>
              <TableHead>レッスン名</TableHead>
              <TableHead>テーマ</TableHead>
              <TableHead>参加者数</TableHead>
              <TableHead>主な気づき・改善点</TableHead>
              <TableHead className="text-right">記録を見る</TableHead>
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
  icon: typeof CalendarDays;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="mb-1 flex items-center gap-2 text-[13px] font-bold">
        <Icon className="h-5 w-5 text-[#56605a]" strokeWidth={1.8} />
        {label}
      </div>
      <p className="pl-7 text-[14px] font-medium leading-6">{value}</p>
    </div>
  );
}
