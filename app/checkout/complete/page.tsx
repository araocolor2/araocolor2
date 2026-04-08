import Link from "next/link";
import { SiteFooter } from "../../components/site-footer";

export default async function CheckoutCompletePage({
  searchParams
}: {
  searchParams: Promise<{ method?: string }>;
}) {
  const params = await searchParams;
  const isBankTransfer = params.method === "bank_transfer_pending";

  return (
    <main>
      <header className="site-header">
        <Link href="/" className="brand">
          제주컬러
        </Link>
      </header>

      <section className="section narrow complete-section">
        <div className="complete-icon" aria-hidden="true">
          {isBankTransfer ? "🕐" : "✅"}
        </div>

        {isBankTransfer ? (
          <>
            <h1 className="complete-title">입금 대기 중입니다</h1>
            <p className="complete-desc">
              입금 확인 후 구매가 확정됩니다.<br />
              이메일로 안내 메시지를 확인해 주세요.
            </p>
          </>
        ) : (
          <>
            <h1 className="complete-title">구매가 완료되었습니다!</h1>
            <p className="complete-desc">
              이메일을 확인하세요. 다운로드 링크가 발송되었습니다.
            </p>
          </>
        )}

        <div className="complete-actions">
          <Link href="/mypage" className="button button-primary">
            마이페이지에서 확인
          </Link>
          <Link href="/community?category=jeju" className="button button-outline-dark complete-community-btn">
            전용 게시판 보기
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
