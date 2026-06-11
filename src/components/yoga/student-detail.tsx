import Link from "next/link";
import {
  ArrowDownUp,
  BarChart3,
  CheckCircle2,
  Dumbbell,
  HeartHandshake,
  NotebookPen,
  Target,
  UserRound,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MiniBar, PageHeader, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { lessons } from "@/components/yoga/records";
import type { StudentRecord } from "@/components/yoga/records";
import { observationMemos } from "@/components/yoga/records";

const points = [
  "肩甲骨まわりをゆるめるウォームアップを丁寧に",
  "呼吸の質を高める意識づけ（吐く息を長く）",
  "猫背になりやすいので、胸を開くポーズを多めに",
  "後屈は無理のない範囲で、腰の様子を確認しながら",
];

export function StudentDetail({ student }: { student: StudentRecord }) {
  const profileItems = [
    ["ヨガ他経験", student.experience, Dumbbell],
    ["ケガなどの注意点", student.caution, HeartHandshake],
    ["その他メモ", student.memo, NotebookPen],
  ] as const;

  return (
    <>
      <PageHeader title="生徒カルテ詳細" subtitle="生徒一人ひとりの状態・記録を管理" />

      <div className="mb-3 flex justify-end gap-2">
        <Link
          href="/students"
          className="inline-flex h-8 items-center rounded-lg border border-[#d8e3d4] bg-white px-3 text-[13px] font-bold text-[#4f7b58]"
        >
          一覧に戻る
        </Link>
        <Link
          href={`/students/${student.id}/edit`}
          className="inline-flex h-8 items-center rounded-lg bg-[#5d956d] px-4 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(64,113,77,0.2)]"
        >
          編集する
        </Link>
      </div>

      <SoftCard className="p-4">
        <div className="grid grid-cols-[160px_minmax(0,1fr)] gap-5">
          <div className="flex flex-col items-center justify-center">
            <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-[#edf4ea] text-[#4f875a] shadow-inner">
              <UserRound className="h-20 w-20" strokeWidth={1.35} />
            </div>
            <p className="mt-3 text-[13px] font-bold text-[#657064]">{student.age}歳 / 女性</p>
          </div>
          <div className="min-w-0">
            <div className="mb-3 flex items-end gap-4 border-b border-[#ebe3d8] pb-2">
              <h1 className="text-[28px] font-extrabold leading-tight">{student.name}</h1>
              <p className="pb-1 text-[13px] font-semibold">{student.kana}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {profileItems.map(([label, value, Icon]) => (
                <div key={label} className="min-h-[96px] rounded-xl border border-[#eee4d8] bg-white/72 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-[#8b6138]" strokeWidth={1.8} />
                    <span className="text-[13px] font-bold">{label}</span>
                  </div>
                  <p className="text-[13px] font-medium leading-5 text-[#33372f]">{value}</p>
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
            {observationMemos.map(([date, memo]) => (
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
            {points.map((point) => (
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
            {lessons.map((lesson) => (
              <TableRow key={lesson.id} className="soft-table-row">
                <TableCell>{lesson.date}</TableCell>
                <TableCell>{lesson.title}</TableCell>
                <TableCell>{lesson.place}</TableCell>
                <TableCell>{lesson.theme}</TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/lessons/${lesson.id}`}
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
            <p className="mt-2 text-[12px] font-semibold text-[#677064]">月平均。安定して通われています</p>
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
              <p>平日夜<span className="float-right">60%</span></p>
              <p>週末午前<span className="float-right">40%</span></p>
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
