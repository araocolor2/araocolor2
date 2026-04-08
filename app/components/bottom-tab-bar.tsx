"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const TABS = [
  {
    href: "/",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
    label: "홈",
    exact: true,
  },
  {
    href: "/community",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    label: "게시판",
    exact: false,
  },
  {
    href: "/#products",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    ),
    label: "상품",
    exact: false,
  },
  {
    href: "/mypage",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
    label: "마이페이지",
    exact: false,
  },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();

  // 로그인 페이지, 회원가입 페이지에선 숨김
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) return null;

  return (
    <nav className="bottom-tab-bar" aria-label="하단 탭 메뉴">
      {TABS.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href.split("#")[0]) && tab.href !== "/";
        const isHome = tab.href === "/" && pathname === "/";
        const active = isActive || isHome;

        // 마이페이지는 로그인 여부에 따라 href 조정
        const href =
          tab.href === "/mypage" && isLoaded && !isSignedIn
            ? "/sign-in"
            : tab.href;

        return (
          <Link
            key={tab.href}
            href={href}
            className={`tab-item${active ? " tab-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
