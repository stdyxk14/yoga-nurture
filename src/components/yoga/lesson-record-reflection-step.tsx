"use client";

import { Textarea } from "@/components/ui/textarea";
import { LessonRecordAiSuggestionPanel } from "@/components/yoga/lesson-record-ai-suggestion-panel";
import type { StudentAiSuggestionState } from "@/lib/ai-suggestions";

type Props = {
  recordId?: string;
  overallMemo: string;
  overallReaction: string;
  improvementPoints: string;
  aiSuggestionState?: StudentAiSuggestionState;
  onChange: (patch: { overallMemo?: string; overallReaction?: string; improvementPoints?: string }) => void;
};

export function LessonRecordReflectionStep(props: Props) {
  return (
    <section className="space-y-4" aria-labelledby="reflection-heading">
      <div className="rounded-xl border border-[#dfe5da] bg-[#f8faf6] p-4"><h2 id="reflection-heading" className="text-lg font-semibold">全体の振り返り</h2><p className="mt-1 text-sm leading-6 text-[#687166]">文章入力はすべて任意です。次回に残したい内容だけ記録してください。</p></div>
      <div className="grid gap-4 rounded-xl border border-[#dde3da] bg-white p-4 lg:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">全体メモ<Textarea value={props.overallMemo} onChange={(event) => props.onChange({ overallMemo: event.target.value })} className="min-h-40 bg-white text-sm" /></label>
        <label className="grid gap-2 text-sm font-medium">生徒の反応・観察<Textarea value={props.overallReaction} onChange={(event) => props.onChange({ overallReaction: event.target.value })} className="min-h-40 bg-white text-sm" /></label>
        <label className="grid gap-2 text-sm font-medium">次回への改善ポイント<Textarea value={props.improvementPoints} onChange={(event) => props.onChange({ improvementPoints: event.target.value })} className="min-h-40 bg-white text-sm" /></label>
      </div>
      <LessonRecordAiSuggestionPanel recordId={props.recordId} aiSuggestionState={props.aiSuggestionState} />
    </section>
  );
}
