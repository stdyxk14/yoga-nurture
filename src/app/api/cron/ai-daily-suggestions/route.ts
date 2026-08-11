import { runDailySuggestionsForEligibleUsers } from "@/lib/daily-suggestions/server";
import { isAuthorizedInternalAiCronRequest } from "@/lib/internal-ai/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isAuthorizedInternalAiCronRequest(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const users = await runDailySuggestionsForEligibleUsers("cron");
    const failed = users.filter((user) => user.result.status === "failed").length;
    return Response.json({ ok: failed === 0, userCount: users.length, failed }, { status: failed ? 503 : 200 });
  } catch {
    return Response.json({ ok: false, error: "ai_daily_cron_failed" }, { status: 503 });
  }
}
