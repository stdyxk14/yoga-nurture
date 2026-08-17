import { Suspense } from "react";
import { DashboardSecondaryView, DashboardView } from "@/components/yoga/dashboard-view";
import { TodayAiSuggestionPanel } from "@/components/yoga/daily-suggestion-panel";
import { getDailySuggestionState } from "@/lib/daily-suggestions/queries";
import { getDashboardData, type DashboardSecondaryData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const dashboard = getDashboardData(month);
  const dailySuggestionPromise = getDailySuggestionState();
  const data = await dashboard.primary;

  return (
    <DashboardView
      data={data}
      dailySuggestionPanel={
        <Suspense fallback={<DailySuggestionSkeleton />}>
          <DailySuggestionSection statePromise={dailySuggestionPromise} />
        </Suspense>
      }
      secondaryPanel={
        <Suspense fallback={<DashboardSecondarySkeleton />}>
          <DashboardSecondarySection dataPromise={dashboard.secondary} />
        </Suspense>
      }
    />
  );
}

async function DailySuggestionSection({ statePromise }: { statePromise: ReturnType<typeof getDailySuggestionState> }) {
  return <TodayAiSuggestionPanel state={await statePromise} />;
}

async function DashboardSecondarySection({ dataPromise }: { dataPromise: Promise<DashboardSecondaryData> }) {
  return <DashboardSecondaryView data={await dataPromise} />;
}

function DailySuggestionSkeleton() {
  return (
    <section aria-label="今日のAIコーチを読み込み中" className="min-h-[390px] animate-pulse rounded-[24px] border border-[#d5e1d1] bg-[linear-gradient(145deg,#f5faf2,#fffaf5)] p-5">
      <div className="h-3 w-28 rounded bg-[#dbe8d7]" />
      <div className="mt-3 h-6 w-44 rounded bg-[#cfddcb]" />
      <div className="mt-6 grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-16 rounded-xl bg-white/75" />)}
      </div>
      <div className="mt-4 h-[220px] rounded-2xl bg-white/75" />
    </section>
  );
}

function DashboardSecondarySkeleton() {
  return (
    <div aria-label="ダッシュボードの分析を読み込み中" className="space-y-6">
      <div className="h-48 animate-pulse rounded-[26px] border border-[#dce6d9] bg-white/75" />
      <div className="h-28 animate-pulse rounded-[26px] border border-[#dfe5dc] bg-[#f7faf5]" />
    </div>
  );
}
