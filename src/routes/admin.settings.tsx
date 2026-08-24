import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  Image as ImageIcon,
  Layout,
  Loader2,
  Megaphone,
  MessageCircle,
  Save,
  Sparkles,
  Upload,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { fetchStoreSettings, updateStoreSettings, type StoreSettings } from "@/lib/settings";
import { uploadProductImage } from "@/lib/uploads";
import { LogoMark } from "@/components/brand/Logo";
import { translateText } from "@/lib/translator";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
});

const field =
  "w-full rounded-xl border border-border bg-background/70 px-4 py-2.5 text-xs sm:text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary";

function AdminSettingsPage() {
  const { t, pick } = useI18n();
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["store-settings"],
    queryFn: fetchStoreSettings,
  });

  const [form, setForm] = useState<Partial<StoreSettings>>({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [translatingAbout, setTranslatingAbout] = useState(false);
  const [translatingAnnouncement, setTranslatingAnnouncement] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<StoreSettings>) => {
      const payload: Partial<StoreSettings> = {
        ...data,
        announcement_bar_text:
          data.announcement_text_ar ||
          data.announcement_bar_text ||
          data.announcement_text_en ||
          "",
      };
      return updateStoreSettings(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store-settings"] });
      toast.success(t("saved"));
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : pick("حدث خطأ أثناء حفظ الإعدادات", "Error saving settings"),
      );
    },
  });

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const url = await uploadProductImage(file);
      const updated = { ...form, logo_url: url };
      setForm(updated);
      await updateStoreSettings(updated);
      qc.invalidateQueries({ queryKey: ["store-settings"] });
      toast.success(
        pick("تم رفع وحفظ الشعار الجديد بنجاح!", "New logo uploaded and saved successfully!"),
      );
    } catch (e) {
      toast.error(pick("فشل رفع صورة الشعار", "Failed to upload logo image"));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleHeroUpload = async (file: File) => {
    setUploadingHero(true);
    try {
      const url = await uploadProductImage(file);
      const updated = { ...form, hero_image_url: url };
      setForm(updated);
      await updateStoreSettings(updated);
      qc.invalidateQueries({ queryKey: ["store-settings"] });
      toast.success(
        pick(
          "تم رفع وحفظ صورة الواجهة الجديدة بنجاح!",
          "New hero image uploaded and saved successfully!",
        ),
      );
    } catch (e) {
      toast.error(pick("فشل رفع صورة الواجهة", "Failed to upload hero image"));
    } finally {
      setUploadingHero(false);
    }
  };

  const autoTranslateAnnouncement = async () => {
    const ar = form.announcement_text_ar || form.announcement_bar_text || "";
    const en = form.announcement_text_en || "";
    if (!ar && !en) return;
    setTranslatingAnnouncement(true);
    try {
      let finalAr = ar;
      let finalEn = en;

      if (ar && !en) {
        finalEn = await translateText(ar, "en");
      } else if (en && !ar) {
        finalAr = await translateText(en, "ar");
      }

      setForm((prev) => ({
        ...prev,
        announcement_text_ar: finalAr,
        announcement_text_en: finalEn,
        announcement_bar_text: finalAr || finalEn,
      }));
      toast.success(
        pick("تمت ترجمة الشريط الإعلاني بنجاح", "Announcement bar auto-translated successfully"),
      );
    } catch {
      toast.error(pick("تعذرت ترجمة الشريط الإعلاني", "Failed to translate announcement text"));
    } finally {
      setTranslatingAnnouncement(false);
    }
  };

  const autoTranslateAbout = async () => {
    if (
      !form.about_title_ar &&
      !form.about_title_en &&
      !form.about_description_ar &&
      !form.about_description_en
    )
      return;
    setTranslatingAbout(true);
    try {
      let titleAr = form.about_title_ar || "";
      let titleEn = form.about_title_en || "";
      let descAr = form.about_description_ar || "";
      let descEn = form.about_description_en || "";

      if (titleAr && !titleEn) {
        titleEn = await translateText(titleAr, "en");
      } else if (titleEn && !titleAr) {
        titleAr = await translateText(titleEn, "ar");
      }

      if (descAr && !descEn) {
        descEn = await translateText(descAr, "en");
      } else if (descEn && !descAr) {
        descAr = await translateText(descEn, "ar");
      }

      setForm((prev) => ({
        ...prev,
        about_title_ar: titleAr,
        about_title_en: titleEn,
        about_description_ar: descAr,
        about_description_en: descEn,
      }));
      toast.success(pick("تمت الترجمة التلقائية بنجاح", "Auto-translated successfully"));
    } catch {
      toast.error(pick("تعذرت الترجمة التلقائية", "Auto-translation failed"));
    } finally {
      setTranslatingAbout(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        {pick("جاري تحميل الإعدادات...", "Loading settings...")}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Title */}
      <div>
        <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
          {pick("إعدادات المتجر العامة والمظهر", "General Store & Appearance Settings")}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {pick(
            "التحكم في اللوجو، صورة واجهة الهيرو، الشريط الإعلاني، بيانات التواصل وبنك مسقط",
            "Manage logo, homepage hero image, announcement bar, contact info, and Bank Muscat details.",
          )}
        </p>
      </div>

      {/* 1. Hero Image Management */}
      <div className="glass rounded-3xl p-6 sm:p-8 border-2 border-primary/40 shadow-gold-glow space-y-5 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-primary font-bold text-base">
            <Layout className="size-5" />
            <span>{pick("صورة واجهة الصفحة الرئيسية (Hero Image)", "Homepage Hero Image")}</span>
          </div>
          <span className="rounded-full bg-primary/20 text-primary px-3 py-1 text-[11px] font-bold">
            {t("nav_home")}
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {pick(
            "هذه هي الصورة الدائرية الفاخرة التي تظهر في أول الصفحة الرئيسية بجانب العنوان الرئيسي وزر الطلب السريع.",
            "This is the luxury circular image displayed at the top of the homepage next to the main heading.",
          )}
        </p>

        <div className="flex flex-col md:flex-row items-center gap-6 pt-2 bg-card/60 p-5 rounded-2xl border border-border">
          {/* Circular Frame Preview */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground">
              {pick("معاينة الصورة الحالية:", "Current Image Preview:")}
            </span>
            <div className="relative size-32 sm:size-36 rounded-full overflow-hidden border-4 border-primary shadow-gold-glow bg-black/40 flex items-center justify-center">
              <img
                src={form.hero_image_url || "/hashem-logo.png"}
                alt={pick("معاينة الواجهة", "Hero preview")}
                className="size-full object-cover"
              />
            </div>
          </div>

          {/* Upload and Link controls */}
          <div className="flex-1 w-full space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                {pick("اختر صورة جديدة من جهازك:", "Choose a new image from device:")}
              </label>
              <label className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold-gradient px-5 py-3 text-xs font-bold text-primary-foreground shadow-gold-glow cursor-pointer transition-all hover:opacity-95 w-full sm:w-auto">
                {uploadingHero ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                <span>
                  {uploadingHero
                    ? pick("جاري الرفع والحفظ...", "Uploading and saving...")
                    : pick("رفع صورة هيرو جديدة (Upload)", "Upload New Hero Image")}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleHeroUpload(f);
                  }}
                />
              </label>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                {pick("أو اكتب رابط الصورة المباشر:", "Or enter direct image URL:")}
              </label>
              <input
                className={field}
                value={form.hero_image_url || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, hero_image_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Logo Management */}
      <div className="glass rounded-3xl p-6 sm:p-8 border border-border/80 space-y-5">
        <div className="flex items-center gap-2.5 text-primary font-bold text-base">
          <ImageIcon className="size-5" />
          <span>{pick("شعار المتجر (Logo)", "Store Logo")}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {pick(
            "الشعار الرسمي الذي يظهر في الهيدر والفوتر وفوق أيقونة المتجر.",
            "Official logo displayed in header, footer, and brand lockups.",
          )}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6 pt-2 bg-card/40 p-5 rounded-2xl border border-border">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground">
              {pick("معاينة الشعار:", "Logo Preview:")}
            </span>
            <LogoMark size={80} customUrl={form.logo_url} />
          </div>

          <div className="flex-1 w-full space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                {pick("رفع شعار جديد:", "Upload New Logo:")}
              </label>
              <label className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold-gradient px-5 py-3 text-xs font-bold text-primary-foreground shadow-gold-glow cursor-pointer transition-all hover:opacity-95 w-full sm:w-auto">
                {uploadingLogo ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                <span>
                  {uploadingLogo
                    ? pick("جاري الرفع والحفظ...", "Uploading and saving...")
                    : pick("رفع لوجو جديد من جهازك", "Upload New Logo")}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleLogoUpload(f);
                  }}
                />
              </label>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                {pick("رابط صورة الشعار:", "Logo Image URL:")}
              </label>
              <input
                className={field}
                value={form.logo_url || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, logo_url: e.target.value }))}
                placeholder="/hashem-logo.png"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Announcement Bar */}
      <div className="glass rounded-3xl p-6 sm:p-8 border border-border/80 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-primary font-bold text-base">
            <Megaphone className="size-5" />
            <span>
              {pick("الشريط الإعلاني العلوي (Top Announcement Bar)", "Top Announcement Bar")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={autoTranslateAnnouncement}
              disabled={translatingAnnouncement}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg hover:bg-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
              title="ترجمة تلقائية / Auto-Translate"
            >
              {translatingAnnouncement ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Sparkles className="size-3" />
              )}
              <span>
                {translatingAnnouncement ? t("auto_translating") : t("auto_translate_btn")}
              </span>
            </button>

            <label className="flex items-center gap-2 text-xs cursor-pointer bg-accent/60 px-3 py-1.5 rounded-xl border border-border">
              <input
                type="checkbox"
                checked={form.announcement_bar_active ?? true}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    announcement_bar_active: e.target.checked,
                    announcement_enabled: e.target.checked,
                  }))
                }
                className="rounded accent-primary size-4"
              />
              <span className="font-semibold text-foreground">
                {pick("تفعيل الشريط", "Enable Announcement Bar")}
              </span>
            </label>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              {pick("نص الشريط المتحرك (عربي)", "Announcement Text (Arabic)")}
            </label>
            <input
              className={field}
              value={form.announcement_text_ar || form.announcement_bar_text || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  announcement_text_ar: e.target.value,
                  announcement_bar_text: e.target.value,
                }))
              }
              placeholder="شحن لجميع المناطق • بخور وعطور ملكية فاخرة • منتجات أصيلة ١٠٠٪"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              {pick("نص الشريط المتحرك (إنجليزي)", "Announcement Text (English)")}
            </label>
            <input
              className={field}
              value={form.announcement_text_en || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  announcement_text_en: e.target.value,
                }))
              }
              placeholder="Shipping to all areas • Royal incense & fine perfume • 100% genuine products"
            />
          </div>
        </div>
      </div>

      {/* 4. Contact Details */}
      <div className="glass rounded-3xl p-6 sm:p-8 border border-border/80 space-y-5">
        <div className="flex items-center gap-2.5 text-primary font-bold text-base">
          <MessageCircle className="size-5" />
          <span>{pick("بيانات التواصل وحسابات المتجر", "Store Contact & Social Accounts")}</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              {pick(
                "رقم الواتساب المعتمد (لاستقبال الطلبات)",
                "Official WhatsApp Number (For Orders)",
              )}
            </label>
            <input
              className={field}
              dir="ltr"
              value={form.whatsapp_number || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, whatsapp_number: e.target.value }))}
              placeholder="96877036097"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              {pick("حساب الانستقرام", "Instagram Handle")}
            </label>
            <input
              className={field}
              dir="ltr"
              value={form.instagram_handle || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, instagram_handle: e.target.value }))}
              placeholder="hashem_lelteeb"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              {t("email")}
            </label>
            <input
              className={field}
              dir="ltr"
              type="email"
              value={form.email || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="abdualhidry@gmail.com"
            />
          </div>
        </div>
      </div>

      {/* 5. Bank Muscat Payment Info */}
      <div className="glass rounded-3xl p-6 sm:p-8 border border-border/80 space-y-5">
        <div className="flex items-center gap-2.5 text-primary font-bold text-base">
          <CreditCard className="size-5" />
          <span>{t("bank_details_title")}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {pick(
            "هذه البيانات تظهر للعميل في صفحة إتمام الطلب وصفحة 'من نحن' للتحويل قبل الشحن.",
            "These details are shown to customers on Checkout and About Us pages for bank transfer before shipping.",
          )}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              {t("bank_label")}
            </label>
            <input
              className={field}
              value={form.bank_name || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, bank_name: e.target.value }))}
              placeholder="بنك مسقط (Bank Muscat)"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              {t("account_number")}
            </label>
            <input
              className={field}
              dir="ltr"
              value={form.bank_account_number || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, bank_account_number: e.target.value }))
              }
              placeholder="0369063092490012"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              {t("recipient_name")}
            </label>
            <input
              className={field}
              value={form.bank_recipient_name || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, bank_recipient_name: e.target.value }))
              }
              placeholder="ABDULMALIK"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              {t("phone_transfer")}
            </label>
            <input
              className={field}
              dir="ltr"
              value={form.bank_phone_transfer || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, bank_phone_transfer: e.target.value }))
              }
              placeholder="77036097"
            />
          </div>
        </div>
      </div>

      {/* 6. About Us Content */}
      <div className="glass rounded-3xl p-6 sm:p-8 border border-border/80 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-primary font-bold text-base">
            <Sparkles className="size-5" />
            <span>{pick("محتوى صفحة 'من نحن'", "About Us Page Content")}</span>
          </div>
          <button
            type="button"
            onClick={autoTranslateAbout}
            disabled={translatingAbout}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg hover:bg-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            title="ترجمة تلقائية / Auto-Translate"
          >
            {translatingAbout ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Sparkles className="size-3" />
            )}
            <span>{translatingAbout ? t("auto_translating") : t("auto_translate_btn")}</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                {pick("العنوان الرئيسي (عربي)", "Main Title (Arabic)")}
              </label>
              <input
                className={field}
                value={form.about_title_ar || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, about_title_ar: e.target.value }))}
                placeholder="هاشم للطيب — فخامة العبير الملكي"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                {pick("العنوان الرئيسي (إنجليزي)", "Main Title (English)")}
              </label>
              <input
                className={field}
                value={form.about_title_en || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, about_title_en: e.target.value }))}
                placeholder="HASHEM LELTEEB — Royal Fragrance Luxury"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                {pick("الوصف والنبذة التعريفية (عربي)", "Description & Story (Arabic)")}
              </label>
              <textarea
                className={`${field} min-h-[110px]`}
                value={form.about_description_ar || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, about_description_ar: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                {pick("الوصف والنبذة التعريفية (إنجليزي)", "Description & Story (English)")}
              </label>
              <textarea
                className={`${field} min-h-[110px]`}
                value={form.about_description_en || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, about_description_en: e.target.value }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="sticky bottom-6 flex justify-end">
        <button
          type="button"
          onClick={() => updateMutation.mutate(form)}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 rounded-2xl bg-gold-gradient px-8 py-3.5 text-xs font-bold text-primary-foreground shadow-gold-glow hover:opacity-95 transition-all cursor-pointer"
        >
          {updateMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          <span>{t("save")}</span>
        </button>
      </div>
    </div>
  );
}
