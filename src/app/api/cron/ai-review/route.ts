import { isAuthorizedInternalAiCronRequest } from "@/lib/internal-ai/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAuthorizedInternalAiCronRequest(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return Response.json({ ok: false, error: "scheduled_review_disabled", message: "Teaching reviews are generated only after an explicit user selection." }, { status: 410 });
}
