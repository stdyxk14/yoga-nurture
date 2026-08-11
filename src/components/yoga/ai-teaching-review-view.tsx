import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Database, Sparkles } from "lucide-react";
import { AiReviewControls } from "@/components/yoga/ai-review-controls";
import {
  WorkspaceEmptyState,
  WorkspaceFeedback,
  WorkspacePanel,
  WorkspaceSection,
  WorkspaceStatus,
} from "@/components/yoga/workspace-kit";
import type { TeachingReviewState } from "@/lib/ai-review/queries";
import type { AiReviewFinding, AiReviewReference, AiReviewReferenceIndex } from "@/lib/ai-review/types";

const axisLabels = {
  lesson_structure: "レッスン構成",
  block_quality: "ブロック品質",
  field_adaptation: "現場適応",
  student_support: "生徒対応",
  safety_consideration: "安全面への配慮",
  continuous_improvement: "継続的改善",
  data_reliability: "記録・データの信頼度",
} as const;

const statusLabels = {
  strength: "強み",
  stable: "安定",
  observe: "観察継続",
  review: "要見直し",
  insufficient: "データ不足",
} as const;

export function AiTeachingReviewView({ state, periodDays }: { state: TeachingReviewState; periodDays: 30 | 90 }) {
  const snapshot = state.snapshot;
  return (
    <div className="space-y-5">
      <WorkspacePanel className="bg-[#fbfcf8]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.06em] text-[#6f8e70]">分析対象期間</p>
            <div className="mt-2 flex gap-2">
              {[30, 90].map((days) => (
                <Link key={days} href={`/reports?view=ai_review&ai_period=${days}`} className={periodDays === days ? "inline-flex h-9 items-center rounded-lg bg-[#5d8f68] px-4 text-[13px] font-semibold text-white" : "inline-flex h-9 items-center rounded-lg border border-[#ddd6cc] bg-white px-4 text-[13px] font-semibold text-[#626a60]"}>{days}日</Link>
              ))}
            </div>
          </div>
          <AiReviewControls periodDays={periodDays} showPreflight={!snapshot} />
        </div>
      </WorkspacePanel>

      {state.latestRun?.status === "running" ? <WorkspaceFeedback tone="info">新しい分析を実行中です。完了するまで前回の成功結果を表示します。</WorkspaceFeedback> : null}
      {state.latestRun?.status === "failed" && snapshot ? <WorkspaceFeedback tone="error">最新の更新は失敗しました（{state.latestRun.errorCode ?? "unknown"}）。前回の成功結果は保持されています。</WorkspaceFeedback> : null}

      {!snapshot ? (
        <WorkspaceEmptyState
          title={state.isConfigured ? "AI総合指導レビューはまだありません" : "AI連携が未設定です"}
          description={state.latestRun?.status === "failed" ? `生成に失敗しました（${state.latestRun.errorCode ?? "unknown"}）。モデル接続を確認して再実行してください。` : "30日または90日の証拠セットを作り、数値と自由記述を合わせて最初のレビューを生成します。"}
        />
      ) : (
        <>
          <section className="rounded-2xl border border-[#d8e3d4] bg-[linear-gradient(135deg,#f6faf3_0%,#fffdf9_72%)] p-5 shadow-[0_10px_28px_rgba(70,91,68,0.08)] lg:p-6">
            <div className="flex items-center gap-2 text-[#4f8058]"><Sparkles className="h-5 w-5" /><p className="text-[13px] font-semibold tracking-[0.05em]">総合所見</p></div>
            <p className="mt-4 max-w-[1100px] text-[17px] font-medium leading-8 text-[#354038]">{snapshot.review.overall_assessment}</p>
            <p className="mt-4 text-[12px] text-[#737a70]">{formatDate(snapshot.periodStart)}〜{formatDate(snapshot.periodEnd)}・{snapshot.model}・{formatDateTime(snapshot.generatedAt)}生成</p>
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <PriorityFinding title="今回最も重要な強み" finding={snapshot.review.key_strength} references={snapshot.references} tone="strength" />
            <PriorityFinding title="最も優先すべき改善" finding={snapshot.review.priority_improvement} references={snapshot.references} tone="improvement" />
          </div>

          <FindingSection number="4" title="レッスンプラン分析" findings={snapshot.review.lesson_plan_analysis} references={snapshot.references} />
          <FindingSection number="5" title="ブロック分析" findings={snapshot.review.block_analysis} references={snapshot.references} />
          <FindingSection number="6" title="生徒対応・安全配慮" findings={snapshot.review.student_safety_analysis} references={snapshot.references} />

          <WorkspaceSection title="7. 記録・データ品質" description="欠損は低評価へ置き換えず、今回の判断範囲を限定する情報として表示します。">
            <div className="rounded-xl border border-[#e6ded3] bg-white p-4">
              <div className="flex items-start gap-3"><Database className="mt-0.5 h-5 w-5 text-[#7568a7]" /><p className="text-[14px] font-medium leading-6 text-[#414a42]">{snapshot.review.data_quality.summary}</p></div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <TextList title="分析上の制限" items={snapshot.review.data_quality.limitations} />
                <TextList title="入力状況" items={snapshot.review.data_quality.completeness_notes} />
              </div>
            </div>
          </WorkspaceSection>

          <WorkspaceSection title="8. 次に行う具体的なこと" description="AIが既存データから導いた候補です。確認してから実際の指導や記録へ反映してください。">
            <ol className="grid gap-3 lg:grid-cols-2">
              {snapshot.review.next_actions.map((action, index) => (
                <li key={`${action.title}-${index}`} className="rounded-xl border border-[#e1ddd4] bg-white p-4">
                  <div className="flex items-center justify-between gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f1e5] text-[12px] font-semibold text-[#4f8058]">{index + 1}</span><WorkspaceStatus tone={action.priority === "high" ? "coral" : action.priority === "medium" ? "sand" : "green"}>{action.priority === "high" ? "優先" : action.priority === "medium" ? "次点" : "継続"}</WorkspaceStatus></div>
                  <h3 className="mt-3 text-[15px] font-semibold">{action.title}</h3><p className="mt-1 text-[13px] leading-6 text-[#60685f]">{action.detail}</p>
                  <ReferenceLinks references={action.references} index={snapshot.references} />
                </li>
              ))}
            </ol>
          </WorkspaceSection>

          <WorkspaceSection title="9. 根拠となるデータ" description="AI出力とは分離して保存した参照先です。元の記録・プラン・ブロック・生徒へ移動できます。">
            <EvidenceIndex index={snapshot.references} />
          </WorkspaceSection>

          <WorkspaceSection title="10. 7評価軸の詳細" description="同じ大きさの点数カードではなく、判断・理由・母数・次の行動を軸ごとに確認します。">
            <div className="divide-y divide-[#e8e2d9] overflow-hidden rounded-xl border border-[#e1ddd4] bg-white">
              {snapshot.review.axes.map((axis) => (
                <article key={axis.axis} className="grid gap-3 p-4 lg:grid-cols-[180px_minmax(0,1fr)_180px] lg:items-start">
                  <div><p className="text-[14px] font-semibold">{axisLabels[axis.axis]}</p><div className="mt-2"><WorkspaceStatus tone={axis.status === "review" ? "coral" : axis.status === "insufficient" ? "sand" : axis.status === "observe" ? "purple" : "green"}>{statusLabels[axis.status]}</WorkspaceStatus></div></div>
                  <div><p className="text-[14px] font-semibold leading-6">{axis.summary}</p><p className="mt-1 text-[13px] leading-6 text-[#646c63]">{axis.reason}</p><p className="mt-2 text-[13px] font-medium text-[#456d4c]">次: {axis.next_action}</p><ReferenceLinks references={axis.references} index={snapshot.references} /></div>
                  <div className="rounded-lg bg-[#f7f5f0] p-3 text-[12px] leading-5 text-[#687068]"><p>根拠 {axis.evidence_count}件</p><p>確信度 {Math.round(axis.confidence * 100)}%</p><p>{axis.includes_inference ? "AIの推測を含む" : "入力事実を中心に判断"}</p></div>
                </article>
              ))}
            </div>
          </WorkspaceSection>

          {snapshot.review.contradictions.length ? (
            <WorkspaceSection title="矛盾している根拠" description="数値と自由記述などが一致しないため、断定しなかった箇所です。">
              <div className="space-y-2">{snapshot.review.contradictions.map((item, index) => <div key={index} className="rounded-lg border border-[#ead9bc] bg-[#fff9ea] p-3"><p className="flex gap-2 text-[13px] leading-6 text-[#725f3f]"><AlertTriangle className="mt-1 h-4 w-4 shrink-0" />{item.description}</p><ReferenceLinks references={item.references} index={snapshot.references} /></div>)}</div>
            </WorkspaceSection>
          ) : null}
        </>
      )}
    </div>
  );
}

