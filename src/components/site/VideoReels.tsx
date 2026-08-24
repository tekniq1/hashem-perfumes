import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { ShoppingBag, Volume2, VolumeX, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { fetchPromoVideos, type PromoVideo } from "@/lib/videos";

function ReelCard({
  video,
  index,
  onOpen,
}: {
  video: PromoVideo;
  index: number;
  onOpen: () => void;
}) {
  const { pick } = useI18n();
  const ref = useRef<HTMLVideoElement>(null);
  const isInView = useInView(ref, { amount: 0.5 });

  useEffect(() => {
    if (isInView) {
      ref.current?.play().catch(() => {});
    } else {
      ref.current?.pause();
    }
  }, [isInView]);

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 120, damping: 18, delay: index * 0.08 }}
      className="glass group relative w-[15rem] shrink-0 snap-start overflow-hidden rounded-3xl p-0 text-start"
    >
      <video
        ref={ref}
        src={video.video_url}
        poster={video.thumbnail_url ?? undefined}
        muted
        loop
        playsInline
        preload="metadata"
        className="aspect-[9/16] w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent p-4 text-sm font-semibold text-teal-foreground">
        {pick(video.title_ar, video.title_en)}
      </span>
    </motion.button>
  );
}

function ReelModal({ video, onClose }: { video: PromoVideo; onClose: () => void }) {
  const { t, pick } = useI18n();
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-primary/30 bg-card shadow-gold-glow"
      >
        <video
          ref={ref}
          src={video.video_url}
          poster={video.thumbnail_url ?? undefined}
          autoPlay
          loop
          playsInline
          muted={muted}
          className="aspect-[9/16] w-full bg-secondary object-cover"
        />
        <button
          onClick={onClose}
          aria-label="close"
          className="absolute end-3 top-3 rounded-full bg-background/80 p-2 text-foreground"
        >
          <X className="size-4" />
        </button>
        <button
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? t("unmute") : t("mute")}
          className="absolute start-3 top-3 rounded-full bg-background/80 p-2 text-foreground"
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>

        <div className="absolute inset-x-0 bottom-0 space-y-3 bg-gradient-to-t from-foreground/85 to-transparent p-4">
          <p className="font-display text-base text-teal-foreground">
            {pick(video.title_ar, video.title_en)}
          </p>
          {video.target_product_id ? (
            <Link
              to="/product/$id"
              params={{ id: video.target_product_id }}
              onClick={onClose}
              className="flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              <ShoppingBag className="size-4" />
              {t("shop_tagged")}
            </Link>
          ) : video.cta_link ? (
            <a
              href={video.cta_link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-5 py-3 text-sm font-semibold text-primary-foreground"
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
  const { t } = useI18n();
  const [open, setOpen] = useState<PromoVideo | null>(null);
  const videos = useQuery({ queryKey: ["promo-videos"], queryFn: () => fetchPromoVideos(true) });
  const list = videos.data ?? [];
  if (!list.length) return null;

  return (
    <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
      <h2 className="mb-6 text-2xl text-foreground sm:text-3xl">{t("promo_videos")}</h2>
      <div className="flex snap-x gap-4 overflow-x-auto pb-4">
        {list.map((v, i) => (
          <ReelCard key={v.id} video={v} index={i} onOpen={() => setOpen(v)} />
        ))}
      </div>
      <AnimatePresence>
        {open ? <ReelModal video={open} onClose={() => setOpen(null)} /> : null}
      </AnimatePresence>
    </section>
  );
}
