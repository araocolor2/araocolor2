import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { SiteFooter } from "../components/site-footer";
import { getOrdersForUser } from "../lib/orders";
import { formatPrice } from "../lib/products";
import { getProfile, upsertProfile } from "../lib/profiles";
import { confirmPendingOrder, saveUsername } from "./actions";

function getOrderStatusLabel(status: string) {
  if (status === "confirmed") {
    return "구매 확정";
  }

  if (status === "bank_transfer_pending") {
    return "입금 확인 대기";
  }

  return "확인 필요";
}

function getPaymentMethodLabel(method: string) {
  if (method === "kakao_link") {
    return "카카오 링크 결제";
  }

  if (method === "bank_transfer") {
    return "카카오뱅크 무통장 입금";
  }

  return "기타";
}

export default async function MyPage({
  searchParams
}: {
  searchParams: Promise<{ order?: string; profile?: string }>;
}) {
  const isDev = process.env.NODE_ENV !== "production";
  const params = await searchParams;
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? "";

  if (user && email) {
    await upsertProfile({
      id: user.id,
      email,
      fullName: user.fullName,
      imageUrl: user.imageUrl
    });
  }

  const [profile, orderResult] = user
    ? await Promise.all([getProfile(user.id), getOrdersForUser(user.id)])
    : [null, { ok: false, message: "로그인이 필요합니다.", orders: [] }];

  return (
    <main>
      <header className="site-header">
        <Link href="/" className="brand">
          제주컬러
        </Link>
        <UserButton />
      </header>

      <section className="section narrow">
        <p className="eyebrow">MY PAGE</p>
        <h1>마이페이지</h1>
        {params.order === "confirmed" ? (
          <p className="notice">구매가 확정되었습니다. 구매 내역을 확인하세요.</p>
        ) : null}
        {params.order === "bank_transfer_pending" ? (
          <p className="notice">입금 대기 주문이 저장되었습니다. 입금 확인 후 구매가 확정됩니다.</p>
        ) : null}
        {params.order === "invalid" ? (
          <p className="notice notice-error">주문 정보가 올바르지 않습니다.</p>
        ) : null}
        {params.order === "error" ? (
          <p className="notice notice-error">주문 확정 처리에 실패했습니다. 잠시 후 다시 시도하세요.</p>
        ) : null}
        {params.profile === "saved" ? <p className="notice">아이디가 저장되었습니다.</p> : null}
        {params.profile === "error" ? (
          <p className="notice notice-error">아이디 저장에 실패했습니다. 중복 여부를 확인하세요.</p>
        ) : null}
        {isDev ? (
          <p className="notice">개발 환경에서는 입금 대기 주문을 직접 확정할 수 있습니다.</p>
        ) : null}
        <div className="product-card">
          <h2>{user?.fullName ?? "회원"}님</h2>
          <p>{email || "이메일 확인 중"}</p>
          <form action={saveUsername} className="profile-form">
            <label htmlFor="username">아이디</label>
            <input
              id="username"
              name="username"
              defaultValue={profile?.username ?? ""}
              placeholder="예: jejucolor"
            />
            <button className="button button-secondary">아이디 저장</button>
          </form>
        </div>
        <div className="product-card">
          <h2>구매 내역</h2>
          {!orderResult.ok ? (
            <p>구매 내역을 불러오지 못했습니다. Supabase 테이블 준비가 필요합니다.</p>
          ) : null}
          {orderResult.orders.length ? (
            <div className="order-accordion">
              {orderResult.orders.map((order) => (
                <details className="order-accordion-item" key={order.id}>
                  <summary className="order-accordion-summary">
                    <span className="order-accordion-name">{order.productName}</span>
                    <span className={`order-status-badge order-status-${order.status}`}>
                      {getOrderStatusLabel(order.status)}
                    </span>
                    <span className="order-accordion-chevron" aria-hidden="true">›</span>
                  </summary>
                  <div className="order-accordion-body">
                    <div className="order-detail-row">
                      <span className="order-detail-label">결제 수단</span>
                      <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
                    </div>
                    <div className="order-detail-row">
                      <span className="order-detail-label">구매일</span>
                      <span>{new Date(order.createdAt).toLocaleDateString("ko-KR")}</span>
                    </div>
                    <div className="order-detail-row">
                      <span className="order-detail-label">금액</span>
                      <strong>{formatPrice(order.amount)}</strong>
                    </div>
                    {order.status === "confirmed" && order.downloadUrl ? (
                      <Link href={order.downloadUrl} className="button button-primary order-download-btn">
                        다운로드
                      </Link>
                    ) : null}
                    {order.status === "confirmed" && !order.downloadUrl ? (
                      <p className="order-detail-note">다운로드 링크 준비 중입니다.</p>
                    ) : null}
                    {isDev && order.status === "bank_transfer_pending" ? (
                      <form action={confirmPendingOrder} style={{ marginTop: "12px" }}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <button className="button button-secondary">개발용 입금 확인 완료</button>
                      </form>
                    ) : null}
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">🛍️</div>
              <p>아직 구매 내역이 없습니다.</p>
              <Link href="/#products" className="button button-primary" style={{ marginTop: "16px" }}>
                상품 보러가기
              </Link>
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
