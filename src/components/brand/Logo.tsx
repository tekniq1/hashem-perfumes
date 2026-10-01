export function LogoMark({
  size = 60,
  customUrl,
  useVideo = true,
}: {
  size?: number | undefined;
  customUrl?: string | undefined;
  useVideo?: boolean | undefined;
}) {
  const logoUrl = customUrl || "/hashem-logo.png";

  return (
    <span
      className="relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-full border-2 border-primary/50 bg-card shadow-gold-glow-lg backdrop-blur-md transition-transform duration-300 hover:scale-105"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {useVideo && !customUrl ? (
        <video
          src="/hero-video.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="size-full object-cover object-center scale-110"
        />
      ) : (
        <img
          src={logoUrl}
          alt="هاشم للطيب"
          className="size-full object-cover object-center p-0.5"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.onerror = null;
            target.src = "/favicon.png";
          }}
        />
      )}
    </span>
  );
}

export function LogoLockup({
  size = 60,
  stacked = false,
  customUrl,
  useVideo = true,
}: {
  size?: number | undefined;
  stacked?: boolean | undefined;
  customUrl?: string | undefined;
  useVideo?: boolean | undefined;
}) {
  if (stacked) {
    return (
      <span className="flex flex-col items-center gap-3.5 text-center">
        <LogoMark size={size} customUrl={customUrl} useVideo={useVideo} />
        <span className="flex flex-col items-center leading-none gap-2">
          <span className="font-display text-sm sm:text-base tracking-[0.28em] text-foreground font-extrabold uppercase">
            HASHEM
          </span>
          <span className="font-display text-lg sm:text-2xl font-extrabold text-foreground">
            هاشم للطيب
          </span>
        </span>
      </span>
    );
  }

  // Horizontal layout matching the luxury Reef design (English [Left] - Animated 3D Logo [Center] - Arabic [Right])
  return (
    <span dir="ltr" className="flex items-center gap-3.5 sm:gap-5 select-none">
      {/* English Text (Left side) */}
      <span className="flex flex-col leading-none">
        <span className="font-display text-xs sm:text-base tracking-[0.28em] text-foreground font-extrabold uppercase transition-colors">
          HASHEM
        </span>
      </span>

      {/* Center 3D Dissolving/Reassembling Icon */}
      <LogoMark size={size} customUrl={customUrl} useVideo={useVideo} />

      {/* Arabic Text (Right side) */}
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg sm:text-2xl font-extrabold text-foreground tracking-tight transition-colors">
          هاشم للطيب
        </span>
      </span>
    </span>
  );
}
