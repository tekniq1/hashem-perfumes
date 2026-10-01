import { motion } from "framer-motion";

export function LogoMark({
  size = 48,
  customUrl,
  animate3D = true,
}: {
  size?: number | undefined;
  customUrl?: string | undefined;
  animate3D?: boolean | undefined;
}) {
  // Always use the new logo file — ignore Supabase/localStorage cached URL
  const logoUrl = customUrl || "/hashem-logo.png";

  const content = (
    <span
      className="relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-full border-2 border-primary/40 bg-card shadow-gold-glow backdrop-blur-sm transition-shadow duration-500 hover:shadow-gold-glow-lg"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
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
      {/* 3D Glass Light Reflection */}
      <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-60" />
    </span>
  );

  if (!animate3D) {
    return content;
  }

  return (
    <div style={{ perspective: 1000 }} className="inline-flex shrink-0 items-center justify-center">
      <motion.div
        animate={{
          rotateY: [0, 360],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          transformStyle: "preserve-3d",
        }}
        className="flex items-center justify-center"
      >
        {content}
      </motion.div>
    </div>
  );
}

export function LogoLockup({
  size = 48,
  stacked = false,
  customUrl,
  animate3D = true,
}: {
  size?: number | undefined;
  stacked?: boolean | undefined;
  customUrl?: string | undefined;
  animate3D?: boolean | undefined;
}) {
  if (stacked) {
    return (
      <span className="flex flex-col items-center gap-3 text-center">
        <LogoMark size={size} customUrl={customUrl} animate3D={animate3D} />
        <span className="flex flex-col items-center leading-none gap-1.5">
          <span className="font-display text-sm tracking-[0.25em] text-foreground font-extrabold uppercase sm:text-base">
            HASHEM
          </span>
          <span className="font-display text-base font-extrabold text-foreground sm:text-lg">
            هاشم للطيب
          </span>
        </span>
      </span>
    );
  }

  // Horizontal layout matching the luxury Reef design (English [Left] - 3D Icon [Center] - Arabic [Right])
  return (
    <span dir="ltr" className="flex items-center gap-3 sm:gap-4 select-none">
      {/* English Text (Left side) */}
      <span className="flex flex-col leading-none">
        <span className="font-display text-xs sm:text-sm tracking-[0.26em] text-foreground font-extrabold uppercase transition-colors">
          HASHEM
        </span>
      </span>

      {/* Center 3D Rotating Icon */}
      <LogoMark size={size} customUrl={customUrl} animate3D={animate3D} />

      {/* Arabic Text (Right side) */}
      <span className="flex flex-col leading-none">
        <span className="font-display text-base sm:text-xl font-extrabold text-foreground tracking-tight transition-colors">
          هاشم للطيب
        </span>
      </span>
    </span>
  );
}
