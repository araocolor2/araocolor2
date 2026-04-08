"use client";

import { useUser } from "@clerk/nextjs";

export function HomeAuthLink() {
  const { isLoaded, isSignedIn } = useUser();
  const href = isLoaded && isSignedIn ? "/mypage" : "/sign-in";
  const label = isLoaded && isSignedIn ? "마이페이지" : "로그인";

  return (
    <a href={href} className="button button-primary">
      {label}
    </a>
  );
}
