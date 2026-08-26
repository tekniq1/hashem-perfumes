import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fetchCategories, fetchProducts, type Product } from "@/lib/products";
import { removeProductImage, uploadProductImages } from "@/lib/uploads";
import { translateText } from "@/lib/translator";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

type Draft = {
  id: string | null;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price: string;
  cost_price: string;
  discount_price: string;
  stock_quantity: string;
  low_stock_threshold: string;
  category_id: string;
  images: string[];
  is_featured: boolean;
};

const emptyDraft: Draft = {
  id: null,
  name_ar: "",
  name_en: "",
  description_ar: "",
  description_en: "",
  price: "",
  cost_price: "",
  discount_price: "",
  stock_quantity: "",
  low_stock_threshold: "5",
  category_id: "",
  images: [],
  is_featured: false,
};

function toDraft(p: Product): Draft {
  return {
    id: p.id,
    name_ar: p.name_ar,
    name_en: p.name_en,
    description_ar: p.description_ar ?? "",
    description_en: p.description_en ?? "",
    price: p.price != null ? String(p.price) : "",
    cost_price: p.cost_price != null ? String(p.cost_price) : "",
    discount_price: p.discount_price != null ? String(p.discount_price) : "",
    stock_quantity: p.stock_quantity != null ? String(p.stock_quantity) : "",
    low_stock_threshold: p.low_stock_threshold != null ? String(p.low_stock_threshold) : "5",
    category_id: p.category_id ?? "",
    images: p.images ?? [],
    is_featured: p.is_featured,
  };
}

