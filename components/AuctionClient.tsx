"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Header from "./Header";
import { Clock, Gavel, CheckCircle2, Eye } from "lucide-react";

type P = {
  id: string;
  name: string;
  imageUrl: string;
  openingPrice: number;
  reservePrice: number | null;
  currentPrice: number;
  bidIncrement: number;
  endsAt: string;
  startsAt: string;
  active: boolean;
  reserveMet: boolean;
  blurImage: boolean;
  _count: { bids: number };
};

const money = (n: number) => `${n.toLocaleString("en-US")} د.ع`;
const PAGE_SIZE = 6;

export default function AuctionClient({ name }: { name: string }) {
  const [products, setProducts] = useState<P[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  // Initial load
  const loadInitial = useCallback(async () => {
    isFetchingRef.current = true;
    try {
      const r = await fetch(`/api/public/products?page=1&limit=${PAGE_SIZE}`, {
        cache: "no-store",
      });
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data)) {
          setProducts(data);
          setHasMore(false);
        } else {
          setProducts(data.items || []);
          setHasMore(Boolean(data.hasMore));
          setTotalCount(data.total ?? null);
          setPage(1);
        }
      }
    } finally {
      setInitialLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Load next page on scroll
  const loadNextPage = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    setLoadingMore(true);

    const nextPage = page + 1;
    try {
      const r = await fetch(`/api/public/products?page=${nextPage}&limit=${PAGE_SIZE}`, {
        cache: "no-store",
      });
      if (r.ok) {
        const data = await r.json();
        const newItems: P[] = Array.isArray(data) ? data : data.items || [];
        const nextHasMore = Array.isArray(data) ? false : Boolean(data.hasMore);

        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const filteredNew = newItems.filter((p) => !existingIds.has(p.id));
          return [...prev, ...filteredNew];
        });

        setPage(nextPage);
        setHasMore(nextHasMore);
        if (data.total !== undefined) {
          setTotalCount(data.total);
        }
      }
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [page, hasMore]);

  // Silent refresh for live prices & bids without resetting scroll or items
  const silentRefresh = useCallback(async () => {
    try {
      const r = await fetch("/api/public/products", { cache: "no-store" });
      if (r.ok) {
        const freshList: P[] = await r.json();
        if (Array.isArray(freshList)) {
          const freshMap = new Map(freshList.map((p) => [p.id, p]));
          setProducts((prev) =>
            prev.map((p) => {
              const fresh = freshMap.get(p.id);
              if (!fresh) return p;
              return {
                ...p,
                currentPrice: fresh.currentPrice,
                active: fresh.active,
                _count: fresh._count,
              };
            })
          );
        }
      }
    } catch {
      // ignore background poll errors
    }
  }, []);

  // Setup initial load and timers
  useEffect(() => {
    loadInitial();
    const clockTimer = setInterval(() => setNow(Date.now()), 1000);
    const pollTimer = setInterval(silentRefresh, 6000);

    return () => {
      clearInterval(clockTimer);
      clearInterval(pollTimer);
    };
  }, [loadInitial, silentRefresh]);

  // IntersectionObserver for infinite scroll on sentinel
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isFetchingRef.current && !initialLoading) {
          loadNextPage();
        }
      },
      {
        root: null,
        rootMargin: "300px",
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, initialLoading, loadNextPage]);

  async function bid(id: string) {
    const r = await fetch("/api/public/bid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id }),
    });
    const d = await r.json();
    if (!r.ok) {
      alert(d.error || "تعذر تنفيذ المزايدة");
      return;
    }
    // Instant local state update
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            currentPrice: p.currentPrice + p.bidIncrement,
            _count: { bids: (p._count?.bids || 0) + 1 },
          };
        }
        return p;
      })
    );
    silentRefresh();
  }

  return (
    <>
      <Header />
      <main className="container">
        <section className="hero">
          <div>
            <small>هلا {name} 👋</small>
            <h1>مزادات حقيقية</h1>
            <p>كل المنتجات في قسم واحد — الفرصة بين إيديك</p>
          </div>
        </section>

        <div className="sectionHead">
          <h2>المزادات الحالية {totalCount !== null ? `(${totalCount})` : ""}</h2>
          <span className="live">● مباشر</span>
        </div>

        <section className="grid">
          {products.map((p) => {
            const diff = Math.max(0, new Date(p.endsAt).getTime() - now);
            const ended = diff <= 0 || !p.active;
            const h = Math.floor(diff / 3600000)
              .toString()
              .padStart(2, "0");
            const m = Math.floor((diff % 3600000) / 60000)
              .toString()
              .padStart(2, "0");
            const s = Math.floor((diff % 60000) / 1000)
              .toString()
              .padStart(2, "0");

            return (
              <article className="card" key={p.id}>
                <div className="image">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    loading="lazy"
                    className={p.blurImage && !revealed.has(p.id) ? "blurredImage" : ""}
                  />
                  {p.blurImage && !revealed.has(p.id) && (
                    <button
                      type="button"
                      className="revealImageBtn"
                      onClick={() =>
                        setRevealed((prev) => new Set(prev).add(p.id))
                      }
                    >
                      <Eye size={16} />
                      عرض الصورة
                    </button>
                  )}
                  <span className="timer">
                    <Clock size={16} />
                    {ended ? "انتهى المزاد" : `${h}:${m}:${s}`}
                  </span>
                </div>

                <div className="body">
                  <h2>{p.name}</h2>
                  <p>
                    السعر الافتتاحي <b>{money(p.openingPrice)}</b>
                  </p>
                  <p className="current">
                    أعلى سعر حالياً <b>{money(p.currentPrice)}</b>
                  </p>
                  {p.reservePrice != null && (
                    <p className={`reserve ${p.reserveMet ? "met" : "unmet"}`}>
                      أقل سعر للبيع <b>{money(p.reservePrice)}</b>
                    </p>
                  )}
                  <small>عدد المزايدات: {p._count.bids}</small>
                  <button
                    disabled={ended}
                    className="goldBtn"
                    onClick={() => bid(p.id)}
                  >
                    <Gavel size={18} />{" "}
                    {ended ? "المزاد منتهي" : `زايد ${money(p.bidIncrement)}`}
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        {/* Scroll Sentinel */}
        <div ref={sentinelRef} className="scrollSentinel" />

        {/* Loading indicator when scrolling */}
        {loadingMore && (
          <div className="scrollLoadingWrap">
            <span className="scrollSpinner" />
            <span>جاري تحميل المزيد من المزادات...</span>
          </div>
        )}

        {/* End of list banner */}
        {!hasMore && products.length > 0 && !initialLoading && (
          <div className="scrollEndWrap">
            <CheckCircle2 size={18} />
            <span>تم عرض جميع المزادات المتاحة حالياً ({products.length})</span>
          </div>
        )}
      </main>
    </>
  );
}
