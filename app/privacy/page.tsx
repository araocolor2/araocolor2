import Link from "next/link";
import { SiteFooter } from "../components/site-footer";

export default function PrivacyPage() {
  return (
    <main>
      <header className="site-header">
        <Link href="/" className="brand">
          제주컬러
        </Link>
      </header>

      <section className="section narrow legal-page">
        <p className="eyebrow">PRIVACY</p>
        <h1>개인정보 처리방침</h1>
        <div className="product-card">
          <h2>준비 중</h2>
          <p>
            정식 운영 전 실제 수집 항목과 보관 기간을 기준으로 내용을 확정합니다.
            현재는 안내 페이지 자리만 준비했습니다.
          </p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
