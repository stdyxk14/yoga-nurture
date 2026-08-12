import { DashboardView } from "@/components/yoga/dashboard-view";
import { getDailySuggestionState } from "@/lib/daily-suggestions/queries";
import { getDashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export default async function DashboardPage() {
  const [data, dailySuggestionState] = await Promise.all([getDashboardData(), getDailySuggestionState()]);
  return <DashboardView data={data} dailySuggestionState={dailySuggestionState} />;
}
