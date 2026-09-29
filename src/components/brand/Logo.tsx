export function LogoMark({
  size = 44,
  customUrl,
}: {
  size?: number | undefined;
  customUrl?: string | undefined;
}) {
  // Always use the new logo file — ignore Supabase/localStorage cached URL
  const logoUrl = customUrl || "/hashem-logo.png";

  return (
    <span
      className="inline-block shrink-0 overflow-hidden rounded-xl border border-primary/20 shadow-sm"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img
        src={logoUrl}
        alt="هاشم للطيب"
        className="size-full object-cover object-center transition-transform duration-300 hover:scale-105"
        onError={(e) => {
          const target = e.currentTarget as HTMLImageElement;
          target.onerror = null;
          target.src = "/favicon.png";
        }}
      />
    </span>
  );
}

export function LogoLockup({
  size = 40,
  stacked = false,
  customUrl,
}: {
  size?: number | undefined;
  stacked?: boolean | undefined;
  customUrl?: string | undefined;
}) {
  if (stacked) {
    return (
      <span className="flex flex-col items-center gap-2.5 text-center">
        <LogoMark size={size} customUrl={customUrl} />
        <span className="flex flex-col items-center leading-none gap-1">
          <span className="font-display text-xs tracking-[0.2em] text-foreground font-bold uppercase">
            HASHEM
          </span>
          <span className="font-display text-sm text-foreground font-bold">
            هاشم للطيب
          </span>
        </span>
      </span>
    );
  }

  // Horizontal layout matching the requested design (English - Icon - Arabic)
  return (
    <span className="flex items-center gap-2.5 sm:gap-3.5">
      {/* English Text (Left side / RTL end) */}
      <span className="hidden sm:flex flex-col leading-none mt-1">
        <span className="font-display text-[10px] tracking-[0.25em] text-foreground sm:text-xs font-bold uppercase">
          HASHEM
        </span>
      </span>

      {/* Center Icon */}
      <LogoMark size={size} customUrl={customUrl} />

      {/* Arabic Text (Right side / RTL start) */}
      <span className="flex flex-col leading-none mt-1">
        <span className="font-display text-sm text-foreground sm:text-base font-bold">
          هاشم للطيب
        </span>
      </span>
    </span>
  );
}
