import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertSameOrigin, getAdmin } from "@/lib/security";
import { productSchema } from "@/lib/validation";

export async function GET() {
  if (!await getAdmin()) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const products = await db.product.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { bids: true } } } });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  try {
    await assertSameOrigin(request);
    if (!await getAdmin()) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const parsed = productSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const v = parsed.data;
    const p = await db.product.create({ data: {
      name: v.name, description: v.description, imageUrl: v.imageUrl,
      openingPrice: v.openingPrice, reservePrice: v.reservePrice || null,
      currentPrice: v.openingPrice, bidIncrement: v.bidIncrement,
      startsAt: new Date(v.startsAt), endsAt: new Date(v.endsAt), active: v.active,
      blurImage: v.blurImage ?? false
    }});
    return NextResponse.json(p, { status: 201 });
  } catch { return NextResponse.json({ error: "مرفوض" }, { status: 403 }); }
}
