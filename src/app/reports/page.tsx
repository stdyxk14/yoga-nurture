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
  "リラックス系クラスの満足度が高く、継続参加に繋がっています。",
  "平日午前の参加が増加し、安定した習慣化が進んでいます。",
  "肩・首の悩みが全体の約6割を占め、需要が高い領域です。",
  "継続受講者（3回以上）が増加し、リピート率も上昇しています。",
  "姿勢改善テーマのレッスンは評価が高く効果実感も大きい傾向です。",
];

const actions = [
  { num: "1", title: "肩・首ケアの特化クラスを強化し、ニーズに応える", icon: Sprout },
  { num: "2", title: "平日午前クラスの安定開催を維持", icon: CalendarDays },
  { num: "3", title: "要フォロー生徒へ個別メッセージを送信", icon: UsersRound },
  { num: "4", title: "姿勢改善テーマのコンテンツを拡充", icon: Target },
  { num: "5", title: "初夏に向けたデトックス系レッスンを企画", icon: Megaphone },
];

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="レポート" subtitle="蓄積された生徒カルテ・レッスンカルテの記録を、期間ごとにまとめて振り返る" />

      <div className="mb-5 flex items-center justify-between">
        <div className="flex rounded-xl border border-[#e6ded3] bg-white/70 p-1 shadow-[0_8px_18px_rgba(91,76,53,0.05)]">
          {["今週", "今月", "3か月", "半年", "1年", "カスタム"].map((period) => (
            <button
              key={period}
              className={`h-9 min-w-20 rounded-lg px-5 text-sm font-bold ${period === "3か月" ? "bg-[#6e9870] text-white" : "text-[#5b5d57]"}`}
            >
              {period}
            </button>
          ))}
        </div>
        <div className="flex h-12 items-center gap-3 rounded-xl border border-[#e2d7ca] bg-white/75 px-6 text-[16px] font-semibold">
          <CalendarDays className="h-5 w-5" />
          2025/02/21　-　2025/05/20
        </div>
      </div>

      <section className="grid grid-cols-4 gap-5">
        <MetricCard icon={CalendarDays} label="総レッスン数" value="48" unit="回" detail="前期比 +14回（+41.2%）" />
        <MetricCard icon={UsersRound} label="延べ参加人数" value="382" unit="名" detail="前期比 +96名（+33.6%）" />
        <MetricCard icon={UserRound} label="ユニーク生徒数" value="27" unit="名" detail="前期比 +4名（+17.4%）" />
        <MetricCard icon={Repeat2} label="リピート率" value="74" unit="%" tone="purple" detail="前期比 +7pt（+10.4%）" />
      </section>

      <section className="mt-4 grid grid-cols-[1.1fr_1.15fr_1fr_1fr_1fr] gap-4">
        <SoftCard className="bg-[#f4f8ef]">
          <SectionTitle icon={Sprout} title="現在地サマリー" />
          <div className="space-y-3">
            {summary.map((item) => (
              <div key={item} className="flex gap-2 text-[13px] font-medium leading-6">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#6e9870]" />
                {item}
              </div>
            ))}
          </div>
        </SoftCard>

        <SoftCard>
          <SectionTitle title="レッスン数の推移" />
          <div className="h-52">
            <LineChart />
          </div>
        </SoftCard>

        <SoftCard>
          <SectionTitle title="クラス種別の分布" />
          <div className="flex h-52 items-center gap-4">
            <div className="relative h-32 w-32 rounded-full bg-[conic-gradient(#6e9870_0_36%,#a79bd3_36%_64%,#f0b66f_64%_84%,#eb806a_84%_94%,#e7e3d8_94%)]">
              <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white text-center text-xs font-bold">
                総レッスン数<br /><span className="text-xl">48回</span>
              </div>
            </div>
            <div className="space-y-2 text-[12px] font-semibold">
              {[
                ["リラックス系", "36%"],
                ["フロー系", "28%"],
                ["ボディメイク系", "20%"],
                ["リストラティブ", "10%"],
                ["その他", "6%"],
              ].map(([name, value]) => (
                <p key={name}>{name}<span className="float-right ml-4">{value}</span></p>
              ))}
            </div>
          </div>
        </SoftCard>

        <SoftCard>
          <SectionTitle title="曜日別参加人数" />
          <div className="flex h-52 items-end justify-between gap-2 px-1">
            {[40, 58, 46, 54, 68, 72, 52].map((value, index) => (
              <div key={value} className="flex h-full flex-1 flex-col justify-end text-center">
                <span className="mb-1 text-[12px] font-bold">{value}</span>
                <div className="mx-auto w-8 rounded-t-md bg-[#7f9a73]" style={{ height: `${value * 1.7}px` }} />
                <span className="mt-2 text-[12px] font-bold">{"月火水木金土日"[index]}</span>
              </div>
            ))}
          </div>
        </SoftCard>

        <SoftCard>
          <SectionTitle title="時間帯別参加人数" />
          <div className="space-y-3 pt-2">
            {[
              ["6-8時", 22],
              ["8-10時", 114],
              ["10-12時", 96],
              ["12-14時", 38],
              ["14-16時", 42],
              ["16-18時", 48],
              ["18-20時", 22],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[58px_1fr_34px] items-center gap-2 text-[12px] font-bold">
                <span>{label}</span>
                <MiniBar value={Number(value) / 1.4} tone="purple" />
                <span>{value}</span>
              </div>
            ))}
          </div>
        </SoftCard>
      </section>

      <SoftCard className="mt-4">
        <SectionTitle icon={ClipboardList} title="生徒カルテ × レッスンカルテ集計" subtitle="生徒情報とレッスン記録を組み合わせた総合データ" />
        <div className="grid grid-cols-5 gap-3">
          <MiniTable
            title="よく受講している生徒 TOP3"
            rows={[
              ["佐藤 里美", "22回"],
              ["田中 美咲", "18回"],
              ["山本 結衣", "15回"],
            ]}
          />
          <MiniTable
            title="要フォロー生徒"
            rows={[
              ["鈴木 花子", "45日未参加"],
              ["高橋 優子", "38日未参加"],
              ["渡辺 京々", "26日未参加"],
            ]}
          />
          <MiniTable
            title="よく使うレッスンテーマ TOP5"
            rows={[
              ["肩こりリリース", "9回 / 4.7"],
              ["リラックス＆呼吸", "8回 / 4.8"],
              ["姿勢改善", "7回 / 4.6"],
            ]}
          />
          <MiniTable
            title="効果が高いレッスン傾向"
            rows={[
              ["リラックス系", "4.7 / 78%"],
              ["姿勢改善系", "4.6 / 74%"],
              ["フロー系", "4.5 / 71%"],
            ]}
          />
          <MiniTable
            title="最近増えている悩み"
            rows={[
              ["肩こり", "+18%"],
              ["首のこり", "+14%"],
              ["姿勢の歪み", "+12%"],
            ]}
          />
        </div>
      </SoftCard>

      <SoftCard className="mt-4">
        <SectionTitle icon={Target} title="次の改善アクション" />
        <div className="grid grid-cols-5 gap-4">
          {actions.map(({ num, title, icon: Icon }) => (
            <div key={num} className="border-r border-dashed border-[#d9d1c6] pr-3 last:border-r-0">
              <CircleBadge>{num}</CircleBadge>
              <p className="mt-3 min-h-[52px] text-[14px] font-bold leading-6">{title}</p>
              <Icon className="mt-3 h-9 w-9 text-[#8d8b72]" strokeWidth={1.5} />
            </div>
          ))}
        </div>
      </SoftCard>
    </>
  );
}

