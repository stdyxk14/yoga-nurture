"use client";

import { Printer } from "lucide-react";

export function ScriptPrintButton({ label = "印刷する" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white shadow-[0_10px_22px_rgba(70,115,78,0.18)]"
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
