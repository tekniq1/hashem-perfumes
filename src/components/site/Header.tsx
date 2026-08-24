import { Link, useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  Boxes,
  Crown,
  Film,
  Flame,
  FolderTree,
  Home,
  Info,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LogoLockup } from "@/components/brand/Logo";
import { useQuery } from "@tanstack/react-query";
import { fetchStoreSettings } from "@/lib/settings";

function AnnouncementBar() {
  const { t, pick } = useI18n();
  const { data: settings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: fetchStoreSettings,
  });

  if (
    settings &&
    settings.announcement_bar_active === false &&
    settings.announcement_enabled === false
  ) {
    return null;
  }

  const customText =
    pick(settings?.announcement_text_ar, settings?.announcement_text_en) ||
    settings?.announcement_bar_text;
  const text = customText && customText.trim() ? customText : t("marquee");

  return (
    <div className="overflow-hidden bg-teal-deep py-2 border-b border-primary/20">
      <div className="marquee-track gap-16 px-8 text-[11px] font-medium tracking-[0.2em] text-teal-foreground">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="whitespace-nowrap flex items-center gap-4">
            <span>✨</span>
            <span>{text}</span>
            <span>✨</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Header() {
  const { t, lang, toggle, pick } = useI18n();
  const { count, setOpen } = useCart();
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: fetchStoreSettings,
  });

  const linkClass =
    "relative py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";
  const activeClass =
    "text-foreground font-semibold after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-gold-gradient";

  const closeMenu = () => setMobileMenuOpen(false);

  const adminSubLinks = [
    { to: "/admin", label: t("tab_overview"), icon: LayoutDashboard, exact: true },
    { to: "/admin/products", label: t("tab_products"), icon: Boxes },
    { to: "/admin/orders", label: t("tab_orders"), icon: Receipt },
    { to: "/admin/categories", label: t("tab_categories"), icon: FolderTree },
    { to: "/admin/branches", label: t("tab_branches"), icon: MapPin },
    { to: "/admin/videos", label: t("tab_videos"), icon: Film },
    { to: "/admin/settings", label: t("tab_settings"), icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40">
      <AnnouncementBar />
      <div className="border-b border-border/70 bg-background/90 backdrop-blur-xl shadow-xs">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Brand Logo */}
          <Link to="/" onClick={closeMenu} aria-label={t("brand")}>
            <LogoLockup />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-7 lg:flex">
            <Link to="/" className={linkClass} activeProps={{ className: activeClass }}>
              {t("nav_home")}
            </Link>
            <Link to="/shop" className={linkClass} activeProps={{ className: activeClass }}>
              {t("nav_shop")}
            </Link>
            <Link
              to="/offers"
              className={`${linkClass} flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold`}
              activeProps={{ className: activeClass }}
            >
              <Flame className="size-4 text-amber-500 animate-pulse" />
              {t("nav_offers")}
            </Link>
            <Link
              to="/shop"
              search={{ category: "incense" }}
              className={linkClass}
              activeProps={{ className: "" }}
            >
              {t("nav_incense")}
            </Link>
            <Link
              to="/shop"
              search={{ category: "fragrances" }}
              className={linkClass}
              activeProps={{ className: "" }}
            >
              {t("nav_perfumes")}
            </Link>
            <Link
              to="/branches"
              className={`${linkClass} flex items-center gap-1`}
              activeProps={{ className: activeClass }}
            >
              <MapPin className="size-3.5 text-primary" />
              {t("nav_branches")}
            </Link>
            <Link to="/about" className={linkClass} activeProps={{ className: activeClass }}>
              {t("nav_about")}
            </Link>
            {user ? (
              <Link to="/orders" className={linkClass} activeProps={{ className: activeClass }}>
                {t("nav_orders")}
              </Link>
            ) : null}
            {isAdmin ? (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/40 px-3 py-1 text-xs font-semibold text-primary shadow-xs transition-all hover:bg-primary hover:text-primary-foreground"
              >
                <Crown className="size-3.5 text-primary group-hover:text-primary-foreground" />
                {t("nav_admin")}
              </Link>
            ) : null}
          </nav>

          {/* Action Buttons & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Language Switch */}
            <button
              onClick={toggle}
              aria-label={t("language")}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-bold tracking-widest text-primary transition-colors hover:bg-accent cursor-pointer"
            >
              {lang === "ar" ? "EN" : "عربي"}
            </button>

            {/* User Profile / Auth Button */}
            {user ? (
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.navigate({ to: "/" });
                }}
                aria-label={t("sign_out")}
                title={t("sign_out")}
                className="hidden sm:inline-flex rounded-full border border-border p-2 text-muted-foreground transition-colors hover:text-primary cursor-pointer"
              >
                <LogOut className="size-4" />
              </button>
            ) : (
              <Link
                to="/auth"
                aria-label={t("sign_in")}
                title={t("sign_in")}
                className="hidden sm:inline-flex rounded-full border border-border p-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <User className="size-4" />
              </Link>
            )}

            {/* Cart Button */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                closeMenu();
                setOpen(true);
              }}
              className="flex items-center gap-2 rounded-full bg-teal px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold text-teal-foreground shadow-soft cursor-pointer hover:opacity-95 transition-opacity"
            >
              <ShoppingBag className="size-4" />
              <span className="hidden md:inline">{t("cart")}</span>
              {count > 0 ? (
                <span className="flex size-5 items-center justify-center rounded-full bg-gold-gradient text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              ) : null}
            </motion.button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex lg:hidden size-10 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="lg:hidden border-b border-border/80 bg-background/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-5 max-h-[calc(100vh-6rem)] overflow-y-auto">
              {/* 👑 ADMIN SECTION (Shown when logged in as Admin) */}
              {isAdmin ? (
                <div className="rounded-3xl border border-primary/40 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent p-4 shadow-gold-glow space-y-3">
                  <div className="flex items-center justify-between border-b border-primary/20 pb-2.5">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <Crown className="size-4.5" />
                      <span>{pick("لوحة تحكم الإدارة", "Admin Dashboard")}</span>
                    </div>
                    <span className="rounded-full bg-primary/20 text-primary px-2.5 py-0.5 text-[10px] font-bold">
                      {pick("مدير المتجر", "Admin Access")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {adminSubLinks.map((tab) => (
                      <Link
                        key={tab.to}
                        to={tab.to}
                        onClick={closeMenu}
                        className="flex items-center gap-2 rounded-xl bg-card/80 border border-primary/20 p-2.5 text-xs font-semibold text-foreground hover:bg-primary hover:text-primary-foreground transition-all shadow-xs"
                      >
                        <tab.icon className="size-4 text-primary shrink-0" />
                        <span className="truncate">{tab.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Public Store Navigation Links */}
              <div>
                {isAdmin ? (
                  <p className="text-[11px] font-bold text-muted-foreground mb-2 px-1">
                    {pick("تصفح صفحات المتجر للزوار:", "Store Pages:")}
                  </p>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Link
                    to="/"
                    onClick={closeMenu}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-border/60 bg-card/60 text-foreground hover:bg-accent font-medium transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Home className="size-4" />
                      </span>
                      <span className="text-sm">{t("nav_home")}</span>
                    </div>
                  </Link>

                  <Link
                    to="/shop"
                    onClick={closeMenu}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-border/60 bg-card/60 text-foreground hover:bg-accent font-medium transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Boxes className="size-4" />
                      </span>
                      <span className="text-sm">{t("nav_shop")}</span>
                    </div>
                  </Link>

                  <Link
                    to="/offers"
                    onClick={closeMenu}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
                        <Flame className="size-4 animate-pulse" />
                      </span>
                      <span className="text-sm">{t("nav_offers")}</span>
                    </div>
                    <span className="rounded-full bg-amber-500 text-primary-foreground text-[10px] font-bold px-2 py-0.5 animate-pulse">
                      {pick("خصومات", "Offers")}
                    </span>
                  </Link>

                  <Link
                    to="/shop"
                    search={{ category: "incense" }}
                    onClick={closeMenu}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-border/60 bg-card/60 text-foreground hover:bg-accent font-medium transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Sparkles className="size-4" />
                      </span>
                      <span className="text-sm">{t("nav_incense")}</span>
                    </div>
                  </Link>

                  <Link
                    to="/shop"
                    search={{ category: "fragrances" }}
                    onClick={closeMenu}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-border/60 bg-card/60 text-foreground hover:bg-accent font-medium transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Sparkles className="size-4" />
                      </span>
                      <span className="text-sm">{t("nav_perfumes")}</span>
                    </div>
                  </Link>

                  <Link
                    to="/branches"
                    onClick={closeMenu}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-border/60 bg-card/60 text-foreground hover:bg-accent font-medium transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <MapPin className="size-4" />
                      </span>
                      <span className="text-sm">{t("nav_branches")}</span>
                    </div>
                  </Link>

                  <Link
                    to="/about"
                    onClick={closeMenu}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-border/60 bg-card/60 text-foreground hover:bg-accent font-medium transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Info className="size-4" />
                      </span>
                      <span className="text-sm">{t("nav_about")}</span>
                    </div>
                  </Link>

                  {user ? (
                    <Link
                      to="/orders"
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border/60 bg-card/60 text-foreground hover:bg-accent font-medium"
                    >
                      <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Package className="size-4" />
                      </span>
                      <span className="text-sm">{t("nav_orders")}</span>
                    </Link>
                  ) : null}
                </div>
              </div>

              {/* Bottom Quick Actions (Auth & WhatsApp) */}
              <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row gap-2.5">
                {user ? (
                  <button
                    type="button"
                    onClick={async () => {
                      closeMenu();
                      await supabase.auth.signOut();
                      router.navigate({ to: "/" });
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-bold cursor-pointer hover:bg-destructive/20"
                  >
                    <LogOut className="size-4" />
                    <span>{t("sign_out")}</span>
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    onClick={closeMenu}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gold-gradient text-primary-foreground shadow-gold-glow text-xs font-bold"
                  >
                    <User className="size-4" />
                    <span>
                      {t("sign_in")} / {t("sign_up")}
                    </span>
                  </Link>
                )}

                {settings?.whatsapp_number ? (
                  <a
                    href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-600/25 transition-all"
                  >
                    <MessageCircle className="size-4" />
                    <span>{pick("تواصل واتساب", "WhatsApp Chat")}</span>
                  </a>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
