"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Save } from "lucide-react";

type Props = {
  step: number;
  pending: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
};

export function LessonRecordFooter({ step, pending, onPrevious, onNext, onComplete }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dfe3da] bg-[#fbfaf6]/96 px-4 py-3 shadow-[0_-5px_18px_rgba(60,70,58,0.08)] backdrop-blur md:left-[190px] xl:left-[196px]">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2">
        <button type="submit" name="status" value="draft" disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#8eae91] bg-white px-4 text-sm font-medium text-[#426449] disabled:opacity-50"><Save className="h-4 w-4" />{pending ? "保存中…" : "下書き保存"}</button>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={onPrevious} disabled={step === 1 || pending} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dfe3da] bg-white px-4 text-sm font-medium disabled:opacity-40"><ArrowLeft className="h-4 w-4" />前へ</button>
          {step < 3 ? <button type="button" onClick={onNext} disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#9e95c9] bg-[#faf7ff] px-4 text-sm font-medium text-[#625994]">次へ<ArrowRight className="h-4 w-4" /></button> : null}
          <button type="button" onClick={onComplete} disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#5d956d] px-5 text-sm font-medium text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />記録を完了</button>
        </div>
      </div>
    </div>
  );
}
