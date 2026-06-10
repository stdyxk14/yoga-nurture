import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Link2,
  NotebookText,
  TrendingUp,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetricCard, PageHeader, SectionTitle, SoftCard } from "@/components/yoga/page-kit";

const linkedRows = [
  ["佐藤 美咲 さん", "ベーシックフロー", "2025/5/20 10:00-", "立ちポーズで安定感UP。呼吸も深い。"],
  ["鈴木 陽菜 さん", "リラックスヨガ", "2025/5/19 13:30-", "肩の緊張が和らぎ、表情も穏やか。"],
  ["田中 優子 さん", "陰ヨガ", "2025/5/18 18:30-", "股関節の詰まりが軽減。睡眠の質も改善。"],
];

const studentNotes = [
  ["5/13", "肩まわりの可動域UP。呼吸も深まる。"],
  ["5/6", "休息が深まり、表情が柔らかい。"],
  ["4/29", "太陽礼拝の安定感が向上。"],
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        greeting="おはようございます！"
        title="今日も素敵なレッスンで、生徒さんの心と体を整えましょう。"
      />

      <section className="grid grid-cols-3 gap-4">
        <MetricCard
          icon={CalendarDays}
          label="今日のレッスン"
          value="3"
          unit="レッスン"
          detail="12名 参加予定"
        />
        <MetricCard
          icon={CalendarDays}
          label="今週のレッスン"
          value="9"
          unit="レッスン"
          tone="blue"
          detail="76名 参加予定"
        />
        <MetricCard
          icon={CalendarDays}
          label="今月のレッスン"
          value="32"
          unit="レッスン"
          tone="purple"
          detail="延べ256名 参加予定"
        />
      </section>

      <section className="mt-3 grid grid-cols-[minmax(0,1fr)_64px_minmax(0,1fr)] gap-4">
        <SoftCard className="min-h-[210px] p-3">
          <SectionTitle icon={UserRound} title="生徒カルテ" />
          <div className="grid grid-cols-[94px_minmax(0,1fr)] gap-3">
            <div className="min-w-0 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e7f0e3] text-[#4b865b]">
                <UserRound className="h-9 w-9" strokeWidth={1.4} />
              </div>
              <p className="mt-2 text-[14px] font-bold leading-5">佐藤 美咲 さん</p>
              <p className="text-[12px] font-semibold text-[#626960]">35歳 / 女性</p>
            </div>

            <div className="min-w-0">
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["目標", "姿勢改善・肩こり解消"],
                  ["注意事項", "膝に違和感あり"],
                  ["性格・傾向", "真面目で変化に前向き"],
                  ["好み", "呼吸重視のゆったり系"],
                ].map(([label, value]) => (
                <div key={label} className="min-w-0 rounded-lg border border-[#eee4d8] bg-white/65 px-2 py-1.5">
                    <p className="whitespace-nowrap text-[12px] font-bold text-[#5d956d]">{label}</p>
                    <p className="mt-1 min-w-0 text-[12px] font-medium leading-5 text-[#3f433d]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-2 rounded-lg bg-[#fbfaf6] px-2.5 py-1.5">
                <p className="text-[12px] font-bold text-[#5d956d]">最近の記録・メモ</p>
                <ul className="mt-1 space-y-0.5 text-[11.5px] font-medium leading-4">
                  {studentNotes.map(([date, note]) => (
                    <li key={date} className="min-w-0">
                      <span className="font-bold">{date}</span>　{note}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <Link href="/students" className="mt-2 flex justify-end text-[12px] font-bold text-[#5d956d]">
            詳細を見る <ChevronRight className="h-4 w-4" />
          </Link>
        </SoftCard>

        <div className="flex min-h-[210px] flex-col items-center justify-center text-[#4f8658]">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#6b9b72] bg-[#f4faf2]">
            <Link2 className="h-6 w-6" />
          </div>
          <p className="mt-2 text-center text-[12px] font-bold leading-5">
            レッスンと<br />生徒情報は<br />連動
          </p>
        </div>

        <SoftCard className="min-h-[210px] p-3">
          <SectionTitle icon={ClipboardList} title="レッスンカルテ" action="最新の記録" />
          <div className="rounded-xl border border-[#eee4d8] bg-white/65 px-3 py-1.5">
            {[
              ["クラス名", "ベーシックフロー"],
              ["日時", "2025/5/20（火）10:00-11:00（60分）"],
              ["場所", "スタジオA"],
              ["実施内容", "太陽礼拝 / 立位 / ツイスト / 前屈"],
              ["生徒の様子", "集中度が高く、呼吸と動きがつながっていた。"],
              ["改善案", "後半の呼吸ガイドを少し長めにする。"],
            ].map(([label, value]) => (
              <div key={label} className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] border-b border-[#eee8dd] py-1 last:border-b-0">
                <span className="whitespace-nowrap text-[12px] font-bold text-[#8b704c]">{label}</span>
                <span className="min-w-0 text-[12px] font-medium leading-5 text-[#3f433d]">{value}</span>
              </div>
            ))}
          </div>
          <Link href="/lessons" className="mt-2 flex justify-end text-[12px] font-bold text-[#8b704c]">
            詳細を見る <ChevronRight className="h-4 w-4" />
          </Link>
        </SoftCard>
      </section>

      <SoftCard className="mt-3 p-3.5">
        <SectionTitle icon={Link2} title="生徒とレッスンの紐づき" subtitle="（最近の記録）" action="すべて見る" />
        <Table>
          <TableHeader>
            <TableRow className="border-[#e8dfd4]">
              <TableHead className="h-8 text-[12px]">生徒名</TableHead>
              <TableHead className="h-8 text-[12px]">参加レッスン</TableHead>
              <TableHead className="h-8 text-[12px]">日時</TableHead>
              <TableHead className="h-8 text-[12px]">メモ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linkedRows.map((row) => (
              <TableRow key={row[0]} className="soft-table-row">
                {row.map((cell) => (
                  <TableCell key={cell}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SoftCard>

      <section className="mt-3 grid grid-cols-3 gap-4 pb-2">
        <SoftCard className="p-3.5">
          <SectionTitle icon={NotebookText} title="最近の記録" action="もっと見る" />
          <div className="grid grid-cols-3 gap-2">
            {[
              ["延べ数", "256", "名", "+18%"],
              ["新規予約", "12", "名", "+20%"],
              ["体験申込", "7", "名", "+16%"],
            ].map(([label, value, unit, diff]) => (
              <div key={label} className="rounded-lg border border-[#e8dfd4] bg-[#fffdf9] p-2 text-center">
                <p className="text-[11px] font-bold text-[#77746c]">{label}</p>
                <p className="mt-1 text-2xl font-extrabold text-[#4f875a]">
                  {value}<span className="ml-1 text-[11px]">{unit}</span>
                </p>
                <p className="mt-1 text-[11px] font-bold text-[#4f875a]">前月比 {diff}</p>
              </div>
            ))}
          </div>
        </SoftCard>

        <SoftCard className="p-3.5">
          <SectionTitle icon={UsersRound} title="要フォロー生徒" action="もっと見る" />
          <div className="space-y-2">
            {["山本 香織 さん　2週間未参加", "高橋 里奈 さん　腰の違和感あり"].map((text) => (
              <div key={text} className="flex items-center justify-between gap-2 rounded-lg border border-[#e8dfd4] bg-white/70 p-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf3e8] text-[#4f875a]">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <p className="min-w-0 truncate text-[12px] font-bold">{text}</p>
                </div>
                <Button variant="outline" className="h-7 shrink-0 rounded-lg border-[#f0c7b4] bg-[#fff3ec] px-2 text-[12px] text-[#e46b50]">
                  フォロー
                </Button>
              </div>
            ))}
          </div>
        </SoftCard>

        <SoftCard className="p-3.5">
          <SectionTitle icon={TrendingUp} title="今月の傾向" action="もっと見る" />
          <div className="space-y-2 rounded-lg border border-[#e8dfd4] bg-white/70 p-2.5">
            {["平日午前の参加が増加傾向", "リラックス系の満足度が高い", "体験申込が多い曜日：火・木・土"].map((text) => (
              <div key={text} className="flex items-center gap-2 text-[12px] font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#629268]" />
                {text}
              </div>
            ))}
          </div>
        </SoftCard>
      </section>
    </>
  );
}
