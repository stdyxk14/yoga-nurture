"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { generateLessonPlanAiSuggestionAction } from "@/lib/ai-suggestions/lesson-plan-actions";
import type { MentorType, StudentAiActionState } from "@/lib/ai-suggestions";

type LessonPlanAiButtonProps = {
  planId?: string;
  label?: string;
  mentorType?: MentorType;
};

const initialState: StudentAiActionState = {};

export function LessonPlanAiButton({ planId, label = "AIに相談", mentorType = "lesson_design" }: LessonPlanAiButtonProps) {
  const [state, formAction] = useActionState(generateLessonPlanAiSuggestionAction, initialState);

  if (!planId) {
    return (
      <p className="rounded-xl border border-[#efd3a7] bg-[#fff7e8] px-3 py-2 text-[12px] font-semibold leading-5 text-[#8b704c]">
        保存済みのレッスンプランに対してAI相談できます。先に保存してください。
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="lesson_plan_id" value={planId} />
      <input type="hidden" name="mentor_type" value={mentorType} />
      <SubmitButton label={label} />
      {state.error ? (
        <p className="rounded-xl border border-[#f2c9bd] bg-[#fff0ea] px-3 py-2 text-[12px] font-semibold leading-5 text-[#b75b48]">{state.error}</p>
      ) : null}
      {state.message ? (
        <p className="rounded-xl border border-[#cfe1ca] bg-[#f8fcf6] px-3 py-2 text-[12px] font-semibold leading-5 text-[#4f7b58]">{state.message}</p>
      ) : null}
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-9 w-full items-center justify-center rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white transition hover:bg-[#4f835d] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
    >
      {pending ? "生成中..." : label}
    </button>
  );
}
