import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_COOKIE, assertSameOrigin, clearSessionCookie, hashToken } from "@/lib/security";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    await assertSameOrigin(request);
    const token = (await cookies()).get(ADMIN_COOKIE)?.value;
    if (token) await db.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
    await clearSessionCookie(ADMIN_COOKIE);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "مرفوض" }, { status: 403 }); }
}
