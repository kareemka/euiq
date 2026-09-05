import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/security";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    if (!await getAdmin()) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "لا يوجد ملف" }, { status: 400 });
    if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "نوع الملف غير مدعوم (jpg, png, webp, gif فقط)" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "الملف كبير جداً (الحد الأقصى 5 ميغابايت)" }, { status: 400 });

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch {
    return NextResponse.json({ error: "تعذر الرفع" }, { status: 500 });
  }
}
