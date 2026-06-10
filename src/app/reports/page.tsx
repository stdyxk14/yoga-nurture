import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Megaphone,
  Repeat2,
  Sprout,
  Target,
  UserRound,
  UsersRound,
} from "lucide-react";
import { PageHeader, CircleBadge, MetricCard, MiniBar, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const summary = [
  "リラックス系の満足度が高く、継続参加につながっています。",
  "平日午前の参加が増加し、習慣化が進んでいます。",
  "肩・首の悩みが多く、ケア系クラスの需要が高いです。",
  "姿勢改善テーマは評価が高く、シリーズ化に向いています。",
];

const actions = [
  { num: "1", title: "肩・首ケア特化クラスを強化", icon: Sprout },
  { num: "2", title: "平日午前クラスを維持", icon: CalendarDays },
  { num: "3", title: "要フォロー生徒へ連絡", icon: UsersRound },
  { num: "4", title: "姿勢改善テーマを拡充", icon: Target },
  { num: "5", title: "初夏向けクラスを企画", icon: Megaphone },
];

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="レポート" subtitle="生徒カルテ・レッスンカルテの記録を期間ごとに振り返る" />

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex rounded-xl border border-[#e6ded3] bg-white/70 p-1 shadow-[0_8px_18px_rgba(91,76,53,0.05)]">
          {["今週", "今月", "3か月", "半年", "1年", "カスタム"].map((period) => (
            <button
              key={period}
              className={`h-8 min-w-16 rounded-lg px-3 text-[12px] font-bold ${period === "3か月" ? "bg-[#6e9870] text-white" : "text-[#5b5d57]"}`}
            >
              {period}
            </button>
          ))}
        </div>
        <div className="flex h-10 items-center gap-2 rounded-xl border border-[#e2d7ca] bg-white/75 px-4 text-[13px] font-semibold">
          <CalendarDays className="h-4 w-4" />
          2025/02/21 - 2025/05/20
        </div>
      </div>

      <section className="grid grid-cols-4 gap-3">
        <MetricCard icon={CalendarDays} label="総レッスン数" value="48" unit="回" detail="前期比 +41.2%" />
        <MetricCard icon={UsersRound} label="延べ参加人数" value="382" unit="名" detail="前期比 +33.6%" />
        <MetricCard icon={UserRound} label="ユニーク生徒数" value="27" unit="名" detail="前期比 +17.4%" />
        <MetricCard icon={Repeat2} label="リピート率" value="74" unit="%" tone="purple" detail="前期比 +10.4%" />
      </section>

      <section className="mt-3 grid grid-cols-[210px_minmax(0,1fr)] gap-3">
        <SoftCard className="bg-[#f4f8ef] p-3.5">
          <SectionTitle icon={Sprout} title="現在地サマリー" />
          <div className="space-y-2">
            {summary.map((item) => (
              <div key={item} className="flex gap-2 text-[12px] font-medium leading-5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#6e9870]" />
                {item}
              </div>
            ))}
          </div>
        </SoftCard>

        <div className="grid min-w-0 grid-cols-2 gap-3">
          <SoftCard className="min-w-[220px] p-3.5">
            <SectionTitle title="レッスン数の推移" />
            <div className="h-[172px]">
              <LineChart />
            </div>
          </SoftCard>

          <SoftCard className="min-w-[220px] p-3.5">
            <SectionTitle title="クラス種別の分布" />
            <div className="grid h-[172px] grid-cols-[132px_minmax(0,1fr)] items-center gap-3">
              <div className="relative h-32 w-32 rounded-full bg-[conic-gradient(#6e9870_0_36%,#a79bd3_36%_64%,#f0b66f_64%_84%,#eb806a_84%_94%,#e7e3d8_94%)]">
                <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white text-center text-[11px] font-bold">
                  総数<br /><span className="text-lg">48回</span>
                </div>
              </div>
              <div className="grid min-w-0 grid-cols-1 gap-1 text-[11px] font-semibold">
                {[
                  ["リラックス系", "36%"],
                  ["フロー系", "28%"],
                  ["ボディメイク", "20%"],
                  ["リストラティブ", "10%"],
                  ["その他", "6%"],
                ].map(([name, value]) => (
                  <div key={name} className="flex min-w-0 justify-between gap-2 whitespace-nowrap">
                    <span className="truncate">{name}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </SoftCard>

          <SoftCard className="min-w-[220px] p-3.5">
            <SectionTitle title="曜日別参加人数" />
            <div className="flex h-[172px] items-end justify-between gap-2 px-1">
              {[40, 58, 46, 54, 68, 72, 52].map((value, index) => (
                <div key={`${value}-${index}`} className="flex h-full flex-1 flex-col justify-end text-center">
                  <span className="mb-1 text-[11px] font-bold">{value}</span>
                  <div className="mx-auto w-full max-w-7 rounded-t-md bg-[#7f9a73]" style={{ height: `${value * 1.35}px` }} />
                  <span className="mt-1 text-[11px] font-bold">{"月火水木金土日"[index]}</span>
                </div>
              ))}
            </div>
          </SoftCard>

          <SoftCard className="min-w-[220px] p-3.5">
            <SectionTitle title="時間帯別参加人数" />
            <div className="space-y-2 pt-1">
              {[
                ["6-8時", 22],
                ["8-10時", 114],
                ["10-12時", 96],
                ["12-14時", 38],
                ["14-16時", 42],
                ["16-18時", 48],
                ["18-20時", 22],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[52px_minmax(0,1fr)_30px] items-center gap-2 text-[11px] font-bold">
                  <span className="whitespace-nowrap">{label}</span>
                  <MiniBar value={Number(value) / 1.2} tone="purple" />
                  <span className="text-right">{value}</span>
                </div>
              ))}
            </div>
          </SoftCard>
        </div>
      </section>

      <SoftCard className="mt-3 p-3.5">
        <SectionTitle icon={ClipboardList} title="生徒カルテ × レッスンカルテ集計" subtitle="生徒情報とレッスン記録の総合データ" />
        <div className="grid grid-cols-5 gap-2">
          <MiniTable title="受講生 TOP3" rows={[["佐藤 里美", "22回"], ["田中 美咲", "18回"], ["山本 結衣", "15回"]]} />
          <MiniTable title="要フォロー" rows={[["鈴木 花子", "45日未参加"], ["高橋 優子", "38日未参加"], ["渡辺 京々", "26日未参加"]]} />
          <MiniTable title="テーマ TOP5" rows={[["肩こりリリース", "9回 / 4.7"], ["リラックス＆呼吸", "8回 / 4.8"], ["姿勢改善", "7回 / 4.6"]]} />
          <MiniTable title="効果が高い傾向" rows={[["リラックス系", "4.7 / 78%"], ["姿勢改善系", "4.6 / 74%"], ["フロー系", "4.5 / 71%"]]} />
          <MiniTable title="増えている悩み" rows={[["肩こり", "+18%"], ["首のこり", "+14%"], ["姿勢の歪み", "+12%"]]} />
        </div>
      </SoftCard>

      <SoftCard className="mt-3 p-3.5">
        <SectionTitle icon={Target} title="次の改善アクション" />
        <div className="grid grid-cols-5 gap-3">
          {actions.map(({ num, title, icon: Icon }) => (
            <div key={num} className="border-r border-dashed border-[#d9d1c6] pr-3 last:border-r-0">
              <CircleBadge className="h-7 w-7 text-[12px]">{num}</CircleBadge>
              <p className="mt-2 min-h-10 text-[12px] font-bold leading-5">{title}</p>
              <Icon className="mt-2 h-7 w-7 text-[#8d8b72]" strokeWidth={1.5} />
            </div>
          ))}
        </div>
      </SoftCard>
    </>
  );
}

function MiniTable({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="min-w-0 rounded-lg border border-[#eee3d7] bg-white/70 p-2">
      <p className="mb-1 truncate text-center text-[12px] font-bold">{title}</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-6 text-[10px]">項目</TableHead>
            <TableHead className="h-6 text-right text-[10px]">値</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([a, b]) => (
            <TableRow key={a} className="soft-table-row">
              <TableCell className="truncate">{a}</TableCell>
              <TableCell className="whitespace-nowrap text-right">{b}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LineChart() {
  return (
    <svg viewBox="0 0 320 172" className="h-full w-full" role="img" aria-label="レッスン数と参加人数の推移">
      {[28, 66, 104, 142].map((y) => (
        <line key={y} x1="30" x2="300" y1={y} y2={y} stroke="#e8e1d7" />
      ))}
      <polyline points="36,136 110,116 188,84 280,66" fill="none" stroke="#6e9870" strokeWidth="5" strokeLinecap="round" />
      <polyline points="36,112 110,84 188,62 280,28" fill="none" stroke="#a79bd3" strokeWidth="5" strokeLinecap="round" />
      {["2月", "3月", "4月", "5月"].map((month, i) => (
        <text key={month} x={36 + i * 78} y="164" fontSize="12" fontWeight="700" fill="#565b53">{month}</text>
      ))}
      <circle cx="280" cy="66" r="5" fill="#6e9870" />
      <circle cx="280" cy="28" r="5" fill="#a79bd3" />
    </svg>
  );
}
