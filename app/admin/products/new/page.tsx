"use client";
import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Gavel,
  X,
  ImagePlus,
  Clock,
  Tag,
  Calendar,
  AlertCircle,
  CheckCircle2,
  PackagePlus,
  ChevronLeft,
  ShieldAlert
} from "lucide-react";
import "./styles.css";

const money = (n: number) => `${n.toLocaleString("en-US")} د.ع`;

function formatWhen(value: string) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("ar-IQ", {
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
    reservePrice: "",
    bidIncrement: "",
    startsAt: "",
    endsAt: "",
    blurImage: false,
  });

  function set<K extends keyof typeof form>(key: K, val: string | boolean) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleFile(file: File) {
    setError("");
    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الملف كبير جداً (الحد الأقصى المسموح 5 ميغابايت)");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("يجب اختيار ملف صورة صالح (JPG, PNG, WebP, GIF)");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "تعذر رفع الصورة");
        return;
      }
      setImageUrl(data.url);
    } catch {
      setError("حدث خطأ أثناء رفع الصورة إلى الخادم");
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
      setError("يرجى ملء جميع الحقول المطلوبة ورفع صورة المنتج");
      return;
    }

    const opening = Number(form.openingPrice);
    const reserve = form.reservePrice ? Number(form.reservePrice) : null;

    if (reserve !== null && reserve < opening) {
      setError("أقل سعر للبيع (السعر الاحتياطي) يجب أن يكون مساوياً أو أعلى من سعر الافتتاح");
      return;
    }

    const starts = new Date(form.startsAt);
    const ends = new Date(form.endsAt);
    if (isNaN(starts.getTime()) || isNaN(ends.getTime())) {
      setError("يرجى التأكد من صحة تواريخ المزاد");
      return;
    }
    if (ends <= starts) {
      setError("وقت نهاية المزاد يجب أن يكون بعد وقت البداية");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          imageUrl,
          openingPrice: opening,
          reservePrice: reserve,
          bidIncrement: Number(form.bidIncrement),
          startsAt: starts.toISOString(),
          endsAt: ends.toISOString(),
          active: true,
          blurImage: form.blurImage,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(typeof data.error === "string" ? data.error : "تعذر إضافة المنتج، يرجى مراجعة البيانات");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  const startsLabel = useMemo(() => formatWhen(form.startsAt), [form.startsAt]);
  const endsLabel = useMemo(() => formatWhen(form.endsAt), [form.endsAt]);

  const previewOpening = form.openingPrice ? Number(form.openingPrice) : 0;
  const previewReserve = form.reservePrice ? Number(form.reservePrice) : 0;
  const previewIncrement = form.bidIncrement ? Number(form.bidIncrement) : 0;

  return (
    <main className="newProductAdmin">
      {/* Header bar matching adminTop */}
      <header className="newProductHeader">
        <div className="newProductTitleArea">
          <div className="newProductBreadcrumb">
            <span>لوحة التحكم</span>
            <ChevronLeft size={14} />
            <span>المنتجات</span>
            <ChevronLeft size={14} />
            <span>إضافة منتج جديد</span>
          </div>
          <h1>
            <PackagePlus size={28} />
            إضافة منتج جديد للمزاد
          </h1>
          <p>املأ تفاصيل القطعة ومواعيد مزايدتها والحد الأدنى للبيع لعرضها للجمهور</p>
        </div>

        <button
          type="button"
          className="newProductBackBtn"
          onClick={() => router.push("/admin")}
        >
          <ArrowRight size={18} />
          العودة للوحة التحكم
        </button>
      </header>

      <div className="newProductLayout">
        {/* Left/Main Column: Form */}
        <div className="newProductFormCard">
          {error && (
            <div className="newProductFormAlert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit}>
            {/* Section 1: Basic Information */}
            <div className="formSection">
              <div className="formSectionHeader">
                <Tag size={18} />
                <h3>المعلومات الأساسية</h3>
                <span>اسم القطعة وتفاصيلها</span>
              </div>

              <div className="formField">
                <label>
                  <span>اسم المنتج</span>
                  <span className="req">* مطلوب</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: ساعة رولكس ديت جست أصلية 36 ملم"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  maxLength={120}
                  required
                />
              </div>

              <div className="formField">
                <label>
                  <span>وصف المنتج</span>
                  <span style={{ color: "#718290", fontSize: "12px" }}>اختياري</span>
                </label>
                <textarea
                  placeholder="أضف وصفاً شاملاً لحالة المنتج، المواصفات، والملحقات..."
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  maxLength={1000}
                  rows={3}
                />
              </div>
            </div>

            {/* Section 2: Product Image */}
            <div className="formSection">
              <div className="formSectionHeader">
                <ImagePlus size={18} />
                <h3>صورة المنتج</h3>
                <span>الصورة الرئيسية للبطاقة</span>
              </div>

              <div className="formField">
                <label>
                  <span>رفع الصورة</span>
                  <span className="req">* مطلوب</span>
                </label>

                <div
                  className={`uploadCard ${imageUrl ? "uploaded" : ""} ${dragActive ? "dragOver" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={onDrop}
                  onClick={() => !uploading && !imageUrl && fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />

                  {uploading ? (
                    <div className="uploadPlaceholder">
                      <span className="uploadSpinner" />
                      <b>جاري معالجة ورفع الصورة...</b>
                      <small>يرجى الانتظار ثوانٍ قليلة</small>
                    </div>
                  ) : imageUrl ? (
                    <div className="uploadPreviewWrap">
                      <img src={imageUrl} alt="صورة المنتج المرفوعة" />
                      <div className="uploadSuccessTag">
                        <CheckCircle2 size={14} />
                        <span>تم رفع الصورة بنجاح</span>
                      </div>
                      <button
                        type="button"
                        className="uploadRemoveBtn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageUrl("");
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                      >
                        <X size={14} />
                        إزالة الصورة
                      </button>
                    </div>
                  ) : (
                    <div className="uploadPlaceholder">
                      <div className="uploadIconWrap">
                        <ImagePlus size={26} />
                      </div>
                      <b>اسحب الصورة وأفلتها هنا، أو اضغط للاختيار</b>
                      <small>يدعم JPG · PNG · WebP · GIF (الحد الأقصى 5 ميغابايت)</small>
                    </div>
                  )}
                </div>

                <label className="blurToggleRow">
                  <input
                    type="checkbox"
                    checked={form.blurImage}
                    onChange={(e) => set("blurImage", e.target.checked)}
                  />
                  <span className="blurToggleUi" />
                  <div className="blurToggleText">
                    <b>
                      <ShieldAlert size={15} />
                      تظليل صورة المنتج في الموقع
                    </b>
                    <small>
                      عند تفعيل هذا الخيار تظهر صورة المنتج مظللة مع زر "عرض" في الموقع،
                      ويضغط المزايد لعرض الصورة.
                    </small>
                  </div>
                </label>
              </div>
            </div>

            {/* Section 3: Pricing, Reserve Price & Timing */}
            <div className="formSection">
              <div className="formSectionHeader">
                <Calendar size={18} />
                <h3>الأسعار، الحد الأدنى للبيع ومواعيد المزاد</h3>
                <span>تحديد الشروط المالية والمدة</span>
              </div>

              <div className="formGrid2">
                <div className="formField">
                  <label>
                    <span>سعر الافتتاح (د.ع)</span>
                    <span className="req">* مطلوب</span>
                  </label>
                  <div className="formInputWrapper">
                    <input
                      type="number"
                      placeholder="مثال: 50000"
                      min="1"
                      step="1"
                      value={form.openingPrice}
                      onChange={(e) => set("openingPrice", e.target.value)}
                      required
                    />
                    <span className="inputCurrencyBadge">د.ع</span>
                  </div>
                </div>

                <div className="formField">
                  <label>
                    <span>أقل سعر للبيع / السعر الاحتياطي (د.ع)</span>
                    <span style={{ color: "var(--gold, #D9A83E)", fontSize: "12px" }}>حماية المزاد</span>
                  </label>
                  <div className="formInputWrapper">
                    <input
                      type="number"
                      placeholder="مثال: 80000 (اختياري)"
                      min="1"
                      step="1"
                      value={form.reservePrice}
                      onChange={(e) => set("reservePrice", e.target.value)}
                    />
                    <span className="inputCurrencyBadge">د.ع</span>
                  </div>
                  <small style={{ color: "#718290", fontSize: "11.5px", marginTop: "2px" }}>
                    لن يُباع المزاد ولن يعتبر فائزاً إذا لم تصل المزايدات لهذا السعر أو تتجاوزه.
                  </small>
                </div>

                <div className="formField">
                  <label>
                    <span>خط المزايدة الأدنى (د.ع)</span>
                    <span className="req">* مطلوب</span>
                  </label>
                  <div className="formInputWrapper">
                    <input
                      type="number"
                      placeholder="مثال: 5000"
                      min="1"
                      step="1"
                      value={form.bidIncrement}
                      onChange={(e) => set("bidIncrement", e.target.value)}
                      required
                    />
                    <span className="inputCurrencyBadge">د.ع</span>
                  </div>
                </div>

                <div className="formField">
                  <label>
                    <span>تاريخ ووقت البداية</span>
                    <span className="req">* مطلوب</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => set("startsAt", e.target.value)}
                    required
                  />
                </div>

                <div className="formField" style={{ gridColumn: "1 / -1" }}>
                  <label>
                    <span>تاريخ ووقت النهاية</span>
                    <span className="req">* مطلوب</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(e) => set("endsAt", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="newProductSubmitBtn"
              disabled={loading || uploading || !imageUrl}
            >
              <Gavel size={19} />
              {loading ? "جاري إضافة المنتج..." : "نشر المنتج في المزاد"}
            </button>
          </form>
        </div>

        {/* Right/Sticky Column: Live Preview matching auction client */}
        <aside className="newProductPreviewPanel">
          <div className="previewPanelHeader">
            <span>معاينة حية كما تظهر للمستخدمين</span>
            <span className="previewLiveBadge">
              <span className="previewPulseDot" />
              مباشر
            </span>
          </div>

          <article className="previewAuctionCard">
            <div className="previewCardImage">
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt={form.name || "معاينة المنتج"}
                    className={form.blurImage ? "previewBlurred" : ""}
                  />
                  {form.blurImage && (
                    <span className="previewBlurOverlay">الصورة مظللة — زر العرض سيظهر للمستخدم</span>
                  )}
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <ImagePlus size={36} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                  <div style={{ fontSize: "12.5px", color: "#536473" }}>بانتظار رفع صورة المنتج...</div>
                </div>
              )}
              <span className="previewCardTimer">
                <Clock size={15} />
                04:25:18
              </span>
            </div>

            <div className="previewCardBody">
              <h2>{form.name || "عنوان المنتج يظهر هنا"}</h2>
              <p className="previewCardDesc">
                {form.description || "وصف المنتج المختصر كما سيراه المزايدون في صفحة المزادات..."}
              </p>

              <div className="previewPriceRow">
                <span>السعر الافتتاحي</span>
                <b>{previewOpening > 0 ? money(previewOpening) : "— د.ع"}</b>
              </div>

              {previewReserve > 0 && (
                <div className="previewPriceRow" style={{ color: "var(--gold, #D9A83E)" }}>
                  <span>أقل سعر للبيع (الاحتياطي)</span>
                  <b style={{ color: "var(--light, #F2C65D)" }}>{money(previewReserve)}</b>
                </div>
              )}

              <div className="previewPriceRow current">
                <span>أعلى سعر حالياً</span>
                <b>{previewOpening > 0 ? money(previewOpening) : "— د.ع"}</b>
              </div>

              <div className="previewDatesMeta">
                <div>
                  <small>بداية المزاد:</small>
                  <span>{startsLabel || "غير محدد بعد"}</span>
                </div>
                <div>
                  <small>نهاية المزاد:</small>
                  <span>{endsLabel || "غير محدد بعد"}</span>
                </div>
              </div>

              <div className="previewMockBtn">
                <Gavel size={16} />
                {previewIncrement > 0
                  ? `زايد ${money(previewIncrement)}`
                  : "زايد (قيمة الخطوة)"}
              </div>
            </div>
          </article>
        </aside>
      </div>
    </main>
  );
}