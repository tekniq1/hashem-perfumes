/** WhatsApp number (international format, digits only) that receives new orders. */
export const ADMIN_WHATSAPP = "96877380145";
export const OFFICIAL_EMAIL = "abdualhidry@gmail.com";
export const INSTAGRAM_HANDLE = "hashem_lelteeb";

export const BANK_DETAILS = {
  bankName: "بنك مسقط (Bank Muscat)",
  accountNumber: "0369063092490012",
  recipientName: "ABDULMALIK",
  phoneTransfer: "77036097",
};

export const statusKeys = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

export type OrderStatus = (typeof statusKeys)[number];

export function mapsUrl(lat: number, lng: number) {
  return `https://maps.google.com/?q=${lat},${lng}`;
}
