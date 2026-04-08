import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthNavServer } from "../../components/auth-nav-server";
import { PurchaseLink } from "../../components/purchase-link";
import { SiteFooter } from "../../components/site-footer";
import { getProduct } from "../../lib/catalog";

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="product-detail-page">
      <header className="site-header">
        <Link href="/" className="brand">
          제주컬러
        </Link>
        <AuthNavServer />
      </header>

      {/* 미리보기 섹션 */}
      <section className="product-hero">
        <div className="product-hero-copy">
          <p className="eyebrow">{product.label}</p>
          <h1>{product.name}</h1>
        </div>
        <div className="product-visual product-visual-large" aria-hidden="true">
          <span>{product.label}</span>
        </div>
      </section>

      {/* 가격 섹션 */}
      <section className="section section-light product-price-section">
        <div className="product-price-row">
          <strong className="product-price-label">{product.priceLabel}</strong>
          <p className="product-price-desc">{product.description}</p>
        </div>
      </section>

      {/* 상품 설명 / 구성 안내 */}
      <section className="section section-light">
        <div className="section-heading">
          <p className="eyebrow">PREVIEW</p>
          <h2>구성 안내</h2>
        </div>
        <div className="detail-list">
          {product.details.map((detail) => (
            <article className="product-card detail-card" key={detail}>
              <h3>{detail}</h3>
              <p>구매 후 마이페이지에서 자료 접근 상태를 확인합니다.</p>
            </article>
          ))}
        </div>
      </section>

      {/* 후기 섹션 자리 (추후 구현) */}
      <section className="section section-light product-review-placeholder">
        <div className="section-heading">
          <p className="eyebrow">REVIEWS</p>
          <h2>구매 후기</h2>
          <p>아직 후기가 없습니다. 구매 후 첫 후기를 남겨보세요.</p>
        </div>
      </section>

      <SiteFooter />

      {/* 하단 고정 구매 버튼 바 (Q4: 애플·무신사·크림 표준 방식) */}
      <div className="sticky-buy-bar">
        <div className="sticky-buy-inner">
          <div className="sticky-buy-info">
            <span className="sticky-buy-name">{product.name}</span>
            <span className="sticky-buy-price">{product.priceLabel}</span>
          </div>
          <div className="sticky-buy-actions">
            <Link href="/#products" className="button button-outline-light sticky-back-btn">
              전체 상품
            </Link>
            <PurchaseLink
              className="button button-primary"
              productSlug={product.slug}
              label="구매하기"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
