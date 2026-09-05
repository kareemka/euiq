import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuctionUser } from "@/lib/security";

export async function GET(request: Request) {
  if (!await getAuctionUser()) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const hasPagination = searchParams.has("page") || searchParams.has("limit");

  if (hasPagination) {
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "6", 10)));
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      db.product.findMany({
        where: { active: true },
        orderBy: { endsAt: "asc" },
        skip,
        take: limit,
        include: { _count: { select: { bids: true } } }
      }),
      db.product.count({ where: { active: true } })
    ]);

    const mappedItems = products.map((p) => ({
      ...p,
      reserveMet: !p.reservePrice || p.currentPrice >= p.reservePrice,
    }));

    return NextResponse.json({
      items: mappedItems,
      total,
      page,
      limit,
      hasMore: skip + products.length < total
    });
  }

  const products = await db.product.findMany({
    where: { active: true },
    orderBy: { endsAt: "asc" },
    include: { _count: { select: { bids: true } } }
  });

  const mapped = products.map((p) => ({
    ...p,
    reserveMet: !p.reservePrice || p.currentPrice >= p.reservePrice,
  }));

  return NextResponse.json(mapped);
}
