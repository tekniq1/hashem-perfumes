import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Check,
  CreditCard,
  ExternalLink,
  ImageIcon,
  Info,
  Loader2,
  MapPin,
  MessageCircle,
  Receipt,
  ShoppingBag,
  Trash2,
  Truck,
  Upload,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/useAuth";
import { placeOrder, whatsappUrl } from "@/lib/checkout";
import { mapsUrl } from "@/lib/config";
import { useQuery } from "@tanstack/react-query";
import { fetchStoreSettings } from "@/lib/settings";
import { uploadProductImage } from "@/lib/uploads";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "إتمام الطلب — هاشم للطيب | Checkout" },
      {
        name: "description",
        content:
          "إتمام طلب العطور والبخور الملكي من متجر هاشم للطيب والدفع عبر التحويل البنكي والتواصل عبر واتساب.",
      },
    ],
  }),
  component: CheckoutPage,
});

const field =
  "w-full rounded-xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary";

function CheckoutPage() {
  const { t, money, pick } = useI18n();
  const { lines, subtotal, clear } = useCart();
  const { user, profile } = useAuth();
  const router = useRouter();

  const { data: settings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: fetchStoreSettings,
  });

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [transferReference, setTransferReference] = useState("");
  const [receiptImageUrl, setReceiptImageUrl] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setName((v) => v || profile.full_name || "");
      setPhone((v) => v || profile.phone || "");
    }
    if (user?.email) {
      setEmail((v) => v || user.email || "");
    }
  }, [profile, user]);

  const steps = [t("step_details"), t("step_delivery"), t("step_review")];

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t("checkout_location_unavailable"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success(t("checkout_location_success"));
      },
      (err) => {
        setLocating(false);
        toast.error(err.message || t("checkout_location_error"));
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const handleReceiptUpload = async (file: File) => {
    setUploadingReceipt(true);
    try {
      const url = await uploadProductImage(file);
      setReceiptImageUrl(url);
      toast.success(t("checkout_receipt_uploaded"));
    } catch (e) {
      toast.error(t("checkout_receipt_upload_error"));
    } finally {
      setUploadingReceipt(false);
    }
  };

  const submitOrder = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error(t("checkout_name_phone_error"));
      setStep(0);
      return;
    }
    if (deliveryMethod === "delivery" && !address.trim() && !coords) {
      toast.error(t("checkout_address_error"));
      setStep(1);
      return;
    }
    if (lines.length === 0) {
      toast.error(t("cart_empty"));
      return;
    }

    setBusy(true);
    try {
      const result = await placeOrder({
        userId: user?.id ?? null,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || undefined,
        delivery_method: deliveryMethod,
        delivery_address: deliveryMethod === "pickup" ? t("checkout_pickup_branch") : address,
        customer_notes: notes || undefined,
        transfer_reference: transferReference || undefined,
        receipt_image_url: receiptImageUrl || undefined,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        payment_method: "bank_transfer_in_advance",
        lines,
      });

      const wa = whatsappUrl({
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        name,
        phone,
        email: email || undefined,
        deliveryMethod,
        address: deliveryMethod === "pickup" ? t("checkout_pickup") : address,
        notes: notes || undefined,
        transferReference: transferReference || undefined,
        receiptImageUrl: receiptImageUrl || undefined,
        mapUrl: result.map_url,
        lines,
        total: subtotal,
        whatsappNumber: settings?.whatsapp_number,
        siteUrl: window.location.origin,
      });

      clear();
      toast.success(t("order_placed"));

      // Open WhatsApp with complete formatted order message
      window.open(wa, "_blank");

      router.navigate({ to: "/orders" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("checkout_order_error"));
    } finally {
      setBusy(false);
    }
  };

  if (lines.length === 0 && !busy) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="glass rounded-3xl p-10 space-y-5">
          <ShoppingBag className="size-12 text-primary mx-auto opacity-60" />
          <h1 className="font-display text-xl text-foreground">{t("cart_empty")}</h1>
          <p className="text-xs text-muted-foreground">
            تصفح أجود العطور والبخور الملكي في المتجر وأضفها لحقيبتك.
          </p>
          <Link
            to="/shop"
            className="inline-block w-full rounded-xl bg-gold-gradient py-3 text-xs font-semibold text-primary-foreground shadow-gold-glow"
          >
            {t("continue_shopping")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {/* Step Indicator */}
      <div className="mb-10 flex items-center justify-between">
        {steps.map((st, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i <= step
                  ? "bg-gold-gradient text-primary-foreground shadow-gold-glow"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </span>
            <span
              className={`hidden text-xs font-medium sm:inline ${
                i === step ? "text-foreground font-bold" : "text-muted-foreground"
              }`}
            >
              {st}
            </span>
          </div>
        ))}
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="glass rounded-3xl p-6 sm:p-10 shadow-gold-glow border border-border/80"
      >
        {/* Step 0: Customer Info */}
        {step === 0 ? (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                {t("step_details")}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">{t("checkout_enter_details")}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="checkout-name"
                  className="text-xs font-medium text-muted-foreground block mb-1.5"
                >
                  {t("full_name")} <span className="text-primary">*</span>
                </label>
                <input
                  id="checkout-name"
                  name="name"
                  autoComplete="name"
                  className={field}
                  placeholder={t("checkout_name_placeholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-phone"
                  className="text-xs font-medium text-muted-foreground block mb-1.5"
                >
                  {t("phone")} <span className="text-primary">*</span>
                </label>
                <input
                  id="checkout-phone"
                  name="tel"
                  autoComplete="tel"
                  className={field}
                  dir="ltr"
                  placeholder={t("checkout_phone_placeholder")}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-email"
                  className="text-xs font-medium text-muted-foreground block mb-1.5"
                >
                  {t("email")} ({t("checkout_email_optional")})
                </label>
                <input
                  id="checkout-email"
                  name="email"
                  autoComplete="email"
                  spellCheck={false}
                  className={field}
                  dir="ltr"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!name.trim() || !phone.trim()) {
                    toast.error(t("checkout_name_phone_required"));
                    return;
                  }
                  setStep(1);
                }}
                className="rounded-xl bg-gold-gradient px-8 py-3 text-xs font-bold text-primary-foreground shadow-gold-glow cursor-pointer"
              >
                {t("next")} ➔
              </button>
            </div>
          </div>
        ) : null}

        {/* Step 1: Delivery & Shipping Method */}
        {step === 1 ? (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                {t("step_delivery")}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                اختر طريقة الاستلام وموقع التوصيل المناسب لك.
              </p>
            </div>

            {/* Delivery Method Selector */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setDeliveryMethod("delivery")}
                className={`p-4 rounded-2xl border text-start transition-all cursor-pointer ${
                  deliveryMethod === "delivery"
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border bg-background/50 hover:bg-accent"
                }`}
              >
                <Truck className="size-6 text-primary mb-2" />
                <h4 className="font-bold text-sm text-foreground">توصيل للمنزل</h4>
                <p className="text-[11px] text-muted-foreground mt-1">
                  توصيل سريع لكافة المناطق (تُحسب التكلفة حسب الموقع)
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod("pickup")}
                className={`p-4 rounded-2xl border text-start transition-all cursor-pointer ${
                  deliveryMethod === "pickup"
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border bg-background/50 hover:bg-accent"
                }`}
              >
                <Building2 className="size-6 text-primary mb-2" />
                <h4 className="font-bold text-sm text-foreground">استلام من الفرع</h4>
                <p className="text-[11px] text-muted-foreground mt-1">
                  استلام مجاني ومباشر من أحد فروع هاشم للطيب
                </p>
              </button>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300">
              <Info className="size-5 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{t("shipping_notice")}</p>
            </div>

            {deliveryMethod === "delivery" ? (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    عنوان وموقع التوصيل (المنطقة / الشارع / رقم المنزل)
                  </label>
                  <textarea
                    className={`${field} min-h-[90px]`}
                    placeholder={t("checkout_address_placeholder")}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={locating}
                    className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
                  >
                    {locating ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MapPin className="size-4" />
                    )}
                    <span>
                      {coords ? t("checkout_update_location") : t("checkout_detect_location")}
                    </span>
                  </button>

                  {coords ? (
                    <a
                      href={mapsUrl(coords.lat, coords.lng)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary underline"
                    >
                      <ExternalLink className="size-3.5" />
                      <span>عرض الإحداثيات على الخريطة</span>
                    </a>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border p-4 bg-background/50 text-xs space-y-2">
                <p className="font-semibold text-foreground">📍 فروع الاستلام المتاحة:</p>
                <p className="text-muted-foreground">
                  • الفرع الرئيسي — مسقط (يومياً من ٩ ص حتى ١٠ م).
                </p>
                <p className="text-muted-foreground text-[11px]">
                  سيتم تجهيز طلبك فور تأكيد الدفع وإبلاغك بجاهزية الاستلام عبر واتساب.
                </p>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                {t("customer_notes")}
              </label>
              <input
                className={field}
                placeholder={t("checkout_notes_placeholder")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="rounded-xl border border-border px-6 py-2.5 text-xs font-medium text-foreground hover:bg-accent cursor-pointer"
              >
                ⬅ {t("back")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deliveryMethod === "delivery" && !address.trim() && !coords) {
                    toast.error(t("checkout_address_required"));
                    return;
                  }
                  setStep(2);
                }}
                className="rounded-xl bg-gold-gradient px-8 py-3 text-xs font-bold text-primary-foreground shadow-gold-glow cursor-pointer"
              >
                {t("next")} ➔
              </button>
            </div>
          </div>
        ) : null}

        {/* Step 2: Review & Bank Muscat Payment Confirmation */}
        {step === 2 ? (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">{t("step_review")}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                راجع تفاصيل طلبك وحساب بنك مسقط، وأدخل رقم الحوالة أو صورة الإشعار ثم اضغط على زر
                إرسال الطلب.
              </p>
            </div>

            {/* Bank Muscat Payment Details Box */}
            <div className="rounded-2xl border border-primary/40 bg-primary/10 p-5 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <CreditCard className="size-5" />
                <span>{t("bank_details_title")}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                يرجى تحويل مبلغ الطلب{" "}
                <span className="font-bold text-foreground">{money(subtotal)}</span> إلى الحساب
                البنكي التالي قبل أو فور إرسال رسالة الواتساب:
              </p>

              <div className="grid gap-2 sm:grid-cols-2 pt-2 text-xs">
                <div className="bg-background/80 p-3 rounded-xl border border-border">
                  <span className="text-muted-foreground block text-[11px]">البنك:</span>
                  <span className="font-semibold text-foreground">
                    {settings?.bank_name || "بنك مسقط (Bank Muscat)"}
                  </span>
                </div>

                <div className="bg-background/80 p-3 rounded-xl border border-border">
                  <span className="text-muted-foreground block text-[11px]">
                    {t("account_number")}:
                  </span>
                  <span dir="ltr" className="font-mono font-bold text-primary">
                    {settings?.bank_account_number || "0369063092490012"}
                  </span>
                </div>

                <div className="bg-background/80 p-3 rounded-xl border border-border">
                  <span className="text-muted-foreground block text-[11px]">
                    {t("recipient_name")}:
                  </span>
                  <span className="font-semibold text-foreground">
                    {settings?.bank_recipient_name || "ABDULMALIK"}
                  </span>
                </div>
                <div className="bg-background/80 p-3 rounded-xl border border-border">
                  <span className="text-muted-foreground block text-[11px]">
                    {t("phone_transfer")}:
                  </span>
                  <span dir="ltr" className="font-mono font-bold text-emerald-600">
                    {settings?.bank_phone_transfer || "77036097"}
                  </span>
                </div>
              </div>

              {/* تنبيه: إرسال الصورة مباشرة في واتساب */}
              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                <span className="text-base leading-none mt-0.5">📱</span>
                <p className="leading-relaxed">
                  <span className="font-bold block mb-0.5">تنبيه مهم:</span>
                  بعد إرسال رسالة الطلب عبر واتساب، يرجى إرسال{" "}
                  <span className="font-bold">صورة إشعار التحويل</span> مباشرةً كصورة في المحادثة
                  لضمان سرعة التأكيد.
                </p>
              </div>
            </div>

            {/* Transfer Reference & Receipt Upload */}
            <div className="rounded-2xl border border-border/80 bg-background/60 p-5 space-y-4">
              <div className="flex items-center gap-2 text-foreground font-bold text-xs sm:text-sm">
                <Receipt className="size-4 text-primary" />
                <span>إثبات التحويل البنكي (رقم الحوالة أو صورة الإشعار)</span>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  رقم الحوالة البنكية / الرقم المرجعي للعملية (اختياري)
                </label>
                <input
                  className={field}
                  dir="ltr"
                  placeholder={t("checkout_transfer_placeholder")}
                  value={transferReference}
                  onChange={(e) => setTransferReference(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  صورة إشعار التحويل البنكي (لقطة شاشة)
                </label>

                {receiptImageUrl ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                    <img
                      src={receiptImageUrl}
                      alt={t("checkout_receipt_alt")}
                      className="size-16 rounded-lg object-cover border border-border"
                    />
                    <div className="flex-1 text-xs space-y-1">
                      <span className="font-semibold text-foreground block">
                        تم إرفاق إشعار التحويل بنجاح
                      </span>
                      <a
                        href={receiptImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary text-[11px] hover:underline"
                      >
                        معاينة الصورة
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReceiptImageUrl("")}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      title={t("checkout_receipt_delete")}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-2 rounded-xl border border-dashed border-primary/50 bg-primary/5 px-5 py-3 text-xs font-semibold text-primary hover:bg-primary/10 cursor-pointer transition-all">
                    {uploadingReceipt ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Upload className="size-4" />
                    )}
                    <span>
                      {uploadingReceipt
                        ? t("checkout_receipt_uploading")
                        : t("checkout_receipt_choose")}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleReceiptUpload(file);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Items Summary */}
            <div className="space-y-3 pt-2">
              <h3 className="font-display text-sm font-semibold text-foreground">
                {t("items")} ({lines.length})
              </h3>
              <div className="divide-y divide-border/60 rounded-2xl border border-border/70 bg-background/50 p-4 space-y-2">
                {lines.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between pt-2 first:pt-0 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={l.image ?? "/hashem-logo.png"}
                        alt={pick(l.name_ar, l.name_en)}
                        className="size-10 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium text-foreground">{pick(l.name_ar, l.name_en)}</p>
                        <p className="text-muted-foreground">
                          {t("quantity")}: {l.qty}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-primary">{money(l.qty * l.price)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total and Delivery Note */}
            <div className="rounded-2xl border border-border/80 bg-background/60 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("subtotal")}:</span>
                <span className="font-bold text-primary text-base">{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{t("delivery_method")}:</span>
                <span>
                  {deliveryMethod === "pickup" ? t("checkout_pickup") : t("checkout_delivery_cost")}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{t("customer")}:</span>
                <span>
                  {name} ({phone})
                </span>
              </div>
              {deliveryMethod === "delivery" && address ? (
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>العنوان:</span>
                  <span className="max-w-[200px] truncate">{address}</span>
                </div>
              ) : null}
              {transferReference ? (
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>رقم الحوالة:</span>
                  <span className="font-mono text-foreground font-semibold">
                    {transferReference}
                  </span>
                </div>
              ) : null}
              {notes ? (
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>ملاحظات:</span>
                  <span className="max-w-[200px] truncate">{notes}</span>
                </div>
              ) : null}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={busy}
                className="rounded-xl border border-border px-6 py-2.5 text-xs font-medium text-foreground hover:bg-accent cursor-pointer"
              >
                ⬅ {t("back")}
              </button>
              <button
                type="button"
                onClick={submitOrder}
                disabled={busy || uploadingReceipt}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-3 text-xs font-bold text-white shadow-lg disabled:opacity-50 transition-all cursor-pointer"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <MessageCircle className="size-4" />
                )}
                <span>{t("confirm_and_whatsapp")}</span>
              </button>
            </div>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
