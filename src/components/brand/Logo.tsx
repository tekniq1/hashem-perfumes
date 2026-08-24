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
  size = 44,
  stacked = false,
  customUrl,
}: {
  size?: number | undefined;
  stacked?: boolean | undefined;
  customUrl?: string | undefined;
}) {
  return (
    <span className={`flex items-center gap-3 ${stacked ? "flex-col text-center" : ""}`}>
      <LogoMark size={size} customUrl={customUrl} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-sm tracking-[0.22em] text-gold-gradient sm:text-base font-bold">
          HASHEM
        </span>
        <span className="mt-0.5 text-[10px] tracking-[0.28em] text-muted-foreground font-medium">
          FOR PERFUMES
        </span>
      </span>
    </span>
  );
}
