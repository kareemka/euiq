"use client";
import { useEffect, useState, useMemo } from "react";
import {
  Gavel,
  Package,
  Plus,
  Users,
  Wallet,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Phone,
  Search,
  RotateCw,
  ShieldCheck,
  Trash2,
  Play,
  Pause,
  Mail,
  PackageSearch,
  AlertTriangle,
  AlertCircle,
  X,
  Crown,
  MessageCircle,
  Clock,
  TrendingUp,
  Coins,
  Flame,
  Eye,
  EyeOff,
  Pencil
} from "lucide-react";
import { useRouter } from "next/navigation";
import "./admin.css";

type P = {
  id: string;
  name: string;
  imageUrl: string;
  currentPrice: number;
  openingPrice: number;
  bidIncrement: number;
  endsAt: string;
  startsAt?: string;
  active: boolean;
  blurImage: boolean;
  _count: { bids: number };
};

type Bid = {
  id: string;
  amount: number;
  createdAt: string;
  user: { id: string; name: string; phone: string };
};

const money = (n: number) => `${n.toLocaleString("en-US")} د.ع`;
const PAGE_SIZE = 8;

function formatBidTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat("ar-IQ", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function getWhatsAppUrl(phone: string) {
  const cleaned = phone.replace(/[^0-9]/g, "");
  const intl = cleaned.startsWith("0")
    ? "964" + cleaned.slice(1)
    : cleaned.startsWith("964")
    ? cleaned
    : "964" + cleaned;
  return `https://wa.me/${intl}`;
}

export default function AdminClient({ email }: { email: string }) {
  const [products, setProducts] = useState<P[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Inspector Drawer State
  const [selectedProduct, setSelectedProduct] = useState<P | null>(null);
  const [productBids, setProductBids] = useState<Bid[]>([]);
  const [loadingProductBids, setLoadingProductBids] = useState(false);

  // Custom Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<P | null>(null);
  const [deleting, setDeleting] = useState(false);

  const router = useRouter();

  const load = async () => {
    setRefreshing(true);
    try {
      const r = await fetch("/api/admin/products", { cache: "no-store" });
      if (r.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (r.ok) {
        const data: P[] = await r.json();
        setProducts(data);
        // If drawer is open, keep selectedProduct updated with fresh data
        if (selectedProduct) {
          const fresh = data.find((x) => x.id === selectedProduct.id);
          if (fresh) setSelectedProduct(fresh);
        }
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Keyboard Escape listener for Drawer & Delete Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (deleteTarget && !deleting) {
          setDeleteTarget(null);
        } else if (selectedProduct) {
          setSelectedProduct(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteTarget, deleting, selectedProduct]);

  // Reset page when search or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  // Open Auction Details & Bids Inspector Drawer
  async function openAuctionInspector(p: P) {
    setSelectedProduct(p);
    setLoadingProductBids(true);
    try {
      const r = await fetch(`/api/admin/products/${p.id}/bids`);
      if (r.ok) {
        setProductBids(await r.json());
      } else {
        setProductBids([]);
      }
    } catch {
      setProductBids([]);
    } finally {
      setLoadingProductBids(false);
    }
  }

  async function toggle(p: P) {
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !p.active }),
    });
    load();
  }

  async function toggleBlur(p: P) {
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blurImage: !p.blurImage }),
    });
    load();
  }

  // Confirm delete handler for custom modal
  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/admin/products/${deleteTarget.id}`, { method: "DELETE" });
      if (r.ok) {
        if (selectedProduct?.id === deleteTarget.id) {
          setSelectedProduct(null);
        }
        setDeleteTarget(null);
        load();
      } else {
        alert("تعذر حذف المنتج، يرجى المحاولة مرة أخرى");
      }
    } catch {
      alert("حدث خطأ أثناء محاولة حذف المنتج");
    } finally {
      setDeleting(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  // Filter products by search query and tab
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (activeTab === "active") return p.active;
      if (activeTab === "inactive") return !p.active;
      return true;
    });
  }, [products, searchQuery, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  const activeCount = products.filter((p) => p.active).length;
  const inactiveCount = products.length - activeCount;
  const totalBids = products.reduce((a, p) => a + (p._count?.bids || 0), 0);
  const totalValue = products.reduce((a, p) => a + (p.currentPrice || 0), 0);

  // Inspector calculations
  const leadingBidder = productBids.length > 0 ? productBids[0] : null;
  const priceGrowth = selectedProduct
    ? Math.max(0, selectedProduct.currentPrice - selectedProduct.openingPrice)
    : 0;
  const growthPercent =
    selectedProduct && selectedProduct.openingPrice > 0
      ? Math.round((priceGrowth / selectedProduct.openingPrice) * 100)
      : 0;

  return (
    <main className="adminPageWrapper">
      {/* Top Header */}
      <header className="adminHeader">
        <div className="adminHeaderTitleArea">
          <span className="adminHeaderBadge">
            <ShieldCheck size={14} />
            لوحة الإدارة الآمنة
          </span>
          <h1>لوحة تحكم المزادات</h1>
          <p className="adminEmailText">
            <Mail size={14} />
            {email}
          </p>
        </div>

        <div className="adminHeaderActions">
          <button
            type="button"
            className={`adminRefreshBtn ${refreshing ? "isSpinning" : ""}`}
            onClick={load}
            title="تحديث البيانات"
          >
            <RotateCw size={17} />
          </button>
          <button type="button" className="adminLogoutBtn" onClick={logout}>
            <LogOut size={16} />
            تسجيل الخروج
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="adminStatsGrid">
        <div className="statCard">
          <div className="statIconBox green">
            <Package size={22} />
          </div>
          <div className="statContent">
            <span className="statLabel">المنتجات النشطة</span>
            <b className="statValue">{activeCount}</b>
          </div>
        </div>

        <div className="statCard">
          <div className="statIconBox gold">
            <Gavel size={22} />
          </div>
          <div className="statContent">
            <span className="statLabel">إجمالي المزايدات</span>
            <b className="statValue">{totalBids}</b>
          </div>
        </div>

        <div className="statCard">
          <div className="statIconBox blue">
            <Wallet size={22} />
          </div>
          <div className="statContent">
            <span className="statLabel">قيمة المزادات</span>
            <b className="statValue">{money(totalValue)}</b>
          </div>
        </div>

        <div className="statCard">
          <div className="statIconBox amber">
            <Users size={22} />
          </div>
          <div className="statContent">
            <span className="statLabel">إجمالي المعروضات</span>
            <b className="statValue">{products.length}</b>
          </div>
        </div>
      </section>

      {/* Action Controls & Filter Bar */}
      <div className="adminControlsBar">
        <div className="adminSearchFilterGroup">
          <div className="adminSearchBox">
            <Search size={16} />
            <input
              type="text"
              placeholder="بحث باسم المنتج..."
              className="adminSearchInput"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="adminFilterTabs">
            <button
              type="button"
              className={`filterTabBtn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              الكل ({products.length})
            </button>
            <button
              type="button"
              className={`filterTabBtn ${activeTab === "active" ? "active" : ""}`}
              onClick={() => setActiveTab("active")}
            >
              النشطة ({activeCount})
            </button>
            <button
              type="button"
              className={`filterTabBtn ${activeTab === "inactive" ? "active" : ""}`}
              onClick={() => setActiveTab("inactive")}
            >
              المتوقفة ({inactiveCount})
            </button>
          </div>
        </div>

        <button
          type="button"
          className="addNewProductBtn"
          onClick={() => router.push("/admin/products/new")}
        >
          <Plus size={18} />
          إضافة منتج جديد
        </button>
      </div>

      {/* Main Products Panel */}
      <section className="adminProductsPanel">
        <div className="panelHeader">
          <h2>
            <Package size={20} />
            قائمة المنتجات
          </h2>
          <span className="productCountTag">
            {filteredProducts.length} من {products.length} منتج
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="adminEmptyState">
            <PackageSearch size={48} />
            <h3>لا توجد منتجات مطابقة</h3>
            <p>
              {searchQuery
                ? `لم نجد أي نتائج لـ "${searchQuery}"`
                : "لم تقم بإضافة أي منتجات حتى الآن"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table (>= 768px) */}
            <div className="desktopTableView">
              <table className="adminTable">
                <thead>
                  <tr>
                    <th>المنتج</th>
                    <th>أعلى سعر حالياً</th>
                    <th>المزايدات</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((p) => (
                    <tr
                      key={p.id}
                      className={selectedProduct?.id === p.id ? "rowExpanded" : ""}
                    >
                      <td>
                        <div
                          className="productItemCell"
                          style={{ cursor: "pointer" }}
                          onClick={() => openAuctionInspector(p)}
                          title="اضغط لمعاينة تفاصيل المزاد"
                        >
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="productThumb"
                          />
                          <div className="productInfoTitle">
                            <b>{p.name}</b>
                            <small>
                              الافتتاحي: {money(p.openingPrice)} · خطوة: +{money(p.bidIncrement)}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="priceCell">{money(p.currentPrice)}</span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={`bidsCountBtn ${selectedProduct?.id === p.id ? "active" : ""}`}
                          onClick={() => openAuctionInspector(p)}
                          title="عرض تفاصيل وسجل المزايدات"
                        >
                          <Gavel size={14} />
                          <span>{p._count?.bids || 0} مزايدة</span>
                          <ChevronLeft size={14} />
                        </button>
                      </td>

                      <td>
                        <span
                          className={`statusBadge ${p.active ? "active" : "inactive"}`}
                        >
                          <span className="statusDot" />
                          {p.active ? "نشط" : "متوقف"}
                        </span>
                      </td>

                      <td>
                        <div className="tableActionButtons">
                          <button
                            type="button"
                            className="actionEditBtn"
                            onClick={() => router.push(`/admin/products/${p.id}/edit`)}
                            title="تعديل بيانات المنتج"
                          >
                            <Pencil size={15} />
                            تعديل
                          </button>

                          <button
                            type="button"
                            className={`actionToggleBtn ${p.active ? "toPause" : "toActivate"}`}
                            onClick={() => toggle(p)}
                          >
                            {p.active ? <Pause size={14} /> : <Play size={14} />}
                            {p.active ? "إيقاف" : "تنشيط"}
                          </button>

                          <button
                            type="button"
                            className={`actionBlurBtn ${p.blurImage ? "on" : ""}`}
                            onClick={() => toggleBlur(p)}
                            title={p.blurImage ? "الصورة مظللة - اضغط لإظهارها" : "الصورة ظاهرة - اضغط لتظليلها"}
                          >
                            {p.blurImage ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>

                          <button
                            type="button"
                            className="actionDeleteBtn"
                            onClick={() => setDeleteTarget(p)}
                            title="حذف المنتج"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< 768px) */}
            <div className="mobileCardsView">
              {paginatedProducts.map((p) => (
                <div className="mobileProductCard" key={p.id}>
                  <div className="mobileCardTop">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="mobileProductThumb"
                      onClick={() => openAuctionInspector(p)}
                    />
                    <div className="mobileCardMeta">
                      <div className="mobileCardTitleRow">
                        <h3 onClick={() => openAuctionInspector(p)}>{p.name}</h3>
                        <span
                          className={`statusBadge ${p.active ? "active" : "inactive"}`}
                        >
                          <span className="statusDot" />
                          {p.active ? "نشط" : "متوقف"}
                        </span>
                      </div>
                      <small style={{ color: "var(--muted, #B9C0C7)" }}>
                        الافتتاحي: {money(p.openingPrice)} · الزيادة: +{money(p.bidIncrement)}
                      </small>
                    </div>
                  </div>

                  {/* Price & Bids Summary */}
                  <div className="mobileCardStats">
                    <div className="mobileCardStatItem">
                      <small>أعلى سعر حالياً</small>
                      <b>{money(p.currentPrice)}</b>
                    </div>
                    <div className="mobileCardStatItem">
                      <small>عدد المزايدات</small>
                      <b style={{ color: "var(--gold, #D9A83E)" }}>
                        {p._count?.bids || 0} مزايدة
                      </b>
                    </div>
                  </div>

                  {/* Actions Area - Optimized for thumb ergonomics */}
                  <div className="mobileCardActions">
                    <button
                      type="button"
                      className="mobileBidsBtn fullWidth"
                      onClick={() => openAuctionInspector(p)}
                    >
                      <Gavel size={15} />
                      <span>تفاصيل وسجل المزاد ({p._count?.bids || 0})</span>
                      <ChevronLeft size={14} />
                    </button>

                    <div className="mobileCardSubActions">
                      <button
                        type="button"
                        className="mobileEditBtn"
                        onClick={() => router.push(`/admin/products/${p.id}/edit`)}
                        title="تعديل بيانات المنتج"
                      >
                        <Pencil size={15} />
                        تعديل
                      </button>

                      <button
                        type="button"
                        className={`mobileActionBtn ${p.active ? "actionToggleBtn toPause" : "actionToggleBtn toActivate"}`}
                        onClick={() => toggle(p)}
                      >
                        {p.active ? <Pause size={14} /> : <Play size={14} />}
                        {p.active ? "إيقاف المزاد" : "تنشيط المزاد"}
                      </button>

                      <button
                        type="button"
                        className={`mobileActionBtn mobileBlurBtn ${p.blurImage ? "on" : ""}`}
                        onClick={() => toggleBlur(p)}
                        title={p.blurImage ? "الصورة مظللة - اضغط لإظهارها" : "الصورة ظاهرة - اضغط لتظليلها"}
                      >
                        {p.blurImage ? <EyeOff size={15} /> : <Eye size={15} />}
                        {p.blurImage ? "مظللة" : "تظليل الصورة"}
                      </button>

                      <button
                        type="button"
                        className="mobileDeleteBtn"
                        onClick={() => setDeleteTarget(p)}
                        title="حذف المنتج"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Admin Pagination Controls */}
            {filteredProducts.length > 0 && (
              <div className="adminPagination">
                <div className="paginationInfo">
                  عرض <b>{Math.min(filteredProducts.length, (currentPage - 1) * PAGE_SIZE + 1)}</b> -{" "}
                  <b>{Math.min(currentPage * PAGE_SIZE, filteredProducts.length)}</b> من أصل{" "}
                  <b>{filteredProducts.length}</b> منتج
                </div>

                <div className="paginationControls">
                  <button
                    type="button"
                    className="pageNavBtn"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ChevronRight size={16} />
                    السابق
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      totalPages > 6 &&
                      page !== 1 &&
                      page !== totalPages &&
                      Math.abs(page - currentPage) > 1
                    ) {
                      if (page === 2 || page === totalPages - 1) {
                        return (
                          <span key={page} className="paginationEllipsis">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={page}
                        type="button"
                        className={`pageNumberBtn ${currentPage === page ? "active" : ""}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    className="pageNavBtn"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    التالي
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ========================================================
          AUCTION DETAILS & BIDS INSPECTOR DRAWER
          ======================================================== */}
      {selectedProduct && (
        <div
          className="drawerOverlay"
          onClick={() => setSelectedProduct(null)}
        >
          <aside
            className="drawerContainer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Native Mobile Pull Handle */}
            <div className="mobileDrawerHandle" />

            {/* Drawer Top Bar */}
            <div className="drawerTopBar">
              <div className="drawerTopTitle">
                <Gavel size={20} style={{ color: "var(--gold, #D9A83E)" }} />
                <h3>مركز تحكم وتفاصيل المزاد</h3>
              </div>

              <button
                type="button"
                className="drawerCloseBtn"
                onClick={() => setSelectedProduct(null)}
                title="إغلاق (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="drawerBody">
              {/* Product Hero Info */}
              <div className="drawerProductHero">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="drawerProductImage"
                />
                <div className="drawerProductMeta">
                  <h2>{selectedProduct.name}</h2>
                  <div className="drawerProductBadges">
                    <span
                      className={`statusBadge ${selectedProduct.active ? "active" : "inactive"}`}
                    >
                      <span className="statusDot" />
                      {selectedProduct.active ? "المزاد نشط" : "المزاد متوقف"}
                    </span>
                    <button
                      type="button"
                      className={`drawerBlurBtn ${selectedProduct.blurImage ? "on" : ""}`}
                      onClick={() => {
                        toggleBlur(selectedProduct);
                      }}
                    >
                      {selectedProduct.blurImage ? (
                        <><EyeOff size={12} /> الصورة مظللة في الموقع</>
                      ) : (
                        <><Eye size={12} /> تظليل الصورة في الموقع</>
                      )}
                    </button>
                    <span
                      style={{
                        background: "#1a2934",
                        color: "var(--muted, #B9C0C7)",
                        padding: "3px 10px",
                        borderRadius: "14px",
                        fontSize: "12px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <Clock size={12} />
                      ينتهي: {formatBidTime(selectedProduct.endsAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 KPI Metric Cards */}
              <div className="drawerKpis">
                <div className="drawerKpiCard gold">
                  <small>
                    <Flame size={14} style={{ color: "var(--gold, #D9A83E)" }} />
                    أعلى مزايدة حالية
                  </small>
                  <b>{money(selectedProduct.currentPrice)}</b>
                  {growthPercent > 0 && (
                    <span style={{ fontSize: "11px", color: "#34d399", display: "flex", alignItems: "center", gap: "3px" }}>
                      <TrendingUp size={12} /> +{growthPercent}% نمو ({money(priceGrowth)})
                    </span>
                  )}
                </div>

                <div className="drawerKpiCard">
                  <small>
                    <Coins size={14} style={{ color: "var(--muted, #B9C0C7)" }} />
                    سعر الافتتاح
                  </small>
                  <b>{money(selectedProduct.openingPrice)}</b>
                  <span style={{ fontSize: "11px", color: "var(--muted, #B9C0C7)" }}>
                    الحد الأدنى للبدء
                  </span>
                </div>

                <div className="drawerKpiCard">
                  <small>
                    <Gavel size={14} style={{ color: "var(--muted, #B9C0C7)" }} />
                    خطوة المزايدة
                  </small>
                  <b style={{ color: "var(--light, #F2C65D)" }}>
                    +{money(selectedProduct.bidIncrement)}
                  </b>
                  <span style={{ fontSize: "11px", color: "var(--muted, #B9C0C7)" }}>
                    لكل رفعة جديدة
                  </span>
                </div>

                <div className="drawerKpiCard green">
                  <small>
                    <Users size={14} style={{ color: "#34d399" }} />
                    إجمالي المزايدات
                  </small>
                  <b>{productBids.length}</b>
                  <span style={{ fontSize: "11px", color: "var(--muted, #B9C0C7)" }}>
                    مزايدة مسجلة
                  </span>
                </div>
              </div>

              {/* Leading Bidder Spotlight Card */}
              {leadingBidder ? (
                <div className="leadingBidderSpotlight">
                  <div className="spotlightHeader">
                    <span className="spotlightBadge">
                      <Crown size={14} />
                      المزايد المتصدر حالياً (الفائز)
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--muted, #B9C0C7)" }}>
                      {formatBidTime(leadingBidder.createdAt)}
                    </span>
                  </div>

                  <div className="spotlightBidderInfo">
                    <div className="bidderIdentity">
                      <b>{leadingBidder.user.name}</b>
                      <span>{leadingBidder.user.phone}</span>
                    </div>

                    <div className="bidderPriceHighlight">
                      <span>مبلغ المزايدة</span>
                      <b>{money(leadingBidder.amount)}</b>
                    </div>
                  </div>

                  {/* Direct Contact Actions */}
                  <div className="spotlightContactActions">
                    <a
                      href={`tel:${leadingBidder.user.phone}`}
                      className="btnCallBidder"
                    >
                      <Phone size={15} />
                      اتصال هاتفي
                    </a>
                    <a
                      href={getWhatsAppUrl(leadingBidder.user.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btnWhatsAppBidder"
                    >
                      <MessageCircle size={15} />
                      مراسلة واتساب
                    </a>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: "#0D1B26",
                    border: "1px solid var(--border, #263744)",
                    borderRadius: "16px",
                    padding: "20px",
                    textAlign: "center",
                    color: "var(--muted, #B9C0C7)",
                  }}
                >
                  <Gavel size={32} style={{ margin: "0 auto 8px", opacity: 0.5, color: "var(--gold, #D9A83E)" }} />
                  <h4 style={{ margin: "0 0 4px", color: "#ffffff", fontSize: "15px" }}>لا توجد مزايدات حتى الآن</h4>
                  <p style={{ margin: 0, fontSize: "13px" }}>
                    السعر الحالي للمنتج هو السعر الافتتاحي ({money(selectedProduct.openingPrice)})
                  </p>
                </div>
              )}

              {/* Full Timeline of Bids */}
              <div className="bidsTimelineSection">
                <div className="bidsTimelineHeader">
                  <h4>
                    <Gavel size={16} style={{ color: "var(--gold, #D9A83E)" }} />
                    سجل المزايدات الكامل ({productBids.length})
                  </h4>
                  {productBids.length > 0 && (
                    <span style={{ fontSize: "12px", color: "var(--muted, #B9C0C7)" }}>
                      مرتبة من الأعلى للأدنى
                    </span>
                  )}
                </div>

                {loadingProductBids ? (
                  <div className="adminLoadingState">
                    <span>جاري تحميل سجل المزايدات...</span>
                  </div>
                ) : productBids.length === 0 ? (
                  <p style={{ color: "var(--muted, #B9C0C7)", textAlign: "center", margin: "14px 0", fontSize: "13.5px" }}>
                    بانتظار أول مزايد لدخول هذا المزاد.
                  </p>
                ) : (
                  <div className="timelineCardList">
                    {productBids.map((b, i) => {
                      const isWinner = i === 0;
                      return (
                        <div
                          key={b.id}
                          className={`timelineCard ${isWinner ? "isWinner" : ""}`}
                        >
                          <div className="timelineBidderMeta">
                            <span
                              className={`rankBadge ${
                                i === 0
                                  ? "gold"
                                  : i === 1
                                  ? "silver"
                                  : i === 2
                                  ? "bronze"
                                  : ""
                              }`}
                            >
                              {i === 0
                                ? "🥇 1"
                                : i === 1
                                ? "🥈 2"
                                : i === 2
                                ? "🥉 3"
                                : `#${i + 1}`}
                            </span>

                            <div className="timelineBidderText">
                              <b>{b.user.name}</b>
                              <a
                                href={`tel:${b.user.phone}`}
                                style={{
                                  color: "var(--muted, #B9C0C7)",
                                  fontSize: "12px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  textDecoration: "none",
                                }}
                              >
                                <Phone size={10} />
                                <span dir="ltr">{b.user.phone}</span>
                              </a>
                            </div>
                          </div>

                          <div className="timelineAmountArea">
                            <b>{money(b.amount)}</b>
                            <small>{formatBidTime(b.createdAt)}</small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="modalOverlay"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div className="modalDialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modalCloseBtn"
              onClick={() => !deleting && setDeleteTarget(null)}
              title="إغلاق"
              disabled={deleting}
            >
              <X size={18} />
            </button>

            <div className="modalHeader">
              <div className="modalIconBox">
                <AlertTriangle size={32} />
              </div>
              <h3 className="modalTitle">تأكيد حذف المنتج</h3>
              <p className="modalSubtitle">
                هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً من المزاد؟
              </p>
            </div>

            {/* Mini preview card of the product */}
            <div className="modalProductCard">
              <img
                src={deleteTarget.imageUrl}
                alt={deleteTarget.name}
                className="modalProductThumb"
              />
              <div className="modalProductInfo">
                <b>{deleteTarget.name}</b>
                <small>
                  السعر: {money(deleteTarget.currentPrice)} · المزايدات: {deleteTarget._count?.bids || 0}
                </small>
              </div>
            </div>

            <div className="modalWarningNote">
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>
                تحذير: سيتم حذف بيانات هذا المنتج وجميع المزايدات المسجلة عليه نهائياً، ولا يمكن التراجع بعد الحذف.
              </span>
            </div>

            <div className="modalActions">
              <button
                type="button"
                className="modalCancelBtn"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                إلغاء الأمر
              </button>

              <button
                type="button"
                className="modalConfirmBtn"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span className="modalSpinner" />
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>نعم، تأكيد الحذف</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
