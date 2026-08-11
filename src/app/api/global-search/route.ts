import { NextResponse } from "next/server";
import { searchGlobal } from "@/lib/global-search";
import { isGlobalSearchQueryReady } from "@/lib/global-search-types";
import { requireFreshUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";

  if (!isGlobalSearchQueryReady(query)) {
    return NextResponse.json(
      { error: "検索語は2文字以上、または日本語1文字で入力してください。" },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const { supabase, userId } = await requireFreshUser();

  try {
    const result = await searchGlobal(supabase, userId, query);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("[global-search] Search failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "検索結果を取得できませんでした。少し待ってからもう一度入力してください。" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
