import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { effectivePrice, fetchProduct } from "@/lib/products";
import { StockBadge } from "@/components/site/StockBadge";
import { BlockSkeleton } from "@/components/site/Skeletons";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product — HASHEM LELTEEB" },
      {
        name: "description",
        content: "A rare luxury piece from the HASHEM LELTEEB private collection.",
      },
      { property: "og:title", content: "Product — HASHEM LELTEEB" },
      {
        property: "og:description",
        content: "A rare luxury piece from the HASHEM LELTEEB private collection.",
      },
    ],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const { t, money, pick } = useI18n();
  const { add, setOpen } = useCart();
  const [active, setActive] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
  });

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2">
        <BlockSkeleton className="aspect-square" />
        <div className="space-y-4">
          <BlockSkeleton className="h-10" />
          <BlockSkeleton className="h-24" />
          <BlockSkeleton className="h-12" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="text-sm text-muted-foreground">{t("no_data")}</p>
        <Link to="/shop" className="mt-4 inline-block text-sm text-primary">
          {t("continue_shopping")}
        </Link>
      </div>
    );
  }

  const price = effectivePrice(data);
  const soldOut = data.stock_quantity <= 0;
  const images = data.images?.length ? data.images : ["/favicon.ico"];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t("nav_shop")}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="glass group relative overflow-hidden rounded-3xl p-2 shadow-gold-glow"
          >
            <div className="relative rounded-2xl overflow-hidden aspect-square">
              <img
                src={images[active]}
                alt={pick(data.name_ar, data.name_en)}
                className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              
              {/* Gradient Overlay for text readability */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30 opacity-80" />

              {/* Product Info Overlays in Corners */}
              <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between pointer-events-none">
                
                {/* Top Corners */}
                <div className="flex justify-between items-start">
                   <div className="flex flex-col gap-2">
                     <StockBadge product={data} />
                     {data.discount_price ? (
                        <span className="pulse-gold rounded-full bg-gold-gradient px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-lg w-fit">
                          {t("sale")}
                        </span>
                     ) : null}
                   </div>
                   <div className="rounded-full bg-black/40 backdrop-blur-md px-3 py-1 border border-white/10 shadow-lg">
                      <span className="text-[10px] font-bold text-white/90 tracking-widest uppercase">HASHEM LELTEEB</span>
                   </div>
                </div>

                {/* Bottom Corners */}
                <div className="flex items-end justify-between translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                   <div className="max-w-[70%]">
                     <h2 className="font-display text-2xl sm:text-3xl font-bold text-white shadow-black drop-shadow-md leading-tight">
                       {pick(data.name_ar, data.name_en)}
                     </h2>
                   </div>
                   <div className="flex flex-col items-end text-end">
                     {data.discount_price ? (
                       <span className="text-sm font-medium text-white/70 line-through drop-shadow">{money(Number(data.price))}</span>
                     ) : null}
                     <span className="text-xl sm:text-2xl font-bold text-primary drop-shadow-lg">{money(price)}</span>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
          {images.length > 1 ? (
            <div className="mt-3 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={img + i}
                  onClick={() => setActive(i)}
                  className={`overflow-hidden rounded-lg border transition-colors ${
                    i === active ? "border-primary" : "border-border hover:border-primary/60"
                  }`}
                >
                  <img src={img} alt="" className="size-16 object-cover sm:size-20" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-5"
        >
          <StockBadge product={data} />
          <h1 className="text-3xl text-foreground sm:text-4xl">
            {pick(data.name_ar, data.name_en)}
          </h1>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-primary">{money(price)}</span>
            {data.discount_price ? (
              <span className="text-sm text-muted-foreground line-through">
                {money(Number(data.price))}
              </span>
            ) : null}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {pick(data.description_ar, data.description_en)}
          </p>
          <p className="text-xs text-muted-foreground">
            {soldOut ? t("out_of_stock") : `${t("in_stock")} · ${data.stock_quantity}`}
          </p>

          <motion.button
            whileHover={{ scale: soldOut ? 1 : 1.02 }}
            whileTap={{ scale: soldOut ? 1 : 0.96 }}
            disabled={soldOut}
            onClick={() => {
              add({
                id: data.id,
                name_ar: data.name_ar,
                name_en: data.name_en,
                price,
                cost_price: Number(data.cost_price),
                image: images[0] ?? null,
                stock: data.stock_quantity,
              });
              setOpen(true);
              toast.success(t("added_to_cart"));
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gold-gradient py-4 text-sm font-semibold text-primary-foreground shadow-gold-glow disabled:opacity-40 sm:w-auto sm:px-10"
          >
            <ShoppingBag className="size-4" />
            {soldOut ? t("out_of_stock") : t("add_to_cart")}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
