"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export function LessonRecordDialog({ open, title, description, onClose, children, className }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const target = panel?.querySelector<HTMLElement>("[data-autofocus], input, select, textarea, button");
    window.requestAnimationFrame(() => target?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#20251f]/45 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-record-dialog-title"
        className={cn("max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[#dfe5da] bg-[#fbfaf6] shadow-xl", className)}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e5e4dc] bg-[#fbfaf6]/95 px-5 py-4 backdrop-blur">
          <div>
            <h2 id="lesson-record-dialog-title" className="text-lg font-semibold text-[#2f342e]">{title}</h2>
            {description ? <p className="mt-1 text-sm leading-6 text-[#687166]">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label="閉じる" className="rounded-lg p-2 text-[#687166] hover:bg-[#eef2eb]">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
