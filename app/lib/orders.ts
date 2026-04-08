import type { Product } from "./products";
import { getSupabaseAdmin, withDataTimeout } from "./supabase";

export type PaymentMethod = "kakao_link" | "bank_transfer";
export type OrderStatus = "confirmed" | "bank_transfer_pending";

export type Order = {
  id: string;
  productSlug: string;
  productName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  downloadUrl: string | null;
  createdAt: string;
  confirmedAt: string | null;
};

export type CreateOrderInput = {
  userId: string;
  userEmail: string;
  product: Product;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
};

function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    productSlug: String(row.product_slug),
    productName: String(row.product_name),
    amount: Number(row.amount ?? 0),
    paymentMethod: String(row.payment_method) as PaymentMethod,
    status: String(row.status) as OrderStatus,
    downloadUrl: typeof row.download_url === "string" ? row.download_url : null,
    createdAt: String(row.created_at),
    confirmedAt: row.confirmed_at ? String(row.confirmed_at) : null
  };
}

export async function createOrder(input: CreateOrderInput) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return { ok: false, message: "Supabase 설정이 없습니다.", order: null };
  }

  const now = new Date().toISOString();
  const { data, error } = await withDataTimeout(
    supabase
      .from("orders")
      .insert({
        user_id: input.userId,
        user_email: input.userEmail,
        product_slug: input.product.slug,
        product_name: input.product.name,
        amount: input.product.priceAmount,
        payment_method: input.paymentMethod,
        status: input.status,
        download_url: input.product.downloadUrl ?? null,
        confirmed_at: input.status === "confirmed" ? now : null
      })
      .select(
        "id,product_slug,product_name,amount,payment_method,status,download_url,created_at,confirmed_at"
      )
      .single(),
    { data: null, error: { message: "Supabase 주문 저장 시간 초과" } },
    5000
  );

  if (error || !data) {
    return { ok: false, message: error?.message ?? "주문 저장 실패", order: null };
  }

  return { ok: true, message: "주문 저장 완료", order: mapOrder(data) };
}

export async function getOrdersForUser(userId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return { ok: false, message: "Supabase 설정이 없습니다.", orders: [] as Order[] };
  }

  const { data, error } = await withDataTimeout(
    supabase
      .from("orders")
      .select(
        "id,product_slug,product_name,amount,payment_method,status,download_url,created_at,confirmed_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    { data: null, error: { message: "Supabase 구매 내역 조회 시간 초과" } }
  );

  if (error) {
    return { ok: false, message: error.message, orders: [] as Order[] };
  }

  return { ok: true, message: "구매 내역 조회 완료", orders: (data ?? []).map(mapOrder) };
}

export async function hasPurchased(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { data } = await withDataTimeout(
    supabase
      .from("orders")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "confirmed")
      .limit(1)
      .maybeSingle(),
    { data: null, error: null }
  );

  return !!data;
}

export async function confirmBankTransferOrder(input: {
  orderId: string;
  userId: string;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return { ok: false, message: "Supabase 설정이 없습니다.", order: null };
  }

  const now = new Date().toISOString();
  const { data, error } = await withDataTimeout(
    supabase
      .from("orders")
      .update({
        status: "confirmed",
        confirmed_at: now,
        updated_at: now
      })
      .eq("id", input.orderId)
      .eq("user_id", input.userId)
      .eq("status", "bank_transfer_pending")
      .select(
        "id,product_slug,product_name,amount,payment_method,status,download_url,created_at,confirmed_at"
      )
      .maybeSingle(),
    { data: null, error: { message: "Supabase 주문 확정 시간 초과" } },
    5000
  );

  if (error || !data) {
    return {
      ok: false,
      message: error?.message ?? "입금 확인 대기 주문이 없습니다.",
      order: null
    };
  }

  return { ok: true, message: "주문 확정 완료", order: mapOrder(data) };
}
