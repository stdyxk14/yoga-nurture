import { isAuthorizedRadarCronRequest } from "@/lib/radar/guards";
import { runRadarForEligibleUser } from "@/lib/radar/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isAuthorizedRadarCronRequest(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const mode = new URL(request.url).searchParams.get("mode") === "bootstrap" ? "bootstrap" : "cron";
  try {
    const result = await runRadarForEligibleUser(mode);
    return Response.json({ ok: result.status !== "failed", mode, ...result }, { status: result.status === "failed" ? 503 : 200 });
  } catch {
    return Response.json({ ok: false, mode, status: "failed", error: "radar_refresh_failed" }, { status: 503 });
  }
}
