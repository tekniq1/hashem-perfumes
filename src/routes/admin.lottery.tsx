import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Copy, Loader2, Trophy, Ticket, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin/lottery")({
  component: AdminLottery,
});

function AdminLottery() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [generateCount, setGenerateCount] = useState(10);
  const [isDrawing, setIsDrawing] = useState(false);

  // 1. Fetch active round
  const { data: activeRound, isLoading: roundLoading } = useQuery({
    queryKey: ["lottery_active_round"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lottery_rounds")
        .select("*")
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // 2. Fetch tickets for active round
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["lottery_tickets", activeRound?.id],
    enabled: !!activeRound?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lottery_tickets")
        .select("*")
        .eq("round_id", activeRound!.id);
      if (error) throw error;
      return data;
    },
  });

  // Derived state
  const unusedTickets = tickets.filter((t) => !t.is_used);
  const usedTickets = tickets.filter((t) => t.is_used);

  // Group by phone for leaderboard
  const leaderboardMap = usedTickets.reduce((acc, ticket) => {
    const key = ticket.customer_phone!;
    if (!acc[key]) {
      acc[key] = {
        name: ticket.customer_name || "غير معروف",
        phone: key,
        count: 0,
        tickets: [] as any[],
      };
    }
    acc[key].count += 1;
    acc[key].tickets.push(ticket);
    return acc;
  }, {} as Record<string, any>);

  const leaderboard = Object.values(leaderboardMap).sort((a, b) => b.count - a.count);

  // Generate codes
  const generateCodes = useMutation({
    mutationFn: async (count: number) => {
      if (!activeRound) throw new Error("لا توجد جولة نشطة.");
      const newTickets = Array.from({ length: count }).map(() => ({
        ticket_code: "HSHM-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        round_id: activeRound.id,
      }));
      const { error } = await supabase.from("lottery_tickets").insert(newTickets);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم توليد الأكواد بنجاح");
      queryClient.invalidateQueries({ queryKey: ["lottery_tickets"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "حدث خطأ");
    },
  });

  // Start new round
  const startNewRound = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("lottery_rounds").insert([{ status: "active" }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم فتح جولة جديدة");
      queryClient.invalidateQueries({ queryKey: ["lottery_active_round"] });
      queryClient.invalidateQueries({ queryKey: ["lottery_tickets"] });
    },
  });

  // Execute Draw
  const runDraw = async () => {
    if (!activeRound) return;
    if (leaderboard.length < 2) {
      toast.error("يجب أن يكون هناك متسابقين على الأقل لإجراء السحب المزدوج.");
      return;
    }

    setIsDrawing(true);
    try {
      // 1. Top Winner (First in leaderboard)
      const topWinner = leaderboard[0];
      
      // 2. Random Winner from the REST of the tickets
      const remainingTickets = usedTickets.filter((t) => t.customer_phone !== topWinner.phone);
      if (remainingTickets.length === 0) {
        toast.error("لا يوجد متسابقين آخرين للسحب العشوائي.");
        setIsDrawing(false);
        return;
      }
      const randomIndex = Math.floor(Math.random() * remainingTickets.length);
      const randomWinnerTicket = remainingTickets[randomIndex];

      // 3. Mark winners in DB
      // mark top winner's latest ticket as the winning ticket just for record
      await supabase
        .from("lottery_tickets")
        .update({ is_winner: true, win_type: "top" })
        .eq("id", topWinner.tickets[0].id);

      await supabase
        .from("lottery_tickets")
        .update({ is_winner: true, win_type: "random" })
        .eq("id", randomWinnerTicket.id);

      // 4. Close the round
      await supabase
        .from("lottery_rounds")
        .update({
          status: "completed",
          top_winner_id: topWinner.tickets[0].id,
          random_winner_id: randomWinnerTicket.id,
          completed_at: new Date().toISOString(),
        })
        .eq("id", activeRound.id);

      toast.success("تم إجراء السحب بنجاح! تم تحديد الفائزين.");
      queryClient.invalidateQueries({ queryKey: ["lottery_active_round"] });
      queryClient.invalidateQueries({ queryKey: ["lottery_tickets"] });
      
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء السحب.");
    } finally {
      setIsDrawing(false);
    }
  };

  const copyUnusedCodes = () => {
    const codes = unusedTickets.map(t => t.ticket_code).join("\n");
    navigator.clipboard.writeText(codes);
    toast.success("تم نسخ الأكواد للحافظة!");
  };

  if (roundLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass p-6 rounded-2xl border border-primary/20">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Gift className="text-amber-500" /> إدارة السحوبات
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            الجولة الحالية: {activeRound ? (
              <span className="text-emerald-500 font-bold">نشطة</span>
            ) : (
              <span className="text-destructive font-bold">لا توجد جولة نشطة</span>
            )}
          </p>
        </div>
        {!activeRound && (
          <button
            onClick={() => startNewRound.mutate()}
            disabled={startNewRound.isPending}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            بدء جولة سحب جديدة
          </button>
        )}
      </div>

      {activeRound && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Section: Generate Codes */}
          <div className="glass p-6 rounded-2xl border border-border">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Ticket className="size-5" /> توليد الأكواد
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <input 
                type="number"
                min="1"
                max="100"
                value={generateCount}
                onChange={(e) => setGenerateCount(Number(e.target.value))}
                className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm text-center"
              />
              <button
                onClick={() => generateCodes.mutate(generateCount)}
                disabled={generateCodes.isPending}
                className="flex-1 rounded-lg bg-secondary px-4 py-2 text-sm font-bold hover:bg-secondary/80 flex items-center justify-center gap-2"
              >
                {generateCodes.isPending ? <Loader2 className="size-4 animate-spin" /> : "توليد كروت جديدة"}
              </button>
            </div>

            <div className="bg-background rounded-lg border border-border p-4 h-64 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground">الكروت الجاهزة للطباعة ({unusedTickets.length})</span>
                {unusedTickets.length > 0 && (
                  <button onClick={copyUnusedCodes} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Copy className="size-3" /> نسخ الكل
                  </button>
                )}
              </div>
              {unusedTickets.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center mt-10">لا توجد أكواد غير مستخدمة.</p>
              ) : (
                <ul className="space-y-1">
                  {unusedTickets.map((t) => (
                    <li key={t.id} className="text-xs font-mono bg-secondary/50 px-2 py-1.5 rounded">{t.ticket_code}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Section: Leaderboard */}
          <div className="lg:col-span-2 glass p-6 rounded-2xl border border-amber-500/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg flex items-center gap-2 text-amber-500">
                <Trophy className="size-5" /> المتصدرين (احصائيات الكروت المستخدمة)
              </h3>
              <button
                onClick={runDraw}
                disabled={isDrawing || leaderboard.length < 2}
                className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-amber-950 shadow-gold-glow hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDrawing ? <Loader2 className="size-4 animate-spin" /> : "تشغيل السحب يدوياً الآن 🚀"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start">
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    <th className="pb-3 font-medium text-center">المركز</th>
                    <th className="pb-3 font-medium">الاسم</th>
                    <th className="pb-3 font-medium">رقم الواتساب</th>
                    <th className="pb-3 font-medium text-center">عدد الكروت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        لم يقم أحد بإدخال أي كود حتى الآن في هذه الجولة.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((user, idx) => (
                      <tr key={user.phone} className={idx === 0 ? "bg-amber-500/10" : ""}>
                        <td className="py-3 text-center">
                          {idx === 0 ? (
                            <span className="inline-flex size-6 items-center justify-center rounded-full bg-amber-500 text-amber-950 font-bold text-xs">1</span>
                          ) : (
                            <span className="text-muted-foreground">{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-3 font-bold text-foreground">{user.name}</td>
                        <td className="py-3 text-muted-foreground" dir="ltr">{user.phone}</td>
                        <td className="py-3 text-center">
                          <span className="inline-flex items-center justify-center rounded-lg bg-secondary px-3 py-1 font-bold text-foreground">
                            {user.count}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg flex items-start gap-2">
              <span className="text-primary text-lg leading-none">💡</span>
              <p>
                <strong>كيف يعمل السحب؟</strong> عند الضغط على "تشغيل السحب"، يفوز <strong>المركز الأول</strong> مباشرة بالجائزة الكبرى. ثم يتم أخذ بقية المشاركين وسحب فائز <strong>عشوائياً</strong> للجائزة الثانية (فرص الفوز العشوائي تعتمد على عدد كروتهم).
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Section: Previous Winners / Archive */}
      {/* We can load completed rounds here if needed, keeping it simple for now or you can request to expand it */}
    </div>
  );
}