function AdminProducts() {
  const { t, pick, money } = useI18n();
  const qc = useQueryClient();
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [uploading, setUploading] = useState(false);
  const [translating, setTranslating] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["products"] });
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const handleAutoTranslate = async () => {
    if (!draft.name_ar && !draft.name_en && !draft.description_ar && !draft.description_en) return;
    setTranslating(true);
    try {
      let newNameEn = draft.name_en;
      let newNameAr = draft.name_ar;
      let newDescEn = draft.description_en;
      let newDescAr = draft.description_ar;

      if (draft.name_ar && !draft.name_en) {
        newNameEn = await translateText(draft.name_ar, "en");
      } else if (draft.name_en && !draft.name_ar) {
        newNameAr = await translateText(draft.name_en, "ar");
      }

      if (draft.description_ar && !draft.description_en) {
        newDescEn = await translateText(draft.description_ar, "en");
      } else if (draft.description_en && !draft.description_ar) {
        newDescAr = await translateText(draft.description_en, "ar");
      }

      setDraft((d) => ({
        ...d,
        name_ar: newNameAr,
        name_en: newNameEn,
        description_ar: newDescAr,
        description_en: newDescEn,
      }));
      toast.success(pick("تمت الترجمة التلقائية بنجاح", "Auto-translated successfully"));
    } catch {
      toast.error(pick("تعذرت الترجمة التلقائية", "Auto-translation failed"));
    } finally {
      setTranslating(false);
    }
  };

  const autoTranslateField = async (
    sourceText: string,
    targetField: "name_ar" | "name_en" | "description_ar" | "description_en",
    targetLang: "ar" | "en",
  ) => {
    if (!sourceText.trim() || draft[targetField].trim()) return;
    try {
      const translated = await translateText(sourceText, targetLang);
      if (translated) {
        set(targetField, translated);
      }
    } catch (e) {
      console.warn("Field auto-translate failed:", e);
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      let finalNameAr = draft.name_ar.trim();
      let finalNameEn = draft.name_en.trim();
      let finalDescAr = draft.description_ar.trim();
      let finalDescEn = draft.description_en.trim();

      if (!finalNameAr && !finalNameEn) {
        throw new Error(pick("يرجى إدخال اسم المنتج", "Please enter product name"));
      }

      // If one language is missing, auto-translate before saving
      if (finalNameAr && !finalNameEn) {
        finalNameEn = await translateText(finalNameAr, "en");
      } else if (finalNameEn && !finalNameAr) {
        finalNameAr = await translateText(finalNameEn, "ar");
      }

      if (finalDescAr && !finalDescEn) {
        finalDescEn = await translateText(finalDescAr, "en");
      } else if (finalDescEn && !finalDescAr) {
        finalDescAr = await translateText(finalDescEn, "ar");
      }

      const payload = {
        name_ar: finalNameAr || finalNameEn,
        name_en: finalNameEn || finalNameAr,
        description_ar: finalDescAr || null,
        description_en: finalDescEn || null,
        price: Number(draft.price) || 0,
        cost_price: Number(draft.cost_price) || 0,
        discount_price: draft.discount_price ? Number(draft.discount_price) : null,
        stock_quantity: Number(draft.stock_quantity) || 0,
        low_stock_threshold: Number(draft.low_stock_threshold) || 5,
        category_id: draft.category_id || null,
        images: draft.images,
        is_featured: draft.is_featured,
      };
      if (draft.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", draft.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(t("saved"));
      setDraft(emptyDraft);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (p: Product) => {
      const { error } = await supabase.from("products").delete().eq("id", p.id);
      if (error) throw error;
      for (const url of p.images ?? []) await removeProductImage(url);
    },
    onSuccess: () => {
      toast.success(t("deleted"));
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const field =
    "w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary";
  const label = "block space-y-1.5";
  const hint = "text-xs text-muted-foreground";

  return (
    <div className="grid gap-8 lg:grid-cols-[24rem_1fr]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="glass h-fit space-y-4 rounded-2xl p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg text-foreground font-bold">
            {draft.id ? t("edit") : t("add_product")}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoTranslate}
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
            {draft.id ? (
              <button
                type="button"
                onClick={() => setDraft(emptyDraft)}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                {t("cancel")}
              </button>
            ) : null}
          </div>
        </div>

        <label className={label}>
          <span className={hint}>{t("name_ar")}</span>
          <input
            value={draft.name_ar}
            onChange={(e) => set("name_ar", e.target.value)}
            onBlur={() => autoTranslateField(draft.name_ar, "name_en", "en")}
            className={field}
          />
        </label>
        <label className={label}>
          <span className={hint}>{t("name_en")}</span>
          <input
            value={draft.name_en}
            onChange={(e) => set("name_en", e.target.value)}
            onBlur={() => autoTranslateField(draft.name_en, "name_ar", "ar")}
            className={field}
          />
        </label>
        <label className={label}>
          <span className={hint}>{t("desc_ar")}</span>
          <textarea
            rows={2}
            value={draft.description_ar}
            onChange={(e) => set("description_ar", e.target.value)}
            onBlur={() => autoTranslateField(draft.description_ar, "description_en", "en")}
            className={field}
          />
        </label>
        <label className={label}>
          <span className={hint}>{t("desc_en")}</span>
          <textarea
            rows={2}
            value={draft.description_en}
            onChange={(e) => set("description_en", e.target.value)}
            onBlur={() => autoTranslateField(draft.description_en, "description_ar", "ar")}
            className={field}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className={label}>
            <span className={hint}>{t("price")}</span>
            <input
              type="number"
              step="any"
              value={draft.price}
              onChange={(e) => set("price", e.target.value)}
              className={field}
            />
          </label>
          <label className={label}>
            <span className={hint}>{t("cost_price")}</span>
            <input
              type="number"
              step="any"
              value={draft.cost_price}
              onChange={(e) => set("cost_price", e.target.value)}
              className={field}
            />
          </label>
          <label className={label}>
            <span className={hint}>{t("discount_price")}</span>
            <input
              type="number"
              step="any"
              value={draft.discount_price}
              onChange={(e) => set("discount_price", e.target.value)}
              className={field}
            />
          </label>
          <label className={label}>
            <span className={hint}>{t("stock")}</span>
            <input
              type="number"
              step="any"
              value={draft.stock_quantity}
              onChange={(e) => set("stock_quantity", e.target.value)}
              className={field}
            />
          </label>
          <label className={label}>
            <span className={hint}>{t("threshold")}</span>
            <input
              type="number"
              step="any"
              value={draft.low_stock_threshold}
              onChange={(e) => set("low_stock_threshold", e.target.value)}
              className={field}
            />
          </label>
          <label className={label}>
            <span className={hint}>{t("category")}</span>
            <select
              value={draft.category_id}
              onChange={(e) => set("category_id", e.target.value)}
              className={field}
            >
              <option value="">{t("none")}</option>
              {(categories.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {pick(c.name_ar, c.name_en)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <span className={hint}>{t("images")}</span>
          <div className="flex flex-wrap gap-2">
            {draft.images.map((url) => (
              <span
                key={url}
                className="relative size-16 overflow-hidden rounded-lg border border-border"
              >
                <img src={url} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "images",
                      draft.images.filter((u) => u !== url),
                    )
                  }
                  className="absolute end-0 top-0 rounded-bl-lg bg-background/85 p-0.5 text-destructive"
                  aria-label={t("remove")}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <label className="flex size-16 cursor-pointer items-center justify-center rounded-lg border border-dashed border-input text-muted-foreground hover:border-primary hover:text-primary">
              <ImagePlus className="size-5" />
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (!files.length) return;
                  setUploading(true);
                  try {
                    const urls = await uploadProductImages(files);
                    setDraft((d) => ({ ...d, images: [...d.images, ...urls] }));
                  } catch (err) {
                    toast.error((err as Error).message);
                  } finally {
                    setUploading(false);
                    e.target.value = "";
                  }
                }}
              />
            </label>
          </div>
          {uploading ? <p className={hint}>{t("uploading")}…</p> : null}
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={draft.is_featured}
            onChange={(e) => set("is_featured", e.target.checked)}
            className="size-4 accent-[var(--gold)]"
          />
          {t("featured_flag")}
        </label>

        <button
          type="submit"
          disabled={save.isPending || uploading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-teal px-5 py-3 text-sm font-semibold text-teal-foreground disabled:opacity-60"
        >
          <Plus className="size-4" />
          {t("save")}
        </button>
      </form>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="border-b border-border/70 px-5 py-4 text-sm font-semibold text-foreground">
          {t("tab_products")} · {(products.data ?? []).length}
        </div>
        <ul className="divide-y divide-border/60">
          {(products.data ?? []).map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3">
              <img
                src={p.images?.[0] ?? "/favicon.ico"}
                alt=""
                className="size-14 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{pick(p.name_ar, p.name_en)}</p>
                <p className="text-xs text-muted-foreground">
                  {money(Number(p.price))} · {t("stock")}: {p.stock_quantity}
                  {p.is_featured ? ` · ${t("featured")}` : ""}
                </p>
              </div>
              <button
                onClick={() => setDraft(toDraft(p))}
                className="rounded-full border border-border p-2 text-muted-foreground hover:text-primary"
                aria-label={t("edit")}
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => remove.mutate(p)}
                className="rounded-full border border-border p-2 text-destructive hover:bg-destructive/10"
                aria-label={t("delete")}
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
          {products.data && products.data.length === 0 ? (
            <li className="px-5 py-6 text-sm text-muted-foreground">{t("no_data")}</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
