import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(self), geolocation=(), interest-cohort=()"
  );
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // All API routes handle their own auth
  if (pathname.startsWith("/api/")) {
    return addSecurityHeaders(NextResponse.next({ request }));
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLoginRoute = pathname === "/admin/login";
  const isAdminCookie = request.cookies.get("admin_mode")?.value === "true";

  // ============ ADMIN PROTECTION ============
  if (isAdminRoute) {
    if (isAdminLoginRoute) {
      if (isAdminCookie) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/users";
        return addSecurityHeaders(NextResponse.redirect(url));
      }
      return addSecurityHeaders(NextResponse.next({ request }));
    }

    if (!isAdminCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return addSecurityHeaders(NextResponse.redirect(url));
    }

    return addSecurityHeaders(NextResponse.next({ request }));
  }

  // ============ USER AUTH ============
  const publicRoutes = ["/login", "/signup"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const sessionCookie = getSessionCookie(request);
  const isGuest = request.cookies.get("guest_mode")?.value === "true";

  if (!sessionCookie && !isGuest && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return addSecurityHeaders(NextResponse.redirect(url));
  }

  if (sessionCookie && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return addSecurityHeaders(NextResponse.redirect(url));
  }

  return addSecurityHeaders(NextResponse.next({ request }));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};