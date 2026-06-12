"use client";

export function StudentAiButton() {
  return (
    <button
      type="button"
      onClick={() => window.alert("AIメンター連携は次のフェーズで有効になります。")}
      className="inline-flex h-9 items-center justify-center rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white hover:bg-[#4f835d]"
    >
      AIメンターに次回プランを相談
    </button>
  );
}
