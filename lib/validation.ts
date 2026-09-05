import { z } from "zod";

export const quickRegisterSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^(07\d{8}|\+?9647\d{8})$/, "رقم الهاتف يجب أن يكون عراقياً (07XXXXXXXX أو +9647XXXXXXXX)")
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(10).max(200)
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  imageUrl: z.string().trim().min(1).max(500),
  openingPrice: z.number().int().positive().max(2_000_000_000),
  reservePrice: z.number().int().positive().max(2_000_000_000).optional().nullable(),
  bidIncrement: z.number().int().positive().max(100_000_000),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  active: z.boolean().default(true),
  blurImage: z.boolean().default(false)
}).refine(v => new Date(v.endsAt) > new Date(v.startsAt), { message: "endsAt must be after startsAt" })
  .refine(v => !v.reservePrice || v.reservePrice >= v.openingPrice, { message: "أقل سعر للبيع يجب أن يكون مساوياً أو أعلى من سعر الافتتاح" });
