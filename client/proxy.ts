import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggedInCookie = request.cookies.get("littlelyst_logged_in");

  // Protect /dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!loggedInCookie || loggedInCookie.value !== "1") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged in users away from auth pages
  if (pathname === "/login" || pathname === "/register") {
    if (loggedInCookie && loggedInCookie.value === "1") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
