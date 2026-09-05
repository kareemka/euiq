import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertSameOrigin, getAuctionUser } from "@/lib/security";
import { rateLimit } from "@/lib/rateLimit";
import { z } from "zod";

const schema = z.object({ productId: z.string().min(1).max(100) });

export async function POST(request: Request) {
  try {
    await assertSameOrigin(request);
    const user = await getAuctionUser();
    if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    if (!rateLimit(`bid:${user.id}`, 20, 10_000)) return NextResponse.json({ error: "انتظر قليلاً قبل المزايدة مرة أخرى" }, { status: 429 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "طلب غير صحيح" }, { status: 400 });

    const result = (await db.$transaction(async () => {
      const rows = await db.product.findMany({
        where: { id: parsed.data.productId },
        select: { id: true, currentPrice: true, bidIncrement: true, startsAt: true, endsAt: true, active: true },
      });
      const p = rows[0];
      const now = new Date();
      if (!p || !p.active || p.startsAt > now || p.endsAt <= now) throw new Error("ENDED");
      const amount = p.currentPrice + p.bidIncrement;
      await db.bid.create({ data: { amount, productId: p.id, userId: user.id } });
      return db.product.update({ where: { id: p.id }, data: { currentPrice: amount } });
    })) as Awaited<ReturnType<typeof db.product.update>>;

    return NextResponse.json({ ok: true, currentPrice: result.currentPrice });
  } catch (e) {
    const msg = e instanceof Error && e.message === "ENDED" ? "المزاد منتهي" : "تعذر تنفيذ المزايدة";
    return NextResponse.json({ error: msg }, { status: 409 });
  }
}
