"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Upload, X, ImagePlus } from "lucide-react";

export default function AddProductPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    openingPrice: "",
    bidIncrement: "",
    startsAt: "",
    endsAt: "",
  });

  function set<K extends keyof typeof form>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleFile(file: File) {
    setError("");
    if (file.size > 5 * 1024 * 1024) { setError("الملف كبير جداً (الحد الأقصى 5 ميغابايت)"); return; }
    if (!file.type.startsWith("image/")) { setError("يجب أن يكون الملف صورة"); return; }
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "تعذر رفع الصورة"); setPreview(""); return; }
      setImageUrl(data.url);
    } catch {
      setError("خطأ في رفع الصورة");
      setPreview("");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name || !imageUrl || !form.openingPrice || !form.bidIncrement || !form.startsAt || !form.endsAt) {
      setError("جميع الحقول المطلوبة يجب ملؤها");
      return;
    }
    const starts = new Date(form.startsAt);
    const ends = new Date(form.endsAt);
    if (ends <= starts) { setError("وقت النهاية يجب أن يكون بعد البداية"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          imageUrl,
          openingPrice: Number(form.openingPrice),
          bidIncrement: Number(form.bidIncrement),
          startsAt: starts.toISOString(),
          endsAt: ends.toISOString(),
          active: true,
        }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "تعذر الإضافة"); return; }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="adminContainer">
      <div className="adminTop">
        <div>
          <h1>إضافة منتج جديد</h1>
          <p>املأ البيانات أدناه لإضافة منتج للمزاد</p>
        </div>
        <button onClick={() => router.push("/admin")}><ArrowRight /> رجوع</button>
      </div>

      <form className="productForm" onSubmit={submit}>
        {error && <div className="formError">{error}</div>}

        <div className="formGrid">
          <div className="formFull">
            <label>اسم المنتج *</label>
            <input type="text" placeholder="مثال: عطر فاخر" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={120} required />
          </div>

          <div className="formFull">
            <label>الوصف (اختياري)</label>
            <textarea placeholder="وصف مختصر للمنتج..." value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={1000} rows={3} />
          </div>

          <div className="formFull">
            <label>صورة المنتج *</label>
            <div
              className={`uploadZone ${imageUrl ? "uploaded" : ""} ${uploading ? "uploading" : ""}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => !uploading && fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              {uploading ? (
                <div className="uploadProgress"><div className="spinner" /><span>جاري الرفع...</span></div>
              ) : imageUrl ? (
                <div className="uploadDone">
                  <img src={imageUrl} alt="المنتج" />
                  <button type="button" className="uploadRemove" onClick={(e) => { e.stopPropagation(); setImageUrl(""); setPreview(""); }}>
                    <X size={16} /> حذف
                  </button>
                </div>
              ) : (
                <div className="uploadHint">
                  <ImagePlus size={36} />
                  <span>اسحب الصورة هنا أو اضغط للاختيار</span>
                  <small>JPG, PNG, Webp, GIF — حتى 5 ميغابايت</small>
                </div>
              )}
            </div>
          </div>

          <div>
            <label>سعر الافتتاح (د.ع) *</label>
            <input type="number" placeholder="25000" min="1" step="1" value={form.openingPrice} onChange={(e) => set("openingPrice", e.target.value)} required />
          </div>

          <div>
            <label>خط المزايدة (د.ع) *</label>
            <input type="number" placeholder="1000" min="1" step="1" value={form.bidIncrement} onChange={(e) => set("bidIncrement", e.target.value)} required />
          </div>

          <div>
            <label>وقت البداية *</label>
            <input type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} required />
          </div>

          <div>
            <label>وقت النهاية *</label>
            <input type="datetime-local" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} required />
          </div>
        </div>

        <button type="submit" className="goldBtn" disabled={loading || uploading || !imageUrl}>
          <Upload size={18} />
          {loading ? "جاري الإضافة..." : "إضافة المنتج"}
        </button>
      </form>
    </main>
  );
}
