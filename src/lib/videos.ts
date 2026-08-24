import { supabase } from "@/integrations/supabase/client";

export const PROMO_BUCKET = "promo-videos";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export type PromoVideo = {
  id: string;
  title_ar: string;
  title_en: string;
  video_url: string;
  thumbnail_url: string | null;
  target_product_id: string | null;
  cta_link: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

export async function fetchPromoVideos(activeOnly = true): Promise<PromoVideo[]> {
  try {
    let query = supabase
      .from("promotional_videos")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (activeOnly) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (error) {
      console.warn("fetchPromoVideos error:", error.message);
      return [];
    }
    return (data ?? []) as PromoVideo[];
  } catch (err) {
    console.warn("fetchPromoVideos exception:", err);
    return [];
  }
}

/** Storage path is recoverable from the signed URL so admins can delete the file. */
export function storagePathFromUrl(url: string): string | null {
  const match = url.match(new RegExp(`/${PROMO_BUCKET}/(.+?)(\\?|$)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

export async function uploadPromoVideo(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const path = `${crypto.randomUUID()}.${ext}`;
  onProgress?.(5);
  const { error } = await supabase.storage.from(PROMO_BUCKET).upload(path, file, {
    contentType: file.type || (ext === "webm" ? "video/webm" : "video/mp4"),
    upsert: false,
  });
  if (error) throw error;
  onProgress?.(85);
  const { data, error: signError } = await supabase.storage
    .from(PROMO_BUCKET)
    .createSignedUrl(path, TEN_YEARS);
  if (signError || !data?.signedUrl) throw signError ?? new Error("Could not sign video URL");
  onProgress?.(100);
  return data.signedUrl;
}

export async function createPromoVideo(input: {
  title_ar: string;
  title_en: string;
  video_url: string;
  thumbnail_url?: string | null;
  target_product_id?: string | null;
  cta_link?: string | null;
  display_order?: number;
}) {
  const { error } = await supabase.from("promotional_videos").insert({
    title_ar: input.title_ar,
    title_en: input.title_en,
    video_url: input.video_url,
    thumbnail_url: input.thumbnail_url ?? null,
    target_product_id: input.target_product_id ?? null,
    cta_link: input.cta_link ?? null,
    display_order: input.display_order ?? 0,
  });
  if (error) throw error;
}

export async function togglePromoVideo(id: string, is_active: boolean) {
  const { error } = await supabase.from("promotional_videos").update({ is_active }).eq("id", id);
  if (error) throw error;
}

export async function deletePromoVideo(video: PromoVideo) {
  const path = storagePathFromUrl(video.video_url);
  if (path) await supabase.storage.from(PROMO_BUCKET).remove([path]);
  const { error } = await supabase.from("promotional_videos").delete().eq("id", video.id);
  if (error) throw error;
}
