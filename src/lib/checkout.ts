import { supabase } from "@/integrations/supabase/client";
import type { CartLine } from "@/lib/cart";
import { ADMIN_WHATSAPP, mapsUrl } from "@/lib/config";

export type CheckoutInput = {
  userId: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | undefined;
  delivery_method: "delivery" | "pickup";
  delivery_address: string;
  customer_notes?: string | undefined;
  transfer_reference?: string | undefined;
  receipt_image_url?: string | undefined;
  lat: number | null;
  lng: number | null;
  payment_method: string;
  lines: CartLine[];
};

export async function placeOrder(input: CheckoutInput) {
  const total_amount = input.lines.reduce((s, l) => s + l.qty * l.price, 0);
  const total_cost = input.lines.reduce((s, l) => s + l.qty * l.cost_price, 0);
  const map_url = input.lat != null && input.lng != null ? mapsUrl(input.lat, input.lng) : null;
  const order_number = Math.floor(10000 + Math.random() * 90000).toString();

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: input.userId,
      customer_name: input.customer_name,
      customer_phone: input.customer_phone,
      customer_email: input.customer_email || null,
      customer_notes: input.customer_notes || null,
      transfer_reference: input.transfer_reference || null,
      receipt_image_url: input.receipt_image_url || null,
      delivery_method: input.delivery_method,
      delivery_address: input.delivery_address,
      location_lat: input.lat,
      location_lng: input.lng,
      map_url,
      total_amount,
      total_cost,
      total_profit: total_amount - total_cost,
      payment_method: input.payment_method,
      order_number,
    })
    .select("id, created_at, order_number")
    .single();
  if (error) throw error;

  const { error: itemsError } = await supabase.from("order_items").insert(
    input.lines.map((l) => ({
      order_id: order.id,
      product_id: l.id,
      quantity: l.qty,
      unit_price: l.price,
      unit_cost: l.cost_price,
    })),
  );
  if (itemsError) console.warn("order_items insert note:", itemsError.message);

  await Promise.all(
    input.lines.map((l) => supabase.rpc("decrement_stock", { _product_id: l.id, _qty: l.qty })),
  );

  await supabase.from("notifications").insert({
    title: "طلب جديد — New order",
    message: `${input.customer_name} قام بطلب جديد بقيمة ${total_amount.toFixed(3)} ر.ع (${input.lines.length} منتجات)${input.transfer_reference ? ` • رقم الحوالة: ${input.transfer_reference}` : ""}.`,
    type: "new_order",
  });

  return {
    orderId: order.id as string,
    orderNumber: (order.order_number || order_number) as string,
    total_amount,
    map_url,
  };
}

export function whatsappUrl(args: {
  orderId: string;
  orderNumber?: string | undefined;
  name: string;
  phone: string;
  email?: string | undefined;
  deliveryMethod: "delivery" | "pickup";
  address: string;
  notes?: string | undefined;
  transferReference?: string | undefined;
  receiptImageUrl?: string | undefined;
  mapUrl: string | null;
  lines: CartLine[];
  total: number;
  paymentMethodText?: string | undefined;
  whatsappNumber?: string | undefined;
  siteUrl?: string | undefined;
}) {
  const dateStr = new Date().toLocaleDateString("ar-OM", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const domain =
    args.siteUrl ||
    (typeof window !== "undefined" ? window.location.origin : "https://hashem-lelteeb.com");
  const trackingUrl = `${domain}/orders`;

  const itemLines = args.lines.map((l) => `${l.name_ar || l.name_en} x ${l.qty}`).join("\n");

  const shippingText =
    args.deliveryMethod === "pickup"
      ? "استلام من الفرع (Pick up)"
      : "توصيل (تُحسب التكلفة حسب المنطقة)";

  const paymentText = args.paymentMethodText || "التحويل البنكي (الدفع قبل الاستلام)";
  const orderNum = args.orderNumber || args.orderId.slice(0, 5).toUpperCase();

  const textParts = [
    `طلب من متجر هاشم للطيب\n${domain}`,
    "",
    `رقم الطلب: ${orderNum}`,
    `تاريخ: ${dateStr}`,
    "",
    `Name: ${args.name}`,
    args.email ? `Email: ${args.email}` : "",
    `Phone: ${args.phone}`,
    "",
    "منتجات:",
    itemLines,
    "",
    `الشحن: ${shippingText}`,
    args.deliveryMethod === "delivery" ? `العنوان: ${args.address}` : "",
    args.mapUrl ? `موقع الخريطة: ${args.mapUrl}` : "",
    "",
    `Payment Method: ${paymentText}`,
    `المجموع: OMR ${args.total.toFixed(3)}`,
    args.transferReference ? `رقم الحوالة: ${args.transferReference}` : "",
    // ✅ لا نرسل رابط Supabase — نطلب من العميل إرسال الصورة بشكل منفصل
    args.receiptImageUrl
      ? `📎 تم حفظ صورة إشعار التحويل — يرجى إرسال صورة الإشعار في رسالة واتساب منفصلة بعد إرسال هذه الرسالة.`
      : "",
    args.notes ? `\nملاحظات: ${args.notes}` : "",
    "",
    "تتبع طلبك:",
    trackingUrl,
  ];

  const fullText = textParts.filter((p) => p !== "").join("\n");
  const phone = (args.whatsappNumber || ADMIN_WHATSAPP).replace(/\D/g, "");

  return `https://wa.me/${phone}?text=${encodeURIComponent(fullText)}`;
}
