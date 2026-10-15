import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Gift,
  Plus,
  Minus,
  Check,
  ShoppingBag,
  X,
  Clock,
  Heart,
  ChevronRight,
  Info,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, type Product, effectivePrice } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

// Fixed bundle settings
const BUNDLE_TARGET_COUNT = 4;
const BUNDLE_BASE_PRICE = 50; // 50 OMR for 4 perfumes
const BUNDLE_ITEM_ID = "bundle-womens-day-4";

export function WomensDayBundleSection() {
  const { money, pick } = useI18n();
  const { add, setOpen: openCartDrawer } = useCart();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMap, setSelectedMap] = useState<Record<string, number>>({});

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  // Calculate selected total items
  const selectedTotalCount = useMemo(() => {
    return Object.values(selectedMap).reduce((sum, qty) => sum + qty, 0);
  }, [selectedMap]);

  // Selected products with their quantities
  const selectedItems = useMemo(() => {
    return Object.entries(selectedMap)
      .map(([id, qty]) => {
        const product = products.find((p) => p.id === id);
        return product && qty > 0 ? { product, qty } : null;
      })
      .filter(Boolean) as { product: Product; qty: number }[];
  }, [selectedMap, products]);

  // Pricing calculation
  // First 4 items = 50 OMR.
  // Any extra items (beyond 4) = regular price.
  const pricingDetails = useMemo(() => {
    if (selectedTotalCount === 0) return { total: 0, bundlePrice: 0, extraPrice: 0, regularTotal: 0, savings: 0 };

    // Flatten all selected perfume instances
    const flatItems: { id: string; price: number; name: string }[] = [];
    selectedItems.forEach(({ product, qty }) => {
      const p = effectivePrice(product);
      for (let i = 0; i < qty; i++) {
        flatItems.push({ id: product.id, price: p, name: pick(product.name_ar, product.name_en) });
      }
    });

    const regularTotal = flatItems.reduce((acc, it) => acc + it.price, 0);

    if (selectedTotalCount < BUNDLE_TARGET_COUNT) {
      return {
        total: regularTotal,
        bundlePrice: 0,
        extraPrice: regularTotal,
        regularTotal,
        savings: 0,
      };
    }

    // Sort to give user maximum benefit or simply first 4 in bundle
    // Sort descending by price so the 4 most expensive perfumes go into the 50 OMR bundle!
    const sorted = [...flatItems].sort((a, b) => b.price - a.price);
    const bundleItems = sorted.slice(0, BUNDLE_TARGET_COUNT);
    const extraItems = sorted.slice(BUNDLE_TARGET_COUNT);

    const bundleOriginalSum = bundleItems.reduce((acc, it) => acc + it.price, 0);
    const extraPrice = extraItems.reduce((acc, it) => acc + it.price, 0);
    const total = BUNDLE_BASE_PRICE + extraPrice;
    const savings = Math.max(0, regularTotal - total);

    return {
      total,
      bundlePrice: BUNDLE_BASE_PRICE,
      extraPrice,
      regularTotal,
      savings,
    };
  }, [selectedItems, selectedTotalCount, pick]);

  const handleIncrement = (productId: string, stock: number) => {
    const current = selectedMap[productId] || 0;
    if (current >= stock) {
      toast.error(pick("الكمية المتاحة في المخزون لا تكفي", "Max stock reached"));
      return;
    }
    setSelectedMap((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const handleDecrement = (productId: string) => {
    setSelectedMap((prev) => {
      const current = prev[productId] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: current - 1 };
    });
  };

  const handleAddBundleToCart = () => {
    if (selectedTotalCount < BUNDLE_TARGET_COUNT) {
      toast.error(
        pick(
          `يرجى اختيار ${BUNDLE_TARGET_COUNT - selectedTotalCount} عطور إضافية لاكتمال الباقة!`,
          `Please select ${BUNDLE_TARGET_COUNT - selectedTotalCount} more perfumes to complete the bundle!`,
        ),
      );
      return;
    }

    // Prepare bundle item name with breakdown
    const perfumesSummaryAr = selectedItems
      .map((it) => `${it.product.name_ar} (×${it.qty})`)
      .join(" + ");
    const perfumesSummaryEn = selectedItems
      .map((it) => `${it.product.name_en} (×${it.qty})`)
      .join(" + ");

    // First image from first selected product
    const bundleImage = selectedItems[0]?.product.images?.[0] || "/favicon.png";

    // Flatten items sorted by price descending
    const flatItems: { product: Product; price: number }[] = [];
    selectedItems.forEach(({ product, qty }) => {
      const p = effectivePrice(product);
      for (let i = 0; i < qty; i++) {
        flatItems.push({ product, price: p });
      }
    });
    flatItems.sort((a, b) => b.price - a.price);

    const bundleParts = flatItems.slice(0, BUNDLE_TARGET_COUNT);
    const extraParts = flatItems.slice(BUNDLE_TARGET_COUNT);

    // Calculate bundle cost price
    const bundleCost = bundleParts.reduce((acc, it) => acc + (it.product.cost_price || 0), 0);

    // 1. Add the 4-perfume bundle item at 50 OMR
    add(
      {
        id: `${BUNDLE_ITEM_ID}-${Date.now().toString().slice(-5)}`,
        name_ar: `🌸 باقة يوم المرأة (4 عطور): ${bundleParts.map((p) => p.product.name_ar).join(" + ")}`,
        name_en: `🌸 Women's Day Bundle (4 Perfumes): ${bundleParts.map((p) => p.product.name_en).join(" + ")}`,
        price: BUNDLE_BASE_PRICE,
        cost_price: bundleCost,
        image: bundleImage,
        stock: 99,
      },
      1,
    );

    // 2. Add extra items at their regular price if any
    const extraCountMap: Record<string, { product: Product; count: number }> = {};
    extraParts.forEach(({ product }) => {
      if (!extraCountMap[product.id]) {
        extraCountMap[product.id] = { product, count: 0 };
      }
      extraCountMap[product.id].count += 1;
    });

    Object.values(extraCountMap).forEach(({ product, count }) => {
      add(
        {
          id: product.id,
          name_ar: product.name_ar,
          name_en: product.name_en,
          price: effectivePrice(product),
          cost_price: product.cost_price,
          image: product.images?.[0] || null,
          stock: product.stock_quantity,
        },
        count,
      );
    });

    toast.success(
      pick(
        "تمت إضافة باقة يوم المرأة الفاخرة إلى سلتك بنجاح! 🎉",
        "Women's Day luxury bundle added to cart! 🎉",
      ),
    );

    setModalOpen(false);
    setSelectedMap({});
    openCartDrawer(true);
  };

  return (
    <>
      {/* 🌸 Main Promotional Banner on Homepage */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 my-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border-2 border-rose-400/40 bg-gradient-to-br from-rose-950/40 via-card to-amber-950/30 p-6 sm:p-9 shadow-2xl backdrop-blur-xl"
        >
          {/* Aesthetic background glows */}
          <div className="pointer-events-none absolute -top-24 -start-20 size-72 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -end-20 size-72 rounded-full bg-amber-500/20 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-start space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 border border-rose-400/30 px-3.5 py-1 text-xs font-bold text-rose-300">
                <Sparkles className="size-3.5 text-amber-300 animate-spin-slow" />
                <span>{pick("عرض خاص لفترة محدودة — 5 أيام فقط", "Limited Time Offer — 5 Days Only")}</span>
                <span className="flex size-2 rounded-full bg-rose-400 animate-ping" />
              </div>

              <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
                {pick("احتفالاً بيوم المرأة العمانية", "Celebrating Omani Women's Day")} 🌸
                <br />
                <span className="bg-gradient-to-r from-rose-300 via-amber-200 to-amber-400 bg-clip-text text-transparent">
                  {pick("اختاري 4 عطور بـ 50 ر.ع فقط!", "Pick Any 4 Perfumes for Only 50 OMR!")}
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed mx-auto lg:mx-0">
                {pick(
                  "اختاري أي 4 عطور تفضلينها من تشكيلة هاشم للطيب الملكية بسعر موحد 50 ريال عماني فقط. (وفي حال اختيار أكثر من 4 عطور يُحسب الإضافي بقيمته الأصلية).",
                  "Choose any 4 perfumes of your choice from Hashem LelTeeb luxury collection for just 50 OMR. Extra perfumes beyond 4 are charged at regular price.",
                )}
              </p>

              {/* Badges / Highlights */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <div className="flex items-center gap-1.5 rounded-xl bg-card/80 border border-border/70 px-3 py-1.5 text-xs font-semibold text-foreground">
                  <Gift className="size-4 text-rose-400" />
                  <span>{pick("توفير استثنائي", "Exceptional Savings")}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-card/80 border border-border/70 px-3 py-1.5 text-xs font-semibold text-foreground">
                  <Heart className="size-4 text-amber-400" />
                  <span>{pick("حرية اختيار أي عطر بالموقع", "Freedom to choose any perfume")}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-card/80 border border-border/70 px-3 py-1.5 text-xs font-semibold text-foreground">
                  <Clock className="size-4 text-rose-400" />
                  <span>{pick("متبقي 5 أيام فقط", "Only 5 Days Left")}</span>
                </div>
              </div>
            </div>

            {/* Right Action Box */}
            <div className="shrink-0 flex flex-col items-center gap-3">
              <div className="relative group">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setModalOpen(true)}
                  className="relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 px-8 sm:px-10 py-4 text-base font-bold text-white shadow-xl shadow-rose-500/25 transition-all hover:shadow-rose-500/40"
                >
                  <span className="flex items-center gap-2.5">
                    <Sparkles className="size-5 animate-pulse text-amber-200" />
                    <span>{pick("صممي باقتكِ الآن ✨", "Build Your Bundle Now ✨")}</span>
                    <ChevronRight className="size-4 rtl:rotate-180" />
                  </span>
                </motion.button>
              </div>
              <span className="text-[11px] font-medium text-rose-300/80">
                {pick("سعر 4 عطور: 50 ر.ع فقط", "Price for 4 perfumes: 50 OMR only")}
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 🌸 Bundle Builder Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-rose-400/40 bg-card shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    <Gift className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                      {pick("صانع باقة يوم المرأة الفاخرة (4 عطور بـ 50 ر.ع)", "Women's Day Luxury Bundle Builder")}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {pick(
                        "اضغطي على (+) لاختيار 4 عطور تفضلينها",
                        "Click (+) to select 4 perfumes of your choice",
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Progress Tracker */}
              <div className="bg-muted/40 px-5 py-3 border-b border-border space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <span>{pick("العطور المختارة:", "Selected Perfumes:")}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        selectedTotalCount >= BUNDLE_TARGET_COUNT
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {selectedTotalCount} / {BUNDLE_TARGET_COUNT}
                    </span>
                  </span>

                  <span className="text-primary font-bold">
                    {selectedTotalCount >= BUNDLE_TARGET_COUNT ? (
                      <span className="flex items-center gap-1 text-emerald-500">
                        <Check className="size-4" />
                        <span>{pick("اكتملت باقتكِ!", "Bundle Complete!")}</span>
                      </span>
                    ) : (
                      <span>{pick(`متبقي ${BUNDLE_TARGET_COUNT - selectedTotalCount} عطور`, `${BUNDLE_TARGET_COUNT - selectedTotalCount} more needed`)}</span>
                    )}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 transition-all duration-300"
                    style={{
                      width: `${Math.min((selectedTotalCount / BUNDLE_TARGET_COUNT) * 100, 100)}%`,
                    }}
                  />
                </div>

                {selectedTotalCount > BUNDLE_TARGET_COUNT && (
                  <p className="text-[11px] text-amber-500 flex items-center gap-1 mt-1">
                    <Info className="size-3 shrink-0" />
                    <span>
                      {pick(
                        `تم اختيار ${selectedTotalCount - BUNDLE_TARGET_COUNT} عطر إضافي سيُحسب بسعره الأصلي من المتجر.`,
                        `${selectedTotalCount - BUNDLE_TARGET_COUNT} extra perfume(s) will be charged at regular store price.`,
                      )}
                    </span>
                  </p>
                )}
              </div>

              {/* Products Grid */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {isLoading ? (
                  <div className="py-20 text-center text-muted-foreground text-sm">
                    {pick("جاري تحميل قائمة العطور...", "Loading perfumes...")}
                  </div>
                ) : products.length === 0 ? (
                  <div className="py-20 text-center text-muted-foreground text-sm">
                    {pick("لا توجد عطور متوفرة حالياً", "No perfumes available")}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                    {products.map((p) => {
                      const count = selectedMap[p.id] || 0;
                      const isSoldOut = p.stock_quantity <= 0;
                      const price = effectivePrice(p);

                      return (
                        <div
                          key={p.id}
                          className={`group relative flex flex-col rounded-2xl border p-3 transition-all ${
                            count > 0
                              ? "border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30"
                              : "border-border/80 bg-card hover:border-border"
                          } ${isSoldOut ? "opacity-50 pointer-events-none" : ""}`}
                        >
                          {/* Image */}
                          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-muted mb-2.5">
                            <img
                              src={p.images?.[0] || "/favicon.png"}
                              alt={pick(p.name_ar, p.name_en)}
                              className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            {count > 0 && (
                              <div className="absolute top-2 start-2 flex size-6 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold shadow-md">
                                {count}
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-xs sm:text-sm text-foreground line-clamp-1">
                              {pick(p.name_ar, p.name_en)}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs font-bold text-primary">{money(price)}</span>
                              {p.discount_price && (
                                <span className="text-[10px] text-muted-foreground line-through">
                                  {money(p.price)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Counter / Selector Actions */}
                          <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between">
                            {count === 0 ? (
                              <button
                                onClick={() => handleIncrement(p.id, p.stock_quantity)}
                                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-primary/10 hover:bg-rose-500 hover:text-white text-primary text-xs font-bold transition-colors cursor-pointer"
                              >
                                <Plus className="size-3.5" />
                                <span>{pick("اختيار", "Add")}</span>
                              </button>
                            ) : (
                              <div className="w-full flex items-center justify-between gap-1">
                                <button
                                  onClick={() => handleDecrement(p.id)}
                                  className="size-7 rounded-lg bg-muted flex items-center justify-center text-foreground hover:bg-destructive/20 hover:text-destructive transition-colors cursor-pointer"
                                >
                                  <Minus className="size-3" />
                                </button>
                                <span className="text-xs font-bold text-foreground">{count}</span>
                                <button
                                  onClick={() => handleIncrement(p.id, p.stock_quantity)}
                                  className="size-7 rounded-lg bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors cursor-pointer"
                                >
                                  <Plus className="size-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer (Summary & Add to Cart) */}
              <div className="sticky bottom-0 z-20 border-t border-border bg-card/95 px-5 py-4 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-muted-foreground">{pick("الإجمالي النهائي:", "Total:")}</span>
                    <span className="text-xl sm:text-2xl font-black text-rose-500">
                      {money(pricingDetails.total)}
                    </span>
                    {pricingDetails.savings > 0 && (
                      <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        {pick(`وفرتِ ${money(pricingDetails.savings)}!`, `Saved ${money(pricingDetails.savings)}!`)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {selectedTotalCount >= BUNDLE_TARGET_COUNT
                      ? pick(
                          "أول 4 عطور بـ 50 ر.ع + العطور الإضافية بسعرها الطبيعي",
                          "First 4 perfumes = 50 OMR + Extras at regular price",
                        )
                      : pick(`اخترتِ ${selectedTotalCount} من 4 عطور مطلوبة`, `Selected ${selectedTotalCount} of 4 required`)}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setSelectedMap({});
                    }}
                    disabled={selectedTotalCount === 0}
                    className="px-3 py-3 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                  >
                    {pick("مسح الكل", "Clear")}
                  </button>

                  <button
                    onClick={handleAddBundleToCart}
                    disabled={selectedTotalCount < BUNDLE_TARGET_COUNT}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-500/25 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    <ShoppingBag className="size-4" />
                    <span>{pick("إضافة الباقة إلى السلة 🛍️", "Add Bundle to Cart 🛍️")}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
