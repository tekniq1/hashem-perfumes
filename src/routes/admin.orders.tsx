import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { statusKeys, type OrderStatus } from "@/lib/config";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

type OrderRow = {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  map_url: string | null;
  total_amount: number;
  total_profit: number;
  status: OrderStatus;
};

function AdminOrders() {
  const { t, pick, money, lang } = useI18n();
  const qc = useQueryClient();

  const orders = useQuery({
    queryKey: ["admin-orders-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, created_at, customer_name, customer_phone, delivery_address, map_url, total_amount, total_profit, status",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("saved"));
      void qc.invalidateQueries({ queryKey: ["admin-orders-all"] });
      void qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = orders.data ?? [];
  const revenue = rows.reduce((s, o) => s + Number(o.total_amount ?? 0), 0);
  const profit = rows.reduce((s, o) => s + Number(o.total_profit ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: t("orders_count"), value: String(rows.length) },
          { label: t("revenue"), value: money(revenue) },
          { label: t("net_profit"), value: money(profit) },
        ].map((c) => (
          <div key={c.label} className="glass rounded-2xl p-5">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-display text-2xl text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[46rem] text-start text-sm">
          <thead className="border-b border-border/70 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start">{t("customer")}</th>
              <th className="px-4 py-3 text-start">{t("date")}</th>
              <th className="px-4 py-3 text-start">{t("total")}</th>
              <th className="px-4 py-3 text-start">{t("profit")}</th>
              <th className="px-4 py-3 text-start">{t("status")}</th>
              <th className="px-4 py-3 text-start">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3">
                  <p className="text-foreground">{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{o.customer_phone}</p>
                  <p className="max-w-[16rem] truncate text-xs text-muted-foreground">
                    {o.delivery_address}
                  </p>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString(lang === "ar" ? "ar-OM" : "en-GB")}
                </td>
                <td className="px-4 py-3 font-semibold text-primary">
                  {money(Number(o.total_amount))}
                </td>
                <td className="px-4 py-3 text-foreground">{money(Number(o.total_profit))}</td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) =>
                      setStatus.mutate({ id: o.id, status: e.target.value as OrderStatus })
                    }
                    className="rounded-full border border-input bg-card px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                  >
                    {statusKeys.map((s) => (
                      <option key={s} value={s}>
                        {t(s)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  {o.map_url ? (
                    <a
                      href={o.map_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-foreground hover:bg-accent"
                    >
                      <MapPin className="size-3.5 text-primary" />
                      {t("open_map")}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t("none")}</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-sm text-muted-foreground">
                  {pick("لا توجد طلبات بعد.", "No orders yet.")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
