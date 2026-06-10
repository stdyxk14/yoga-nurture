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
import { recentRecords } from "@/components/yoga/data";

const linkedRows = [
  ["佐藤 美咲 さん", "ベーシックフロー（スタジオA）", "2025/5/20（火）10:00-", "立ちポーズで安定感UP。呼吸が深まり笑顔も多かった。"],
  ["鈴木 陽菜 さん", "リラックスヨガ（スタジオB）", "2025/5/19（月）13:30-", "肩の緊張が和らぎ、リラックスの深さが向上。"],
  ["田中 優子 さん", "陰ヨガ（オンライン）", "2025/5/18（日）18:30-", "股関節の詰まりが軽減。睡眠の質が良くなったと報告。"],
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        greeting="おはようございます！"
        title="今日も素敵なレッスンで、生徒さんの心と体を整えましょう。"
      />

      <section className="grid grid-cols-3 gap-5">
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

      <section className="mt-4 grid grid-cols-[1fr_120px_1fr] gap-5">
        <SoftCard>
          <SectionTitle icon={UserRound} title="生徒カルテ" />
          <div className="grid grid-cols-[130px_1fr] gap-4">
            <div className="flex flex-col items-center justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#e7f0e3] text-[#4b865b]">
                <UserRound className="h-14 w-14" strokeWidth={1.4} />
              </div>
              <p className="mt-4 text-lg font-bold">佐藤 美咲 さん</p>
              <p className="text-sm font-semibold text-[#626960]">35歳 / 女性</p>
            </div>
            <div className="space-y-2 rounded-xl border border-[#eee4d8] bg-white/60 p-3">
              {[
                ["目標", "姿勢改善・肩こり解消・柔軟性アップ"],
                ["注意事項", "膝に違和感あり（無理な深屈曲は避ける）"],
                ["性格・傾向", "真面目で努力家。変化を実感するとモチベーションが上がりやすい。"],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[86px_1fr] border-b border-[#eee8dd] pb-2 last:border-b-0 last:pb-0">
                  <span className="text-[13px] font-bold text-[#5d956d]">{label}</span>
                  <span className="text-[13px] font-medium leading-6">{value}</span>
                </div>
              ))}
              <div className="rounded-lg bg-[#fbfaf6] p-3">
                <p className="text-[13px] font-bold text-[#5d956d]">最近の記録・メモ</p>
                <ul className="mt-1 space-y-1 text-[12px] font-medium leading-5">
                  {recentRecords.map(([date, note]) => (
                    <li key={date}>
                      <span className="font-bold">{date}</span>　{note}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <Link href="/students" className="mt-3 flex justify-end text-[13px] font-bold text-[#5d956d]">
            生徒カルテの詳細を見る <ChevronRight className="h-4 w-4" />
          </Link>
        </SoftCard>

        <div className="flex flex-col items-center justify-center text-[#4f8658]">
          <div className="flex items-center gap-2">
            <ChevronRight className="h-9 w-9 rotate-180" />
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#6b9b72] bg-[#f4faf2]">
              <Link2 className="h-8 w-8" />
            </div>
            <ChevronRight className="h-9 w-9" />
          </div>
          <p className="mt-3 text-center text-[14px] font-bold leading-6">レッスンと<br />生徒情報は<br />連動しています</p>
        </div>

        <SoftCard>
          <SectionTitle icon={ClipboardList} title="レッスンカルテ" action="最新の記録" />
          <div className="rounded-xl border border-[#eee4d8] bg-white/60 p-3">
            {[
              ["クラス名", "ベーシックフロー"],
              ["日時", "2025/5/20（火）10:00-11:00（60分）"],
              ["場所", "スタジオA"],
              ["実施内容", "太陽礼拝A-C / 立ちポーズ / ツイスト / 前屈 / クールダウン"],
              ["生徒の様子", "全体的に集中度が高く、呼吸と動きがつながっていた。"],
              ["次回の改善案", "後半の呼吸ガイドをもう少し長めにする。"],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[96px_1fr] border-b border-[#eee8dd] py-2 first:pt-0 last:border-b-0 last:pb-0">
                <span className="text-[13px] font-bold text-[#8b704c]">{label}</span>
                <span className="text-[13px] font-medium leading-6">{value}</span>
              </div>
            ))}
          </div>
          <Link href="/lessons" className="mt-3 flex justify-end text-[13px] font-bold text-[#8b704c]">
            レッスンカルテの詳細を見る <ChevronRight className="h-4 w-4" />
          </Link>
        </SoftCard>
      </section>

      <SoftCard className="mt-4">
        <SectionTitle icon={Link2} title="生徒とレッスンの紐づき" subtitle="（最近の記録）" action="すべての紐づき記録を見る" />
        <Table>
          <TableHeader>
            <TableRow className="border-[#e8dfd4]">
              <TableHead>生徒名</TableHead>
              <TableHead>参加レッスン</TableHead>
              <TableHead>日時</TableHead>
              <TableHead>メモ</TableHead>
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

      <section className="mt-4 grid grid-cols-3 gap-5 pb-2">
        <SoftCard>
          <SectionTitle icon={NotebookText} title="最近の記録" action="もっと見る" />
          <div className="grid grid-cols-3 gap-3">
            {[
              ["受講生の延べ数", "256", "名", "+18%"],
              ["新規予約", "12", "名", "+20%"],
              ["体験申込", "7", "名", "+16%"],
            ].map(([label, value, unit, diff]) => (
              <div key={label} className="rounded-xl border border-[#e8dfd4] bg-[#fffdf9] p-3 text-center">
                <p className="text-[12px] font-bold text-[#77746c]">{label}</p>
                <p className="mt-2 text-3xl font-extrabold text-[#4f875a]">{value}<span className="ml-1 text-xs">{unit}</span></p>
                <p className="mt-2 text-[12px] font-bold text-[#4f875a]">前月比 {diff}</p>
              </div>
            ))}
          </div>
        </SoftCard>

        <SoftCard>
          <SectionTitle icon={UsersRound} title="要フォロー生徒" action="もっと見る" />
          <div className="space-y-3">
            {["山本 香織 さん　2週間レッスン未参加", "高橋 里奈 さん　腰の違和感あり"].map((text) => (
              <div key={text} className="flex items-center justify-between rounded-xl border border-[#e8dfd4] bg-white/70 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf3e8] text-[#4f875a]">
                    <UserRound className="h-6 w-6" />
                  </div>
                  <p className="text-[13px] font-bold">{text}</p>
                </div>
                <Button variant="outline" className="h-8 rounded-lg border-[#f0c7b4] bg-[#fff3ec] text-[#e46b50]">フォローする</Button>
              </div>
            ))}
          </div>
        </SoftCard>

        <SoftCard>
          <SectionTitle icon={TrendingUp} title="今月の傾向" action="もっと見る" />
          <div className="space-y-3 rounded-xl border border-[#e8dfd4] bg-white/70 p-3">
            {["平日午前のレッスン参加が増加傾向です", "リラックス系レッスンの満足度が高いです", "体験申込の多い曜日：火・木・土"].map((text) => (
              <div key={text} className="flex items-center gap-2 text-[13px] font-semibold">
                <CheckCircle2 className="h-4 w-4 text-[#629268]" />
                {text}
              </div>
            ))}
          </div>
        </SoftCard>
      </section>
    </>
  );
}
