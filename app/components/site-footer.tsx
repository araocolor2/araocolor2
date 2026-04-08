import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { isAdmin } from "../lib/admin";

export async function SiteFooter() {
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? "";
  const admin = isAdmin(email);

  return (
    <footer className="site-footer" aria-label="사이트 정보">
      <p>제주컬러</p>
      <nav className="footer-links" aria-label="정책 링크">
        <Link href="/privacy">개인정보 처리방침</Link>
        <Link href="/terms">이용약관</Link>
        {admin ? <Link href="/admin">admin</Link> : null}
      </nav>
    </footer>
  );
}
