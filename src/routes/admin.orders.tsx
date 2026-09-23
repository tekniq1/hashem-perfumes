import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, ChevronDown, ChevronUp, MessageCircle,
  Package, Search, Filter, Copy, CheckCheck,
  ShoppingBag, TrendingUp, Banknote, Clock
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { statusKeys, type OrderStatus } from "@/lib/config";
import { fetchStoreSettings } from "@/lib/settings";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  processing: "bg-blue-500/10  text-blue-600  border-blue-500/30",
  shipped:    "bg-purple-500/10 text-purple-600 border-purple-500/30",
  delivered:  "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  cancelled:  "bg-red-500/10   text-red-500   border-red-500/30",
};

function AdminOrders() {
  const { t, pick, money, lang } = useI18n();
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ─── Fetch all orders ───────────────────────────────────────────────────
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, order_number, created_at,
          customer_name, customer_phone,
          delivery_address, map_url,
          total_amount, total_profit,
          status, transfer_reference,
          customer_notes, delivery_method
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // ─── Fetch order items when expanded ───────────────────────────────────
  const { data: expandedItems = [] } = useQuery({
    queryKey: ["order-items", expandedId],
    enabled: !!expandedId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          id, quantity, unit_price, unit_cost,
          products ( name_ar, name_en, images )
        `)
        .eq("order_id", expandedId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ─── Store settings ─────────────────────────────────────────────────────
  const { data: settings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: fetchStoreSettings,
  });

  // ─── Update status ──────────────────────────────────────────────────────
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("saved"));
      qc.invalidateQueries({ queryKey: ["admin-orders-all"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ─── Copy order number ──────────────────────────────────────────────────
  const copyOrderNum = (num: string, id: string) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    toast.success("تم نسخ رقم الطلب");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── WhatsApp to customer ───────────────────────────────────────────────
  const openWhatsApp = (order: any) => {
    const items = expandedItems.length > 0
      ? expandedItems.map((i: any) =>
          `• ${pick(i.products?.name_ar, i.products?.name_en) ?? "منتج"} × ${i.quantity}`
        ).join("\n")
      : "—";

    const msg = [
      `🌹 مرحباً ${order.customer_name}`,
      ``,
      `بخصوص طلبك من *هاشم للطيب*`,
      `رقم الطلب: *#${order.order_number || order.id.slice(0, 8).toUpperCase()}*`,
      ``,
      `🛍️ المنتجات:`,
      items,
      ``,
      `💰 الإجمالي: ${money(Number(order.total_amount))}`,
      `📦 الاستلام: ${order.delivery_method === "pickup" ? "من الفرع" : "توصيل"}`,
      order.delivery_address ? `📍 العنوان: ${order.delivery_address}` : "",
      ``,
      `شكراً لتسوقك معنا 🌹`,
    ].filter(Boolean).join("\n");

    const phone = (order.customer_phone || "").replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // ─── Filter & search ────────────────────────────────────────────────────
  const filtered = (orders as any[]).filter((o: any) => {
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_phone?.includes(q) ||
      (o.order_number || "").includes(q) ||
      o.id.slice(0, 8).toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // ─── Stats ──────────────────────────────────────────────────────────────
  const totalRevenue = (orders as any[]).reduce((s, o) => s + Number(o.total_amount ?? 0), 0);
  const totalProfit  = (orders as any[]).reduce((s, o) => s + Number(o.total_profit ?? 0), 0);
  const pending      = (orders as any[]).filter((o) => o.status === "pending").length;

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "إجمالي الطلبات",   value: String((orders as any[]).length), icon: ShoppingBag, color: "text-primary" },
          { label: "الإيرادات",         value: money(totalRevenue),              icon: Banknote,    color: "text-emerald-500" },
          { label: "صافي الربح",        value: money(totalProfit),               icon: TrendingUp,  color: "text-blue-500" },
          { label: "بانتظار التأكيد",   value: String(pending),                  icon: Clock,       color: "text-yellow-500" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 border border-border">
            <s.icon className={`size-5 ${s.color} mb-2`} />
            <p className="font-display text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، الرقم، رقم الطلب..."
            className="w-full rounded-xl border border-border bg-card ps-10 pe-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="relative">
          <Filter className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-border bg-card ps-10 pe-4 py-2.5 text-sm outline-none focus:border-primary appearance-none cursor-pointer"
          >
            <option value="all">كل الطلبات</option>
            {statusKeys.map((s) => (
              <option key={s} value={s}>{t(s)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl h-16 animate-pulse border border-border" />
          ))
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl py-16 text-center border border-border">
            <ShoppingBag className="size-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search || filterStatus !== "all"
                ? "لا توجد نتائج مطابقة."
                : pick("لا توجد طلبات بعد.", "No orders yet.")}
            </p>
          </div>
        ) : (
          filtered.map((order: any) => {
            const isExpanded = expandedId === order.id;
            const orderNum = order.order_number || order.id.slice(0, 8).toUpperCase();
            const date = new Date(order.created_at).toLocaleDateString(
              lang === "ar" ? "ar-OM" : "en-GB",
              { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
            );

            return (
              <motion.div
                key={order.id}
                layout
                className="glass rounded-2xl border border-border overflow-hidden"
              >
                {/* Order header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="w-full text-start px-5 py-4 flex flex-wrap items-center gap-3 hover:bg-accent/30 transition-colors cursor-pointer"
                >
                  {/* Order number */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-sm font-bold text-primary">
                      #{orderNum}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); copyOrderNum(orderNum, order.id); }}
                      className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {copiedId === order.id
                        ? <CheckCheck className="size-3.5 text-emerald-500" />
                        : <Copy className="size-3.5" />}
                    </span>
                  </div>

                  <span className="text-border hidden sm:inline select-none">|</span>

                  {/* Customer name + phone */}
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-sm text-foreground">{order.customer_name}</span>
                    <span className="text-muted-foreground text-xs ms-2" dir="ltr">{order.customer_phone}</span>
                  </div>

                  {/* Date */}
                  <span className="text-[11px] text-muted-foreground hidden md:block">{date}</span>

                  {/* Amount */}
                  <span className="font-bold text-primary text-sm shrink-0">
                    {money(Number(order.total_amount))}
                  </span>

                  {/* Status badge */}
                  <span className={`text-[11px] font-bold border rounded-full px-2.5 py-1 shrink-0 ${STATUS_COLORS[order.status] ?? "bg-secondary text-foreground border-border"}`}>
                    {t(order.status)}
                  </span>

                  {isExpanded
                    ? <ChevronUp className="size-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="size-4 text-muted-foreground shrink-0" />}
                </button>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border px-5 py-5 space-y-5 bg-background/50">

                        {/* Products table */}
                        <div>
                          <h4 className="text-xs font-bold text-muted-foreground mb-3 flex items-center gap-2">
                            <Package className="size-3.5" />
                            المنتجات المطلوبة
                          </h4>
                          <div className="rounded-xl border border-border overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-secondary/50 text-muted-foreground text-xs">
                                <tr>
                                  <th className="px-4 py-2.5 text-start font-medium">المنتج</th>
                                  <th className="px-4 py-2.5 text-center font-medium w-20">الكمية</th>
                                  <th className="px-4 py-2.5 text-end font-medium w-24">السعر</th>
                                  <th className="px-4 py-2.5 text-end font-medium w-24">الإجمالي</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {(expandedItems as any[]).length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="px-4 py-6 text-center text-xs text-muted-foreground">
                                      <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                                    </td>
                                  </tr>
                                ) : (
                                  (expandedItems as any[]).map((item: any) => {
                                    const name = pick(item.products?.name_ar, item.products?.name_en) ?? "منتج";
                                    const img  = item.products?.images?.[0];
                                    const lineTotal = item.quantity * Number(item.unit_price);
                                    return (
                                      <tr key={item.id} className="hover:bg-accent/20 transition-colors">
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-3">
                                            {img ? (
                                              <img src={img} alt={name} className="size-10 rounded-lg object-cover border border-border shrink-0" />
                                            ) : (
                                              <div className="size-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                                                <Package className="size-4 text-muted-foreground" />
                                              </div>
                                            )}
                                            <span className="font-medium text-foreground">{name}</span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <span className="inline-flex items-center justify-center size-7 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                                            {item.quantity}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-end text-muted-foreground">
                                          {money(Number(item.unit_price))}
                                        </td>
                                        <td className="px-4 py-3 text-end font-bold text-foreground">
                                          {money(lineTotal)}
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                              <tfoot className="bg-secondary/30 border-t border-border">
                                <tr>
                                  <td colSpan={3} className="px-4 py-2.5 text-sm font-bold text-foreground text-end">
                                    الإجمالي:
                                  </td>
                                  <td className="px-4 py-2.5 text-end font-bold text-primary text-base">
                                    {money(Number(order.total_amount))}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>

                        {/* Extra info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {order.delivery_address && (
                            <div className="rounded-xl bg-secondary/40 border border-border px-4 py-3">
                              <p className="text-muted-foreground mb-1 font-medium">📍 عنوان التوصيل</p>
                              <p className="text-foreground">{order.delivery_address}</p>
                            </div>
                          )}
                          {order.transfer_reference && (
                            <div className="rounded-xl bg-secondary/40 border border-border px-4 py-3">
                              <p className="text-muted-foreground mb-1 font-medium">🏦 رقم الحوالة</p>
                              <p className="text-foreground font-mono font-bold">{order.transfer_reference}</p>
                            </div>
                          )}
                          {order.customer_notes && (
                            <div className="rounded-xl bg-secondary/40 border border-border px-4 py-3 sm:col-span-2">
                              <p className="text-muted-foreground mb-1 font-medium">📝 ملاحظات الزبون</p>
                              <p className="text-foreground">{order.customer_notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              setStatus.mutate({ id: order.id, status: e.target.value as OrderStatus })
                            }
                            className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                          >
                            {statusKeys.map((s) => (
                              <option key={s} value={s}>{t(s)}</option>
                            ))}
                          </select>

                          <button
                            onClick={() => openWhatsApp(order)}
                            className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors"
                          >
                            <MessageCircle className="size-3.5" />
                            واتساب الزبون
                          </button>

                          {order.map_url && (
                            <a
                              href={order.map_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                            >
                              <MapPin className="size-3.5 text-primary" />
                              عرض الموقع
                            </a>
                          )}

                          <span className="text-[11px] text-muted-foreground ms-auto hidden sm:block">{date}</span>
                        </div>

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
