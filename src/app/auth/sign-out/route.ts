import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // If Supabase env is missing, still send the user back to login.
  }

  return NextResponse.redirect(new URL("/login", request.url));
}