function PriorityFinding({ title, finding, references, tone }: { title: string; finding: AiReviewFinding; references: AiReviewReferenceIndex; tone: "strength" | "improvement" }) {
  return <section className={`rounded-xl border p-5 ${tone === "strength" ? "border-[#cfe0cb] bg-[#f6faf3]" : "border-[#ead9bc] bg-[#fff9ea]"}`}><div className="flex items-center gap-2">{tone === "strength" ? <CheckCircle2 className="h-5 w-5 text-[#4f8058]" /> : <AlertTriangle className="h-5 w-5 text-[#a57238]" />}<h2 className="text-[16px] font-semibold">{title}</h2></div><h3 className="mt-4 text-[17px] font-semibold">{finding.title}</h3><p className="mt-2 text-[14px] leading-7 text-[#525b53]">{finding.detail}</p><FindingMeta finding={finding} /><p className="mt-3 text-[13px] font-medium text-[#456d4c]">次: {finding.next_action}</p><ReferenceLinks references={finding.references} index={references} /></section>;
}

function FindingSection({ number, title, findings, references }: { number: string; title: string; findings: AiReviewFinding[]; references: AiReviewReferenceIndex }) {
  return <WorkspaceSection title={`${number}. ${title}`}><div className="space-y-3">{findings.map((finding, index) => <article key={`${finding.title}-${index}`} className="rounded-xl border border-[#e6ded3] bg-white p-4"><h3 className="text-[15px] font-semibold">{finding.title}</h3><p className="mt-2 text-[13px] leading-6 text-[#60685f]">{finding.detail}</p><p className="mt-2 text-[13px] leading-6 text-[#737a70]">理由: {finding.reason}</p><FindingMeta finding={finding} /><p className="mt-2 text-[13px] font-medium text-[#456d4c]">次: {finding.next_action}</p><ReferenceLinks references={finding.references} index={references} /></article>)}</div></WorkspaceSection>;
}

