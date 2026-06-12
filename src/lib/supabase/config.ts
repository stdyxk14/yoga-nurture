export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function getSupabaseConfig() {
  return {
    url: supabaseUrl,
    publishableKey: supabasePublishableKey,
    missing: !supabaseUrl || !supabasePublishableKey,
  };
}

export function getSupabaseConfigError() {
  const missing = [
    !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !supabasePublishableKey ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" : null,
  ].filter(Boolean);

  if (!missing.length) return null;
  return `Supabase environment variables are missing: ${missing.join(", ")}`;
}
