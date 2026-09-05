import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertSameOrigin, createUserSession } from "@/lib/security";
import { quickRegisterSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    await assertSameOrigin(request);
    const forwarded = request.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(`register:${forwarded}`, 20, 60_000)) return NextResponse.json({ error: "طلبات كثيرة" }, { status: 429 });
    const parsed = quickRegisterSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    const phone = parsed.data.phone.replace(/[^\d+]/g, "");
    const user = await db.auctionUser.upsert({
      where: { phone },
      update: { name: parsed.data.name },
      create: { name: parsed.data.name, phone }
    });
    await createUserSession(user.id);
    return NextResponse.json({ ok: true, user: { name: user.name } });
  } catch {
    return NextResponse.json({ error: "الطلب مرفوض" }, { status: 403 });
  }
}
