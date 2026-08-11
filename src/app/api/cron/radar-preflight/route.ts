import { isAuthorizedRadarCronRequest } from "@/lib/radar/guards";
import { preflightRadarRuntime } from "@/lib/radar/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
  if (!isAuthorizedRadarCronRequest(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const result = await preflightRadarRuntime();
  const ok = result.key_present && result.api_connected && result.web_search_available;
  console.info("radar.runtime_preflight", JSON.stringify({ ok, ...result }));
  return Response.json({ ok, ...result }, { status: ok ? 200 : 503 });
}
