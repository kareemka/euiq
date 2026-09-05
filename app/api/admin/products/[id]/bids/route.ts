import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdmin } from "@/lib/security";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!await getAdmin()) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const { id } = await ctx.params;
    const bids = await db.bid.findMany({
      where: { productId: id },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, phone: true } } },
    });
    return NextResponse.json(bids);
  } catch {
    return NextResponse.json({ error: "تعذر الجلب" }, { status: 400 });
  }
}
