import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Crown,
  HeartHandshake,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { fetchStoreSettings } from "@/lib/settings";
import { LogoMark } from "@/components/brand/Logo";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن — هاشم للطيب | About HASHEM LELTEEB" },
      {
        name: "description",
        content:
          "تعرف على قصة هاشم للطيب، فخامة العطور المركزة والبخور الملكي واللبان الحوجري الأصيل.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t, pick } = useI18n();
  const { data: settings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: fetchStoreSettings,
  });

  const title = pick(settings?.about_title_ar, settings?.about_title_en) || t("about_title");
  const description =
    pick(settings?.about_description_ar, settings?.about_description_en) || t("hero_sub");
  const whatsapp = settings?.whatsapp_number || "96877380145";
  const instagram = settings?.instagram_handle || "hashem_lelteeb";
  const email = settings?.email || "abdualhidry@gmail.com";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-card to-background border border-border/80 p-8 sm:p-16 mb-16 text-center shadow-gold-glow">
        <div className="flex justify-center mb-6">
          <LogoMark size={84} />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-loose">
          {description}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-6 py-3 text-xs font-semibold text-primary-foreground shadow-gold-glow hover:opacity-95 transition-opacity"
          >
            <MessageCircle className="size-4" />
            <span>
              {t("contact_us")} ({whatsapp})
            </span>
          </a>
          <a
            href={`https://instagram.com/${instagram}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-6 py-3 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
          >
            <Instagram className="size-4" />
            <span>Instagram @{instagram}</span>
          </a>
        </div>
      </div>

      {/* Values Grid */}
      <div className="grid gap-8 sm:grid-cols-3 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-8 text-center space-y-4 border border-border/70"
        >
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <Crown className="size-7" />
          </span>
          <h3 className="font-display text-lg font-bold text-foreground">
            {pick("الأصالة الملكية", "Royal Authenticity")}
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {pick(
              "نعتمد في خلطاتنا على أجود أنواع العود المعتق والزيوت الطبيعية النقية دون أي إضافات مقلدة.",
              "We craft our blends using the finest aged oud and pure natural oils without any synthetic additives.",
            )}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 text-center space-y-4 border border-border/70"
        >
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <ShieldCheck className="size-7" />
          </span>
          <h3 className="font-display text-lg font-bold text-foreground">{t("value_1_title")}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {pick(
              "لبان حوجري ظفاري فاخر وبخور تم إعداده بعناية فائقة ليدوم عبيره الفواح في منازلكم ومناسباتكم.",
              "Authentic Dhofari Hojari luban and incense carefully prepared to bring long-lasting royal scent to your home.",
            )}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-8 text-center space-y-4 border border-border/70"
        >
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <HeartHandshake className="size-7" />
          </span>
          <h3 className="font-display text-lg font-bold text-foreground">{t("value_3_title")}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {pick(
              "متابعة دقيقة لكل طلب وتوصيل سريع ومباشر لكافة مناطق السلطنة ودول الخليج.",
              "Dedicated support for every order with fast delivery across Oman and the GCC.",
            )}
          </p>
        </motion.div>
      </div>

      {/* Bank & Payment Information Box */}
      <div className="glass rounded-3xl p-8 sm:p-12 border border-primary/30 bg-card/60">
        <div className="flex items-center gap-3 mb-6">
          <Award className="size-6 text-primary" />
          <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
            {t("bank_details_title")}
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mb-6">{t("payment_advance_note")}</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border/80 bg-background/60 p-4">
            <span className="text-[11px] text-muted-foreground block">{t("bank_label")}</span>
            <span className="font-semibold text-sm text-foreground mt-1 block">
              {settings?.bank_name || "بنك مسقط (Bank Muscat)"}
            </span>
          </div>

          <div className="rounded-xl border border-border/80 bg-background/60 p-4">
            <span className="text-[11px] text-muted-foreground block">{t("account_number")}</span>
            <span dir="ltr" className="font-mono font-bold text-sm text-primary mt-1 block">
              {settings?.bank_account_number || "0369063092490012"}
            </span>
          </div>

          <div className="rounded-xl border border-border/80 bg-background/60 p-4">
            <span className="text-[11px] text-muted-foreground block">{t("recipient_name")}</span>
            <span className="font-semibold text-sm text-foreground mt-1 block">
              {settings?.bank_recipient_name || "ABDULMALIK"}
            </span>
          </div>

          <div className="rounded-xl border border-border/80 bg-background/60 p-4">
            <span className="text-[11px] text-muted-foreground block">{t("phone_transfer")}</span>
            <span dir="ltr" className="font-mono font-bold text-sm text-emerald-600 mt-1 block">
              {settings?.bank_phone_transfer || "77036097"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
