import Link from "next/link";
import { SiteFooter } from "../components/site-footer";
import { createCheckoutOrder } from "./actions";
import { getProduct } from "../lib/catalog";

export default async function CheckoutPage({
  searchParams
}: {
  searchParams: Promise<{ product?: string; error?: string }>;
}) {
  const params = await searchParams;
  const product = await getProduct(params.product ?? "basic-pack");
  const kakaoPaymentLink = process.env.NEXT_PUBLIC_KAKAO_PAYMENT_LINK;
  const merchantName = process.env.KAKAO_PAYMENT_MERCHANT_NAME ?? "제주컬러";
  const bankName = process.env.BANK_TRANSFER_BANK_NAME ?? "카카오뱅크";
  const bankAccount = process.env.BANK_TRANSFER_ACCOUNT_NUMBER;
  const bankHolder = process.env.BANK_TRANSFER_ACCOUNT_HOLDER;
  const deadlineHours = process.env.BANK_TRANSFER_DEADLINE_HOURS ?? "24";

  return (
    <main>
      <header className="site-header">
        <Link href="/" className="brand">
          제주컬러
        </Link>
      </header>

      <section className="section narrow">
        <p className="eyebrow">PAYMENT</p>
        <h1>결제 방식 선택</h1>
        {params.error ? (
          <p className="notice notice-error">
            주문 저장에 실패했습니다. Supabase 테이블이 준비됐는지 확인이 필요합니다.
          </p>
        ) : null}
        <p className="notice">주문 생성은 로그인 후 진행됩니다.</p>
        {product ? (
          <article className="product-card checkout-summary">
            <p className="eyebrow">{product.label}</p>
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <strong>{product.priceLabel}</strong>
          </article>
        ) : (
          <article className="product-card checkout-summary">
            <h2>상품을 찾을 수 없습니다</h2>
            <p>홈 화면에서 다시 상품을 선택하세요.</p>
          </article>
        )}
        <div className="payment-list">
          <article className="product-card">
            <h2>카카오 링크 결제</h2>
            <p>
              {kakaoPaymentLink
                ? `${merchantName} 카카오 결제 링크로 이동합니다.`
                : "카카오 결제 링크 발급 전까지는 개발용 완료 처리로 주문 흐름을 확인합니다."}
            </p>
            {kakaoPaymentLink ? (
              <Link href={kakaoPaymentLink} className="button button-primary">
                카카오 결제 링크 열기
              </Link>
            ) : null}
            <form action={createCheckoutOrder}>
              <input type="hidden" name="product" value={product?.slug ?? ""} />
              <input type="hidden" name="paymentMethod" value="kakao_link" />
              <button className="button button-secondary" disabled={!product}>
                개발용 결제 완료 처리
              </button>
            </form>
          </article>
          <article className="product-card">
            <h2>카카오뱅크 무통장 입금</h2>
            <p>입금 확인 후 구매가 확정됩니다. 입금 대기 주문으로 먼저 저장합니다.</p>
            <div className="bank-box">
              <p>은행: {bankName}</p>
              <p>계좌: {bankAccount ?? "계좌번호 입력 전"}</p>
              <p>예금주: {bankHolder ?? "예금주 입력 전"}</p>
              <p>입금 기한: 주문 후 {deadlineHours}시간</p>
            </div>
            <form action={createCheckoutOrder}>
              <input type="hidden" name="product" value={product?.slug ?? ""} />
              <input type="hidden" name="paymentMethod" value="bank_transfer" />
              <button className="button button-secondary" disabled={!product}>
                입금 대기 주문 생성
              </button>
            </form>
          </article>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
