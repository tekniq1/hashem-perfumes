import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { BlockSkeleton } from "@/components/site/Skeletons";
import type { OrderStatus } from "@/lib/config";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — HASHEM LELTEEB" },
      { name: "description", content: "Track your HASHEM LELTEEB orders and delivery status." },
      { property: "og:title", content: "My Orders — HASHEM LELTEEB" },
      { property: "og:description", content: "Track your luxury orders and delivery status." },
    ],
  }),
  component: Orders,
});

type OrderRow = {
  id: string;
  created_at: string;
  total_amount: number;
  status: OrderStatus;
  delivery_address: string;
  map_url: string | null;
};

function Orders() {
  const { t, money } = useI18n();
  const { user, loading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, total_amount, status, delivery_address, map_url")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
  });

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="text-sm text-muted-foreground">{t("need_sign_in")}</p>
        <Link
          to="/auth"
          className="mt-5 inline-block rounded-full bg-gold-gradient px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          {t("sign_in")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl text-foreground sm:text-4xl">{t("nav_orders")}</h1>
      <div className="mt-8 space-y-3">
        {isLoading ? (
          <>
            <BlockSkeleton className="h-24" />
            <BlockSkeleton className="h-24" />
          </>
        ) : (data ?? []).length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">{t("no_data")}</p>
        ) : (
          (data ?? []).map((o, i) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass flex flex-wrap items-center gap-4 rounded-xl p-5"
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-primary">#{o.id.slice(0, 8).toUpperCase()}</p>
                <p className="mt-1 line-clamp-1 text-sm text-foreground">{o.delivery_address}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleString()}
                </p>
              </div>
              <span className="rounded-full border border-primary/40 px-3 py-1 text-xs text-primary">
                {t(o.status)}
              </span>
              <span className="text-sm font-semibold text-primary">
                {money(Number(o.total_amount))}
              </span>
              {o.map_url ? (
                <a
                  href={o.map_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-border p-2 text-muted-foreground hover:text-primary"
                  aria-label={t("open_map")}
                >
                  <MapPin className="size-4" />
                </a>
              ) : null}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
