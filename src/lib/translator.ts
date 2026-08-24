/**
 * Auto-translation utility for Arabic <-> English using Google Translate API
 */

export async function translateText(text: string, targetLang: "ar" | "en"): Promise<string> {
  if (!text || !text.trim()) return "";

  try {
    const sourceLang = targetLang === "en" ? "ar" : "en";
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text.trim())}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Translation request failed");

    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0].map((item: any) => item[0]).join("");
      return translated || text;
    }
    return text;
  } catch (error) {
    console.warn("Auto-translate fallback:", error);
    return text;
  }
}
