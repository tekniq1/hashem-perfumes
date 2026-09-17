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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mt-12 max-w-4xl px-4 sm:px-6 relative z-30"
      >
        <button
          onClick={() => setIsOpen(true)}
          className="w-full relative overflow-hidden rounded-3xl border border-primary/30 bg-black/60 backdrop-blur-xl p-1 group cursor-pointer shadow-gold-glow transition-all hover:scale-[1.01] hover:border-primary/60"
        >
          {/* Subtle animated background elements */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute -start-20 -top-20 size-40 bg-primary/20 blur-[60px] rounded-full group-hover:bg-primary/30 transition-colors" />
          <div className="absolute -end-20 -bottom-20 size-40 bg-primary/10 blur-[60px] rounded-full group-hover:bg-primary/20 transition-colors" />
          
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 p-8">
            <div className="flex items-center gap-5 text-start w-full sm:w-auto">
              <div className="relative shrink-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 p-4 border border-primary/30 shadow-inner">
                <div className="absolute inset-0 bg-gold-gradient opacity-20 blur-md rounded-2xl animate-pulse" />
                <Gift className="relative size-10 text-primary drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gold-gradient drop-shadow-sm tracking-wide">
                  السحب الحصري للجوائز الكبرى
                </h3>
                <p className="text-sm sm:text-base text-primary/70 mt-2 font-medium tracking-wide">
                  أدخل كود بطاقتك الآن لتأكيد فرصتك في الفوز بجوائزنا القيمة
                </p>
              </div>
            </div>
            
            <div className="shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
              <span className="flex items-center justify-center gap-3 rounded-2xl bg-gold-gradient px-8 py-4 font-bold text-primary-foreground shadow-gold-glow hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all hover:-translate-y-1 w-full text-base">
                <Ticket className="size-5" />
                تسجيل البطاقة
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
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-primary/30 bg-black/80 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-6 sm:p-8"
            >
              {/* Subtle top glow */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 end-4 rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="size-5" />
              </button>

              <div className="text-center mb-8 mt-2">
                <div className="mx-auto mb-5 relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 shadow-inner">
                  <div className="absolute inset-0 bg-gold-gradient opacity-20 blur-md rounded-2xl" />
                  <Gift className="size-8 text-primary drop-shadow-md" strokeWidth={1.5} />
                </div>
                <h2 className="font-display text-2xl font-bold bg-clip-text text-transparent bg-gold-gradient">
                  تسجيل بطاقة السحب
                </h2>
                <p className="text-xs sm:text-sm text-primary/60 mt-3 leading-relaxed">
                  أدخل الكود المرفق مع بطاقتك لتأكيد دخولك في القرعة.<br />كل بطاقة إضافية تضاعف فرصتك بالفوز.
                </p>
              </div>

              {successCount !== null ? (
                <div className="text-center space-y-5 py-4">
                  <div className="relative mx-auto size-20 flex items-center justify-center">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                    <CheckCircle2 className="relative size-16 text-emerald-400 drop-shadow-md" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-emerald-400 tracking-wide">تم تسجيل بطاقتك بنجاح!</h3>
                    <p className="text-sm text-primary/70 mt-3">
                      تم ربط الكرت برقمك. إجمالي فرصك الحالية:
                    </p>
                    <div className="mt-5 text-4xl font-display font-bold text-primary bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl py-6 shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                      {successCount} <span className="text-lg text-primary/60">فرصة</span>
                    </div>
                  </div>
                  <div className="grid gap-3 mt-8">
                    <button
                      onClick={() => setSuccessCount(null)}
                      className="w-full rounded-xl bg-gold-gradient px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-gold-glow hover:-translate-y-0.5 transition-all"
                    >
                      تسجيل بطاقة أخرى
                    </button>
                    <button
                      onClick={() => {
                        setSuccessCount(null);
                        setIsOpen(false);
                      }}
                      className="w-full rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-primary/70 ms-1">
                      الاسم الثلاثي
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-primary/20 bg-black/40 px-4 py-3.5 text-sm text-white outline-none transition-all focus:border-primary focus:bg-primary/5 focus:ring-1 focus:ring-primary/50 placeholder:text-white/20"
                      placeholder="الاسم الكريم"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-primary/70 ms-1">
                      رقم الواتساب
                    </label>
                    <div className="relative">
                      <Phone className="absolute start-4 top-1/2 -translate-y-1/2 size-4 text-primary/50" />
                      <input
                        type="tel"
                        required
                        dir="ltr"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border border-primary/20 bg-black/40 px-11 py-3.5 text-sm text-white outline-none transition-all focus:border-primary focus:bg-primary/5 focus:ring-1 focus:ring-primary/50 placeholder:text-white/20"
                        placeholder="96877000000"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-primary ms-1 flex items-center gap-2">
                      <Ticket className="size-3.5" /> كود البطاقة
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        dir="ltr"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full rounded-xl border border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 text-primary font-bold tracking-[0.2em] px-4 py-4 text-center text-lg outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/50 uppercase placeholder:text-primary/30 placeholder:tracking-normal placeholder:font-normal placeholder:text-sm shadow-inner"
                        placeholder="HSHM-XXXX-XXXX"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 rounded-xl bg-gold-gradient px-4 py-4 text-base font-bold text-primary-foreground shadow-gold-glow hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group/btn"
                  >
                    {loading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <>
                        <span>تأكيد التسجيل</span>
                        <ArrowRight className="size-4 rtl:rotate-180 transition-transform group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1" strokeWidth={2.5} />
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
