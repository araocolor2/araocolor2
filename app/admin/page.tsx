import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { AuthNavServer } from "../components/auth-nav-server";
import { SiteFooter } from "../components/site-footer";
import { isAdmin, getAdminOrders, getAdminProducts } from "../lib/admin";
import { formatPrice } from "../lib/products";
import { getHeroImageUrl } from "../lib/hero-image";
import { adminConfirmOrderAction, adminToggleProductAction, adminUploadHeroImageAction } from "./actions";

function getStatusLabel(status: string) {
  if (status === "confirmed") return "구매 확정";
  if (status === "bank_transfer_pending") return "입금 대기";
  return status;
}

function getPaymentLabel(method: string) {
  if (method === "kakao_link") return "카카오 링크";
  if (method === "bank_transfer") return "무통장 입금";
  return method;
}

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string; success?: string; error?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "";
  if (!isAdmin(email)) redirect("/");

  const params = await searchParams;
  const tab = params.tab === "products" ? "products" : params.tab === "hero" ? "hero" : "orders";

  const [{ orders }, { products }, heroImageUrl] = await Promise.all([
    getAdminOrders(),
    getAdminProducts(),
    getHeroImageUrl(),
  ]);

  const pendingOrders = orders.filter((o) => o.status === "bank_transfer_pending");

  return (
    <main>
      <header className="site-header">
        <Link href="/" className="brand">제주컬러</Link>
        <AuthNavServer />
      </header>

      <section className="section narrow">
        <p className="eyebrow">ADMIN</p>
        <h1>관리자</h1>

        <nav className="category-tabs">
          <Link href="/admin?tab=orders" className={`category-tab${tab === "orders" ? " active" : ""}`}>
            주문 관리
            {pendingOrders.length > 0 ? (
              <span className="bell-badge" style={{ position: "static", marginLeft: "6px" }}>
                {pendingOrders.length}
              </span>
            ) : null}
          </Link>
          <Link href="/admin?tab=products" className={`category-tab${tab === "products" ? " active" : ""}`}>
            상품 관리
          </Link>
          <Link href="/admin?tab=hero" className={`category-tab${tab === "hero" ? " active" : ""}`}>
            히어로 이미지
          </Link>
        </nav>

        {tab === "hero" ? (
          <div className="admin-section">
            <h2 style={{ fontSize: "20px", margin: "24px 0 4px" }}>히어로 이미지 관리</h2>
            <p style={{ color: "var(--color-weak)", fontSize: "14px", marginBottom: "24px" }}>
              첫 화면 히어로 섹션 배경 이미지를 교체합니다. 1024px 너비 기준으로 표시됩니다.
            </p>

            {params.success === "1" ? (
              <p className="notice">이미지가 성공적으로 업로드되었습니다.</p>
            ) : null}
            {params.error === "no_file" ? (
              <p className="notice notice-error">파일을 선택해주세요.</p>
            ) : null}
            {params.error === "invalid_type" ? (
              <p className="notice notice-error">이미지 파일만 업로드 가능합니다.</p>
            ) : null}
            {params.error === "upload_failed" ? (
              <p className="notice notice-error">업로드에 실패했습니다. Supabase Storage 버킷 설정을 확인하세요.</p>
            ) : null}

            {/* 현재 이미지 미리보기 */}
            <div className="hero-preview-box">
              <p className="hero-preview-label">현재 히어로 이미지</p>
              {heroImageUrl ? (
                <div className="hero-preview-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${heroImageUrl}?t=${Date.now()}`}
                    alt="현재 히어로 이미지"
                    className="hero-preview-img"
                  />
                  <p className="hero-preview-size">1024px 너비 기준 표시</p>
                </div>
              ) : (
                <div className="hero-preview-empty">
                  <p>등록된 이미지가 없습니다.</p>
                </div>
              )}
            </div>

            {/* 업로드 폼 */}
            <form action={adminUploadHeroImageAction} encType="multipart/form-data" className="hero-upload-form">
              <div className="form-field">
                <label htmlFor="heroImage">새 이미지 선택</label>
                <input
                  id="heroImage"
                  name="heroImage"
                  type="file"
                  accept="image/*"
                  required
                  className="hero-file-input"
                />
                <p style={{ color: "var(--color-weak)", fontSize: "12px" }}>
                  JPG, PNG, WebP 권장 · 최적 해상도 1440×900px 이상
                </p>
              </div>
              <button className="button button-primary" style={{ width: "fit-content" }}>
                이미지 업로드
              </button>
            </form>
          </div>
        ) : tab === "orders" ? (
          <div className="admin-section">
            <h2 style={{ fontSize: "20px", margin: "24px 0 16px" }}>주문 내역 ({orders.length}건)</h2>
            {orders.length === 0 ? (
              <p>주문이 없습니다.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>이메일</th>
                      <th>상품</th>
                      <th>금액</th>
                      <th>결제</th>
                      <th>상태</th>
                      <th>주문일</th>
                      <th>처리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={String(order.id)} className={order.status === "bank_transfer_pending" ? "row-pending" : ""}>
                        <td>{String(order.user_email)}</td>
                        <td>{String(order.product_name)}</td>
                        <td>{formatPrice(Number(order.amount))}</td>
                        <td>{getPaymentLabel(String(order.payment_method))}</td>
                        <td>{getStatusLabel(String(order.status))}</td>
                        <td>{new Date(String(order.created_at)).toLocaleDateString("ko-KR")}</td>
                        <td>
                          {order.status === "bank_transfer_pending" ? (
                            <form action={adminConfirmOrderAction}>
                              <input type="hidden" name="orderId" value={String(order.id)} />
                              <button className="button button-primary" style={{ fontSize: "13px", minHeight: "32px", padding: "4px 12px" }}>
                                입금 확인
                              </button>
                            </form>
                          ) : (
                            <span style={{ color: "var(--color-weak)", fontSize: "13px" }}>완료</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="admin-section">
            <h2 style={{ fontSize: "20px", margin: "24px 0 16px" }}>상품 목록 ({products.length}개)</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>라벨</th>
                    <th>상품명</th>
                    <th>가격</th>
                    <th>상태</th>
                    <th>처리</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={String(p.slug)}>
                      <td>{String(p.label)}</td>
                      <td>{String(p.name)}</td>
                      <td>{formatPrice(Number(p.price_amount))}</td>
                      <td>{p.active ? "판매 중" : "판매 중지"}</td>
                      <td>
                        <form action={adminToggleProductAction}>
                          <input type="hidden" name="slug" value={String(p.slug)} />
                          <input type="hidden" name="active" value={p.active ? "false" : "true"} />
                          <button className="button button-secondary" style={{ fontSize: "13px", minHeight: "32px", padding: "4px 12px" }}>
                            {p.active ? "중지" : "재개"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
