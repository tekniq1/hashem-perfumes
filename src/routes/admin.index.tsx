import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Boxes, Film, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fetchProducts } from "@/lib/products";
import { fetchPromoVideos } from "@/lib/videos";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { pick, money } = useI18n();
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const videos = useQuery({
    queryKey: ["promo-videos-all"],
    queryFn: () => fetchPromoVideos(false),
  });
  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total_amount, total_profit, status, created_at, customer_name")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const revenue = (orders.data ?? []).reduce((s, o) => s + Number(o.total_amount ?? 0), 0);

  const cards = [
    {
      icon: Boxes,
      label: pick("المنتجات", "Products"),
      value: String((products.data ?? []).length),
    },
    {
      icon: Receipt,
      label: pick("إيراد آخر ١٠ طلبات", "Last 10 orders revenue"),
      value: money(revenue),
    },
    {
      icon: Film,
      label: pick("الفيديوهات", "Videos"),
      value: String((videos.data ?? []).length),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-2xl p-5">
            <c.icon className="size-5 text-primary" />
            <p className="mt-3 text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-display text-2xl text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="border-b border-border/70 px-5 py-4 text-sm font-semibold text-foreground">
          {pick("أحدث الطلبات", "Latest orders")}
        </div>
        <ul className="divide-y divide-border/60">
          {(orders.data ?? []).map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
              <span className="text-foreground">{o.customer_name}</span>
              <span className="text-muted-foreground">{o.status}</span>
              <span className="font-semibold text-primary">{money(Number(o.total_amount))}</span>
            </li>
          ))}
          {orders.data && orders.data.length === 0 ? (
            <li className="px-5 py-6 text-sm text-muted-foreground">
              {pick("لا توجد طلبات بعد.", "No orders yet.")}
            </li>
          ) : null}
        </ul>
      </div>

      <Link
        to="/admin/videos"
        className="inline-flex rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-teal-foreground"
      >
        {pick("إدارة الفيديوهات", "Manage videos")}
      </Link>
    </div>
  );
}
