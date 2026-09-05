import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertSameOrigin, getAdmin } from "@/lib/security";
import { productUpdateSchema } from "@/lib/validation";
import type { Prisma } from "@prisma/client";

type Data = Prisma.ProductUpdateInput;

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin(request);
    if (!await getAdmin()) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const parsed = productUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    const { id } = await ctx.params;
    const d = parsed.data;
    const data: Data = {};
    if (d.name !== undefined) data.name = d.name;
    if (d.description !== undefined) data.description = d.description;
    if (d.imageUrl !== undefined) data.imageUrl = d.imageUrl;
    if (d.openingPrice !== undefined) data.openingPrice = d.openingPrice;
    if (d.reservePrice !== undefined) data.reservePrice = d.reservePrice;
    if (d.bidIncrement !== undefined) data.bidIncrement = d.bidIncrement;
    if (d.startsAt) data.startsAt = new Date(d.startsAt);
    if (d.endsAt) data.endsAt = new Date(d.endsAt);
    if (d.active !== undefined) data.active = d.active;
    if (d.blurImage !== undefined) data.blurImage = d.blurImage;
    const p = await db.product.update({ where: { id }, data });
    return NextResponse.json(p);
  } catch { return NextResponse.json({ error: "تعذر التعديل" }, { status: 400 }); }
}

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin(request);
    if (!await getAdmin()) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const { id } = await ctx.params;
    await db.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "تعذر الحذف" }, { status: 400 }); }
}