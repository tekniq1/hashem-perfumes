import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  Boxes,
  Crown,
  Film,
  FolderTree,
  LayoutDashboard,
  MapPin,
  Receipt,
  Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة التحكم — هاشم للطيب | Admin Panel" },
      {
        name: "description",
        content: "إدارة متجر هاشم للطيب، المنتجات، الطلبات، الفروع، الإعدادات واللوجو.",
      },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, loading, user } = useAuth();
  const { t, pick } = useI18n();

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-20 text-center text-muted-foreground">
        {pick("جاري التحقق من الصلاحيات...", "Verifying admin access...")}
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <Crown className="mx-auto size-12 text-primary animate-pulse" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">{t("nav_admin")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {pick(
            "هذه الصفحة مخصصة لمدير متجر هاشم للطيب فقط.",
            "This area is for administrators only.",
          )}
        </p>
        <Link
          to="/auth"
          className="mt-6 inline-flex rounded-xl bg-gold-gradient px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold-glow"
        >
          {t("sign_in")}
        </Link>
      </div>
    );
  }

  const tab =
    "rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground transition-all hover:bg-accent hover:text-foreground";
  const active = "bg-gold-gradient text-primary-foreground font-bold shadow-gold-glow";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-3 mb-2">
        <Crown className="size-6 text-primary" />
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          {pick("لوحة تحكم المتجر", "Store Admin Panel")}
        </h1>
      </div>
      <p className="text-xs text-muted-foreground">
        {pick(
          "إدارة منتجات وعروض وفروع وطلبات متجر هاشم للطيب",
          "Manage products, offers, branches, and orders for HASHEM LELTEEB boutique.",
        )}
      </p>

      <nav className="mt-6 flex flex-wrap gap-2 border-b border-border/70 pb-4">
        <Link
          to="/admin"
          activeOptions={{ exact: true }}
          className={tab}
          activeProps={{ className: active }}
        >
          <span className="inline-flex items-center gap-2">
            <LayoutDashboard className="size-4" />
            {t("tab_overview")}
          </span>
        </Link>
        <Link to="/admin/products" className={tab} activeProps={{ className: active }}>
          <span className="inline-flex items-center gap-2">
            <Boxes className="size-4" />
            {t("tab_products")}
          </span>
        </Link>
        <Link to="/admin/orders" className={tab} activeProps={{ className: active }}>
          <span className="inline-flex items-center gap-2">
            <Receipt className="size-4" />
            {t("tab_orders")}
          </span>
        </Link>
        <Link to="/admin/categories" className={tab} activeProps={{ className: active }}>
          <span className="inline-flex items-center gap-2">
            <FolderTree className="size-4" />
            <span>{t("tab_categories")}</span>
          </span>
        </Link>
        <Link to="/admin/branches" className={tab} activeProps={{ className: active }}>
          <span className="inline-flex items-center gap-2">
            <MapPin className="size-4" />
            {t("tab_branches")}
          </span>
        </Link>
        <Link to="/admin/videos" className={tab} activeProps={{ className: active }}>
          <span className="inline-flex items-center gap-2">
            <Film className="size-4" />
            {t("tab_videos")}
          </span>
        </Link>
        <Link to="/admin/settings" className={tab} activeProps={{ className: active }}>
          <span className="inline-flex items-center gap-2">
            <Settings className="size-4" />
            {t("tab_settings")}
          </span>
        </Link>
      </nav>

      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
