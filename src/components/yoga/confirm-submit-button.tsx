"use client";

import { useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { AlertTriangle } from "lucide-react";

type Props = {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  className: string;
  children: ReactNode;
  disabled?: boolean;
  form?: string;
  formAction?: ButtonHTMLAttributes<HTMLButtonElement>["formAction"];
};

export function ConfirmSubmitButton({
  message,
  title = "この操作を実行しますか？",
  confirmLabel = "実行する",
  cancelLabel = "キャンセル",
  className,
  children,
  disabled,
  form,
  formAction,
}: Props) {
  const submitRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <AlertDialog.Root>
        <AlertDialog.Trigger type="button" disabled={disabled} className={className}>{children}</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-[90] bg-[#20251f]/45 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <AlertDialog.Viewport className="fixed inset-0 z-[91] flex items-center justify-center p-4">
            <AlertDialog.Popup className="w-full max-w-md rounded-xl border border-[#eadfd4] bg-[#fffdf9] p-5 shadow-[0_24px_70px_rgba(35,41,34,0.24)] outline-none transition-[transform,opacity] data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff0ea] text-[#bd5d50]">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <AlertDialog.Title className="text-[18px] font-semibold text-[#2f342e]">{title}</AlertDialog.Title>
                  <AlertDialog.Description className="mt-2 text-[14px] leading-6 text-[#687068]">{message}</AlertDialog.Description>
                </div>
              </div>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <AlertDialog.Close type="button" className="inline-flex h-10 items-center justify-center rounded-lg border border-[#ddd6cc] bg-white px-4 text-[13px] font-semibold text-[#5f675d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]">
                  {cancelLabel}
                </AlertDialog.Close>
                <AlertDialog.Close
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-[#bd5d50] px-4 text-[13px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bd5d50] focus-visible:ring-offset-2"
                  onClick={() => submitRef.current?.click()}
                >
                  {confirmLabel}
                </AlertDialog.Close>
              </div>
            </AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      <button ref={submitRef} type="submit" form={form} formAction={formAction} className="hidden" tabIndex={-1} aria-hidden="true" />
    </>
  );
}
