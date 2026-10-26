import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingBag, Volume2, VolumeX } from "lucide-react";
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
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Touch/swipe tracking
  const touchStartX = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const videos = useQuery({
    queryKey: ["promo-videos"],
    queryFn: () => fetchPromoVideos(true),
  });
  const list: PromoVideo[] = videos.data ?? [];

  const goTo = useCallback(
    (idx: number, wrap = true) => {
      if (list.length === 0) return;
      const next = wrap ? ((idx % list.length) + list.length) % list.length : idx;
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIndex(next);
        setProgress(0);
        setIsTransitioning(false);
      }, 280);
    },
    [list.length],
  );

  const handleNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const handlePrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  // Auto-advance timer
  useEffect(() => {
    if (isPaused || list.length === 0) return;
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

  // Reset progress on video change
  useEffect(() => {
    setProgress(0);
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.muted = muted;
    el.play().catch(() => {});
  }, [activeIndex]);

  // Sync mute state to video element
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") isRtl ? handleNext() : handlePrev();
      if (e.key === "ArrowRight") isRtl ? handlePrev() : handleNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNext, handlePrev, isRtl]);

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
    <section
      className="relative w-full overflow-hidden bg-black"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-label={t("promo_videos")}
    >
      {/* ─── Video Layer ─── */}
      <div className="relative w-full aspect-[21/9] min-h-[220px] sm:min-h-[320px] lg:min-h-[420px] overflow-hidden">
        <AnimatePresence mode="sync">
          <motion.div
            key={current.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: isTransitioning ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {/* Thumbnail shown instantly as poster */}
            {current.thumbnail_url && (
              <img
                src={current.thumbnail_url}
                alt={pick(current.title_ar, current.title_en)}
                className="absolute inset-0 size-full object-cover"
              />
            )}

            <video
              ref={videoRef}
              src={current.video_url}
              poster={current.thumbnail_url ?? undefined}
              autoPlay
              muted={muted}
              loop={list.length === 1}
              playsInline
              preload="auto"
              className="absolute inset-0 size-full object-cover"
              onEnded={() => list.length > 1 && handleNext()}
            />
          </motion.div>
        </AnimatePresence>

        {/* ─── Top gradient + Progress bar ─── */}
        <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/50 to-transparent pb-8 pt-3 px-4">
          {/* Progress bars for each slide */}
          {list.length > 1 && (
            <div className="flex items-center gap-1.5">
              {list.map((_, idx) => {
                const isComplete = idx < activeIndex;
                const isCurrent = idx === activeIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goTo(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30 transition-all cursor-pointer hover:bg-white/50"
                  >
                    <div
                      className="h-full bg-primary rounded-full transition-none"
                      style={{
                        width: isComplete ? "100%" : isCurrent ? `${progress}%` : "0%",
                        transitionDuration: isCurrent ? "75ms" : "0ms",
                        transitionTimingFunction: "linear",
                      }}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Side Navigation Arrows (desktop) ─── */}
        {list.length > 1 && (
          <>
            <button
              type="button"
              onClick={isRtl ? handleNext : handlePrev}
              aria-label="Previous"
              className="absolute start-3 top-1/2 -translate-y-1/2 z-20 hidden sm:flex size-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 hover:bg-black/60 hover:scale-110 transition-all"
            >
              <ChevronRight className="size-5" />
            </button>
            <button
              type="button"
              onClick={isRtl ? handlePrev : handleNext}
              aria-label="Next"
              className="absolute end-3 top-1/2 -translate-y-1/2 z-20 hidden sm:flex size-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 hover:bg-black/60 hover:scale-110 transition-all"
            >
              <ChevronLeft className="size-5" />
            </button>
          </>
        )}

        {/* ─── Bottom overlay: Title + CTA ─── */}
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-5 sm:px-8 pb-5 pt-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id + "-text"}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col sm:flex-row sm:items-end justify-between gap-3"
            >
              {/* Title */}
              <div>
                <p className="font-display text-base sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg leading-snug max-w-xl">
                  {pick(current.title_ar, current.title_en)}
                </p>
              </div>

              {/* CTA Button */}
              {(current.target_product_id || current.cta_link) && (
                <div className="shrink-0">
                  {current.target_product_id ? (
                    <Link
                      to="/product/$id"
                      params={{ id: current.target_product_id }}
                      className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-gold-glow hover:opacity-90 transition-all active:scale-95"
                    >
                      <ShoppingBag className="size-4" />
                      <span>{t("shop_tagged")}</span>
                    </Link>
                  ) : (
                    <a
                      href={current.cta_link!}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-gold-glow hover:opacity-90 transition-all active:scale-95"
                    >
                      <ShoppingBag className="size-4" />
                      <span>{t("shop_tagged")}</span>
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ─── Mute Button (top-end corner) ─── */}
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? t("unmute") : t("mute")}
          className="absolute end-3 top-3 z-20 flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors"
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      </div>

      {/* ─── Dots Indicator (below banner, mobile-friendly) ─── */}
      {list.length > 1 && (
        <div className="flex justify-center items-center gap-2 py-3 bg-background">
          {list.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => goTo(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeIndex
                  ? "w-6 h-2 bg-primary shadow-gold-glow"
                  : "size-2 bg-border hover:bg-primary/50"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
