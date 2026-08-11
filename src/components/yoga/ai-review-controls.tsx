"use client";

import { useActionState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import {
  preflightTeachingReviewAction,
  refreshTeachingReviewAction,
  type ReviewActionState,
} from "@/app/reports/actions";
import { WorkspaceFeedback } from "@/components/yoga/workspace-kit";

export function AiReviewControls({ periodDays, showPreflight = false }: { periodDays: 30 | 90; showPreflight?: boolean }) {
  const [refreshState, refreshAction, refreshing] = useActionState<ReviewActionState, FormData>(refreshTeachingReviewAction, {});
  const [preflightState, preflightAction, preflighting] = useActionState<ReviewActionState, FormData>(preflightTeachingReviewAction, {});
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <form action={refreshAction}>
          <input type="hidden" name="period_days" value={periodDays} />
          <button disabled={refreshing} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#5d8f68] px-3.5 text-[13px] font-semibold text-white disabled:opacity-55">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            {refreshing ? "分析中…" : "この期間を更新"}
          </button>
        </form>
        {showPreflight ? (
          <form action={preflightAction}>
            <button disabled={preflighting} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#d4ddd0] bg-white px-3.5 text-[13px] font-semibold text-[#456d4c] disabled:opacity-55">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {preflighting ? "確認中…" : "モデル接続を確認"}
            </button>
          </form>
        ) : null}
      </div>
      {refreshState.error ? <WorkspaceFeedback tone="error">{refreshState.error}</WorkspaceFeedback> : null}
      {refreshState.message ? <WorkspaceFeedback tone={refreshState.ok ? "success" : "info"}>{refreshState.message}</WorkspaceFeedback> : null}
      {preflightState.error ? <WorkspaceFeedback tone="error">{preflightState.error}</WorkspaceFeedback> : null}
      {preflightState.message ? (
        <WorkspaceFeedback tone="success">
          {preflightState.message}
          {preflightState.preflight ? ` ${preflightState.preflight.responseModel ?? preflightState.preflight.model}・入力${preflightState.preflight.inputTokens}／出力${preflightState.preflight.outputTokens} tokens・概算$${preflightState.preflight.estimatedCostUsd.toFixed(4)}` : ""}
        </WorkspaceFeedback>
      ) : null}
    </div>
  );
}
