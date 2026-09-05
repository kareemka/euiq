import { NextResponse } from "next/server";
import argon2 from "argon2";
import { db } from "@/lib/db";
import { adminLoginSchema } from "@/lib/validation";
import { assertSameOrigin, createAdminSession } from "@/lib/security";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    await assertSameOrigin(request);
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(`admin-login:${ip}`, 8, 15 * 60_000)) return NextResponse.json({ error: "محاولات كثيرة. حاول لاحقاً." }, { status: 429 });
    const parsed = adminLoginSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 400 });
    const admin = await db.admin.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (!admin || !admin.active || !await argon2.verify(admin.passwordHash, parsed.data.password)) {
      return NextResponse.json({ error: "البريد أو كلمة المرور غير صحيحة" }, { status: 401 });
    }
    await createAdminSession(admin.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "الطلب مرفوض" }, { status: 403 });
  }
}
