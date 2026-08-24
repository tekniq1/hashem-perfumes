import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Edit2,
  FolderTree,
  Image as ImageIcon,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
  type Category,
} from "@/lib/products";
import { uploadProductImage } from "@/lib/uploads";
import { translateText } from "@/lib/translator";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategoriesPage,
});

const field =
  "w-full rounded-xl border border-border bg-background/70 px-4 py-2.5 text-xs sm:text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary";

function AdminCategoriesPage() {
  const { t, pick } = useI18n();
  const qc = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [translating, setTranslating] = useState(false);

  const [form, setForm] = useState<{
    name_ar: string;
    name_en: string;
    slug: string;
    image_url: string;
  }>({
    name_ar: "",
    name_en: "",
    slug: "",
    image_url: "",
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const autoTranslateCategory = async () => {
    if (!form.name_ar && !form.name_en) return;
    setTranslating(true);
    try {
      let ar = form.name_ar || "";
      let en = form.name_en || "";

      if (ar && !en) {
        en = await translateText(ar, "en");
      } else if (en && !ar) {
        ar = await translateText(en, "ar");
      }

      const autoSlug = form.slug || (en ? en.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "");

      setForm((p) => ({
        ...p,
        name_ar: ar,
        name_en: en,
        slug: autoSlug || p.slug || "",
      }));
      toast.success(pick("تمت الترجمة التلقائية بنجاح", "Auto-translated successfully"));
    } catch {
      toast.error(pick("تعذرت الترجمة التلقائية", "Auto-translation failed"));
    } finally {
      setTranslating(false);
    }
  };

  const handleFieldBlur = async (sourceText: string, targetLang: "ar" | "en") => {
    if (!sourceText.trim()) return;
    try {
      if (targetLang === "en" && !form.name_en?.trim()) {
        const translated = await translateText(sourceText, "en");
        if (translated) {
          setForm((p) => ({
            ...p,
            name_en: translated,
            slug: p.slug || translated.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          }));
        }
      } else if (targetLang === "ar" && !form.name_ar?.trim()) {
        const translated = await translateText(sourceText, "ar");
        if (translated) {
          setForm((p) => ({ ...p, name_ar: translated }));
        }
      }
    } catch (e) {
      console.warn("Auto-translate field error:", e);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let finalNameAr = form.name_ar?.trim() || "";
      let finalNameEn = form.name_en?.trim() || "";

      if (!finalNameAr && !finalNameEn) {
        throw new Error(pick("يرجى إدخال اسم القسم", "Please enter category name"));
      }

      if (finalNameAr && !finalNameEn) {
        finalNameEn = await translateText(finalNameAr, "en");
      } else if (finalNameEn && !finalNameAr) {
        finalNameAr = await translateText(finalNameEn, "ar");
      }

      const finalSlug =
        form.slug?.trim() ||
        (finalNameEn ? finalNameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-") : `cat-${Date.now()}`);

      const payload = {
        name_ar: finalNameAr || finalNameEn,
        name_en: finalNameEn || finalNameAr,
        slug: finalSlug,
        image_url: form.image_url || null,
      };

      if (editing) {
        await updateCategory(editing.id, payload);
      } else {
        await createCategory(
          payload as { name_ar: string; name_en: string; slug: string; image_url?: string },
        );
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success(t("saved"));
      setModalOpen(false);
      setEditing(null);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : pick("حدث خطأ أثناء حفظ التصنيف", "Error saving category"),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success(t("deleted"));
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : pick("تعذر حذف التصنيف", "Failed to delete category"),
      );
    },
  });

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const url = await uploadProductImage(file);
      setForm((p) => ({ ...p, image_url: url }));
      toast.success(pick("تم رفع صورة التصنيف بنجاح", "Category image uploaded"));
    } catch (e) {
      toast.error(pick("فشل رفع صورة التصنيف", "Failed to upload image"));
    } finally {
      setUploadingImage(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({
      name_ar: "",
      name_en: "",
      slug: "",
      image_url: "",
    });
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({
      name_ar: c.name_ar,
      name_en: c.name_en,
      slug: c.slug,
      image_url: c.image_url || "",
    });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
            {pick("إدارة تصنيفات وأقسام المتجر", "Manage Store Categories")}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {pick(
              "إضافة وتعديل وحذف تصنيفات المنتجات وصورها الرئيسية في المتجر.",
              "Add, edit, and delete product categories and banner images.",
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-gold-glow cursor-pointer"
        >
          <Plus className="size-4" />
          <span>{t("add_category")}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : categories.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div
              key={c.id}
              className="glass rounded-2xl p-4 border border-border/80 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="size-16 rounded-xl overflow-hidden bg-background border border-border shrink-0">
                  <img
                    src={c.image_url || "/hashem-logo.png"}
                    alt={pick(c.name_ar, c.name_en)}
                    className="size-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-sm text-foreground truncate">
                    {pick(c.name_ar, c.name_en)}
                  </h3>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {c.name_en || c.name_ar}
                  </p>
                  <span className="inline-block mt-1 font-mono text-[10px] text-primary/80 bg-primary/10 px-2 py-0.5 rounded-md">
                    slug: {c.slug}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border/50 pt-3">
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors cursor-pointer"
                  title={t("edit")}
                >
                  <Edit2 className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        pick(
                          "هل أنت متأكد من حذف هذا التصنيف؟",
                          "Are you sure you want to delete this category?",
                        ),
                      )
                    ) {
                      deleteMutation.mutate(c.id);
                    }
                  }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  title={t("delete")}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center max-w-md mx-auto">
          <p className="text-sm text-muted-foreground mb-4">
            {pick("لا توجد تصنيفات مضافة بعد.", "No categories added yet.")}
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-xl bg-gold-gradient px-6 py-2.5 text-xs font-bold text-primary-foreground"
          >
            {t("add_category")}
          </button>
        </div>
      )}

      {/* Category Modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="glass relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl p-6 sm:p-8 border border-border shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/70 pb-4 mb-5">
              <h3 className="font-display text-lg font-bold text-foreground">
                {editing ? pick("تعديل بيانات التصنيف", "Edit Category") : t("add_category")}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={autoTranslateCategory}
                  disabled={translating}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg hover:bg-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                  title="ترجمة تلقائية للغات الأخرى"
                >
                  {translating ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Sparkles className="size-3" />
                  )}
                  <span>{translating ? t("auto_translating") : t("auto_translate_btn")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-medium text-muted-foreground block mb-1">
                  {t("name_ar")} <span className="text-primary">*</span>
                </label>
                <input
                  className={field}
                  placeholder="مثال: عطور فاخرة"
                  value={form.name_ar || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((p) => ({
                      ...p,
                      name_ar: val,
                    }));
                  }}
                  onBlur={() => handleFieldBlur(form.name_ar || "", "en")}
                />
              </div>

              <div>
                <label className="font-medium text-muted-foreground block mb-1">
                  {t("name_en")} <span className="text-primary">*</span>
                </label>
                <input
                  className={field}
                  placeholder="e.g. Fine Fragrances"
                  value={form.name_en || ""}
                  onChange={(e) => setForm((p) => ({ ...p, name_en: e.target.value }))}
                  onBlur={() => handleFieldBlur(form.name_en || "", "ar")}
                />
              </div>

              <div>
                <label className="font-medium text-muted-foreground block mb-1">
                  Slug <span className="text-primary">*</span>
                </label>
                <input
                  className={field}
                  dir="ltr"
                  placeholder="مثال: fragrances / incense / oud"
                  value={form.slug || ""}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                />
              </div>

              <div>
                <label className="font-medium text-muted-foreground block mb-1">صورة التصنيف</label>

                {form.image_url ? (
                  <div className="space-y-2 mb-2">
                    <img
                      src={form.image_url}
                      alt="معاينة"
                      className="aspect-video w-full rounded-xl object-cover border border-border"
                    />
                    <div className="flex gap-2">
                      <input
                        className={field}
                        value={form.image_url}
                        onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                        placeholder="رابط الصورة..."
                      />
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, image_url: "" }))}
                        className="p-2 rounded-xl text-destructive hover:bg-destructive/10 border border-border"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ) : null}

                <label className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground cursor-pointer transition-all">
                  {uploadingImage ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  <span>{uploadingImage ? "جاري الرفع..." : "رفع صورة للقسم من جهازك"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(f);
                    }}
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/70 mt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-border px-5 py-2.5 text-xs font-medium text-foreground hover:bg-accent cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="rounded-xl bg-gold-gradient px-7 py-2.5 text-xs font-bold text-primary-foreground shadow-gold-glow cursor-pointer disabled:opacity-50"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin inline" />
                  ) : (
                    t("save")
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
