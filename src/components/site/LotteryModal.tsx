import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, X, Gift, CheckCircle2, Loader2, Phone, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function LotterySection() {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  
  const { user, profile } = useAuth();

  // Auto-fill if user is logged in
  useState(() => {
    if (profile) {
      if (profile.full_name) setName(profile.full_name);
      if (profile.phone) setPhone(profile.phone);
    }
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
        .eq("ticket_code", code.trim())
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

      // 2. Mark as used and assign to customer
      const { error: updateError } = await supabase
        .from("lottery_tickets")
        .update({
          is_used: true,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          used_at: new Date().toISOString()
        })
        .eq("id", ticket.id);

      if (updateError) {
        throw updateError;
      }

      // 3. Count total tickets for this phone number
      const { count } = await supabase
        .from("lottery_tickets")
        .select("*", { count: "exact", head: true })
        .eq("customer_phone", phone.trim())
        .eq("is_used", true);

      setSuccessCount(count || 1);
      toast.success("تم تسجيل الكرت بنجاح! حظاً موفقاً.");
      setCode(""); // clear code for next entry

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "حدث خطأ أثناء تسجيل الكرت.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating or Embedded Banner to trigger modal */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mt-12 max-w-4xl px-4 sm:px-6 relative z-30"
      >
        <button
          onClick={() => setIsOpen(true)}
          className="w-full relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950 via-card to-background p-1 group cursor-pointer shadow-gold-glow transition-all hover:scale-[1.01]"
        >
          <div className="absolute inset-0 bg-gold-gradient opacity-10 group-hover:opacity-20 transition-opacity" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 p-6 sm:p-8">
            <div className="flex items-center gap-4 text-start">
              <div className="rounded-full bg-amber-500/20 p-3 border border-amber-500/30">
                <Gift className="size-8 text-amber-500 animate-bounce" />
              </div>
              <div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-amber-500">
                  سحب الجوائز الكبرى! 🎁
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  لديك كرت سحب؟ أدخل الكود الآن لتسجيل اسمك في السحب القادم.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-2 rounded-xl bg-amber-500 text-amber-950 px-6 py-3 font-bold text-sm shadow-md group-hover:bg-amber-400 transition-colors">
                <Ticket className="size-4" />
                أدخل الكود الآن
              </span>
            </div>
          </div>
        </button>
      </motion.div>

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
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/30 bg-card shadow-2xl glass p-6 sm:p-8"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 end-4 rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X className="size-5" />
              </button>

              <div className="text-center mb-6">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Gift className="size-7 text-amber-500" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  تسجيل كرت السحب
                </h2>
                <p className="text-xs text-muted-foreground mt-2">
                  أدخل الكود الموجود في الكرت لتسجيل اسمك في القرعة. كل كرت يزيد فرصتك!
                </p>
              </div>

              {successCount !== null ? (
                <div className="text-center space-y-4 py-4">
                  <CheckCircle2 className="size-16 text-emerald-500 mx-auto" />
                  <div>
                    <h3 className="font-bold text-lg text-emerald-500">تم التسجيل بنجاح!</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      تم ربط الكرت برقمك. إجمالي كروتك الحالية:
                    </p>
                    <div className="mt-4 text-4xl font-display font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-2xl py-4">
                      {successCount} كرت
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSuccessCount(null);
                      setIsOpen(false);
                    }}
                    className="w-full mt-6 rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    إغلاق
                  </button>
                  <button
                    onClick={() => setSuccessCount(null)}
                    className="w-full mt-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    إدخال كرت آخر
                  </button>
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
                      className="w-full rounded-xl border border-border bg-background/80 px-4 py-3 text-sm outline-none transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      placeholder="أدخل اسمك الكريم"
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
                        className="w-full rounded-xl border border-border bg-background/80 px-10 py-3 text-sm outline-none transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        placeholder="96877000000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1 text-amber-500">
                      كود السحب (الكرت)
                    </label>
                    <div className="relative">
                      <Ticket className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-amber-500" />
                      <input
                        type="text"
                        required
                        dir="ltr"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full rounded-xl border border-amber-500/50 bg-amber-500/5 text-amber-500 font-bold tracking-widest px-10 py-3 text-center text-lg outline-none transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500 uppercase placeholder:text-amber-500/30 placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
                        placeholder="مثال: HSHM-1234-ABCD"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-4 rounded-xl bg-amber-500 px-4 py-3.5 text-sm font-bold text-amber-950 shadow-md hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <>
                        <span>تسجيل الدخول في السحب</span>
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
