import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";

export function CartDrawer() {
  const { t, money, pick, dir } = useI18n();
  const { lines, open, setOpen, setQty, remove, subtotal } = useCart();
  const offscreen = dir === "rtl" ? -420 : 420;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: offscreen }}
            animate={{ x: 0 }}
            exit={{ x: offscreen }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className="fixed inset-y-0 end-0 z-50 flex w-full max-w-sm flex-col border-s border-border bg-card/95 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="flex items-center gap-2 font-display text-base text-foreground">
                <ShoppingBag className="size-4 text-primary" />
                {t("cart")}
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label={t("cancel")}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:text-primary"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Voucher Progress / Reward Banner */}
            {lines.length > 0 && (
              <div className="bg-primary/5 px-5 py-3 border-b border-primary/10">
                {subtotal >= 99 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-gold-gradient text-primary-foreground shadow-gold-glow">
                      <span className="text-[9px] font-bold uppercase leading-none opacity-80">Gift</span>
                      <span className="text-sm font-bold leading-none">5</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {pick("مبروك! ربحت قسيمة شرائية 🎉", "Congrats! You won a gift voucher 🎉")}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {pick("سيتم إرسال كود الخصم بعد إتمام الطلب", "Voucher code will be sent after checkout")}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-center text-foreground">
                      {pick(
                        `أضف منتجات بقيمة ${money(99 - subtotal)} لتربح قسيمة بقيمة 5 ريال!`,
                        `Add ${money(99 - subtotal)} more to win a 5 SAR gift voucher!`
                      )}
                    </p>
                    <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gold-gradient transition-all duration-500 ease-out" 
                        style={{ width: `${Math.min((subtotal / 99) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {lines.length === 0 ? (
                <p className="mt-16 text-center text-sm text-muted-foreground">{t("cart_empty")}</p>
              ) : (
                lines.map((l) => (
                  <motion.div
                    key={l.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="glass flex gap-3 rounded-lg p-3"
                  >
                    <img
                      src={l.image ?? "/favicon.ico"}
                      alt={pick(l.name_ar, l.name_en)}
                      className="size-16 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm text-foreground">
                        {pick(l.name_ar, l.name_en)}
                      </p>
                      <p className="text-xs text-primary">{money(l.price)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          aria-label={t("remove")}
                          onClick={() => setQty(l.id, l.qty - 1)}
                          className="rounded-md border border-border p-1 text-muted-foreground hover:text-primary"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-6 text-center text-sm">{l.qty}</span>
                        <button
                          aria-label={t("quantity")}
                          onClick={() => setQty(l.id, l.qty + 1)}
                          className="rounded-md border border-border p-1 text-muted-foreground hover:text-primary"
                        >
                          <Plus className="size-3" />
                        </button>
                        <button
                          aria-label={t("remove")}
                          onClick={() => remove(l.id)}
                          className="ms-auto rounded-md p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="space-y-3 border-t border-border p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span className="font-semibold text-primary">{money(subtotal)}</span>
              </div>
              {lines.length > 0 ? (
                <Link
                  to="/checkout"
                  onClick={() => setOpen(false)}
                  className="block w-full rounded-lg bg-gold-gradient py-3 text-center text-sm font-semibold text-primary-foreground shadow-gold-glow"
                >
                  {t("checkout")}
                </Link>
              ) : (
                <Link
                  to="/shop"
                  onClick={() => setOpen(false)}
                  className="block w-full rounded-lg border border-primary/40 py-3 text-center text-sm font-semibold text-primary"
                >
                  {t("continue_shopping")}
                </Link>
              )}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