function FindingMeta({ finding }: { finding: AiReviewFinding }) {
  return <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[#687068]"><span className="rounded-full bg-[#f0eee8] px-2 py-1">根拠 {finding.evidence_count}件</span><span className="rounded-full bg-[#f0eee8] px-2 py-1">確信度 {Math.round(finding.confidence * 100)}%</span><span className="rounded-full bg-[#f0eee8] px-2 py-1">{finding.includes_inference ? "AIの推測を含む" : "入力事実を中心に判断"}</span></div>;
}

function ReferenceLinks({ references, index }: { references: AiReviewReference[]; index: AiReviewReferenceIndex }) {
  const items = references.map((reference) => index[reference.type]?.[reference.ref]).filter(Boolean);
  if (!items.length) return null;
  return <div className="mt-3 flex flex-wrap gap-1.5">{items.map((item) => <Link key={`${item.href}-${item.id}`} href={item.href} className="inline-flex items-center gap-1 rounded-lg border border-[#d4ddd0] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#456d4c] hover:bg-[#f3f8f1]">{item.label}<ArrowUpRight className="h-3 w-3" /></Link>)}</div>;
}

function EvidenceIndex({ index }: { index: AiReviewReferenceIndex }) {
  const groups = [{ key: "record", label: "実施後記録" }, { key: "plan", label: "プラン" }, { key: "block", label: "ブロック" }, { key: "student", label: "生徒" }, { key: "schedule", label: "予定" }] as const;
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{groups.map((group) => { const items = Object.values(index[group.key]); return <div key={group.key} className="rounded-xl border border-[#e6ded3] bg-white p-4"><h3 className="text-[14px] font-semibold">{group.label} <span className="text-[#777e74]">{items.length}件</span></h3>{items.length ? <div className="mt-3 flex flex-col gap-1.5">{items.map((item) => <Link key={item.id} href={item.href} className="inline-flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[13px] text-[#456d4c] hover:bg-[#f3f8f1]"><span className="truncate">{item.label}</span><ArrowUpRight className="h-3.5 w-3.5 shrink-0" /></Link>)}</div> : <p className="mt-3 text-[12px] text-[#777e74]">参照なし</p>}</div>; })}</div>;
}

function TextList({ title, items }: { title: string; items: string[] }) {
  return <div><h3 className="text-[13px] font-semibold">{title}</h3>{items.length ? <ul className="mt-2 space-y-1.5">{items.map((item, index) => <li key={index} className="flex gap-2 text-[13px] leading-5 text-[#626a60]"><span>•</span><span>{item}</span></li>)}</ul> : <p className="mt-2 text-[13px] text-[#777e74]">特記事項なし</p>}</div>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "numeric", day: "numeric", timeZone: "Asia/Tokyo" }).format(new Date(value)); }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tokyo" }).format(new Date(value)); }
