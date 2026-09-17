import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface LotteryCountdownProps {
  drawDate: string | null | undefined;
  prize?: string | null;
  compact?: boolean;
}

function getTimeLeft(target: Date): TimeLeft {
  const now = new Date().getTime();
  const diff = target.getTime() - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

export function LotteryCountdown({ drawDate, prize, compact = false }: LotteryCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!drawDate) return;
    const target = new Date(drawDate);

    const tick = () => {
      const tl = getTimeLeft(target);
      setTimeLeft(tl);
      if (tl.days === 0 && tl.hours === 0 && tl.minutes === 0 && tl.seconds === 0) {
        setExpired(true);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [drawDate]);

  if (!drawDate) return null;

  if (expired) {
    return (
      <div className="text-center text-xs text-primary font-bold animate-pulse">
        🎊 السحب انتهى! تابع الإعلان عبر الواتساب
      </div>
    );
  }

  if (!timeLeft) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-mono text-primary font-bold" dir="ltr">
        <span className="bg-primary/10 border border-primary/20 rounded-md px-1.5 py-0.5">{String(timeLeft.days).padStart(2,"0")}د</span>
        <span className="text-primary/40">:</span>
        <span className="bg-primary/10 border border-primary/20 rounded-md px-1.5 py-0.5">{String(timeLeft.hours).padStart(2,"0")}س</span>
        <span className="text-primary/40">:</span>
        <span className="bg-primary/10 border border-primary/20 rounded-md px-1.5 py-0.5">{String(timeLeft.minutes).padStart(2,"0")}د</span>
        <span className="text-primary/40">:</span>
        <span className="bg-primary/10 border border-primary/20 rounded-md px-1.5 py-0.5">{String(timeLeft.seconds).padStart(2,"0")}ث</span>
      </div>
    );
  }

  const blocks = [
    { label: "يوم", value: timeLeft.days },
    { label: "ساعة", value: timeLeft.hours },
    { label: "دقيقة", value: timeLeft.minutes },
    { label: "ثانية", value: timeLeft.seconds },
  ];

  return (
    <div className="w-full mt-4 mb-2">
      {prize && (
        <p className="text-center text-xs text-muted-foreground mb-3">
          الجائزة: <span className="font-bold text-primary">{prize}</span>
        </p>
      )}
      <p className="text-center text-[11px] text-muted-foreground mb-2 font-medium">⏳ السحب بعد:</p>
      <div className="flex justify-center gap-2" dir="ltr">
        {blocks.map((b) => (
          <div key={b.label} className="flex flex-col items-center gap-1">
            <div className="min-w-[48px] rounded-xl border border-primary/30 bg-primary/5 px-2 py-2 text-center">
              <span className="text-xl font-display font-bold text-primary tabular-nums">
                {String(b.value).padStart(2, "0")}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
