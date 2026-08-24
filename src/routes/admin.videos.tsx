import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Sparkles, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { fetchProducts } from "@/lib/products";
import {
  createPromoVideo,
  deletePromoVideo,
  fetchPromoVideos,
  togglePromoVideo,
  uploadPromoVideo,
  type PromoVideo,
} from "@/lib/videos";
import { translateText } from "@/lib/translator";

export const Route = createFileRoute("/admin/videos")({
  component: AdminVideos,
});

function AdminVideos() {
  const { t, pick } = useI18n();
  const qc = useQueryClient();
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const videos = useQuery({
    queryKey: ["promo-videos-all"],
    queryFn: () => fetchPromoVideos(false),
  });

  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [productId, setProductId] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [order, setOrder] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [translating, setTranslating] = useState(false);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["promo-videos-all"] });
    void qc.invalidateQueries({ queryKey: ["promo-videos"] });
  };

  const autoTranslateTitle = async () => {
    if (!titleAr && !titleEn) return;
    setTranslating(true);
    try {
      if (titleAr && !titleEn) {
        const tr = await translateText(titleAr, "en");
        setTitleEn(tr);
      } else if (titleEn && !titleAr) {
        const tr = await translateText(titleEn, "ar");
        setTitleAr(tr);
      }
      toast.success(pick("تمت الترجمة التلقائية بنجاح", "Auto-translated successfully"));
    } catch {
      toast.error(pick("تعذرت الترجمة التلقائية", "Auto-translation failed"));
    } finally {
      setTranslating(false);
    }
  };

  const create = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error(pick("اختر ملف فيديو", "Choose a video file"));
      setProgress(0);
      const url = await uploadPromoVideo(file, setProgress);
      await createPromoVideo({
        title_ar: titleAr || titleEn,
        title_en: titleEn || titleAr,
        video_url: url,
        target_product_id: productId || null,
        cta_link: ctaLink || null,
        display_order: Number(order) || 0,
      });
    },
    onSuccess: () => {
      toast.success(pick("تم إضافة الفيديو", "Video added"));
      setTitleAr("");
      setTitleEn("");
      setProductId("");
      setCtaLink("");
      setOrder(0);
      setFile(null);
      setProgress(null);
      invalidate();
    },
    onError: (e: Error) => {
      setProgress(null);
      toast.error(e.message);
    },
  });

  const toggle = useMutation({
    mutationFn: (v: PromoVideo) => togglePromoVideo(v.id, !v.is_active),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (v: PromoVideo) => deletePromoVideo(v),
    onSuccess: () => {
      toast.success(t("deleted"));
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const field =
    "w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary";

  return (
    <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="glass space-y-4 rounded-2xl p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg text-foreground font-bold">
            {pick("إضافة فيديو ترويجي", "Add Promo Video")}
          </h2>
          <button
            type="button"
            onClick={autoTranslateTitle}
            disabled={translating}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg hover:bg-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            title="ترجمة تلقائية / Auto-Translate"
          >
            {translating ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Sparkles className="size-3" />
            )}
            <span>{translating ? t("auto_translating") : t("auto_translate_btn")}</span>
          </button>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">{t("video_title_ar")}</span>
          <input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} className={field} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">{t("video_title_en")}</span>
          <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className={field} />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">{t("video_file")}</span>
          <input
            type="file"
            accept="video/mp4,video/webm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className={`${field} file:me-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1 file:text-xs`}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">{t("video_product")}</span>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className={field}
          >
            <option value="">{t("none")}</option>
            {(products.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {pick(p.name_ar, p.name_en)}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">{t("video_cta_link")}</span>
          <input
            value={ctaLink}
            onChange={(e) => setCtaLink(e.target.value)}
            placeholder="https://"
            className={field}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">{t("video_order")}</span>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className={field}
          />
        </label>

        {progress !== null ? (
          <div className="space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-gold-gradient transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("uploading")} {progress}%
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={create.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gold-gradient px-5 py-3 text-sm font-semibold text-primary-foreground shadow-gold-glow disabled:opacity-60 cursor-pointer"
        >
          <UploadCloud className="size-4" />
          {pick("رفع وإضافة الفيديو", "Upload & Add Video")}
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(videos.data ?? []).map((v) => (
          <div key={v.id} className="glass overflow-hidden rounded-2xl">
            <video
              src={v.video_url}
              poster={v.thumbnail_url ?? undefined}
              controls
              preload="metadata"
              className="aspect-[9/16] w-full bg-secondary object-cover"
            />
            <div className="space-y-2 p-4">
              <p className="text-sm font-semibold text-foreground">
                {pick(v.title_ar, v.title_en)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("video_order")}: {v.display_order}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => toggle.mutate(v)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs text-foreground hover:bg-accent"
                >
                  {v.is_active ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                  {v.is_active ? pick("مرئي", "Visible") : pick("مخفي", "Hidden")}
                </button>
                <button
                  onClick={() => remove.mutate(v)}
                  className="rounded-full border border-destructive/40 p-2 text-destructive hover:bg-destructive/10"
                  aria-label="delete"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {videos.data && videos.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("no_videos_yet")}</p>
        ) : null}
      </div>
    </div>
  );
}
