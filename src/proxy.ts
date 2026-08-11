import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { measurePerformance, sanitizePerformanceRoute } from "@/lib/performance";

const PUBLIC_FILE = /\.(.*)$/;

function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/auth") ||
    pathname === "/api/cron/radar-refresh" ||
    pathname === "/api/cron/radar-preflight" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Server Actions post back to the current route. If middleware turns that POST
  // into a login redirect, React receives an HTML page instead of an action
  // response and shows "This page couldn't load".
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  const isLogin = pathname === "/login";

  if (!hasSupabaseEnv()) {
    if (isLogin) return NextResponse.next();
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headersToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headersToSet).forEach(([name, value]) => response.headers.set(name, value));
        },
      },
    },
  );

  const { data } = await measurePerformance(
    { operation: "auth.verifyClaims", route: sanitizePerformanceRoute(pathname) },
    () => supabase.auth.getClaims(),
    undefined,
    (result) => !result.error && Boolean(result.data?.claims.sub),
  );
  const isAuthenticated = Boolean(data?.claims.sub);

  if (!isAuthenticated && !isLogin) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return redirectWithAuthCookies(loginUrl, response);
  }

  if (isAuthenticated && isLogin) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return redirectWithAuthCookies(dashboardUrl, response);
  }

  return response;
}

function redirectWithAuthCookies(url: URL, authResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);
  authResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));

  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = authResponse.headers.get(header);
    if (value) redirectResponse.headers.set(header, value);
  }

  return redirectResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
