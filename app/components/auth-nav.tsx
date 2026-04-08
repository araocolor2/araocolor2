"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

type Props = {
  unreadCount?: number;
};

export function AuthNav({ unreadCount = 0 }: Props) {
  const { isLoaded, isSignedIn } = useUser();

  return (
    <nav className="header-actions" aria-label="주요 메뉴">
      <Link href="/#products" className="nav-link">
        상품
      </Link>
      <Link href="/community" className="nav-link">
        게시판
      </Link>
      {isLoaded && isSignedIn ? (
        <>
          <Link href="/notifications" className="bell-link" aria-label={`알림${unreadCount > 0 ? ` ${unreadCount}개` : ""}`}>
            🔔
            {unreadCount > 0 ? (
              <span className="bell-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
            ) : null}
          </Link>
          <Link href="/mypage" className="nav-link">
            마이페이지
          </Link>
          <UserButton />
        </>
      ) : (
        <Link href="/sign-in" className="nav-link">
          로그인
        </Link>
      )}
    </nav>
  );
}
