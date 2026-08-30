import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingBag, Volume2, VolumeX, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { fetchPromoVideos, type PromoVideo } from "@/lib/videos";

const STORY_DURATION_MS = 8000;

function ReelCard({
  video,
  index,
  isActive,
  progress,
  onOpen,
  cardRef,
}: {
  video: PromoVideo;
  index: number;
  isActive: boolean;
  progress: number;
  onOpen: () => void;
  cardRef: (el: HTMLButtonElement | null) => void;
}) {
  const { pick } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Force DOM-level muted and playsinline properties so mobile & desktop browsers allow autoplay
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    el.setAttribute("muted", "");
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");
    el.setAttribute("autoplay", "");

    const playVideo = () => {
      el.muted = true;
      el.play().catch(() => {});
    };

    playVideo();
    el.addEventListener("loadedmetadata", playVideo);
    el.addEventListener("canplay", playVideo);

    return () => {
      el.removeEventListener("loadedmetadata", playVideo);
      el.removeEventListener("canplay", playVideo);
    };
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.play().catch(() => {});
  }, [isActive]);

  return (
    <motion.button
      ref={cardRef}
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 120, damping: 18, delay: index * 0.08 }}
      className={`group relative w-[15rem] shrink-0 snap-center overflow-hidden rounded-3xl p-0 text-start transition-all duration-500 ${
        isActive
          ? "ring-2 ring-primary/80 shadow-gold-glow scale-[1.02] opacity-100"
          : "opacity-85 hover:opacity-100 ring-1 ring-border/40"
      }`}
    >
      {/* 8-second progress bar for active card */}
      {isActive && (
        <div className="absolute inset-x-0 top-0 z-20 h-1.5 overflow-hidden bg-black/40">
          <div
            className="h-full bg-primary transition-all duration-75 ease-linear rounded-full shadow-[0_0_8px_rgba(212,175,55,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Active playing indicator badge */}
      {isActive && (
        <div className="absolute start-3 top-3.5 z-20 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-primary"></span>
          </span>
          <span>8s</span>
        </div>
      )}

      <video
        ref={videoRef}
        src={video.video_url}
        poster={video.thumbnail_url ?? undefined}
        muted
        autoPlay
        loop
        playsInline
        preload="auto"
        className="aspect-[9/16] w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent p-4 text-sm font-semibold text-white drop-shadow">
        {pick(video.title_ar, video.title_en)}
      </span>
    </motion.button>
  );
}

