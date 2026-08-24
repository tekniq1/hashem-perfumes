import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Flame,
  Headphones,
  MapPin,
  MessageCircle,
  Sparkles,
  Truck,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { fetchCategories, fetchProducts } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductGridSkeleton } from "@/components/site/Skeletons";
import { VideoReels } from "@/components/site/VideoReels";
import { LogoMark } from "@/components/brand/Logo";
import { fetchStoreSettings } from "@/lib/settings";
import { fetchBranches } from "@/lib/branches";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "هاشم للطيب — HASHEM LELTEEB | عطور وبخور ملكي فاخر" },
      {
        name: "description",
        content:
          "متجر هاشم للطيب للعطور المركزة الفاخرة، البخور الملكي، واللبان الحوجري الأصيل. طلب مباشر وسريع عبر واتساب.",
      },
      { property: "og:title", content: "HASHEM LELTEEB — Luxury Perfumes & Royal Incense" },
      {
        property: "og:description",
        content: "فخامة عبيرك... اختيارك. بخور وعطور ملكية فاخرة ولبان حوجري أصيل.",
      },
    ],
  }),
  component: Home,
});

function Hero() {
  const { t } = useI18n();
  const { data: settings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: fetchStoreSettings,
  });

  const whatsapp = settings?.whatsapp_number || "96877380145";

  return (
    <section className="relative overflow-hidden px-4 pb-14 pt-10 sm:px-6 sm:pt-16">
      <div className="pointer-events-none absolute -top-40 start-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/25 px-4 py-1.5 text-xs font-bold text-primary mb-4"
          >
            <Sparkles className="size-3.5" />
            <span>{t("hero_kicker")}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 90, damping: 18, delay: 0.1 }}
            className="mt-2 font-display text-4xl leading-[1.2] text-foreground sm:text-6xl"
          >
            {t("hero_title_1")} <br />
            <span className="text-gold-gradient">{t("hero_title_2")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base"
          >
            {t("hero_sub")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.34 }}
            className="mt-8 flex flex-wrap items-center gap-3.5"
          >
            <Link
              to="/shop"
              className="group inline-flex items-center gap-2 rounded-full bg-gold-gradient px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-gold-glow hover:opacity-90 transition-all"
            >
              {t("cta_explore")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>

            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-6 py-3.5 text-sm font-semibold text-primary hover:bg-gold-gradient hover:text-primary-foreground transition-all shadow-sm"
            >
              <MessageCircle className="size-4" />
              <span>{t("direct_whatsapp_order")}</span>
            </a>
          </motion.div>
        </div>

        {/* Brand Pedestal Column */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 80, damping: 18, delay: 0.15 }}
          className="relative mx-auto flex aspect-square w-full max-w-lg items-center justify-center"
        >
          <div className="absolute inset-6 rounded-full border border-primary/40 shadow-gold-glow" />
          <div className="absolute inset-14 rounded-full bg-gold-gradient opacity-15 blur-2xl" />
          <div className="glass float-slow relative z-10 flex size-3/4 items-center justify-center overflow-hidden rounded-full border border-primary/30">
            <video 
              src="/hero-video.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="size-full object-cover scale-110" 
            />
          </div>
          <div className="absolute bottom-2 z-20 h-10 w-2/3 rounded-[100%] bg-foreground/10 blur-xl" />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute -bottom-2 end-6 z-20 rounded-2xl bg-card/95 p-3 shadow-gold-glow backdrop-blur border border-primary/20"
          >
            <LogoMark size={48} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function ValueBar() {
  const { t } = useI18n();
  const items = [
    { icon: BadgeCheck, title: t("value_1_title"), body: t("value_1_body") },
    { icon: Truck, title: t("value_2_title"), body: t("value_2_body") },
    { icon: Headphones, title: t("value_3_title"), body: t("value_3_body") },
  ];
  return (
    <section className="mx-auto mt-4 grid max-w-7xl gap-4 px-4 sm:grid-cols-3 sm:px-6">
      {items.map((it, i) => (
        <motion.div
          key={it.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 120, damping: 18, delay: i * 0.1 }}
          className="glass flex items-start gap-3.5 rounded-2xl px-5 py-5 border border-border/70 shadow-xs"
        >
          <span className="rounded-xl bg-primary/10 text-primary p-2.5 border border-primary/20">
            <it.icon className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-foreground">{it.title}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{it.body}</span>
          </span>
        </motion.div>
      ))}
    </section>
  );
}

