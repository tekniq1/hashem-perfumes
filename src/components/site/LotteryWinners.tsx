import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Star } from "lucide-react";
import { motion } from "framer-motion";

export function LotteryWinners() {
  const { data: completedRounds = [] } = useQuery({
    queryKey: ["lottery_completed_rounds"],
    queryFn: async () => {
      const { data } = await supabase
        .from("lottery_rounds")
        .select("id, prize_description, completed_at, winners_display")
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(6);
      return data || [];
    },
  });

  const rounds = completedRounds.filter(
    (r) => r.winners_display && Array.isArray(r.winners_display) && (r.winners_display as any[]).length > 0
  );

  if (rounds.length === 0) return null;

  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 mt-10 mb-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
          <Trophy className="size-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">قاعة الفائزين</h2>
          <p className="text-xs text-muted-foreground">فائزو السحوبات السابقة من هاشم للطيب</p>
        </div>
      </div>

      <div className="space-y-3">
        {rounds.map((round, roundIdx) => {
          const winners = round.winners_display as Array<{ name: string; prize_type: string; city?: string }>;
          const date = round.completed_at
            ? new Date(round.completed_at).toLocaleDateString("ar-OM", { year: "numeric", month: "long", day: "numeric" })
            : "";
          return (
            <motion.div
              key={round.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: roundIdx * 0.07 }}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Star className="size-4 text-primary fill-primary/30" />
                  <span className="text-sm font-bold text-foreground">{round.prize_description || "جائزة قيمة"}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">{date}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {winners.map((w, i) => (
                  <div key={i} className="flex items-center gap-3 bg-secondary/40 rounded-xl px-3 py-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-display font-bold text-sm">
                      {i === 0 ? "🥇" : "🎲"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{w.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {i === 0 ? "الجائزة الكبرى" : "جائزة السحب العشوائي"}
                        {w.city ? ` · ${w.city}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
