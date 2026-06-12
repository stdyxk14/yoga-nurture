"use client";

import { useState } from "react";

type AiCopyButtonProps = {
  text: string;
  label?: string;
};

export function AiCopyButton({ text, label = "改善案をコピー" }: AiCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex min-h-9 items-center justify-center rounded-xl border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58] transition hover:bg-[#f8fcf6]"
    >
      {copied ? "コピーしました" : label}
    </button>
  );
}
