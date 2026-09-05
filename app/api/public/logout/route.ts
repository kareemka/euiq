import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { USER_COOKIE, assertSameOrigin, clearSessionCookie, hashToken } from "@/lib/security";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    await assertSameOrigin(request);
    const token = (await cookies()).get(USER_COOKIE)?.value;
    if (token) await db.userSession.deleteMany({ where: { tokenHash: hashToken(token) } });
    await clearSessionCookie(USER_COOKIE);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "تعذر تسجيل الخروج" }, { status: 403 });
  }
}