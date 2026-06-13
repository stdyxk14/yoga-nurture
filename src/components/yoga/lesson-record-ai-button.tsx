"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generateLessonRecordAiSuggestionAction } from "@/lib/ai-suggestions/lesson-record-actions";
import type { StudentAiActionState } from "@/lib/ai-suggestions";

type LessonRecordAiButtonProps = {
  recordId?: string;
  label?: string;
};

export function LessonRecordAiButton({ recordId, label = "AIに相談" }: LessonRecordAiButtonProps) {
  const router = useRouter();
  const [state, setState] = useState<StudentAiActionState>({});
  const [pending, startTransition] = useTransition();
  const resolvedRecordId = recordId ?? "";

  if (!resolvedRecordId) {
    return (
      <p className="rounded-xl border border-[#efd3a7] bg-[#fff7e8] px-3 py-2 text-[12px] font-semibold leading-5 text-[#8b704c]">
        保存済みの実施後記録に対してAI相談できます。先に下書き保存、または記録を完了してください。
      </p>
    );
  }

  function handleClick() {
    startTransition(async () => {
      const result = await generateLessonRecordAiSuggestionAction(resolvedRecordId);
      setState(result);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex min-h-9 w-full items-center justify-center rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white transition hover:bg-[#4f835d] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
      >
        {pending ? "生成中..." : label}
      </button>
      {state.error ? (
        <p className="rounded-xl border border-[#f2c9bd] bg-[#fff0ea] px-3 py-2 text-[12px] font-semibold leading-5 text-[#b75b48]">{state.error}</p>
      ) : null}
      {state.message ? (
        <p className="rounded-xl border border-[#cfe1ca] bg-[#f8fcf6] px-3 py-2 text-[12px] font-semibold leading-5 text-[#4f7b58]">{state.message}</p>
      ) : null}
    </div>
  );
}
