import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, X, Gift, CheckCircle2, Loader2, Phone, ArrowRight, Share2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { LotteryCountdown } from "./LotteryCountdown";
import { useAuth } from "@/hooks/useAuth";

// Generate a unique 6-char referral code from phone
function makeReferralCode(phone: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let hash = 0;
  for (let i = 0; i < phone.length; i++) hash = phone.charCodeAt(i) + ((hash << 5) - hash);
  let result = "HS";
  for (let i = 0; i < 4; i++) result += chars[Math.abs((hash >> (i * 5)) & 31) % chars.length];
  return result;
}

export function LotterySection() {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ count: number; referralCode: string } | null>(null);
  
  const { profile } = useAuth();

  // Read referral code from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const referredBy = urlParams.get("ref") || "";

  // Auto-fill from profile
  useState(() => {
    if (profile) {
      if (profile.full_name) setName(profile.full_name);
      if (profile.phone) setPhone(profile.phone);
    }
  });

  // Fetch active round (for countdown)
  const { data: activeRound } = useQuery({
    queryKey: ["lottery_active_round_public"],
    queryFn: async () => {
      const { data } = await supabase
        .from("lottery_rounds")
        .select("id, draw_date, prize_description, status")
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !phone.trim() || !name.trim()) {
      toast.error("يرجى إدخال جميع البيانات المطلوبة");
      return;
    }

    setLoading(true);
    try {
      // 1. Check if the code exists and is not used
      const { data: ticket, error: fetchError } = await supabase
        .from("lottery_tickets")
        .select("*")
        .eq("ticket_code", code.trim().toUpperCase())
        .single();

      if (fetchError || !ticket) {
        toast.error("الكود غير صحيح أو غير موجود.");
        setLoading(false);
        return;
      }

      if (ticket.is_used) {
        toast.error("هذا الكود تم استخدامه مسبقاً.");
        setLoading(false);
        return;
      }

      // 2. Generate referral code for this customer
      const customerReferralCode = makeReferralCode(phone.trim());

      // 3. Mark ticket as used
      const { error: updateError } = await supabase
        .from("lottery_tickets")
        .update({
          is_used: true,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          used_at: new Date().toISOString(),
          referral_code: customerReferralCode,
          referred_by: referredBy || null,
        })
        .eq("id", ticket.id);

      if (updateError) throw updateError;

      // 4. If referred_by exists, give the referrer a bonus ticket (mark referral_bonus flag)
      if (referredBy) {
        // Find the latest unused ticket in the same round to assign as bonus to referrer
        const { data: unusedBonus } = await supabase
          .from("lottery_tickets")
          .select("id")
          .eq("round_id", ticket.round_id)
          .eq("is_used", false)
          .limit(1)
          .single();
        
        if (unusedBonus) {
          // Get referrer's info
          const { data: referrerTicket } = await supabase
            .from("lottery_tickets")
            .select("customer_name, customer_phone")
            .eq("referral_code", referredBy)
            .eq("is_used", true)
            .single();

          if (referrerTicket) {
            await supabase
              .from("lottery_tickets")
              .update({
                is_used: true,
                customer_name: referrerTicket.customer_name,
                customer_phone: referrerTicket.customer_phone,
                used_at: new Date().toISOString(),
                referral_code: referredBy + "_BONUS",
                referred_by: "REFERRAL_BONUS",
              })
              .eq("id", unusedBonus.id);
          }
        }
      }

      // 5. Count total tickets for this phone
      const { count } = await supabase
        .from("lottery_tickets")
        .select("*", { count: "exact", head: true })
        .eq("customer_phone", phone.trim())
        .eq("is_used", true);

      setSuccessData({ count: count || 1, referralCode: customerReferralCode });
      toast.success("تم تسجيل البطاقة بنجاح! حظاً موفقاً. 🎊");
      setCode("");

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "حدث خطأ أثناء تسجيل البطاقة.");
    } finally {
      setLoading(false);
    }
  };

  const shareReferral = (referralCode: string) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}?ref=${referralCode}#lottery`;
    const msg = `🎁 سجّل في سحب هاشم للطيب واربح جوائز قيمة!\n\nاستخدم رابط الدعوة الخاص بي لتسجيل بطاقتك الآن:\n${shareUrl}\n\nكل بطاقة تزيد فرصتك!`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
  };

  const copyReferralLink = (referralCode: string) => {
    const url = `${window.location.origin}?ref=${referralCode}#lottery`;
    navigator.clipboard.writeText(url);
    toast.success("تم نسخ رابط الإحالة!");
  };

  const hasDrawDate = !!activeRound?.draw_date;
  const isExpired = hasDrawDate && new Date(activeRound!.draw_date!) < new Date();

  return (
      {/* Official In-Page Luxury Lottery Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6" id="lottery">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-primary/10 to-amber-500/5 p-4 sm:p-6 shadow-gold-glow backdrop-blur-md"
        >
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute -end-10 -top-10 size-40 rounded-full bg-amber-500/15 blur-2xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gold-gradient text-primary-foreground shadow-gold-glow">
                <Gift className="size-6 animate-pulse" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                    سحوبات وجوائز هاشم للطيب 🎁
                  </h3>
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    فرصة ذهبية
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  مع كل طلب أو كود سحب تحصل على فرصة للفوز بجوائز ملكية قيمة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 self-start sm:self-auto">
              {hasDrawDate && !isExpired && (
                <div className="hidden md:block">
                  <LotteryCountdown drawDate={activeRound!.draw_date} compact />
                </div>
              )}
              <button
                onClick={() => setIsOpen(true)}
                className="group inline-flex items-center gap-2 rounded-2xl bg-gold-gradient px-5 sm:px-6 py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-gold-glow hover:opacity-90 transition-all cursor-pointer"
              >
                <Ticket className="size-4" />
                <span>سجّل بطاقتك الآن</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-10 sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl p-6 sm:p-8"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 end-4 rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X className="size-5" />
              </button>

              <div className="text-center mb-4 mt-2">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                  <Gift className="size-7 text-primary" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  تسجيل بطاقة السحب
                </h2>
                {activeRound?.prize_description && (
                  <p className="text-xs font-medium text-primary mt-1">
                    🏆 الجائزة: {activeRound.prize_description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  أدخل الكود المرفق مع بطاقتك لتأكيد دخولك في القرعة.
                </p>
                {referredBy && (
                  <div className="mt-2 text-[11px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg px-3 py-1.5">
                    ✅ جاء بدعوة — ستحصل على كرت مجاني إضافي!
                  </div>
                )}
                {/* Countdown */}
                <LotteryCountdown
                  drawDate={activeRound?.draw_date}
                  prize={null}
                />
              </div>

              {successData !== null ? (
                <div className="text-center space-y-4 py-2">
                  <CheckCircle2 className="size-14 text-emerald-500 mx-auto" />
                  <div>
                    <h3 className="font-bold text-lg text-emerald-500">تم تسجيل بطاقتك بنجاح! 🎊</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      إجمالي فرصك في هذه الجولة:
                    </p>
                    <div className="mt-3 text-4xl font-display font-bold text-primary bg-primary/10 border border-primary/20 rounded-2xl py-3">
                      {successData.count}
                      <span className="text-lg text-muted-foreground mr-1">فرصة</span>
                    </div>
                  </div>

                  {/* Referral section */}
                  <div className="bg-secondary/50 border border-border rounded-2xl p-4 text-start">
                    <p className="text-xs font-bold text-foreground mb-1">🔗 زوّد أصحابك وازد فرصتك!</p>
                    <p className="text-[11px] text-muted-foreground mb-3">
                      كل صاحب يسجل بواسطتك = كرت مجاني لك تلقائياً
                    </p>
                    <div className="flex items-center gap-2 bg-background rounded-xl px-3 py-2 border border-border mb-3">
                      <span className="text-xs font-mono text-primary font-bold flex-1">{successData.referralCode}</span>
                      <button
                        onClick={() => copyReferralLink(successData.referralCode)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="size-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => shareReferral(successData.referralCode)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 transition-colors"
                    >
                      <Share2 className="size-4" />
                      شارك رابط دعوتك عبر واتساب
                    </button>
                  </div>

                  <div className="grid gap-2">
                    <button
                      onClick={() => setSuccessData(null)}
                      className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      تسجيل بطاقة أخرى
                    </button>
                    <button
                      onClick={() => { setSuccessData(null); setIsOpen(false); }}
                      className="w-full rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-foreground hover:bg-secondary/80 transition-colors"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                      الاسم الثلاثي
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="الاسم الكريم"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                      رقم الواتساب
                    </label>
                    <div className="relative">
                      <Phone className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type="tel"
                        required
                        dir="ltr"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-10 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="96877000000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-primary block mb-1">
                      كود البطاقة
                    </label>
                    <div className="relative">
                      <Ticket className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-primary" />
                      <input
                        type="text"
                        required
                        dir="ltr"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="w-full rounded-xl border border-primary/40 bg-primary/5 text-foreground font-bold tracking-widest px-10 py-3 text-center text-lg outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary uppercase placeholder:text-muted-foreground/50 placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
                        placeholder="HSHM-XXXX-XXXX"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-4 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <>
                        <span>تأكيد التسجيل</span>
                        <ArrowRight className="size-4 rtl:rotate-180" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
