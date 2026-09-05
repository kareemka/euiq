"use client";
import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Gavel, X, ImagePlus, Clock, Tag } from "lucide-react";

const priceFmt = new Intl.NumberFormat("ar", { numberingSystem: "latn" });

function formatWhen(value: string) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("ar-IQ", {
    numberingSystem: "latn",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function AddProductPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
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
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "تعذر رفع الصورة"); return; }
      setImageUrl(data.url);
    } catch {
      setError("خطأ في رفع الصورة");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
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

  const startsLabel = useMemo(() => formatWhen(form.startsAt), [form.startsAt]);
  const endsLabel = useMemo(() => formatWhen(form.endsAt), [form.endsAt]);

  return (
    <main className="lotAdmin">
      <div className="lotAdminTop">
        <div>
          <span className="lotAdminEyebrow">قطعة جديدة</span>
          <h1>إضافة منتج للمزاد</h1>
        </div>
        <button type="button" className="lotBackBtn" onClick={() => router.push("/admin")}>
          <ArrowRight size={18} /> رجوع
        </button>
      </div>

      <div className="lotAdminBody">
        <form className="lotForm" onSubmit={submit}>
          {error && <div className="lotFormError">{error}</div>}

          <section className="lotSection">
            <div className="lotField">
              <label>اسم المنتج *</label>
              <input
                type="text"
                placeholder="مثال: عطر فاخر"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                maxLength={120}
                required
              />
            </div>

            <div className="lotField">
              <label>الوصف (اختياري)</label>
              <textarea
                placeholder="وصف مختصر للمنتج..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                maxLength={1000}
                rows={3}
              />
            </div>

            <div className="lotField">
              <label>صورة المنتج *</label>
              <div
                className={`lotUpload ${imageUrl ? "is-done" : ""} ${uploading ? "is-uploading" : ""} ${dragActive ? "is-drag" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
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
                  <div className="lotUploadState">
                    <span className="lotSpinner" />
                    <span>جاري الرفع...</span>
                  </div>
                ) : imageUrl ? (
                  <div className="lotUploadDone">
                    <img src={imageUrl} alt="المنتج" />
                    <button
                      type="button"
                      className="lotUploadRemove"
                      onClick={(e) => { e.stopPropagation(); setImageUrl(""); }}
                    >
                      <X size={15} /> إزالة الصورة
                    </button>
                  </div>
                ) : (
                  <div className="lotUploadState">
                    <ImagePlus size={30} />
                    <span>اسحب الصورة هنا أو اضغط للاختيار</span>
                    <small>JPG · PNG · WEBP · GIF — حتى 5 ميغابايت</small>
                  </div>
                )}
              </div>
            </div>
          </section>

          <hr className="lotRule" />

          <section className="lotSection lotSection--grid">
            <div className="lotField">
              <label>سعر الافتتاح (د.ع) *</label>
              <input type="number" placeholder="25000" min="1" step="1" value={form.openingPrice} onChange={(e) => set("openingPrice", e.target.value)} required />
            </div>
            <div className="lotField">
              <label>خط المزايدة (د.ع) *</label>
              <input type="number" placeholder="1000" min="1" step="1" value={form.bidIncrement} onChange={(e) => set("bidIncrement", e.target.value)} required />
            </div>
            <div className="lotField">
              <label>وقت البداية *</label>
              <input type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} required />
            </div>
            <div className="lotField">
              <label>وقت النهاية *</label>
              <input type="datetime-local" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} required />
            </div>
          </section>

          <button type="submit" className="lotSubmitBtn" disabled={loading || uploading || !imageUrl}>
            <Gavel size={18} />
            {loading ? "جاري الإضافة..." : "إضافة المنتج"}
          </button>
        </form>

        <aside className="lotPreview">
          <span className="lotPreviewLabel">معاينة البطاقة في المزاد</span>
          <div className="lotCard">
            <div className="lotCardImage">
              {imageUrl ? <img src={imageUrl} alt="" /> : <ImagePlus size={28} />}
            </div>
            <div className="lotCardBody">
              <h3>{form.name || "اسم المنتج"}</h3>
              {form.description && <p>{form.description}</p>}

              <div className="lotCardRow">
                <Tag size={14} />
                <span>
                  {form.openingPrice ? `${priceFmt.format(Number(form.openingPrice))} د.ع` : "سعر الافتتاح"}
                  {form.bidIncrement ? ` · مزايدة +${priceFmt.format(Number(form.bidIncrement))}` : ""}
                </span>
              </div>

              <div className="lotCardRow">
                <Clock size={14} />
                <span>
                  {startsLabel && endsLabel ? `${startsLabel} — ${endsLabel}` : "مواعيد المزاد"}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}