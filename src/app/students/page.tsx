import Link from "next/link";
import {
  ArrowDownUp,
  BarChart3,
  CheckCircle2,
  Dumbbell,
  HeartHandshake,
  NotebookPen,
  Sparkles,
  Star,
  Target,
  UserRound,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, SectionTitle, SoftCard, MiniBar } from "@/components/yoga/page-kit";
import { lessonHistory } from "@/components/yoga/data";

const profileItems = [
  ["ヨガ経験", "約3年", Dumbbell],
  ["主な目標", "肩こり改善・姿勢改善", Target],
  ["注意事項", "膝に違和感あり（無理な後屈は避ける）", HeartHandshake],
  ["性格・傾向", "真面目で努力家。変化を実感するとモチベーションUP", Sparkles],
  ["好みのスタイル", "呼吸を重視したゆったりフロー・陰ヨガ", Star],
  ["現在の課題", "肩のこり・呼吸が浅くなりやすい・姿勢の崩れ", CheckCircle2],
] as const;

const observation = [
  ["2025/5/18", "肩まわりの緊張が緩減。呼吸が深まり、表情も柔らかく。ダウンドッグの安定感UP。"],
  ["2025/5/11", "長時間デスクワーク後のレッスン。肩・首のこり強め。胸を開くポーズで呼吸が深まる。"],
  ["2025/5/04", "姿勢改善を意識して取り組めていた。プランクで体幹の安定感が向上。"],
  ["2025/4/27", "久しぶりの受講。体が硬くなっていたが、終盤はリラックスして動けていた。"],
];

export default function StudentsPage() {
  return (
    <>
      <PageHeader title="生徒カルテ" subtitle="生徒一人ひとりの状態・目的・受講履歴を管理" />

      <SoftCard className="p-6">
        <div className="grid grid-cols-[210px_1fr] gap-7">
          <div className="flex flex-col items-center">
            <div className="flex h-44 w-44 items-center justify-center rounded-2xl bg-[#edf4ea] text-[#4f875a] shadow-inner">
              <UserRound className="h-24 w-24" strokeWidth={1.35} />
            </div>
          </div>
          <div>
            <div className="mb-4 flex items-end gap-4 border-b border-[#ebe3d8] pb-3">
              <h1 className="text-[32px] font-extrabold">佐藤 美咲</h1>
              <p className="pb-1 text-sm font-semibold">さとう みさき　・　35歳</p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {profileItems.map(([label, value, Icon]) => (
                <div key={label} className="grid min-h-[56px] grid-cols-[34px_96px_1fr] items-start border-b border-[#eee8dd] pb-3">
                  <Icon className="mt-1 h-5 w-5 text-[#8b6138]" strokeWidth={1.8} />
                  <span className="text-[14px] font-bold">{label}</span>
                  <span className="text-[14px] font-medium leading-6">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SoftCard>

      <section className="mt-4 grid grid-cols-[1.15fr_1fr] gap-4">
        <SoftCard>
          <SectionTitle icon={NotebookPen} title="最近の変化・観察メモ" action="もっと見る" />
          <div className="relative space-y-0 pl-5">
            <div className="absolute left-[8px] top-2 h-[calc(100%-16px)] w-px bg-[#d9cab8]" />
            {observation.map(([date, memo]) => (
              <div key={date} className="relative grid grid-cols-[96px_1fr] gap-4 border-b border-[#eee8dd] py-3 last:border-b-0">
                <span className="absolute -left-[18px] top-5 h-2.5 w-2.5 rounded-full bg-[#d8c7ae]" />
                <span className="text-[13px] font-bold">{date}</span>
                <p className="text-[13px] font-medium leading-6">{memo}</p>
              </div>
            ))}
          </div>
        </SoftCard>

        <SoftCard>
          <SectionTitle icon={Target} title="次回レッスンに向けたポイント" />
          <div className="space-y-3">
            {[
              "肩甲骨まわりをゆるめるウォームアップを丁寧に",
              "呼吸の質を高める意識づけ（吐く息を長く）",
              "猫背になりやすいので、胸を開くポーズを多めに",
              "後屈は無理のない範囲で。腰の様子を確認しながら",
            ].map((point) => (
              <div key={point} className="flex items-start gap-2 text-[14px] font-medium">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#629268]" />
                {point}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-full bg-[#edf5ef] px-4 py-2 text-center text-sm font-bold text-[#5d8e67]">
            おすすめクラス：リラックスフロー / 陰ヨガ
          </div>
        </SoftCard>
      </section>

      <SoftCard className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <SectionTitle icon={ArrowDownUp} title="紐づくレッスン履歴" subtitle="この生徒が受講したレッスンカルテと連携しています" />
          <Link href="/lessons" className="text-[13px] font-bold text-[#5d956d]">レッスンカルテ一覧へ</Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日付</TableHead>
              <TableHead>レッスン名</TableHead>
              <TableHead>場所</TableHead>
              <TableHead>レッスン概要</TableHead>
              <TableHead className="text-right">導線</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessonHistory.map(([date, lesson, place, memo]) => (
              <TableRow key={date} className="soft-table-row">
                <TableCell>{date}</TableCell>
                <TableCell>{lesson}</TableCell>
                <TableCell>{place}</TableCell>
                <TableCell>{memo}</TableCell>
                <TableCell className="text-right">
                  <Link
                    href="/lessons"
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-3 text-[13px] font-bold text-[#5d956d]"
                  >
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
            <p className="mt-2 text-[12px] font-semibold text-[#677064]">月平均・安定して通われています</p>
          </div>
          <div className="border-r border-[#eee3d7] pr-4">
            <p className="mb-3 text-sm font-bold">よく受けるクラス</p>
            {[
              ["リラックス系", 60],
              ["ベーシックフロー", 30],
              ["陰ヨガ・リストラティブ", 10],
            ].map(([label, value]) => (
              <div key={label} className="mb-3 grid grid-cols-[120px_1fr_36px] items-center gap-2 text-[12px] font-semibold">
                <span>{label}</span>
                <MiniBar value={Number(value)} />
                <span>{value}%</span>
              </div>
            ))}
          </div>
          <div className="border-r border-[#eee3d7] pr-4">
            <p className="mb-4 text-sm font-bold">時間帯の傾向</p>
            <div className="space-y-4 text-[13px] font-semibold">
              <p>平日夜　<span className="float-right">60%</span></p>
              <p>週末午前　<span className="float-right">40%</span></p>
            </div>
          </div>
          <div className="border-r border-[#eee3d7] pr-4">
            <p className="mb-3 text-sm font-bold">反応・傾向</p>
            <p className="text-[13px] font-medium leading-6">呼吸の意識で変化が出やすいタイプ。フィードバックに対して素直で、継続的に改善が見られます。</p>
          </div>
          <div>
            <p className="mb-3 text-sm font-bold">次のおすすめフォーカス</p>
            <p className="text-[13px] font-medium leading-6">肩甲骨の可動域UP<br />体幹の安定性をさらに強化</p>
          </div>
        </div>
      </SoftCard>
    </>
  );
}
