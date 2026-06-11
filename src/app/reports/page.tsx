import { BarChart3, CalendarDays, ClipboardList, PieChart, Repeat2, SlidersHorizontal, UsersRound } from "lucide-react";
import { PageHeader, CircleBadge, MetricCard, MiniBar, SectionTitle, SoftCard } from "@/components/yoga/page-kit";

const genderRows = [["女性", 78], ["男性", 14], ["その他/回答しない", 8]];
const ageRows = [["20代", 18], ["30代", 36], ["40代", 26], ["50代以上", 20]];
const blockRows = [
  ["シャヴァーサナ", "24回", "4.9", "反応が良い"],
  ["完全呼吸法", "21回", "4.8", "反応が良い"],
  ["ハラアーサナ", "5回", "4.1", "改善メモ多い"],
  ["スーリャナマスカーラA", "9回", "4.3", "最近少なめ"],
];

export default function ReportsPage() {
  return (
    <>
      <div className="md:hidden">
        <MobileReports />
      </div>

      <div className="hidden md:block">
        <PageHeader title="レポート" subtitle="生徒属性・出席状況・ブロック評価を振り返る" />

        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex rounded-xl border border-[#e6ded3] bg-white/70 p-1">
            {["今週", "今月", "3か月", "半年", "1年", "カスタム"].map((period) => (
              <button key={period} className={`h-8 min-w-16 rounded-lg px-3 text-[12px] font-bold ${period === "3か月" ? "bg-[#6e9870] text-white" : "text-[#5b5d57]"}`}>{period}</button>
            ))}
          </div>
          <div className="flex h-10 items-center gap-2 rounded-xl border border-[#e2d7ca] bg-white/75 px-4 text-[13px] font-semibold">
            <CalendarDays className="h-4 w-4" />2025/02/21 - 2025/05/20
          </div>
        </div>

        <section className="grid grid-cols-4 gap-3">
          <MetricCard icon={CalendarDays} label="総レッスン数" value="48" unit="回" detail="前期比 +41.2%" />
          <MetricCard icon={UsersRound} label="延べ参加人数" value="382" unit="名" detail="キャンセル率 8.4%" />
          <MetricCard icon={Repeat2} label="リピート率" value="74" unit="%" tone="purple" detail="継続参加が増加" />
          <MetricCard icon={ClipboardList} label="ブロック登録数" value="128" unit="個" tone="beige" detail="未使用 16個" />
        </section>

        <section className="mt-3 grid grid-cols-[240px_minmax(0,1fr)] gap-3">
          <SoftCard className="p-3.5">
            <SectionTitle icon={PieChart} title="生徒属性サマリー" />
            <AttributeBars title="男女比率" rows={genderRows as [string, number][]} />
            <div className="mt-4">
              <AttributeBars title="年代比率" rows={ageRows as [string, number][]} tone="purple" />
            </div>
          </SoftCard>

          <div className="grid grid-cols-2 gap-3">
            <SoftCard className="p-3.5">
              <SectionTitle title="クラス種別ごとの男女比率" />
              <ClassMix rows={[["ベーシックフロー", "女性 76% / 男性 18%"], ["リラックスヨガ", "女性 88% / 男性 6%"], ["オンライン", "女性 64% / 男性 24%"]]} />
            </SoftCard>
            <SoftCard className="p-3.5">
              <SectionTitle title="クラス種別ごとの年代比率" />
              <ClassMix rows={[["ベーシックフロー", "30代 42% / 40代 28%"], ["陰ヨガ", "40代 34% / 50代 38%"], ["肩こり改善", "30代 32% / 40代 36%"]]} />
            </SoftCard>
            <SoftCard className="p-3.5">
              <SectionTitle title="レッスンごとの参加者属性" />
              <ClassMix rows={[["基礎バランスフロー", "30半ば女性が中心 / 男性1名"], ["リラックスヨガ", "40代女性が中心"], ["陰ヨガ", "50代以上の比率が高い"]]} />
            </SoftCard>
            <SoftCard className="p-3.5">
              <SectionTitle title="出席・キャンセル" />
              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniNumber label="出席率" value="87%" />
                <MiniNumber label="キャンセル率" value="8%" tone="coral" />
                <MiniNumber label="無断欠席" value="5%" tone="purple" />
              </div>
            </SoftCard>
          </div>
        </section>

        <SoftCard className="mt-3 p-3.5">
          <SectionTitle icon={BarChart3} title="ブロック分析" subtitle="使用回数・反応・改善メモから次回プランへ活かす" />
          <div className="grid grid-cols-4 gap-3">
            {blockRows.map(([name, usage, rating, note]) => (
              <div key={name} className="rounded-xl border border-[#eee4d8] bg-white/70 p-3">
                <p className="text-[14px] font-extrabold">{name}</p>
                <p className="mt-2 text-[12px] font-bold text-[#5d956d]">使用回数：{usage}</p>
                <p className="text-[12px] font-bold text-[#7469bf]">平均評価：{rating}</p>
                <p className="mt-2 rounded-lg bg-[#fff7e8] px-2 py-1 text-[11px] font-bold text-[#9b7338]">{note}</p>
              </div>
            ))}
          </div>
        </SoftCard>

        <SoftCard className="mt-3 p-3.5">
          <SectionTitle icon={SlidersHorizontal} title="次の改善アクション" />
          <div className="grid grid-cols-5 gap-3">
            {["完全呼吸法を導入候補に固定", "ハラアーサナの注意文を見直す", "未使用ブロックを棚卸し", "肩こり改善系を増やす", "キャンセル理由を記録"].map((title, index) => (
              <div key={title} className="border-r border-dashed border-[#d9d1c6] pr-3 last:border-r-0">
                <CircleBadge className="h-7 w-7 text-[12px]">{index + 1}</CircleBadge>
                <p className="mt-2 min-h-10 text-[12px] font-bold leading-5">{title}</p>
              </div>
            ))}
          </div>
        </SoftCard>
      </div>
    </>
  );
}

function MobileReports() {
  const periods = ["今週", "今月", "3か月", "半年", "1年", "カスタム"];
  const summaries = [
    ["総レッスン数", "48回", "3か月"],
    ["延べ参加人数", "382名", "キャンセル率 8.4%"],
    ["リピート率", "74%", "継続参加が増加"],
    ["ブロック数", "128個", "未使用 16個"],
  ];
  const classCards = [
    ["ベーシックフロー", "女性 76% / 男性 18%", "30代 42%・40代 28%", "参加 112名", "基礎と呼吸の組み合わせが安定。"],
    ["リラックスヨガ", "女性 88% / 男性 6%", "40代中心", "参加 96名", "継続率が高く、夜枠と相性が良い。"],
    ["肩こり改善", "女性 72% / 男性 20%", "30〜40代中心", "参加 74名", "改善メモを次回プランに反映。"],
  ];

  return (
    <div className="mx-auto max-w-[430px] space-y-4 overflow-x-hidden">
      <section className="rounded-[24px] border border-[#eee4d8] bg-white/84 p-4 shadow-[0_12px_26px_rgba(122,104,80,0.08)]">
        <h1 className="text-[22px] font-extrabold tracking-normal">レポート</h1>
        <p className="mt-1 text-[12px] font-semibold leading-5 text-[#6d7469]">属性・出席・ブロック評価をスマホで読みやすく確認</p>
        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {periods.map((period) => (
            <button key={period} className={`h-9 shrink-0 rounded-full px-4 text-[12px] font-bold ${period === "3か月" ? "bg-[#6e9870] text-white" : "border border-[#e6ded3] bg-white text-[#5b5d57]"}`}>
              {period}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {summaries.map(([label, value, detail]) => (
          <div key={label} className="rounded-[20px] border border-[#eee4d8] bg-white/84 p-3 shadow-[0_8px_18px_rgba(122,104,80,0.06)]">
            <p className="text-[11px] font-bold text-[#6d7469]">{label}</p>
            <p className="mt-1 text-[24px] font-extrabold leading-none text-[#4f875a]">{value}</p>
            <p className="mt-2 line-clamp-1 text-[11px] font-semibold text-[#8a7d6b]">{detail}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[24px] border border-[#eee4d8] bg-white/84 p-4 shadow-[0_10px_24px_rgba(122,104,80,0.06)]">
        <h2 className="mb-3 text-[16px] font-extrabold">生徒属性サマリー</h2>
        <AttributeBars title="男女比率" rows={genderRows as [string, number][]} />
        <div className="mt-4">
          <AttributeBars title="年代比率" rows={ageRows as [string, number][]} tone="purple" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="px-1 text-[16px] font-extrabold">クラス種別ごとの属性分析</h2>
        {classCards.map(([name, gender, age, count, comment]) => (
          <article key={name} className="rounded-[22px] border border-[#eee4d8] bg-white/84 p-4 shadow-[0_8px_18px_rgba(122,104,80,0.06)]">
            <h3 className="text-[15px] font-extrabold">{name}</h3>
            <div className="mt-3 grid gap-2 text-[12px] font-semibold leading-5 text-[#50584e]">
              <p><span className="font-extrabold text-[#4f875a]">男女比：</span>{gender}</p>
              <p><span className="font-extrabold text-[#7469bf]">年代：</span>{age}</p>
              <p><span className="font-extrabold text-[#9b7338]">参加人数：</span>{count}</p>
              <p className="rounded-2xl bg-[#faf7ef] px-3 py-2">{comment}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[24px] border border-[#eee4d8] bg-white/84 p-4 shadow-[0_10px_24px_rgba(122,104,80,0.06)]">
        <h2 className="mb-3 text-[16px] font-extrabold">出席・キャンセル分析</h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniNumber label="出席率" value="87%" />
          <MiniNumber label="キャンセル" value="8%" tone="coral" />
          <MiniNumber label="無断欠席" value="5%" tone="purple" />
        </div>
      </section>

      <MobileRanking title="ブロック分析" rows={blockRows} />

      <section className="rounded-[24px] border border-[#eee4d8] bg-[#fbfaf3] p-4">
        <h2 className="text-[16px] font-extrabold">改善ヒント</h2>
        <div className="mt-3 grid gap-2">
          {["完全呼吸法を導入候補に固定", "ハラアーサナの注意文を見直す", "未使用ブロックを棚卸し", "キャンセル理由を記録"].map((item, index) => (
            <div key={item} className="flex gap-3 rounded-2xl bg-white/74 p-3">
              <CircleBadge className="h-7 w-7 shrink-0 text-[12px]">{index + 1}</CircleBadge>
              <p className="min-w-0 text-[13px] font-bold leading-5">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MobileRanking({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <section className="rounded-[24px] border border-[#eee4d8] bg-white/84 p-4 shadow-[0_10px_24px_rgba(122,104,80,0.06)]">
      <h2 className="mb-3 text-[16px] font-extrabold">{title}</h2>
      <div className="grid gap-2">
        {rows.map(([name, usage, rating, note], index) => (
          <div key={name} className="grid grid-cols-[30px_1fr] gap-3 rounded-2xl border border-[#eee4d8] bg-white/76 p-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#edf5ef] text-[12px] font-extrabold text-[#4f875a]">{index + 1}</span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-extrabold">{name}</p>
              <p className="mt-1 text-[11px] font-bold text-[#5d956d]">使用 {usage} / 評価 {rating}</p>
              <p className="mt-2 inline-flex rounded-full bg-[#fff7e8] px-2 py-1 text-[11px] font-bold text-[#9b7338]">{note}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AttributeBars({ title, rows, tone = "green" }: { title: string; rows: Array<[string, number]>; tone?: "green" | "purple" }) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-bold">{title}</p>
      <div className="grid gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[82px_1fr_34px] items-center gap-2 text-[12px] font-bold">
            <span>{label}</span>
            <MiniBar value={value} tone={tone} />
            <span className="text-right">{value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassMix({ rows }: { rows: string[][] }) {
  return (
    <div className="grid gap-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-[#eee4d8] bg-white/70 p-2">
          <p className="text-[12px] font-extrabold">{label}</p>
          <p className="mt-1 text-[12px] font-medium text-[#5f665c]">{value}</p>
        </div>
      ))}
    </div>
  );
}

function MiniNumber({ label, value, tone = "green" }: { label: string; value: string; tone?: "green" | "coral" | "purple" }) {
  const color = tone === "coral" ? "text-[#ef6f5b]" : tone === "purple" ? "text-[#7469bf]" : "text-[#4f875a]";
  return (
    <div className="rounded-xl border border-[#eee4d8] bg-white/70 p-3">
      <p className="text-[12px] font-bold text-[#7c8476]">{label}</p>
      <p className={`mt-1 text-[28px] font-extrabold ${color}`}>{value}</p>
    </div>
  );
}