function Home() {
  const { t, pick } = useI18n();
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const branches = useQuery({ queryKey: ["branches"], queryFn: () => fetchBranches(true) });

  const allProducts = products.data ?? [];
  const featured = allProducts.filter((p) => p.is_featured);
  const discounted = allProducts.filter(
    (p) => p.discount_price && p.discount_price > 0 && p.discount_price < p.price,
  );

  return (
    <div>
      <Hero />
      <ValueBar />

      {/* Categories */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              {t("shop_by_category")}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">{t("browse_luxury_fragrances")}</p>
          </div>
          <Link
            to="/shop"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>{t("view_all")}</span>
            <span>➔</span>
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(categories.data ?? []).map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 110, damping: 18, delay: i * 0.08 }}
            >
              <Link
                to="/shop"
                search={{ category: c.slug }}
                className="glass group relative block overflow-hidden rounded-3xl border border-border/80 shadow-xs hover:border-primary/50 transition-all"
              >
                <img
                  src={c.image_url ?? "/hashem-logo.png"}
                  alt={pick(c.name_ar, c.name_en)}
                  loading="lazy"
                  className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-110 sm:h-72"
                />
                <span className="absolute inset-x-4 bottom-4 rounded-2xl border border-primary/25 bg-card/85 p-4 text-center font-display text-sm font-bold text-foreground backdrop-blur-md shadow-sm">
                  {pick(c.name_ar, c.name_en)}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Promotional Video Reels */}
      <VideoReels />

      {/* Exclusive Offers Section (if any) */}
      {discounted.length > 0 ? (
        <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-card to-background p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2.5">
                <Flame className="size-6 text-amber-500 animate-pulse" />
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                    {t("offers_title")}
                  </h2>
                  <p className="text-xs text-muted-foreground">{t("offers_subtitle")}</p>
                </div>
              </div>
              <Link
                to="/offers"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:underline"
              >
                <span>{t("view_all_offers")}</span>
                <span>➔</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {discounted.slice(0, 4).map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Featured Products */}
      <section id="featured" className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              {t("featured_products")}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">{t("most_popular_selection")}</p>
          </div>
          <Link
            to="/shop"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>{t("all_products")}</span>
            <span>➔</span>
          </Link>
        </div>

        {products.isLoading ? (
          <ProductGridSkeleton />
        ) : (() => {
          const baseList = allProducts;
          let items = [...baseList];
          while (items.length > 0 && items.length < 10) {
            items = [...items, ...baseList];
          }
          return (
            <div className="overflow-hidden">
              <div className="marquee-track-slow">
                {items.map((p, i) => (
                  <div key={`a-${i}`} className="w-[170px] sm:w-[250px] shrink-0 px-2 sm:px-3" dir="rtl">
                    <ProductCard product={p} index={0} />
                  </div>
                ))}
                {items.map((p, i) => (
                  <div key={`b-${i}`} className="w-[170px] sm:w-[250px] shrink-0 px-2 sm:px-3" dir="rtl">
                    <ProductCard product={p} index={0} />
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </section>

      {/* Branches Preview Section */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
        <div className="glass rounded-3xl p-8 sm:p-12 border border-border/80 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-4 py-1.5 text-xs font-bold text-primary">
            <MapPin className="size-4" />
            <span>{t("nav_branches")}</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-4xl">
            {t("visit_branches_title")}
          </h2>
          <p className="mx-auto max-w-xl text-xs sm:text-sm text-muted-foreground">
            {t("visit_branches_desc")}
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/branches"
              className="rounded-xl bg-gold-gradient px-7 py-3 text-xs font-bold text-primary-foreground shadow-gold-glow"
            >
              {t("view_branches_info")}
            </Link>
            <Link
              to="/about"
              className="rounded-xl border border-border px-7 py-3 text-xs font-medium text-foreground hover:bg-accent"
            >
              {t("nav_about")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
