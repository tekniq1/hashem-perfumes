import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  price: number;
  cost_price: number;
  discount_price: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  category_id: string | null;
  images: string[];
  is_featured: boolean;
  created_at: string;
};

export type Category = {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  image_url: string | null;
  created_at?: string;
};

export const effectivePrice = (p: Pick<Product, "price" | "discount_price">) =>
  p.discount_price && p.discount_price > 0 ? Number(p.discount_price) : Number(p.price);

export async function fetchProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      console.warn("fetchProducts query returned error:", error.message);
      return [];
    }
    return (data ?? []) as Product[];
  } catch (err) {
    console.warn("fetchProducts exception:", err);
    return [];
  }
}

export async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    if (error) {
      console.warn("fetchProduct error:", error.message);
      return null;
    }
    return (data as Product) ?? null;
  } catch (err) {
    console.warn("fetchProduct exception:", err);
    return null;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase.from("categories").select("*").order("name_en").limit(20);
    if (error) {
      console.warn("fetchCategories error:", error.message);
      return [];
    }
    return (data ?? []) as Category[];
  } catch (err) {
    console.warn("fetchCategories exception:", err);
    return [];
  }
}

export async function createCategory(input: {
  name_ar: string;
  name_en: string;
  slug: string;
  image_url?: string | null;
}): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name_ar: input.name_ar,
      name_en: input.name_en,
      slug: input.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      image_url: input.image_url ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(
  id: string,
  input: Partial<Omit<Category, "id">>,
): Promise<void> {
  const updateData: {
    name_ar?: string;
    name_en?: string;
    slug?: string;
    image_url?: string | null;
  } = { ...input };
  if (input.slug) {
    updateData.slug = input.slug.trim().toLowerCase().replace(/\s+/g, "-");
  }
  const { error } = await supabase.from("categories").update(updateData).eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
