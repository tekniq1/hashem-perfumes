import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, ExternalLink, MapPin, Phone, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { fetchBranches } from "@/lib/branches";

export const Route = createFileRoute("/branches")({
  head: () => ({
    meta: [
      { title: "فروعنا — هاشم للطيب | Our Branches" },
      {
        name: "description",
        content:
          "فروع متجر هاشم للطيب في سلطنة عمان. تفضل بزيارتنا لتجربة أرقى العطور والبخور واللبان الحوجري.",
      },
    ],
  }),
  component: BranchesPage,
});

function BranchesPage() {
  const { t, pick } = useI18n();
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: () => fetchBranches(true),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-4 py-1.5 text-xs font-bold text-primary mb-4">
          <MapPin className="size-4" />
          <span>{t("nav_branches")}</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-5xl">
          {t("branches_title")}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground sm:text-base">{t("branches_subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass animate-pulse rounded-2xl h-64 p-6" />
          ))}
        </div>
      ) : branches.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((b, idx) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass relative overflow-hidden rounded-2xl p-6 border border-border/80 flex flex-col justify-between hover:border-primary/50 transition-all group shadow-sm hover:shadow-gold-glow"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <MapPin className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {pick(b.name_ar, b.name_en)}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {pick(b.city_ar, b.city_en)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-muted-foreground pt-2">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="size-4 shrink-0 text-primary/70 mt-0.5" />
                    <span>{pick(b.address_ar, b.address_en)}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="size-4 shrink-0 text-primary/70 mt-0.5" />
                    <span>{pick(b.opening_hours_ar, b.opening_hours_en)}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="size-4 shrink-0 text-primary/70" />
                    <span dir="ltr" className="font-medium text-foreground">
                      {b.phone}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                {b.map_url ? (
                  <a
                    href={b.map_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary/10 border border-primary/30 py-2.5 text-xs font-semibold text-primary hover:bg-gold-gradient hover:text-primary-foreground transition-all"
                  >
                    <ExternalLink className="size-3.5" />
                    <span>{t("view_on_map")}</span>
                  </a>
                ) : null}
                <a
                  href={`tel:${b.phone}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <Phone className="size-3.5" />
                  <span>{t("call_branch")}</span>
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center max-w-md mx-auto">
          <Sparkles className="size-10 text-primary mx-auto opacity-70 mb-3" />
          <h3 className="font-display text-base text-foreground">{t("branches_updating")}</h3>
          <p className="text-xs text-muted-foreground mt-1">{t("branches_updating_desc")}</p>
        </div>
      )}
    </div>
  );
}
