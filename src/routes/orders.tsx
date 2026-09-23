import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Package, ChevronDown, ChevronUp, Phone, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { BlockSkeleton } from "@/components/site/Skeletons";
import type { OrderStatus } from "@/lib/config";
import { useState } from "react";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "طلباتي — هاشم للطيب" },
      { name: "description", content: "تابع طلباتك وحالة التوصيل من متجر هاشم للطيب." },
    ],
  }),
  component: Orders,
});

const STATUS_COLORS: Record<string, string> = {
  pending:    "border-yellow-500/40  bg-yellow-500/10  text-yellow-600",
  processing: "border-blue-500/40   bg-blue-500/10   text-blue-600",
  shipped:    "border-purple-500/40  bg-purple-500/10  text-purple-600",
  delivered:  "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
  cancelled:  "border-red-500/40    bg-red-500/10    text-red-500",
};

type OrderRow = {
  id: string;
  order_number: string | null;
  created_at: string;
  total_amount: number;
  status: OrderStatus;
  delivery_address: string;
  map_url: string | null;
  customer_name: string;
  customer_phone: string;
};

function OrderItems({ orderId }: { orderId: string }) {
  const { pick, money } = useI18n();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["order-items-public", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("id, quantity, unit_price, products(name_ar, name_en, images)")
        .eq("order_id", orderId);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {(items as any[]).map((item: any) => {
        const name = pick(item.products?.name_ar, item.products?.name_en) ?? "منتج";
        const img  = item.products?.images?.[0];
        return (
          <div key={item.id} className="flex items-center gap-3">
            {img ? (
              <img src={img} alt={name} className="size-10 rounded-xl object-cover border border-border shrink-0" />
            ) : (
              <div className="size-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <Package className="size-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{name}</p>
              <p className="text-xs text-muted-foreground">الكمية: {item.quantity}</p>
            </div>
            <span className="text-sm font-bold text-primary shrink-0">
              {money(item.quantity * Number(item.unit_price))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Orders() {
  const { t, money } = useI18n();
  const { user, loading } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, created_at, total_amount, status, delivery_address, map_url, customer_name, customer_phone")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
  });

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <ShoppingBag className="size-12 text-primary/30 mx-auto mb-4" />
        <p className="text-sm text-muted-foreground mb-5">{t("need_sign_in")}</p>
        <Link
          to="/auth"
          className="inline-block rounded-full bg-gold-gradient px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          {t("sign_in")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-foreground mb-8">{t("nav_orders")}</h1>

      <div className="space-y-3">
        {isLoading ? (
          <>
            <BlockSkeleton className="h-24" />
            <BlockSkeleton className="h-24" />
            <BlockSkeleton className="h-24" />
          </>
        ) : (data ?? []).length === 0 ? (
          <div className="glass rounded-2xl py-16 text-center border border-border">
            <ShoppingBag className="size-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t("no_data")}</p>
            <Link to="/shop" className="mt-4 inline-block text-primary text-sm hover:underline">
              تصفح منتجاتنا
            </Link>
          </div>
        ) : (
          (data ?? []).map((o, i) => {
            const isExpanded = expandedId === o.id;
            const orderNum = o.order_number || o.id.slice(0, 8).toUpperCase();
            const date = new Date(o.created_at).toLocaleString("ar-OM", {
              year: "numeric", month: "short", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            });

            return (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                layout
                className="glass rounded-2xl border border-border overflow-hidden"
              >
                {/* Order header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : o.id)}
                  className="w-full text-start p-5 flex flex-wrap items-center gap-3 hover:bg-accent/20 transition-colors cursor-pointer"
                >
                  {/* Order number */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-primary font-bold">#{orderNum}</span>
                      <span className={`text-[11px] font-bold border rounded-full px-2.5 py-0.5 ${STATUS_COLORS[o.status] ?? "bg-secondary text-foreground border-border"}`}>
                        {t(o.status)}
                      </span>
                    </div>

                    {/* Customer name + phone */}
                    <p className="mt-1 font-bold text-sm text-foreground">{o.customer_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Phone className="size-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground" dir="ltr">{o.customer_phone}</p>
                    </div>
                  </div>

                  {/* Amount + expand icon */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-base font-bold text-primary">{money(Number(o.total_amount))}</span>
                    {isExpanded
                      ? <ChevronUp className="size-4 text-muted-foreground" />
                      : <ChevronDown className="size-4 text-muted-foreground" />}
                  </div>
                </button>

                {/* Expandable details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border px-5 py-4 space-y-4 bg-background/40">

                        {/* Products */}
                        <div>
                          <p className="text-[11px] font-bold text-muted-foreground mb-3 flex items-center gap-1.5">
                            <Package className="size-3.5" /> المنتجات المطلوبة
                          </p>
                          <OrderItems orderId={o.id} />
                        </div>

                        {/* Address + date + map */}
                        <div className="grid grid-cols-1 gap-2 text-xs pt-1">
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                            <span>{o.delivery_address}</span>
                          </div>
                          <p className="text-muted-foreground">{date}</p>
                        </div>

                        {o.map_url && (
                          <a
                            href={o.map_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                          >
                            <MapPin className="size-3.5" />
                            عرض الموقع على الخريطة
                          </a>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
