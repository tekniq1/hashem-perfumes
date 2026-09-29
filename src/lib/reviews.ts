import { supabase } from "@/integrations/supabase/client";

export type Review = {
  id: string;
  product_id: string | null;
  customer_name: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
};

// Fetch all reviews (For Admin)
export async function fetchAllReviews() {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, products(name_ar, name_en)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// Fetch approved reviews (For Frontend Homepage/Product)
export async function fetchApprovedReviews(productId?: string) {
  let query = supabase
    .from("reviews")
    .select("*")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Add a new review
export async function addReview(review: Omit<Review, "id" | "created_at" | "is_approved">) {
  const { data, error } = await supabase.from("reviews").insert([review]).select().single();
  if (error) throw error;
  return data;
}

// Approve a review (Admin)
export async function approveReview(id: string, is_approved: boolean) {
  const { data, error } = await supabase
    .from("reviews")
    .update({ is_approved })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete a review (Admin)
export async function deleteReview(id: string) {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
  return true;
}