function ReelModal({
  videos,
  initialIndex = 0,
  onClose,
}: {
  videos: PromoVideo[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const { t, pick, lang } = useI18n();
  const isRtl = lang === "ar";
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [muted, setMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoldingRef = useRef(false);

  const currentVideo = videos[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, videos.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    } else {
      setProgress(0);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [currentIndex]);

  // Handle 8-second auto advance timer with smooth progress bar
  useEffect(() => {
    if (isPaused) {
      videoRef.current?.pause();
      return;
    }

    videoRef.current?.play().catch(() => {});

    const updateInterval = 50; // update progress every 50ms
    const step = (updateInterval / STORY_DURATION_MS) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, handleNext]);

  // Restart progress when index changes
  useEffect(() => {
    setProgress(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") {
        isRtl ? handlePrev() : handleNext();
      }
      if (e.key === "ArrowLeft") {
        isRtl ? handleNext() : handlePrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, handleNext, handlePrev, isRtl]);

  // Press and hold to pause story
  const startHold = () => {
    holdTimeoutRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      setIsPaused(true);
    }, 150);
  };

  const endHold = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
    }
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      setIsPaused(false);
    }
  };

  if (!currentVideo) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/85 p-2 sm:p-4 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Desktop side navigation buttons */}
      {currentIndex > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          aria-label="Previous story"
          className="hidden md:flex absolute start-6 top-1/2 -translate-y-1/2 z-30 size-12 items-center justify-center rounded-full bg-background/60 text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-background hover:scale-110"
        >
          {isRtl ? <ChevronRight className="size-6" /> : <ChevronLeft className="size-6" />}
        </button>
      )}

      {currentIndex < videos.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          aria-label="Next story"
          className="hidden md:flex absolute end-6 top-1/2 -translate-y-1/2 z-30 size-12 items-center justify-center rounded-full bg-background/60 text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-background hover:scale-110"
        >
          {isRtl ? <ChevronLeft className="size-6" /> : <ChevronRight className="size-6" />}
        </button>
      )}

      <motion.div
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col justify-between w-full max-w-sm aspect-[9/16] overflow-hidden rounded-3xl border border-primary/30 bg-card shadow-gold-glow select-none"
        onMouseDown={startHold}
        onMouseUp={endHold}
        onTouchStart={startHold}
        onTouchEnd={endHold}
        onMouseLeave={endHold}
      >
        {/* Story Progress Bars on top */}
        <div className="absolute inset-x-0 top-0 z-30 flex gap-1.5 p-3 pt-3.5 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
          {videos.map((_, idx) => {
            let widthPercent = 0;
            if (idx < currentIndex) widthPercent = 100;
            else if (idx === currentIndex) widthPercent = progress;

            return (
              <div
                key={idx}
                className="h-1 flex-1 overflow-hidden rounded-full bg-white/30 backdrop-blur-sm"
              >
                <div
                  className="h-full bg-white transition-all duration-75 ease-linear rounded-full"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Video Player */}
        <div className="absolute inset-0 z-10 bg-black">
          <AnimatePresence mode="wait">
            <motion.video
              key={currentVideo.id}
              ref={videoRef}
              src={currentVideo.video_url}
              poster={currentVideo.thumbnail_url ?? undefined}
              autoPlay
              playsInline
              muted={muted}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.8 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full object-cover"
              onEnded={handleNext}
            />
          </AnimatePresence>
        </div>

        {/* Story Tap Zones (Left / Right for quick clicking) */}
        <div className="absolute inset-y-16 inset-x-0 z-20 flex">
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              isRtl ? handleNext() : handlePrev();
            }}
          />
          <div className="w-1/3 h-full cursor-pointer" />
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              isRtl ? handlePrev() : handleNext();
            }}
          />
        </div>

        {/* Header Actions */}
        <div className="relative z-30 flex items-center justify-between px-3.5 pt-7">
          <button
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? t("unmute") : t("mute")}
            className="rounded-full bg-black/40 p-2 text-white backdrop-blur-md transition-colors hover:bg-black/60"
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <button
            onClick={onClose}
            aria-label="close"
            className="rounded-full bg-black/40 p-2 text-white backdrop-blur-md transition-colors hover:bg-black/60"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Bottom Details & CTA */}
        <div className="relative z-30 space-y-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentVideo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <p className="font-display text-base font-semibold text-white drop-shadow">
                {pick(currentVideo.title_ar, currentVideo.title_en)}
              </p>
            </motion.div>
          </AnimatePresence>

          {currentVideo.target_product_id ? (
            <Link
              to="/product/$id"
              params={{ id: currentVideo.target_product_id }}
              onClick={onClose}
              className="flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-transform active:scale-95"
            >
              <ShoppingBag className="size-4" />
              {t("shop_tagged")}
            </Link>
          ) : currentVideo.cta_link ? (
            <a
              href={currentVideo.cta_link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-transform active:scale-95"
            >
              {t("shop_tagged")}
            </a>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function VideoReels() {
  const { t, lang } = useI18n();
  const isRtl = lang === "ar";
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const isSectionInView = useInView(sectionRef, {
    margin: "100px 0px 100px 0px",
  });

  const videos = useQuery({ queryKey: ["promo-videos"], queryFn: () => fetchPromoVideos(true) });
  const list = videos.data ?? [];

  // Smoothly scroll the container to center the active card
  useEffect(() => {
    if (list.length > 0) {
      const targetCard = cardRefs.current[activeIndex];
      if (targetCard) {
        targetCard.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeIndex, list.length]);

  // 8-second auto advance timer
  useEffect(() => {
    if (isInteracting || selectedIdx !== null || list.length === 0) {
      return;
    }

    const intervalMs = 50;
    const step = (intervalMs / STORY_DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveIndex((current) => (current + 1) % list.length);
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isInteracting, selectedIdx, list.length]);

  // Reset progress whenever active card changes
  useEffect(() => {
    setProgress(0);
  }, [activeIndex]);

  const handleNextCard = () => {
    setActiveIndex((current) => (current + 1) % list.length);
  };

  const handlePrevCard = () => {
    setActiveIndex((current) => (current === 0 ? list.length - 1 : current - 1));
  };

  if (!list.length) return null;

  return (
    <section ref={sectionRef} className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{t("promo_videos")}</h2>
        </div>

        {/* Carousel arrows */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={isRtl ? handleNextCard : handlePrevCard}
            aria-label="Previous reel"
            className="flex size-10 items-center justify-center rounded-full border border-border bg-card/80 text-foreground transition-all hover:bg-primary/20 hover:border-primary/50"
          >
            <ChevronRight className="size-5" />
          </button>
          <button
            type="button"
            onClick={isRtl ? handlePrevCard : handleNextCard}
            aria-label="Next reel"
            className="flex size-10 items-center justify-center rounded-full border border-border bg-card/80 text-foreground transition-all hover:bg-primary/20 hover:border-primary/50"
          >
            <ChevronLeft className="size-5" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-none py-2"
        onMouseEnter={() => setIsInteracting(true)}
        onMouseLeave={() => setIsInteracting(false)}
        onTouchStart={() => setIsInteracting(true)}
        onTouchEnd={() => {
          setTimeout(() => setIsInteracting(false), 2000);
        }}
      >
        {list.map((v, i) => (
          <ReelCard
            key={v.id}
            video={v}
            index={i}
            isActive={activeIndex === i}
            progress={progress}
            cardRef={(el) => {
              cardRefs.current[i] = el;
            }}
            onOpen={() => {
              setActiveIndex(i);
              setSelectedIdx(i);
            }}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedIdx !== null ? (
          <ReelModal
            videos={list}
            initialIndex={selectedIdx}
            onClose={() => setSelectedIdx(null)}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}


