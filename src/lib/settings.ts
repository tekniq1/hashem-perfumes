import { supabase } from "@/integrations/supabase/client";
import { ADMIN_WHATSAPP, BANK_DETAILS, INSTAGRAM_HANDLE, OFFICIAL_EMAIL } from "./config";

export type StoreSettings = {
  id: string;
  logo_url: string;
  hero_image_url: string;
  announcement_bar_text: string;
  announcement_text_ar?: string | undefined;
  announcement_text_en?: string | undefined;
  announcement_bar_active: boolean;
  announcement_enabled?: boolean | undefined;
  whatsapp_number: string;
  instagram_handle: string;
  email: string;
  bank_name: string;
  bank_account_number: string;
  bank_recipient_name: string;
  bank_phone_transfer: string;
  about_title_ar: string;
  about_title_en: string;
  about_description_ar: string;
  about_description_en: string;
  updated_at?: string | undefined;
};

const STORAGE_KEY = "hashem_store_settings_cache";

export const defaultSettings: StoreSettings = {
  id: "default",
  logo_url: "/hashem-logo.png",
  hero_image_url: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200&q=80",
  announcement_bar_text: "شحن لجميع المناطق • بخور وعطور ملكية فاخرة • منتجات أصيلة ١٠٠٪",
  announcement_text_ar: "شحن لجميع المناطق • بخور وعطور ملكية فاخرة • منتجات أصيلة ١٠٠٪",
  announcement_text_en:
    "Shipping to all areas • Royal incense & fine perfume • 100% genuine products",
  announcement_bar_active: true,
  announcement_enabled: true,
  whatsapp_number: ADMIN_WHATSAPP,
  instagram_handle: INSTAGRAM_HANDLE,
  email: OFFICIAL_EMAIL,
  bank_name: BANK_DETAILS.bankName,
  bank_account_number: BANK_DETAILS.accountNumber,
  bank_recipient_name: BANK_DETAILS.recipientName,
  bank_phone_transfer: BANK_DETAILS.phoneTransfer,
  about_title_ar: "هاشم للطيب — فخامة العبير الملكي",
  about_title_en: "Hashem Lelteeb — Royal Fragrance Luxury",
  about_description_ar:
    "متجر هاشم للطيب، وجهتك الأولى للعطور المركزة الفاخرة والبخور الملكي واللبان الحوجري الأصيل. ننتقي أفضل المكونات الطبيعية والزيوت العطرية لنمنحك تجربة استثنائية تعكس أصالة وفخامة التراث العماني والخليجي.",
  about_description_en:
    "Hashem Lelteeb boutique, your premier destination for concentrated fine perfumes, royal incense, and authentic Hojari luban.",
};

function getLocalSettings(): Partial<StoreSettings> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveLocalSettings(settings: Partial<StoreSettings>) {
  if (typeof window === "undefined") return;
  try {
    const current = getLocalSettings();
    const merged = { ...current, ...settings, updated_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.warn("saveLocalSettings error:", e);
  }
}

export async function fetchStoreSettings(): Promise<StoreSettings> {
  const local = getLocalSettings();
  try {
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) {
      return { ...defaultSettings, ...local };
    }
    const dbSettings = data as unknown as StoreSettings;
    const combined = { ...defaultSettings, ...local, ...dbSettings };
    saveLocalSettings(combined);
    return combined;
  } catch (e) {
    console.warn("fetchStoreSettings fallback to cache:", e);
    return { ...defaultSettings, ...local };
  }
}

export async function updateStoreSettings(settings: Partial<StoreSettings>): Promise<void> {
  // 1. Save to local storage cache immediately so UI and changes are never lost
  saveLocalSettings(settings);

  // 2. Sync to Supabase
  try {
    const payload = {
      id: "default",
      ...settings,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("store_settings").upsert(payload);

    if (error) {
      console.warn("Supabase store_settings upsert error (local cache preserved):", error.message);
      // If error is related to table not found or column missing, we still don't fail user experience
      // but let caller know if needed
    }
  } catch (e) {
    console.warn("updateStoreSettings database sync error:", e);
  }
}
