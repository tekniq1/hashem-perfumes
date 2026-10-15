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
  Package,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, type Product, effectivePrice } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

// Fixed bundle settings
const BUNDLE_TARGET_COUNT = 4;
const BUNDLE_BASE_PRICE = 50; // 50 OMR for 4 perfume slots
const BUNDLE_ITEM_ID = "bundle-womens-day-4";

// Product ID that counts as 2 units (Box: Perfume + Incense)
const TWO_SLOT_PRODUCT_IDS = new Set(["d092f2e0-18c9-43b2-82c1-cf95364273b9"]);

const getProductSlotWeight = (productId: string) => {
  return TWO_SLOT_PRODUCT_IDS.has(productId) ? 2 : 1;
};

export function WomensDayBundleSection() {
  const { money, pick } = useI18n();
  const { add, setOpen: openCartDrawer } = useCart();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMap, setSelectedMap] = useState<Record<string, number>>({});

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  // Calculate total slots used (regular item = 1 slot, 2-in-1 box = 2 slots)
  const selectedTotalSlots = useMemo(() => {
    return Object.entries(selectedMap).reduce((sum, [id, qty]) => {
      return sum + qty * getProductSlotWeight(id);
    }, 0);
  }, [selectedMap]);

  // Selected products with their quantities and slot weights
  const selectedItems = useMemo(() => {
    return Object.entries(selectedMap)
      .map(([id, qty]) => {
        const product = products.find((p) => p.id === id);
        return product && qty > 0
          ? { product, qty, slotWeight: getProductSlotWeight(id) }
          : null;
      })
      .filter(Boolean) as { product: Product; qty: number; slotWeight: number }[];
  }, [selectedMap, products]);

  // Pricing calculation
  const pricingDetails = useMemo(() => {
    if (selectedTotalSlots === 0) {
      return { total: 0, bundlePrice: 0, extraPrice: 0, regularTotal: 0, savings: 0 };
    }

    // Flatten all selected slots
    // For a 2-slot item (like the perfume + incense box), each slot gets half its effective price
    const flatSlots: {
      productId: string;
      product: Product;
      slotPrice: number;
      isSecondSlotOfPair?: boolean;
    }[] = [];

    selectedItems.forEach(({ product, qty, slotWeight }) => {
      const fullPrice = effectivePrice(product);
      for (let i = 0; i < qty; i++) {
        if (slotWeight === 2) {
          flatSlots.push({ productId: product.id, product, slotPrice: fullPrice / 2 });
          flatSlots.push({ productId: product.id, product, slotPrice: fullPrice / 2, isSecondSlotOfPair: true });
        } else {
          flatSlots.push({ productId: product.id, product, slotPrice: fullPrice });
        }
      }
    });

    const regularTotal = selectedItems.reduce((acc, it) => acc + effectivePrice(it.product) * it.qty, 0);

    if (selectedTotalSlots < BUNDLE_TARGET_COUNT) {
      return {
        total: regularTotal,
        bundlePrice: 0,
        extraPrice: regularTotal,
        regularTotal,
        savings: 0,
      };
    }

    // Sort descending by slotPrice so the highest value slots enter the 50 OMR bundle
    const sorted = [...flatSlots].sort((a, b) => b.slotPrice - a.slotPrice);
    const extraSlots = sorted.slice(BUNDLE_TARGET_COUNT);

    const extraPrice = extraSlots.reduce((acc, it) => acc + it.slotPrice, 0);
    const total = BUNDLE_BASE_PRICE + extraPrice;
    const savings = Math.max(0, regularTotal - total);

    return {
      total,
      bundlePrice: BUNDLE_BASE_PRICE,
      extraPrice,
      regularTotal,
      savings,
    };
  }, [selectedItems, selectedTotalSlots]);

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
    if (selectedTotalSlots < BUNDLE_TARGET_COUNT) {
      toast.error(
        pick(
          `يرجى اختيار ما يعادل ${BUNDLE_TARGET_COUNT - selectedTotalSlots} عطور إضافية لاكتمال الباقة!`,
          `Please select ${BUNDLE_TARGET_COUNT - selectedTotalSlots} more item slots to complete the bundle!`,
        ),
      );
      return;
    }

    const bundleImage = selectedItems[0]?.product.images?.[0] || "/favicon.png";

    // Split items between bundle (first 4 slots) and extras
    const flatSlots: {
      productId: string;
      product: Product;
      slotPrice: number;
    }[] = [];

    selectedItems.forEach(({ product, qty, slotWeight }) => {
      const fullPrice = effectivePrice(product);
      for (let i = 0; i < qty; i++) {
        if (slotWeight === 2) {
          flatSlots.push({ productId: product.id, product, slotPrice: fullPrice / 2 });
          flatSlots.push({ productId: product.id, product, slotPrice: fullPrice / 2 });
        } else {
          flatSlots.push({ productId: product.id, product, slotPrice: fullPrice });
        }
      }
    });
    flatSlots.sort((a, b) => b.slotPrice - a.slotPrice);

    // Names of items in the bundle
    const bundleProductNames: string[] = [];
    selectedItems.forEach(({ product, qty, slotWeight }) => {
      const name = pick(product.name_ar, product.name_en);
      const tag = slotWeight === 2 ? ` (بوكس عطر+بخور ×2)` : "";
      bundleProductNames.push(`${name}${tag} (×${qty})`);
    });

    const bundleCost = selectedItems.reduce((acc, it) => acc + (it.product.cost_price || 0) * it.qty, 0);

    // 1. Add bundle item (50 OMR)
    add(
      {
        id: `${BUNDLE_ITEM_ID}-${Date.now().toString().slice(-5)}`,
        name_ar: `🌸 باقة يوم المرأة: ${bundleProductNames.join(" + ")}`,
        name_en: `🌸 Women's Day Bundle: ${bundleProductNames.join(" + ")}`,
        price: pricingDetails.total,
        cost_price: bundleCost,
        image: bundleImage,
        stock: 99,
      },
      1,
    );

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
      {/* 👑 Royal Luxury Promotional Banner on Homepage */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 my-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-primary/40 bg-card/90 shadow-gold-glow backdrop-blur-xl p-6 sm:p-9"
        >
          {/* Subtle Royal Gold Ambience Glow */}
          <div className="pointer-events-none absolute -top-20 -start-20 size-64 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -end-20 size-64 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-start space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-3.5 py-1 text-xs font-bold text-primary">
                <Sparkles className="size-3.5 text-primary" />
                <span>{pick("عرض خاص لفترة محدودة — 5 أيام فقط", "Limited Time Offer — 5 Days Only")}</span>
                <span className="flex size-2 rounded-full bg-primary animate-ping" />
              </div>

              <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black text-foreground leading-tight tracking-tight">
                {pick("احتفالاً بيوم المرأة العمانية", "Celebrating Omani Women's Day")} 🌸
                <br />
                <span className="text-gold-gradient font-black">
                  {pick("اختاري 4 عطور بـ 50 ر.ع فقط!", "Pick Any 4 Perfumes for Only 50 OMR!")}
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed mx-auto lg:mx-0">
                {pick(
                  "اختاري أي 4 عطور تفضلينها من تشكيلة هاشم للطيب الملكية بسعر موحد 50 ريال عماني فقط. (بوكس العطر والبخور يُحتسب كقطعتين، وفي حال اختيار أكثر من 4 عطور يُحسب الإضافي بقيمته الأصلية).",
                  "Choose any 4 perfumes of your choice from Hashem LelTeeb luxury collection for just 50 OMR. (Perfume & Incense box counts as 2 units, extras beyond 4 are charged at regular price).",
                )}
              </p>

              {/* Badges / Highlights */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                <div className="flex items-center gap-1.5 rounded-xl bg-primary/5 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-foreground">
                  <Gift className="size-4 text-primary" />
                  <span>{pick("توفير استثنائي", "Exceptional Savings")}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-primary/5 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-foreground">
                  <Heart className="size-4 text-primary" />
                  <span>{pick("حرية اختيار أي عطر بالموقع", "Freedom to choose any perfume")}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-primary/5 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-foreground">
                  <Clock className="size-4 text-primary" />
                  <span>{pick("متبقي 5 أيام فقط", "Only 5 Days Left")}</span>
                </div>
              </div>
            </div>

            {/* Right Action Box */}
            <div className="shrink-0 flex flex-col items-center gap-2.5">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setModalOpen(true)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gold-gradient px-8 sm:px-10 py-4 text-sm sm:text-base font-bold text-primary-foreground shadow-gold-glow hover:opacity-90 transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <Sparkles className="size-4.5" />
                  <span>{pick("صممي باقتكِ الآن ✨", "Build Your Bundle Now ✨")}</span>
                  <ChevronRight className="size-4 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </span>
              </motion.button>
              <span className="text-xs font-semibold text-primary">
                {pick("سعر 4 عطور: 50 ر.ع فقط", "Price for 4 perfumes: 50 OMR only")}
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 🌸 Bundle Builder Modal in Pure Hashem LelTeeb Luxury Style */}
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
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-primary/30 bg-card shadow-gold-glow overflow-hidden"
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-gold-gradient text-primary-foreground shadow-sm">
                    <Gift className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                      {pick("صانع باقة يوم المرأة الفاخرة (4 عطور بـ 50 ر.ع)", "Women's Day Luxury Bundle Builder")}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {pick(
                        "اختاري ما يعادل 4 عطور (البوكس المزدوج يُحتسب بقطعتين)",
                        "Select 4 perfume units (Dual box counts as 2 units)",
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
              <div className="bg-primary/5 px-5 py-3 border-b border-primary/15 space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <span>{pick("العطور المحتسبة في الباقة:", "Selected Bundle Units:")}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        selectedTotalSlots >= BUNDLE_TARGET_COUNT
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-primary/15 text-primary border border-primary/30"
                      }`}
                    >
                      {selectedTotalSlots} / {BUNDLE_TARGET_COUNT}
                    </span>
                  </span>

                  <span className="font-bold">
                    {selectedTotalSlots >= BUNDLE_TARGET_COUNT ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <Check className="size-4" />
                        <span>{pick("اكتملت باقتكِ الفاخرة!", "Bundle Complete!")}</span>
                      </span>
                    ) : (
                      <span className="text-primary font-semibold">
                        {pick(`متبقي ما يعادل ${BUNDLE_TARGET_COUNT - selectedTotalSlots} عطور`, `${BUNDLE_TARGET_COUNT - selectedTotalSlots} more needed`)}
                      </span>
                    )}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gold-gradient transition-all duration-300"
                    style={{
                      width: `${Math.min((selectedTotalSlots / BUNDLE_TARGET_COUNT) * 100, 100)}%`,
                    }}
                  />
                </div>

                {selectedTotalSlots > BUNDLE_TARGET_COUNT && (
                  <p className="text-[11px] text-primary flex items-center gap-1 mt-1 font-medium">
                    <Info className="size-3 shrink-0" />
                    <span>
                      {pick(
                        `تم اختيار ما يعادل ${selectedTotalSlots - BUNDLE_TARGET_COUNT} عطر إضافي سيُحسب بقيمته الأصلية من المتجر.`,
                        `${selectedTotalSlots - BUNDLE_TARGET_COUNT} extra unit(s) will be charged at regular store price.`,
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
                      const isTwoSlots = TWO_SLOT_PRODUCT_IDS.has(p.id);

                      return (
                        <div
                          key={p.id}
                          className={`group relative flex flex-col rounded-2xl border p-3 transition-all ${
                            count > 0
                              ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-sm"
                              : "border-border/80 bg-card hover:border-primary/40"
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
                            
                            {/* Two Slots Badge */}
                            {isTwoSlots && (
                              <div className="absolute top-2 end-2 flex items-center gap-1 rounded-full bg-amber-900/80 backdrop-blur-sm border border-amber-400/40 text-amber-200 text-[10px] font-bold px-2 py-0.5 shadow-md">
                                <Package className="size-3" />
                                <span>{pick("يُحسب بـ 2", "Counts as 2")}</span>
                              </div>
                            )}

                            {count > 0 && (
                              <div className="absolute top-2 start-2 flex size-6 items-center justify-center rounded-full bg-gold-gradient text-primary-foreground text-xs font-bold shadow-md">
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
                            {isTwoSlots && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                                {pick("بوكس عطر + بخور ملكي", "Perfume & Royal Incense Box")}
                              </p>
                            )}
                          </div>

                          {/* Counter / Selector Actions */}
                          <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between">
                            {count === 0 ? (
                              <button
                                onClick={() => handleIncrement(p.id, p.stock_quantity)}
                                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-primary/10 hover:bg-gold-gradient hover:text-primary-foreground text-primary text-xs font-bold transition-all cursor-pointer"
                              >
                                <Plus className="size-3.5" />
                                <span>{pick("اختيار", "Add")}</span>
                              </button>
                            ) : (
                              <div className="w-full flex items-center justify-between gap-1">
                                <button
                                  onClick={() => handleDecrement(p.id)}
                                  className="size-7 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                >
                                  <Minus className="size-3" />
                                </button>
                                <span className="text-xs font-bold text-primary">{count}</span>
                                <button
                                  onClick={() => handleIncrement(p.id, p.stock_quantity)}
                                  className="size-7 rounded-lg bg-gold-gradient text-primary-foreground flex items-center justify-center hover:opacity-90 shadow-xs transition-opacity cursor-pointer"
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
                    <span className="text-xl sm:text-2xl font-black text-primary">
                      {money(pricingDetails.total)}
                    </span>
                    {pricingDetails.savings > 0 && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-md">
                        {pick(`وفرتِ ${money(pricingDetails.savings)}!`, `Saved ${money(pricingDetails.savings)}!`)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {selectedTotalSlots >= BUNDLE_TARGET_COUNT
                      ? pick(
                          "أول 4 عطور بـ 50 ر.ع + أي وحدات إضافية بسعرها الطبيعي",
                          "First 4 perfume units = 50 OMR + Extras at regular price",
                        )
                      : pick(`اخترتِ ما يعادل ${selectedTotalSlots} من 4 عطور مطلوبة`, `Selected ${selectedTotalSlots} of 4 required`)}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setSelectedMap({});
                    }}
                    disabled={selectedTotalSlots === 0}
                    className="px-3 py-3 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                  >
                    {pick("مسح الكل", "Clear")}
                  </button>

                  <button
                    onClick={handleAddBundleToCart}
                    disabled={selectedTotalSlots < BUNDLE_TARGET_COUNT}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gold-gradient text-primary-foreground font-bold text-sm shadow-gold-glow hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
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
