import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LessonPlanPrintDocument } from "@/components/yoga/lesson-plan-print-document";
import { ScriptPrintButton } from "@/components/yoga/script-print-actions";
import type { DbLessonPlan } from "@/lib/lesson-plans";
import type { DbSchedule } from "@/lib/schedules";

type Props = {
  plan: DbLessonPlan;
  schedule?: DbSchedule;
  backHref: string;
};

export function LessonPlanPrintPage({ plan, schedule, backHref }: Props) {
  return (
    <div className="min-h-screen bg-[#f6f2ea] text-[#20231e] print:min-h-0 print:bg-white">
      <div className="mx-auto max-w-5xl px-4 py-4 print:hidden">
        <div className="flex flex-col gap-3 rounded-2xl border border-[#e7dfd4] bg-white/90 p-4 shadow-[0_12px_28px_rgba(66,55,38,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12px] font-extrabold tracking-[0.18em] text-[#5d956d]">PRINT DOCUMENT</p>
            <h1 className="mt-1 text-[22px] font-extrabold">{plan.name}</h1>
            <p className="mt-1 text-[12px] font-semibold text-[#6b7468]">
              紙で配れるレッスン原稿として整えた印刷用レイアウトです。必要に応じて印刷設定でヘッダーとフッターをOFFにしてください。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={backHref} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58]">
              <ArrowLeft className="h-4 w-4" />
              原稿に戻る
            </Link>
            <ScriptPrintButton />
          </div>
        </div>
      </div>

      <LessonPlanPrintDocument plan={plan} schedule={schedule} />
    </div>
  );
}
