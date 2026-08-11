import Link from "next/link";
import { Copy, FileText, Pencil, Printer } from "lucide-react";

import { duplicateLessonPlanAction } from "@/app/lessons/lesson-plan-actions";
import { LessonPlanAiSuggestionPanel } from "@/components/yoga/lesson-plan-ai-suggestion-panel";
import { Pill } from "@/components/yoga/page-kit";
import { RichScriptText } from "@/components/yoga/rich-script-text";
import {
  WorkspaceAction,
  WorkspaceActionBar,
  WorkspaceEmptyState,
  WorkspacePageHeader,
  WorkspacePanel,
  WorkspaceSection,
  WorkspaceStatus,
} from "@/components/yoga/workspace-kit";
import { formatJapaneseDate } from "@/lib/date-format";
import type { StudentAiSuggestionState } from "@/lib/ai-suggestions";
import type { DbLessonPlan } from "@/lib/lesson-plans";

export function LessonPlanDetail({ plan, aiSuggestionState }: { plan: DbLessonPlan; aiSuggestionState: StudentAiSuggestionState }) {
  return (
    <div className="space-y-4">
      <WorkspacePageHeader
        eyebrow="LESSON PLAN"
        title={plan.name}
        description="原稿へ反映される基本情報と、ブロック構成を順番どおり確認できます。"
        backLink={{ href: "/lessons?tab=plans", label: "レッスンプラン一覧へ戻る" }}
        meta={(
          <>
            <WorkspaceStatus tone="green">{plan.statusLabel}</WorkspaceStatus>
            <WorkspaceStatus tone="sand">{plan.totalMinutes}分</WorkspaceStatus>
            <WorkspaceStatus tone="purple">{plan.blockCount}ブロック</WorkspaceStatus>
          </>
        )}
      />

      <WorkspaceActionBar>
        <WorkspaceAction href={`/lessons/${plan.id}/script`} icon={Printer} variant="primary">原稿を開く</WorkspaceAction>
        <form action={duplicateLessonPlanAction.bind(null, plan.id)}>
          <WorkspaceAction type="submit" icon={Copy}>複製</WorkspaceAction>
        </form>
        <WorkspaceAction href={`/lessons/${plan.id}/edit`} icon={Pencil}>編集</WorkspaceAction>
      </WorkspaceActionBar>

      <WorkspacePanel>
        <WorkspaceSection title="プランの要約" description="一覧と原稿で使われる基本情報です。">
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
            <Info label="テーマ" value={plan.theme || "未設定"} />
            <Info label="場所" value={plan.place || "未設定"} />
            <Info label="形式" value={plan.formatLabel} />
            <Info label="最終更新" value={formatDate(plan.updatedAt)} />
          </dl>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {plan.tags.length ? plan.tags.map((tag) => <Pill key={tag}>{tag}</Pill>) : <Pill>タグ未設定</Pill>}
          </div>
        </WorkspaceSection>
      </WorkspacePanel>

      <WorkspacePanel>
        <WorkspaceSection title="使用ブロック一覧" description="原稿に出力される順番です。重複したブロックも出現単位で保持します。">
          {plan.blocks.length ? (
            <ol className="divide-y divide-[var(--yn-border-subtle)]">
              {plan.blocks.map((block, index) => (
                <li key={block.planBlockId} className="py-4 first:pt-0 last:pb-0">
                  <article>
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf5ef] text-[13px] font-semibold text-[#477b52]">{index + 1}</span>
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-semibold text-[var(--yn-text)]">{block.name}</h3>
                          <p className="mt-1 text-[13px] font-medium text-[#5d8764]">{block.majorCategory} / {block.minorCategory} / {block.plannedDurationMinutes}分</p>
                        </div>
                      </div>
                      <Link href={`/blocks/${block.id}`} className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-[#d4ddd0] bg-white px-3 text-[13px] font-semibold text-[#456d4c] hover:bg-[#f3f8f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--yn-focus)]">ブロック詳細</Link>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-[minmax(180px,0.42fr)_minmax(0,1fr)]">
                      <div className="rounded-lg border border-[#ead9bc] bg-[#fff8e9] p-3 text-[13px] font-medium leading-6 text-[#8b704c]">注意点: {block.cautionsOverride || block.cautions || "未入力"}</div>
                      <div className="min-w-0 rounded-lg bg-[#f8f7f3] p-3">
                        <p className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold text-[#566057]"><FileText className="h-4 w-4" aria-hidden="true" />誘導セリフ</p>
                        <RichScriptText text={block.scriptOverride || block.script} emptyText="誘導セリフは未入力です。" className="line-clamp-3 text-[13px] font-normal leading-6 text-[#50584e]" />
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ol>
          ) : (
            <WorkspaceEmptyState title="ブロックは未登録です" description="編集画面から、原稿に使うブロックを追加できます。" />
          )}
        </WorkspaceSection>
      </WorkspacePanel>

      <LessonPlanAiSuggestionPanel plan={plan} aiSuggestionState={aiSuggestionState} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-l-2 border-[#d9e5d5] pl-3">
      <dt className="text-[13px] font-medium text-[var(--yn-text-muted)]">{label}</dt>
      <dd className="mt-1 break-words text-[14px] font-semibold leading-6 text-[var(--yn-text)]">{value}</dd>
    </div>
  );
}

function formatDate(value: string) {
  return formatJapaneseDate(new Date(value));
}
