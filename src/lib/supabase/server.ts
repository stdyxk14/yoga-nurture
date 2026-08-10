import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { cache } from "react";
import { measurePerformance } from "@/lib/performance";
import { getSupabaseConfig, getSupabaseConfigError } from "@/lib/supabase/config";

export async function createSupabaseServerClient() {
  const config = getSupabaseConfig();

  if (config.missing) {
    throw new Error(getSupabaseConfigError() ?? "Supabase environment variables are missing.");
  }

  const cookieStore = await cookies();

  return createServerClient(config.url!, config.publishableKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies. Route handlers and middleware can.
        }
      },
    },
  });
}

export type RequestSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

// React cache is reset for every Server Component render / Server Action request.
// It deduplicates within that request without sharing a user's client or auth state
// with another request.
export const getRequestSupabaseClient = cache(createSupabaseServerClient);

export const requireAuthClaims = cache(async () => {
  noStore();
  const supabase = await getRequestSupabaseClient();
  const { data, error } = await measurePerformance(
    { operation: "auth.verifyClaims", route: "server-request" },
    () => supabase.auth.getClaims(),
    undefined,
    (result) => !result.error && Boolean(result.data?.claims.sub),
  );
  const userId = data?.claims.sub;

  if (error || !userId) {
    redirect("/login");
  }

  return { supabase, userId, claims: data.claims };
});

export const requireFreshUser = cache(async () => {
  const { supabase, userId, claims } = await requireAuthClaims();
  const {
    data: { user },
    error,
  } = await measurePerformance(
    { operation: "auth.getFreshUser", route: "server-request" },
    () => supabase.auth.getUser(),
    undefined,
    (result) => !result.error && Boolean(result.data.user),
  );

  if (error || !user || user.id !== userId) {
    redirect("/login");
  }

  return { supabase, userId, claims, user };
});

export const createMutationContext = cache(async () => {
  const { supabase, userId, claims } = await requireAuthClaims();
  return { supabase, userId, claims };
});
