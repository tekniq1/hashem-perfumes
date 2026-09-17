import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Gift, Copy, Loader2, Trophy, Ticket, Calendar, Settings2,
  MessageCircle, CheckCheck, Clock
} from "lucide-react";
import { toast } from "sonner";
import { LotteryCountdown } from "@/components/site/LotteryCountdown";

export const Route = createFileRoute("/admin/lottery")({
  component: AdminLottery,
});

function AdminLottery() {
  const queryClient = useQueryClient();
  const [generateCount, setGenerateCount] = useState(10);
  const [isDrawing, setIsDrawing] = useState(false);
  // Settings form state
  const [drawDate, setDrawDate] = useState("");
  const [prizeDesc, setPrizeDesc] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // ─── Fetch active round ────────────────────────────────────────────────────
  const { data: activeRound, isLoading: roundLoading } = useQuery({
    queryKey: ["lottery_active_round"],
    queryFn: async () => {
      const { data } = await supabase
        .from("lottery_rounds")
        .select("*")
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.draw_date) setDrawDate(data.draw_date.slice(0, 16)); // datetime-local format
      if (data?.prize_description) setPrizeDesc(data.prize_description);
    },
  } as any);

  // ─── Fetch tickets ─────────────────────────────────────────────────────────
  const { data: tickets = [] } = useQuery({
    queryKey: ["lottery_tickets", activeRound?.id],
    enabled: !!activeRound?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("lottery_tickets")
        .select("*")
        .eq("round_id", activeRound!.id);
      return data || [];
    },
  });

  const unusedTickets = tickets.filter((t: any) => !t.is_used);
  const usedTickets = tickets.filter((t: any) => t.is_used);

  const leaderboardMap = usedTickets.reduce((acc: any, ticket: any) => {
    const key = ticket.customer_phone!;
    if (!acc[key]) {
      acc[key] = { name: ticket.customer_name || "غير معروف", phone: key, count: 0, tickets: [] };
    }
    acc[key].count += 1;
    acc[key].tickets.push(ticket);
    return acc;
  }, {} as Record<string, any>);
  const leaderboard = Object.values(leaderboardMap).sort((a: any, b: any) => b.count - a.count);

  // ─── Fetch completed rounds ────────────────────────────────────────────────
  const { data: pastRounds = [] } = useQuery({
    queryKey: ["lottery_past_rounds"],
    queryFn: async () => {
      const { data } = await supabase
        .from("lottery_rounds")
        .select("*, top_ticket:top_winner_id(customer_name,customer_phone,win_type), random_ticket:random_winner_id(customer_name,customer_phone,win_type)")
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  // ─── Save round settings ───────────────────────────────────────────────────
  const saveSettings = async () => {
    if (!activeRound) return;
    setSavingSettings(true);
    const { error } = await supabase
      .from("lottery_rounds")
      .update({
        draw_date: drawDate ? new Date(drawDate).toISOString() : null,
        prize_description: prizeDesc || null,
      })
      .eq("id", activeRound.id);
    setSavingSettings(false);
    if (error) toast.error("فشل الحفظ: " + error.message);
    else {
      toast.success("تم حفظ إعدادات الجولة ✅");
      queryClient.invalidateQueries({ queryKey: ["lottery_active_round"] });
      queryClient.invalidateQueries({ queryKey: ["lottery_active_round_public"] });
    }
  };

  // ─── Generate codes ────────────────────────────────────────────────────────
  const generateCodes = useMutation({
    mutationFn: async (count: number) => {
      if (!activeRound) throw new Error("لا توجد جولة نشطة.");
      const newTickets = Array.from({ length: count }).map(() => ({
        ticket_code: "HSHM-" + Math.random().toString(36).substring(2, 6).toUpperCase() +
          "-" + Math.random().toString(36).substring(2, 6).toUpperCase(),
        round_id: activeRound.id,
      }));
      const { error } = await supabase.from("lottery_tickets").insert(newTickets);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم توليد الأكواد بنجاح ✅");
      queryClient.invalidateQueries({ queryKey: ["lottery_tickets"] });
    },
    onError: (err: any) => toast.error(err.message || "حدث خطأ"),
  });

  // ─── Start new round ───────────────────────────────────────────────────────
  const startNewRound = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("lottery_rounds").insert([{ status: "active" }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم فتح جولة جديدة 🎉");
      setDrawDate(""); setPrizeDesc("");
      queryClient.invalidateQueries({ queryKey: ["lottery_active_round"] });
      queryClient.invalidateQueries({ queryKey: ["lottery_tickets"] });
    },
  });

  // ─── Run draw ──────────────────────────────────────────────────────────────
  const runDraw = async () => {
    if (!activeRound) return;
    if ((leaderboard as any[]).length < 2) {
      toast.error("يجب وجود مشاركين اثنين على الأقل.");
      return;
    }
    setIsDrawing(true);
    try {
      const topWinner: any = leaderboard[0];
      const remaining = usedTickets.filter((t: any) => t.customer_phone !== topWinner.phone);
      if (remaining.length === 0) {
        toast.error("لا يوجد مشاركون آخرون للسحب العشوائي.");
        setIsDrawing(false);
        return;
      }
      const randomWinner: any = remaining[Math.floor(Math.random() * remaining.length)];

      await supabase.from("lottery_tickets").update({ is_winner: true, win_type: "top" }).eq("id", topWinner.tickets[0].id);
      await supabase.from("lottery_tickets").update({ is_winner: true, win_type: "random" }).eq("id", randomWinner.id);

      // Build winners display (no phone numbers)
      const winnersDisplay = [
        { name: topWinner.name, prize_type: "top" },
        { name: randomWinner.customer_name || "غير معروف", prize_type: "random" },
      ];

      await supabase.from("lottery_rounds").update({
        status: "completed",
        top_winner_id: topWinner.tickets[0].id,
        random_winner_id: randomWinner.id,
        completed_at: new Date().toISOString(),
        winners_display: winnersDisplay,
      }).eq("id", activeRound.id);

      toast.success("🎊 تم إجراء السحب بنجاح! تحقق من الفائزين أدناه.");
      queryClient.invalidateQueries({ queryKey: ["lottery_active_round"] });
      queryClient.invalidateQueries({ queryKey: ["lottery_tickets"] });
      queryClient.invalidateQueries({ queryKey: ["lottery_past_rounds"] });
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء السحب.");
    } finally {
      setIsDrawing(false);
    }
  };

  // ─── WhatsApp notification for winner ─────────────────────────────────────
  const sendWhatsApp = (name: string, phone: string, prizeType: "top" | "random", prize?: string) => {
    const msg = prizeType === "top"
      ? `🎊 *مبروك ${name}!* \n\nلقد فزت *بالجائزة الكبرى* في سحب *هاشم للطيب*! 🏆\n🎁 الجائزة: ${prize || "جائزة قيمة"}\n\nسيتم التواصل معك قريباً لاستلام جائزتك.\n\n_شكراً لثقتك بهاشم للطيب_ 🌹`
      : `🎉 *مبروك ${name}!* \n\nاسمك خرج في *السحب العشوائي* لهاشم للطيب! 🎲\n🎁 الجائزة: ${prize || "جائزة مفاجأة"}\n\nسيتم التواصل معك قريباً لاستلام جائزتك.\n\n_شكراً لثقتك بهاشم للطيب_ 🌹`;
    const waPhone = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const copyUnusedCodes = () => {
    const codes = unusedTickets.map((t: any) => t.ticket_code).join("\n");
    navigator.clipboard.writeText(codes);
    toast.success("تم نسخ الأكواد!");
  };

  if (roundLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto size-8 text-primary" /></div>;

  return (
    <div className="space-y-6">

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass p-6 rounded-2xl border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-2.5">
            <Gift className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">إدارة السحوبات والجوائز</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              الجولة الحالية: {activeRound
                ? <span className="text-emerald-500 font-bold">نشطة ✅</span>
                : <span className="text-destructive font-bold">لا توجد جولة نشطة</span>}
            </p>
          </div>
        </div>
        {!activeRound && (
          <button
            onClick={() => startNewRound.mutate()}
            disabled={startNewRound.isPending}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {startNewRound.isPending ? <Loader2 className="size-4 animate-spin" /> : "بدء جولة جديدة"}
          </button>
        )}
      </div>

      {activeRound && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ─── Left column ──────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Settings card */}
            <div className="glass p-5 rounded-2xl border border-border">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                <Settings2 className="size-4 text-primary" /> إعدادات الجولة
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">الجائزة</label>
                  <input
                    type="text"
                    value={prizeDesc}
                    onChange={(e) => setPrizeDesc(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="مثال: ساعة Omega، رحلة عائلية..."
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    <span className="flex items-center gap-1"><Calendar className="size-3" /> تاريخ ووقت السحب</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={drawDate}
                    onChange={(e) => setDrawDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button
                  onClick={saveSettings}
                  disabled={savingSettings}
                  className="w-full rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                >
                  {savingSettings ? <Loader2 className="size-4 animate-spin" /> : <><CheckCheck className="size-4" /> حفظ الإعدادات</>}
                </button>
              </div>
              {/* Live countdown preview */}
              {drawDate && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1"><Clock className="size-3" /> معاينة العداد التنازلي:</p>
                  <LotteryCountdown drawDate={new Date(drawDate).toISOString()} prize={prizeDesc || null} />
                </div>
              )}
            </div>

            {/* Generate codes card */}
            <div className="glass p-5 rounded-2xl border border-border">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                <Ticket className="size-4" /> توليد الأكواد
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="number" min="1" max="200"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Number(e.target.value))}
                  className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm text-center"
                />
                <button
                  onClick={() => generateCodes.mutate(generateCount)}
                  disabled={generateCodes.isPending}
                  className="flex-1 rounded-xl bg-secondary px-3 py-2 text-sm font-bold hover:bg-secondary/80 flex items-center justify-center gap-2"
                >
                  {generateCodes.isPending ? <Loader2 className="size-4 animate-spin" /> : "توليد كروت"}
                </button>
              </div>
              <div className="bg-background rounded-xl border border-border p-3 h-48 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-muted-foreground">غير مستخدمة ({unusedTickets.length})</span>
                  {unusedTickets.length > 0 && (
                    <button onClick={copyUnusedCodes} className="text-[11px] text-primary hover:underline flex items-center gap-1">
                      <Copy className="size-3" /> نسخ الكل
                    </button>
                  )}
                </div>
                {unusedTickets.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center mt-8">لا توجد أكواد غير مستخدمة.</p>
                ) : (
                  <ul className="space-y-1">
                    {(unusedTickets as any[]).map((t: any) => (
                      <li key={t.id} className="text-xs font-mono bg-secondary/50 px-2 py-1.5 rounded-lg">{t.ticket_code}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* ─── Right: Leaderboard + Draw ─────────────────────────────────── */}
          <div className="xl:col-span-2 glass p-5 rounded-2xl border border-primary/20">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-base flex items-center gap-2 text-primary">
                <Trophy className="size-5" /> المتصدرين ({(leaderboard as any[]).length} مشارك · {usedTickets.length} كرت)
              </h3>
              <button
                onClick={runDraw}
                disabled={isDrawing || (leaderboard as any[]).length < 2}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
              >
                {isDrawing ? <Loader2 className="size-4 animate-spin" /> : "🚀 تشغيل السحب الآن"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start">
                <thead className="border-b border-border text-muted-foreground text-xs">
                  <tr>
                    <th className="pb-3 font-medium text-center w-12">#</th>
                    <th className="pb-3 font-medium">الاسم</th>
                    <th className="pb-3 font-medium">رقم الواتساب</th>
                    <th className="pb-3 font-medium text-center">الكروت</th>
                    <th className="pb-3 font-medium text-center">إشعار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {(leaderboard as any[]).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-muted-foreground text-sm">
                        لم يتم تسجيل أي كرت في هذه الجولة بعد.
                      </td>
                    </tr>
                  ) : (
                    (leaderboard as any[]).map((user: any, idx: number) => (
                      <tr key={user.phone} className={idx === 0 ? "bg-primary/5" : ""}>
                        <td className="py-3 text-center">
                          {idx === 0 ? <span className="text-lg">🥇</span>
                            : idx === 1 ? <span className="text-base">🥈</span>
                            : idx === 2 ? <span className="text-base">🥉</span>
                            : <span className="text-muted-foreground text-xs">{idx + 1}</span>}
                        </td>
                        <td className="py-3 font-bold text-foreground text-sm">{user.name}</td>
                        <td className="py-3 text-muted-foreground text-xs" dir="ltr">{user.phone}</td>
                        <td className="py-3 text-center">
                          <span className="inline-flex items-center justify-center rounded-lg bg-secondary px-2.5 py-1 font-bold text-foreground text-sm min-w-[2rem]">{user.count}</span>
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => sendWhatsApp(user.name, user.phone, idx === 0 ? "top" : "random", prizeDesc)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 px-2.5 py-1.5 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                            title="إرسال رسالة واتساب للفائز"
                          >
                            <MessageCircle className="size-3" /> إشعار
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-5 text-xs text-muted-foreground bg-primary/5 border border-primary/10 p-3 rounded-xl flex items-start gap-2">
              <span className="text-primary mt-0.5">💡</span>
              <p><strong>كيف يعمل السحب؟</strong> عند الضغط على "تشغيل السحب"، يفوز <strong>الأول في الترتيب</strong> مباشرة. ثم يُختار فائز <strong>عشوائي</strong> من باقي المشاركين. بعدها تظهر أزرار الإشعار لإرسال تهنئة واتساب مباشرة للفائزين.</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Past winners ──────────────────────────────────────────────────── */}
      {pastRounds.length > 0 && (
        <div className="glass p-5 rounded-2xl border border-border">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <Trophy className="size-4 text-primary" /> سجل الجولات السابقة
          </h3>
          <div className="space-y-3">
            {(pastRounds as any[]).map((round: any) => {
              const topTicket = round.top_ticket as any;
              const randomTicket = round.random_ticket as any;
              const date = round.completed_at
                ? new Date(round.completed_at).toLocaleDateString("ar-OM", { year: "numeric", month: "long", day: "numeric" })
                : "";
              return (
                <div key={round.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-secondary/40 border border-border px-4 py-3">
                  <div>
                    <span className="text-sm font-bold text-foreground">{round.prize_description || "جائزة سحب"}</span>
                    <span className="text-[11px] text-muted-foreground ms-2">{date}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {topTicket && (
                      <button
                        onClick={() => sendWhatsApp(topTicket.customer_name, topTicket.customer_phone, "top", round.prize_description)}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 px-3 py-1.5 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                      >
                        <MessageCircle className="size-3" />
                        🥇 {topTicket.customer_name?.split(" ")[0]}
                      </button>
                    )}
                    {randomTicket && (
                      <button
                        onClick={() => sendWhatsApp(randomTicket.customer_name, randomTicket.customer_phone, "random", round.prize_description)}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-600 px-3 py-1.5 text-xs font-bold hover:bg-blue-500/20 transition-colors"
                      >
                        <MessageCircle className="size-3" />
                        🎲 {randomTicket.customer_name?.split(" ")[0]}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
