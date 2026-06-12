"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig, getSupabaseConfigError } from "@/lib/supabase/config";

export function createSupabaseBrowserClient() {
  const config = getSupabaseConfig();

  if (config.missing) {
    throw new Error(getSupabaseConfigError() ?? "Supabase environment variables are missing.");
  }

  return createBrowserClient(config.url!, config.publishableKey!);
}
