"use client";

import { useActionState, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Ban, X } from "lucide-react";
import { saveScheduleClosureAction, type ScheduleClosureFormState } from "@/app/schedules/actions";
import { WorkspaceFeedback } from "@/components/yoga/workspace-kit";
import {
  scheduleClosureReasonOptions,
  type ScheduleClosure,
} from "@/lib/schedule-closures";

export function ScheduleClosureDialog({
  scheduleId,
  activeClosure,
  hasDraftRecord,
  disabled,
}: {
  scheduleId: string;
  activeClosure: ScheduleClosure | null;
  hasDraftRecord: boolean;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const action = saveScheduleClosureAction.bind(null, scheduleId);
  const [state, formAction, pending] = useActionState<ScheduleClosureFormState, FormData>(action, {});

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        disabled={disabled}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#efc9c0] bg-[#fff5f1] px-3.5 text-[13px] font-semibold text-[#a9584d] transition hover:bg-[#ffede7] disabled:pointer-events-none disabled:opacity-50"
      >
        <Ban className="h-4 w-4" aria-hidden="true" />
        {activeClosure ? "クローズ内容を編集" : "レッスンをクローズ"}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[80] bg-[#20251f]/45 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-[81] flex items-center justify-center p-4">
          <Dialog.Popup className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-xl border border-[#eadfd4] bg-[#fffdf9] shadow-[0_24px_70px_rgba(35,41,34,0.24)] outline-none">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e5e0d8] bg-[#fffdf9]/96 px-5 py-4 backdrop-blur">
              <div>
                <Dialog.Title className="text-[18px] font-semibold text-[#2f342e]">
                  {activeClosure ? "クローズ内容を編集" : "レッスンをクローズ"}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-[13px] leading-5 text-[#687068]">
                  レッスン全体が一切実施されなかった場合だけ登録します。個人のキャンセルや欠席とは別の記録です。
                </Dialog.Description>
              </div>
              <Dialog.Close className="yn-icon-button shrink-0" aria-label="閉じる"><X className="h-5 w-5" /></Dialog.Close>
            </div>

            <form action={formAction} className="space-y-4 p-5">
              {state.error ? <WorkspaceFeedback tone="error">{state.error}</WorkspaceFeedback> : null}
              {state.success ? <WorkspaceFeedback tone="success">{state.success}ダイアログを閉じると表示へ反映されます。</WorkspaceFeedback> : null}
              {hasDraftRecord && !activeClosure ? (
                <WorkspaceFeedback tone="info">
                  下書きの実施後記録があります。クローズ後も内容は保持されますが、解除するまで編集できません。
                </WorkspaceFeedback>
              ) : null}

              <label className="grid gap-1.5 text-[13px] font-semibold text-[#4f584e]">
                クローズ理由 <span className="text-[#bd5d50]">必須</span>
                <select name="reason_code" required defaultValue={activeClosure?.reasonCode ?? ""} className="h-10 rounded-lg border border-[#dcd6cc] bg-white px-3 text-[14px] font-normal">
                  <option value="" disabled>選択してください</option>
                  {scheduleClosureReasonOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>

              <label className="grid gap-1.5 text-[13px] font-semibold text-[#4f584e]">
                補足メモ
                <textarea name="note" rows={3} defaultValue={activeClosure?.note ?? ""} className="rounded-lg border border-[#dcd6cc] bg-white px-3 py-2 text-[14px] font-normal leading-6" />
              </label>

              <label className="grid gap-1.5 text-[13px] font-semibold text-[#4f584e]">
                次回への引き継ぎ
                <textarea name="handoff_note" rows={3} defaultValue={activeClosure?.handoffNote ?? ""} className="rounded-lg border border-[#dcd6cc] bg-white px-3 py-2 text-[14px] font-normal leading-6" />
              </label>

              {hasDraftRecord && !activeClosure ? (
                <label className="flex items-start gap-2 rounded-lg border border-[#e5d9bd] bg-[#fff9ea] p-3 text-[13px] leading-5 text-[#725f3f]">
                  <input type="checkbox" name="confirm_draft" required className="mt-1" />
                  下書きを保持したままクローズし、解除するまで実施後記録を編集できないことを確認しました。
                </label>
              ) : null}

              <div className="flex flex-col-reverse gap-2 border-t border-[#ece5db] pt-4 sm:flex-row sm:justify-end">
                <Dialog.Close type="button" className="inline-flex h-10 items-center justify-center rounded-lg border border-[#ddd6cc] bg-white px-4 text-[13px] font-semibold text-[#5f675d]">キャンセル</Dialog.Close>
                <button disabled={pending} className="inline-flex h-10 items-center justify-center rounded-lg bg-[#a9584d] px-4 text-[13px] font-semibold text-white disabled:opacity-55">
                  {pending ? "保存中…" : activeClosure ? "変更を保存" : "クローズを登録"}
                </button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
