"use client";

import { useState, type ReactNode } from "react";
import { CompactEmptyState, DonutMetric, type MetricSegment } from "@/components/yoga/data-visuals";
import type { RatioRow } from "@/lib/reports";
import { cn } from "@/lib/utils";

type StudentCompositionDataset = {
  total: number;
  ageRows: RatioRow[];
  genderRows: RatioRow[];
};

type CompositionScope = "participants" | "registered";

const ageCategories = [
  { label: "20代", color: "#6f9875" },
  { label: "30代", color: "#6887a5" },
  { label: "40代", color: "#c17d8d" },
  { label: "50代", color: "#b39262" },
  { label: "60代以上", color: "#8578b2" },
  { label: "年齢不明", color: "#8a9189" },
] as const;

const genderCategories = [
  { label: "女性", color: "#c17d8d" },
  { label: "男性", color: "#6887a5" },
  { label: "その他", color: "#8578b2" },
  { label: "回答しない", color: "#b39262" },
  { label: "未登録", color: "#8a9189" },
] as const;

export function StudentCompositionVisual({
  registered,
  participants,
}: {
  registered: StudentCompositionDataset;
  participants: StudentCompositionDataset;
}) {
  const [scope, setScope] = useState<CompositionScope>(participants.total > 0 ? "participants" : "registered");
  const selected = scope === "participants" ? participants : registered;
  const scopeLabel = scope === "participants" ? "期間内参加" : "登録生徒";
  const ageSegments = aggregateAgeSegments(selected.ageRows);
  const genderSegments = aggregateGenderSegments(selected.genderRows);

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] font-medium text-[#687068]">表示対象</p>
        <div className="inline-grid max-w-full grid-cols-2 rounded-lg bg-[#efeee9] p-1" role="group" aria-label="生徒構成の表示対象">
          <ScopeButton active={scope === "participants"} onClick={() => setScope("participants")}>
            期間内参加 <span className="tabular-nums">{participants.total}名</span>
          </ScopeButton>
          <ScopeButton active={scope === "registered"} onClick={() => setScope("registered")}>
            登録生徒 <span className="tabular-nums">{registered.total}名</span>
          </ScopeButton>
        </div>
      </div>

      {selected.total === 0 ? (
        <CompactEmptyState label={scope === "participants" ? "期間内に参加した生徒はいません" : "登録生徒データがありません"} />
      ) : (
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <CompositionDonut title="年代構成" segments={ageSegments} scopeLabel={scopeLabel} />
          <CompositionDonut title="性別構成" segments={genderSegments} scopeLabel={scopeLabel} />
        </div>
      )}
    </div>
  );
}

function ScopeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "min-w-0 rounded-md px-3 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6f9875]",
        active ? "bg-white text-[#3f7048] shadow-sm" : "text-[#687068] hover:bg-white/60 hover:text-[#465047]",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function CompositionDonut({ title, segments, scopeLabel }: { title: string; segments: MetricSegment[]; scopeLabel: string }) {
  return (
    <section className="min-w-0 rounded-lg bg-[#faf9f5] p-3 sm:p-4">
      <h3 className="mb-3 text-[13px] font-semibold text-[#465047]">{title}</h3>
      <DonutMetric
        segments={segments}
        totalLabel={scopeLabel}
        emptyLabel="対象データなし"
        unit="名"
        legendColumns={2}
        showUnitInCenter
      />
    </section>
  );
}

function aggregateAgeSegments(rows: RatioRow[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = visualAgeCategory(row.label);
    counts.set(label, (counts.get(label) ?? 0) + row.count);
  }
  return ageCategories
    .map(({ label, color }) => ({ label, color, value: counts.get(label) ?? 0 }))
    .filter((segment) => segment.value > 0);
}

function visualAgeCategory(value: string) {
  const label = value.trim();
  if (!label || label === "年齢不明" || label === "未設定") return "年齢不明";
  const age = Number(label.match(/^\d{2,3}/)?.[0]);
  if (age >= 60) return "60代以上";
  if (age >= 50) return "50代";
  if (age >= 40) return "40代";
  if (age >= 30) return "30代";
  if (age >= 20) return "20代";
  return "年齢不明";
}

function aggregateGenderSegments(rows: RatioRow[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = visualGenderCategory(row.label);
    counts.set(label, (counts.get(label) ?? 0) + row.count);
  }
  return genderCategories
    .map(({ label, color }) => ({ label, color, value: counts.get(label) ?? 0 }))
    .filter((segment) => segment.value > 0);
}

function visualGenderCategory(value: string) {
  const label = value.trim();
  if (label === "女性" || label === "男性" || label === "その他" || label === "回答しない") return label;
  if (!label || label === "未設定" || label === "未登録") return "未登録";
  return "その他";
}
