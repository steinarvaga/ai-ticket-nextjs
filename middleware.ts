import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Run on all matched paths (see config below)
  const token = request.cookies.get("token")?.value;

  // Build login URL with full return path
  const loginUrl = new URL("/login", request.nextUrl.origin);
  loginUrl.searchParams.set("next", `${pathname}${search || ""}`);

  // 1) No token → redirect to login
  if (!token) {
    return NextResponse.redirect(loginUrl);
  }

  // 2) Verify by calling your profile endpoint (cookie forwarded)
  try {
    const res = await fetch(`${request.nextUrl.origin}/api/profile`, {
      headers: { Cookie: request.headers.get("cookie") || "" },
    });
    if (!res.ok) throw new Error("profile fetch failed");
    const { authUser } = (await res.json()) as {
      authUser: { id: string; email: string; role?: string } | null;
    };
    if (!authUser) return NextResponse.redirect(loginUrl);

    // 3) Extra: gate /admin by role
    if (pathname.startsWith("/admin") && authUser.role !== "admin") {
      return NextResponse.redirect(
        new URL("/dashboard", request.nextUrl.origin)
      );
    }
  } catch {
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/admin/:path*", "/logout"],
};
