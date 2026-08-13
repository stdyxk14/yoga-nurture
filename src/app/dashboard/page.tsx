import { DashboardView } from "@/components/yoga/dashboard-view";
import { getDailySuggestionState } from "@/lib/daily-suggestions/queries";
import { getDashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const [data, dailySuggestionState] = await Promise.all([getDashboardData(month), getDailySuggestionState()]);
  return <DashboardView data={data} dailySuggestionState={dailySuggestionState} />;
}
