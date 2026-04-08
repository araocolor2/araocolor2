import Link from "next/link";
import { AuthNavServer } from "./components/auth-nav-server";
import { HomeAuthLink } from "./components/home-auth-link";
import { PurchaseLink } from "./components/purchase-link";
import { SiteFooter } from "./components/site-footer";
import { getProducts } from "./lib/catalog";
import { getHeroImageUrl } from "./lib/hero-image";

export default async function Home() {
  const [products, heroImageUrl] = await Promise.all([
    getProducts(),
    getHeroImageUrl(),
  ]);

  return (
    <main className="home">
      <header className="site-header">
        <Link href="/" className="brand">
          제주컬러
        </Link>
        <AuthNavServer />
      </header>

      <section className="hero" aria-labelledby="home-title">
        <div
          className="hero-bg"
          style={heroImageUrl ? {
            backgroundImage: `url(${heroImageUrl})`,
          } : undefined}
        >
        <div className="hero-inner">
          <p className="eyebrow">JEJU COLOR</p>
          <h1 id="home-title">제주의 색을 바로 쓰는 자료</h1>
          <p className="hero-copy">
            필요한 자료를 고르고, 결제 후 구매 내역에서 바로 확인하세요.
          </p>
          <div className="hero-actions">
            <Link href="#products" className="button button-outline-dark">
              상품 보기
            </Link>
            <HomeAuthLink />
          </div>
        </div>
        </div>
      </section>

      <section className="section section-light" id="products" aria-labelledby="products-title">
        <div className="section-heading">
          <p className="eyebrow">PRODUCTS</p>
          <h2 id="products-title">전체 상품</h2>
          <p>모든 상품은 같은 가격으로 시작합니다. 결제 방식은 다음 단계에서 선택합니다.</p>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.name}>
              <div className="product-visual" aria-hidden="true">
                <span>{product.label}</span>
              </div>
              <div>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
              </div>
              <div className="product-footer">
                <strong>{product.priceLabel}</strong>
                <Link href={`/products/${product.slug}`} className="pill-link">
                  자세히 보기 &gt;
                </Link>
                <PurchaseLink productSlug={product.slug} />
              </div>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
