import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — anyone can access
  const publicRoutes = [
    "/login",
    "/signup",
    "/auth/callback",
    "/auth/verify",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check for session cookie (fast check, no DB call)
  const sessionCookie = getSessionCookie(request);
  const isGuest =
    request.cookies.get("guest_mode")?.value === "true";

  // Not logged in and not guest and not public → redirect to login
  if (!sessionCookie && !isGuest && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in user trying to access login/signup → go to home
  if (sessionCookie && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};