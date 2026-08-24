import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { fetchProducts } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductGridSkeleton } from "@/components/site/Skeletons";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "العروض الحصرية — هاشم للطيب | Exclusive Offers" },
      {
        name: "description",
        content:
          "أفضل العروض والتخفيضات الحصرية على العطور الملكية والبخور واللبان من متجر هاشم للطيب.",
      },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  const { t } = useI18n();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const discountedProducts = products.filter(
    (p) => p.discount_price && p.discount_price > 0 && p.discount_price < p.price,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/40 via-background to-teal-deep/30 border border-amber-500/20 p-8 sm:p-12 mb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 border border-amber-500/30 px-4 py-1.5 text-xs font-bold text-amber-500 mb-4">
          <Flame className="size-4 animate-bounce" />
          <span>{t("offers_badge")}</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-5xl">
          {t("offers_title")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
          {t("offers_subtitle")}
        </p>
      </div>

      {isLoading ? (
        <ProductGridSkeleton />
      ) : discountedProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
          {discountedProducts.map((product, idx) => (
            <ProductCard key={product.id} product={product} index={idx} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
          <Sparkles className="size-10 text-primary mx-auto opacity-70" />
          <h3 className="font-display text-lg text-foreground">{t("no_offers_now")}</h3>
          <p className="text-xs text-muted-foreground">{t("offers_explore_desc")}</p>
          <Link
            to="/shop"
            className="inline-block rounded-xl bg-gold-gradient px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-gold-glow"
          >
            {t("cta_explore")}
          </Link>
        </div>
      )}
    </div>
  );
}
