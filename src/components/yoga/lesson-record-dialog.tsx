"use client";

import { type ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  placement?: "center" | "bottom";
};

export function LessonRecordDialog({
  open,
  title,
  description,
  onClose,
  children,
  className,
  placement = "center",
}: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[80] bg-[#20251f]/45 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport
          className={cn(
            "fixed inset-0 z-[81] flex p-3 md:p-4",
            placement === "bottom" ? "items-end justify-center md:items-center" : "items-center justify-center",
          )}
        >
          <Dialog.Popup
            className={cn(
              "max-h-[88dvh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[#dfe5da] bg-[#fbfaf6] shadow-[0_24px_70px_rgba(35,41,34,0.22)] outline-none transition-[transform,opacity] data-ending-style:translate-y-2 data-ending-style:opacity-0 data-starting-style:translate-y-2 data-starting-style:opacity-0",
              className,
            )}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e5e4dc] bg-[#fbfaf6]/96 px-5 py-4 backdrop-blur">
              <div className="min-w-0">
                <Dialog.Title className="text-[18px] font-semibold text-[#2f342e]">{title}</Dialog.Title>
                {description ? <Dialog.Description className="mt-1 text-[14px] leading-6 text-[#687166]">{description}</Dialog.Description> : null}
              </div>
              <Dialog.Close className="yn-icon-button shrink-0" aria-label="閉じる">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            {children}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
