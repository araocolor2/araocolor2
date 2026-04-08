import {
  fallbackProducts,
  getFallbackProduct,
  normalizeProduct,
  type Product
} from "./products";
import { getSupabaseAdmin, withDataTimeout } from "./supabase";

export async function getProducts(): Promise<Product[]> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return fallbackProducts;
  }

  const { data, error } = await withDataTimeout(
    supabase
      .from("products")
      .select("slug,name,description,price_amount,label,details,download_url")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    { data: null, error: { message: "Supabase 조회 시간 초과" } }
  );

  if (error || !data?.length) {
    return fallbackProducts;
  }

  return data.map((row) => normalizeProduct(row));
}

export async function getProduct(slug: string): Promise<Product | null> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return getFallbackProduct(slug);
  }

  const { data, error } = await withDataTimeout(
    supabase
      .from("products")
      .select("slug,name,description,price_amount,label,details,download_url")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle(),
    { data: null, error: { message: "Supabase 조회 시간 초과" } }
  );

  if (error || !data) {
    return getFallbackProduct(slug);
  }

  return normalizeProduct(data);
}
