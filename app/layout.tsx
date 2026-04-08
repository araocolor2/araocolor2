import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { BottomTabBar } from "./components/bottom-tab-bar";
import "./globals.css";

export const metadata: Metadata = {
  title: "제주컬러",
  description: "제주컬러 디지털 상품 구매 서비스"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      <html lang="ko">
        <body>
          {children}
          <BottomTabBar />
        </body>
      </html>
    </ClerkProvider>
  );
}
