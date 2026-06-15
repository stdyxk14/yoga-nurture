import Link from "next/link";
import { ArrowLeft, BarChart3, FileText, History, MessageSquareText, Pencil, Sparkles } from "lucide-react";
import { BlockAiSuggestionPanel } from "@/components/yoga/block-ai-suggestion-panel";
import { PageHeader, Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import type { BlockUsageHistory } from "@/components/yoga/records";
import type { StudentAiSuggestionState } from "@/lib/ai-suggestions";
import type { DbBlockTemplate } from "@/lib/blocks";

export function BlockDetail({
  block,
  histories,
  aiSuggestionState,
}: {
  block: DbBlockTemplate;
  histories: BlockUsageHistory[];
  aiSuggestionState?: StudentAiSuggestionState;
}) {
  const executedHistories = histories.filter((history) => history.done);
  const usageCount = executedHistories.length;
  const lastUsed = executedHistories[0]?.lessonDate ?? "未使用";
  const reviewCount = histories.filter((history) => history.scriptReviewRequired).length;
  const averageMinutes = executedHistories.length
    ? `${Math.round(executedHistories.reduce((sum, history) => sum + (Number.parseInt(history.actualDuration, 10) || 0), 0) / executedHistories.length)}分`
    : "未集計";
  const reactionCount = executedHistories.filter((history) => history.reaction && history.reaction !== "未評価").length;
  const goodRate = reactionCount ? `${Math.round((executedHistories.filter((history) => history.reaction === "良かった").length / reactionCount) * 100)}%` : "評価データなし";

  return (
    <>
      <div className="md:hidden">
        <MobileBlockDetail block={block} histories={histories} aiSuggestionState={aiSuggestionState} />
      </div>
      <div className="hidden md:block">
      <PageHeader title="ブロック詳細" subtitle="原稿・利用実績・改善履歴をまとめて確認" />

      <div className="mb-3 flex flex-wrap justify-end gap-2">
        <Link href="/lessons?tab=blocks" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d8e3d4] bg-white px-3 text-[12px] font-bold text-[#4f7b58]">
          <ArrowLeft className="h-3.5 w-3.5" />
          ブロック一覧に戻る
        </Link>
        <Link href="/lessons?tab=plans" className="inline-flex h-8 items-center rounded-lg border border-[#d8e3d4] bg-white px-3 text-[12px] font-bold text-[#4f7b58]">
          レッスンプランに戻る
        </Link>
        <a href="#history" className="inline-flex h-8 items-center rounded-lg bg-[#5d956d] px-3 text-[12px] font-bold text-white">
          関連する記録を見る
        </a>
      </div>

      <section className="grid grid-cols-[minmax(0,1fr)_330px] gap-4">
        <SoftCard className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-[24px] font-extrabold">{block.name}</h2>
              <div className="mt-2 flex flex-wrap gap-2 text-[12px] font-bold">
                <span className="max-w-[220px] truncate rounded-full bg-[#edf5ef] px-3 py-1 text-[#4f875a]" title={block.majorCategory}>{block.majorCategory}</span>
                <span className="max-w-[220px] truncate rounded-full bg-[#fff7e8] px-3 py-1 text-[#9b7338]" title={block.minorCategory}>{block.minorCategory}</span>
                <span className="rounded-full bg-[#f2efff] px-3 py-1 text-[#7469bf]">{block.duration}</span>
              </div>
            </div>
            <Link href={`/blocks/${block.id}/edit`} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#d8e3d4] bg-white px-3 text-[12px] font-bold text-[#4f7b58]">
              <Pencil className="h-3.5 w-3.5" />
              編集
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <InfoCard label="目的" value={block.purpose} />
            <InfoCard label="対象レベル" value={block.level} />
            <InfoCard label="注意点" value={block.cautions} tone="coral" />
          </div>

          <div className="mt-4">
            <SectionTitle icon={FileText} title="誘導セリフ全文" />
            <div className="rounded-xl border border-[#eee4d8] bg-white/72 p-4">
              <p className="whitespace-pre-line text-[13px] font-medium leading-7 text-[#30362f]">{block.script}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {block.tags.map((tag) => (
              <Pill key={tag}>{tag}</Pill>
            ))}
          </div>

          <div className="mt-4">
            <BlockAiSuggestionPanel block={block} aiSuggestionState={aiSuggestionState} />
          </div>
        </SoftCard>

        <div className="grid gap-3">
          <SoftCard className="p-3.5">
            <SectionTitle icon={BarChart3} title="利用サマリー" />
            <div className="grid grid-cols-2 gap-2">
              <SummaryStat label="使用回数" value={`${usageCount}回`} />
              <SummaryStat label="良かった率" value={goodRate} />
              <SummaryStat label="最近使用日" value={lastUsed} />
              <SummaryStat label="次回も使いたい率" value="未集計" />
              <SummaryStat label="セリフ見直し対象" value={`${reviewCount}回`} />
              <SummaryStat label="平均所要時間" value={averageMinutes} />
            </div>
          </SoftCard>

          <SoftCard className="p-3.5">
            <SectionTitle icon={Sparkles} title="まとめ" />
            <div className="grid gap-2 text-[12px] font-medium leading-5 text-[#50584e]">
              <SummaryNote title="よく出てくる講師メモ" body={histories[0]?.teacherMemo ?? "まだ使用履歴はありません。初回利用後に講師メモが蓄積されます。"} />
              <SummaryNote title="改善メモの要点" body={histories.find((history) => history.improvementMemo)?.improvementMemo ?? "まだ改善メモはありません。"} />
              <SummaryNote title="反応が良かったときの傾向" body="レッスン後記録が蓄積されると表示されます。" />
              <SummaryNote title="セリフ見直し候補" body={histories.find((history) => history.scriptRevision)?.scriptRevision ?? "次回利用時にセリフ改善メモを残します。"} />
            </div>
          </SoftCard>
        </div>
      </section>

      <SoftCard id="history" className="mt-4 p-4">
        <SectionTitle icon={History} title="レッスン後記録からの蓄積データ" subtitle="ブロック単位で入力された講師メモ・改善メモを表示" />
        <div className="grid gap-3">
          {histories.length ? histories.map((history) => (
            <div key={`${history.lessonId}-${history.blockId}`} className="rounded-xl border border-[#eee4d8] bg-white/72 p-3">
              <div className="mb-3 grid grid-cols-[110px_minmax(0,1fr)_110px_110px_130px] items-center gap-3">
                <p className="text-[12px] font-bold">{history.lessonDate}</p>
                <div className="min-w-0">
                  <Link href={`/lessons/${history.lessonId}`} className="block truncate text-[14px] font-extrabold text-[#2f342e] hover:text-[#5d956d]">
                    {history.lessonName}
                  </Link>
                  <p className="truncate text-[11px] font-semibold text-[#6b7468]">レッスンプラン：{history.planName}</p>
                </div>
                <StatusPill active={history.done} />
                <p className="text-[12px] font-bold text-[#4f875a]">{history.actualDuration}</p>
                <p className="rounded-full bg-[#f2efff] px-2 py-1 text-center text-[11px] font-bold text-[#7469bf]">{history.reaction}</p>
              </div>
              <div className="grid grid-cols-[1fr_1fr_110px_110px] gap-3">
                <HistoryText icon={MessageSquareText} title="講師メモ" body={history.teacherMemo} />
                <HistoryText icon={Pencil} title="改善メモ / セリフ直し" body={`${history.improvementMemo}\n${history.scriptRevision}`} />
                <BooleanBox label="次回も使いたい" active={history.useAgain} />
                <BooleanBox label="セリフを見直す" active={history.scriptReviewRequired} tone="coral" />
              </div>
            </div>
          )) : (
            <div className="rounded-xl border border-dashed border-[#d8d1c6] bg-white/62 p-4 text-[13px] font-medium text-[#6b7468]">
              レッスン後記録でこのブロックが使われると、ここに使用履歴や改善メモが蓄積されます。
            </div>
          )}
        </div>
      </SoftCard>
      </div>
    </>
  );
}

function MobileBlockDetail({
  block,
  histories,
  aiSuggestionState,
}: {
  block: DbBlockTemplate;
  histories: BlockUsageHistory[];
  aiSuggestionState?: StudentAiSuggestionState;
}) {
  const executedHistories = histories.filter((history) => history.done);
  const usageCount = executedHistories.length;
  const lastUsed = executedHistories[0]?.lessonDate ?? "未使用";
  const reviewCount = histories.filter((history) => history.scriptReviewRequired).length;
  const averageMinutes = executedHistories.length
    ? `${Math.round(executedHistories.reduce((sum, history) => sum + (Number.parseInt(history.actualDuration, 10) || 0), 0) / executedHistories.length)}分`
    : "未集計";
  const reactionCount = executedHistories.filter((history) => history.reaction && history.reaction !== "未評価").length;
  const goodRate = reactionCount ? `${Math.round((executedHistories.filter((history) => history.reaction === "良かった").length / reactionCount) * 100)}%` : "評価データなし";

  return (
    <div className="mx-auto max-w-[430px] space-y-4">
      <section className="rounded-3xl border border-[#eee4d8] bg-white/80 p-4 shadow-[0_10px_24px_rgba(91,76,53,0.06)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-[22px] font-extrabold">{block.name}</h1>
            <p className="mt-1 truncate text-[12px] font-bold text-[#5d956d]">{block.majorCategory} / {block.minorCategory}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#fff7e8] px-3 py-1.5 text-[12px] font-bold text-[#9b7338]">{block.duration}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {block.tags.slice(0, 5).map((tag) => <Pill key={tag}>{tag}</Pill>)}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <SummaryStat label="使用回数" value={`${usageCount}回`} />
          <SummaryStat label="良かった率" value={goodRate} />
          <SummaryStat label="最近" value={lastUsed} />
        </div>
      </section>

      <div className="grid grid-cols-3 rounded-2xl border border-[#e2d9cc] bg-white/75 p-1 text-center">
        <a href="#basic" className="rounded-xl bg-[#7ea06f] px-2 py-2 text-[11px] font-bold text-white">基本情報</a>
        <a href="#summary" className="px-2 py-2 text-[11px] font-bold text-[#5d6b58]">利用サマリー</a>
        <a href="#history" className="px-2 py-2 text-[11px] font-bold text-[#5d6b58]">改善履歴</a>
      </div>

      <section id="basic" className="rounded-3xl border border-[#eee4d8] bg-white/80 p-4">
        <h2 className="text-[16px] font-extrabold">基本情報</h2>
        <div className="mt-3 grid gap-3">
          <InfoCard label="目的" value={block.purpose} />
          <InfoCard label="注意点" value={block.cautions} tone="coral" />
          <div className="rounded-2xl border border-[#eee4d8] bg-white/72 p-3">
            <p className="text-[12px] font-bold text-[#4f7b58]">誘導セリフ全文</p>
            <p className="mt-2 whitespace-pre-line text-[13px] font-medium leading-7 text-[#30362f]">{block.script}</p>
          </div>
        </div>
      </section>

      <BlockAiSuggestionPanel block={block} aiSuggestionState={aiSuggestionState} />

      <section id="summary" className="rounded-3xl border border-[#eee4d8] bg-white/80 p-4">
        <h2 className="text-[16px] font-extrabold">利用サマリー</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <SummaryStat label="使用回数" value={`${usageCount}回`} />
          <SummaryStat label="良かった率" value={goodRate} />
          <SummaryStat label="最近使用日" value={lastUsed} />
          <SummaryStat label="使いたい率" value="未集計" />
          <SummaryStat label="見直し回数" value={`${reviewCount}回`} />
          <SummaryStat label="平均所要時間" value={averageMinutes} />
        </div>
      </section>

      <section id="history" className="rounded-3xl border border-[#eee4d8] bg-white/80 p-4">
        <h2 className="text-[16px] font-extrabold">改善履歴</h2>
        <div className="mt-3 grid gap-3">
          {histories.length ? histories.map((history) => (
            <div key={`${history.lessonId}-${history.blockId}`} className="relative rounded-2xl border border-[#eee4d8] bg-white/78 p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-extrabold">{history.lessonName}</p>
                  <p className="text-[11px] font-bold text-[#8f867a]">{history.lessonDate}</p>
                </div>
                <span className={history.done ? "rounded-full bg-[#edf5ef] px-2 py-1 text-[10px] font-bold text-[#4f875a]" : "rounded-full bg-[#fff0ea] px-2 py-1 text-[10px] font-bold text-[#e46b50]"}>
                  {history.done ? "実施" : "スキップ"}
                </span>
              </div>
              <div className="mb-2 grid grid-cols-3 gap-2 text-center">
                <MiniHistory label="時間" value={history.actualDuration} />
                <MiniHistory label="反応" value={history.reaction} />
                <MiniHistory label="次回" value={history.useAgain ? "使う" : "見送り"} />
              </div>
              <p className="text-[12px] font-bold text-[#4f7b58]">講師メモ</p>
              <p className="mt-1 text-[12px] font-medium leading-5 text-[#50584e]">{history.teacherMemo}</p>
              <p className="mt-3 text-[12px] font-bold text-[#d96c55]">改善メモ / セリフ直し</p>
              <p className="mt-1 whitespace-pre-line text-[12px] font-medium leading-5 text-[#50584e]">{history.improvementMemo}{"\n"}{history.scriptRevision}</p>
              {history.scriptReviewRequired ? <span className="mt-3 inline-flex rounded-full bg-[#fff0ea] px-3 py-1 text-[11px] font-bold text-[#e46b50]">セリフ見直し</span> : null}
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed border-[#d8d1c6] bg-white/62 p-4 text-[13px] font-medium leading-6 text-[#6b7468]">
              レッスン後記録でこのブロックが使われると、ここに使用履歴や改善メモが蓄積されます。
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MiniHistory({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f8f6f0] px-2 py-1.5">
      <p className="text-[10px] font-bold text-[#8f867a]">{label}</p>
      <p className="truncate text-[11px] font-extrabold text-[#394238]">{value}</p>
    </div>
  );
}

function InfoCard({ label, value, tone = "green" }: { label: string; value: string; tone?: "green" | "coral" }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#eee4d8] bg-white/72 p-3">
      <p className={tone === "coral" ? "text-[12px] font-bold text-[#d96c55]" : "text-[12px] font-bold text-[#4f7b58]"}>{label}</p>
      <p className="mt-1 line-clamp-3 text-[12px] font-medium leading-5 text-[#50584e]">{value}</p>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#eee4d8] bg-white/72 p-3 text-center">
      <p className="text-[11px] font-bold text-[#7c8476]">{label}</p>
      <p className="mt-1 truncate text-[22px] font-extrabold text-[#4f875a]">{value}</p>
    </div>
  );
}

function SummaryNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg bg-[#f8f6f0] px-3 py-2">
      <p className="font-bold text-[#394238]">{title}</p>
      <p className="mt-1 line-clamp-2">{body}</p>
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span className={active ? "rounded-full bg-[#edf5ef] px-2 py-1 text-center text-[11px] font-bold text-[#4f875a]" : "rounded-full bg-[#fff0ea] px-2 py-1 text-center text-[11px] font-bold text-[#e46b50]"}>
      {active ? "実施した" : "スキップした"}
    </span>
  );
}

function HistoryText({ icon: Icon, title, body }: { icon: typeof MessageSquareText; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-[#eee4d8] bg-white/72 p-3">
      <p className="mb-1 flex items-center gap-1.5 text-[12px] font-bold text-[#4f7b58]">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </p>
      <p className="whitespace-pre-line text-[12px] font-medium leading-5 text-[#50584e]">{body}</p>
    </div>
  );
}

function BooleanBox({ label, active, tone = "green" }: { label: string; active: boolean; tone?: "green" | "coral" }) {
  const activeClass = tone === "coral" ? "bg-[#fff0ea] text-[#e46b50] border-[#f0c7b4]" : "bg-[#edf5ef] text-[#4f875a] border-[#cfe1ca]";
  return (
    <div className={`flex items-center justify-center rounded-xl border px-2 text-center text-[12px] font-bold ${active ? activeClass : "border-[#e3dbcf] bg-white/70 text-[#7c8476]"}`}>
      {label}
      <br />
      {active ? "はい" : "いいえ"}
    </div>
  );
}
