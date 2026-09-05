import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path.startsWith("/admin") && path !== "/admin/login") {
    const hasCookie = Boolean(req.cookies.get("auction_admin_session")?.value);
    if (!hasCookie) return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
