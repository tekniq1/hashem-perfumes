import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles, Volume2, VolumeX } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { fetchPromoVideos, type PromoVideo } from "@/lib/videos";

const BANNER_DURATION_MS = 6000;

export function VideoReels() {
  const { t, pick, lang } = useI18n();
  const isRtl = lang === "ar";
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const videos = useQuery({
    queryKey: ["promo-videos"],
    queryFn: () => fetchPromoVideos(true),
  });
  const list: PromoVideo[] = videos.data ?? [];

  const goTo = useCallback(
    (idx: number) => {
      if (list.length === 0) return;
      const next = ((idx % list.length) + list.length) % list.length;
      setActiveIndex(next);
      setProgress(0);
    },
    [list.length],
  );

  const handleNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const handlePrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  // Auto-advance timer
  useEffect(() => {
    if (isPaused || list.length <= 1) return;
    const intervalMs = 50;
    const step = (intervalMs / BANNER_DURATION_MS) * 100;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPaused, list.length, handleNext, activeIndex]);

  // Reset video and progress on change
  useEffect(() => {
    setProgress(0);
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.muted = muted;
    el.play().catch(() => {});
  }, [activeIndex]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 40) {
      const swipeLeft = dx < 0;
      swipeLeft
        ? isRtl ? handlePrev() : handleNext()
        : isRtl ? handleNext() : handlePrev();
    }
    setTimeout(() => setIsPaused(false), 300);
  };

  if (!list.length) return null;

  const current = list[activeIndex];

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 my-3 sm:my-6" aria-label={t("promo_videos")}>
      {/* ── Luxury Card Container ── */}
      <div
        className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/25 bg-card shadow-gold-glow transition-all duration-300 hover:border-primary/50"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Banner Frame (Controlled height: sleek promo ratio) */}
        <div className="relative h-[180px] sm:h-[260px] md:h-[320px] w-full overflow-hidden bg-gradient-to-br from-card via-background to-card">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="absolute inset-0"
            >
              {/* Blur backdrop for videos with non-matching aspect ratios */}
              {current.thumbnail_url && (
                <div
                  className="absolute inset-0 bg-cover bg-center blur-2xl opacity-25 scale-110"
                  style={{ backgroundImage: `url(${current.thumbnail_url})` }}
                />
              )}

              {/* Main Video */}
              <video
                ref={videoRef}
                src={current.video_url}
                poster={current.thumbnail_url ?? undefined}
                autoPlay
                muted={muted}
                loop={list.length === 1}
                playsInline
                preload="auto"
                className="size-full object-cover"
                onEnded={() => list.length > 1 && handleNext()}
              />
            </motion.div>
          </AnimatePresence>

          {/* Luxury Overlay Gradients */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />

          {/* ── Top Bar inside Card: "إعلان" Badge + Audio Toggle ── */}
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-3 sm:p-4">
            {/* Ad Badge (Like the user's reference) */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-[11px] sm:text-xs font-semibold text-primary border border-primary/30 backdrop-blur-md shadow-sm">
              <Sparkles className="size-3 text-primary animate-pulse" />
              <span>{isRtl ? "إعلان مميز" : "Featured Ad"}</span>
            </div>

            {/* Mute / Unmute Button */}
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? t("unmute") : t("mute")}
              className="flex size-8 sm:size-9 items-center justify-center rounded-full bg-black/45 text-white/90 border border-white/15 backdrop-blur-md transition-all hover:bg-black/70 hover:scale-105 active:scale-95"
            >
              {muted ? <VolumeX className="size-3.5 sm:size-4" /> : <Volume2 className="size-3.5 sm:size-4" />}
            </button>
          </div>

          {/* ── Side Navigation Arrows ── */}
          {list.length > 1 && (
            <>
              <button
                type="button"
                onClick={isRtl ? handleNext : handlePrev}
                aria-label="Previous"
                className="absolute start-2 sm:start-3 top-1/2 -translate-y-1/2 z-20 flex size-8 sm:size-10 items-center justify-center rounded-full bg-black/40 text-white/90 border border-white/10 backdrop-blur-md transition-all hover:bg-primary hover:text-black hover:border-primary opacity-80 group-hover:opacity-100 hover:scale-110 active:scale-95"
              >
                <ChevronRight className="size-4 sm:size-5" />
              </button>
              <button
                type="button"
                onClick={isRtl ? handlePrev : handleNext}
                aria-label="Next"
                className="absolute end-2 sm:end-3 top-1/2 -translate-y-1/2 z-20 flex size-8 sm:size-10 items-center justify-center rounded-full bg-black/40 text-white/90 border border-white/10 backdrop-blur-md transition-all hover:bg-primary hover:text-black hover:border-primary opacity-80 group-hover:opacity-100 hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="size-4 sm:size-5" />
              </button>
            </>
          )}

          {/* ── Bottom Content: Title & CTA ── */}
          <div className="absolute inset-x-0 bottom-0 z-20 p-3 sm:p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="max-w-xl">
              <p className="font-display text-base sm:text-2xl font-bold text-white drop-shadow-md leading-snug">
                {pick(current.title_ar, current.title_en)}
              </p>
            </div>

            {(current.target_product_id || current.cta_link) && (
              <div className="shrink-0">
                {current.target_product_id ? (
                  <Link
                    to="/product/$id"
                    params={{ id: current.target_product_id }}
                    className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-gold-glow transition-all hover:opacity-90 active:scale-95"
                  >
                    <ShoppingBag className="size-3.5 sm:size-4" />
                    <span>{t("shop_tagged")}</span>
                  </Link>
                ) : (
                  <a
                    href={current.cta_link!}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-gold-glow transition-all hover:opacity-90 active:scale-95"
                  >
                    <ShoppingBag className="size-3.5 sm:size-4" />
                    <span>{t("shop_tagged")}</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* ── Top Progress Bar (subtle golden line) ── */}
          {list.length > 1 && (
            <div className="absolute inset-x-0 bottom-0 z-30 h-1 bg-white/15">
              <div
                className="h-full bg-primary transition-all shadow-[0_0_8px_rgba(212,175,55,0.8)]"
                style={{
                  width: `${((activeIndex + progress / 100) / list.length) * 100}%`,
                  transitionDuration: "50ms",
                  transitionTimingFunction: "linear",
                }}
              />
            </div>
          )}
        </div>

        {/* ── Slide Indicator Dots (inside card bottom or footer) ── */}
        {list.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-2 bg-card/90 border-t border-border/50">
            {list.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goTo(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === activeIndex
                    ? "w-6 h-1.5 bg-primary shadow-gold-glow"
                    : "size-1.5 bg-muted-foreground/30 hover:bg-primary/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
