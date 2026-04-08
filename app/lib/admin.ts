import { getSupabaseAdmin, withDataTimeout } from "./supabase";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

export function isAdmin(email: string): boolean {
  return !!ADMIN_EMAIL && email === ADMIN_EMAIL;
}

export async function getAdminOrders() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, orders: [] };

  const { data, error } = await withDataTimeout(
    supabase
      .from("orders")
      .select("id,user_email,product_name,product_slug,amount,payment_method,status,created_at,confirmed_at")
      .order("created_at", { ascending: false })
      .limit(200),
    { data: null, error: { message: "시간 초과" } }
  );

  if (error || !data) return { ok: false, orders: [] };
  return { ok: true, orders: data as Record<string, unknown>[] };
}

export async function adminConfirmOrder(orderId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, message: "Supabase 설정이 없습니다." };

  const now = new Date().toISOString();
  const { error } = await withDataTimeout(
    supabase
      .from("orders")
      .update({ status: "confirmed", confirmed_at: now, updated_at: now })
      .eq("id", orderId)
      .eq("status", "bank_transfer_pending"),
    { data: null, error: { message: "시간 초과" } }
  );

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function getAdminProducts() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, products: [] };

  const { data, error } = await withDataTimeout(
    supabase
      .from("products")
      .select("slug,name,description,price_amount,label,active,sort_order")
      .order("sort_order"),
    { data: null, error: { message: "시간 초과" } }
  );

  if (error || !data) return { ok: false, products: [] };
  return { ok: true, products: data as Record<string, unknown>[] };
}

export async function adminToggleProduct(slug: string, active: boolean) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, message: "Supabase 설정이 없습니다." };

  const { error } = await withDataTimeout(
    supabase.from("products").update({ active, updated_at: new Date().toISOString() }).eq("slug", slug),
    { data: null, error: { message: "시간 초과" } }
  );

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
