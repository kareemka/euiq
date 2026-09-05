import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertSameOrigin, getAdmin } from "@/lib/security";
import { z } from "zod";

const patchSchema = z.object({
  active: z.boolean().optional(),
  endsAt: z.string().datetime().optional(),
  reservePrice: z.number().int().positive().optional().nullable(),
  blurImage: z.boolean().optional()
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin(request);
    if (!await getAdmin()) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    const { id } = await ctx.params;
    const data: { active?: boolean; endsAt?: Date; reservePrice?: number | null; blurImage?: boolean } = {};
    if (parsed.data.active !== undefined) data.active = parsed.data.active;
    if (parsed.data.endsAt) data.endsAt = new Date(parsed.data.endsAt);
    if (parsed.data.reservePrice !== undefined) data.reservePrice = parsed.data.reservePrice;
    if (parsed.data.blurImage !== undefined) data.blurImage = parsed.data.blurImage;
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