function MiniTable({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="rounded-xl border border-[#eee3d7] bg-white/70 p-3">
      <p className="mb-2 text-center text-[13px] font-bold">{title}</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-7 text-[11px]">項目</TableHead>
            <TableHead className="h-7 text-right text-[11px]">値</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([a, b]) => (
            <TableRow key={a} className="soft-table-row">
              <TableCell>{a}</TableCell>
              <TableCell className="text-right">{b}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LineChart() {
  return (
    <svg viewBox="0 0 320 190" className="h-full w-full" role="img" aria-label="レッスン数と参加人数の推移">
      {[30, 70, 110, 150].map((y) => (
        <line key={y} x1="30" x2="300" y1={y} y2={y} stroke="#e8e1d7" />
      ))}
      <polyline points="36,150 110,128 188,92 280,74" fill="none" stroke="#6e9870" strokeWidth="5" strokeLinecap="round" />
      <polyline points="36,128 110,98 188,70 280,28" fill="none" stroke="#a79bd3" strokeWidth="5" strokeLinecap="round" />
      {["2月", "3月", "4月", "5月"].map((month, i) => (
        <text key={month} x={36 + i * 78} y="180" fontSize="14" fontWeight="700" fill="#565b53">{month}</text>
      ))}
      <circle cx="280" cy="74" r="5" fill="#6e9870" />
      <circle cx="280" cy="28" r="5" fill="#a79bd3" />
    </svg>
  );
}
