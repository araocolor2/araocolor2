# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**제주컬러 (arao.kr)** — 디지털 상품 판매 플랫폼. Clerk 인증, Supabase DB, 카카오 링크 결제 + 무통장 입금, 커뮤니티 게시판.

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js 15 (App Router) |
| 인증 | Clerk (구글 로그인) |
| DB | Supabase (PostgreSQL + RLS) |
| 이메일 | Resend |
| 배포 | Vercel |

## 필수 사항

- **plan_clerk.md 참조 금지** — 구버전 계획서, 현재 프로젝트와 무관
- **코드 작업 전 반드시 실행 여부를 사용자에게 확인**

## 커뮤니케이션 규칙

- 어려운 기술 용어 사용 금지 — 웹 사용자 경험 관점에서 쉽게 설명
- 페이지 파일 이름 언급 금지
- 표(table) 활용, 중간 제목 사용
- 코드 작업 완료 보고: **300자 이하**, 마지막 행에 결론 요약 (2~3줄 이내)

## 개발 서버

```bash
PORT=3001 npm run dev > /tmp/nextjs-dev.log 2>&1 &
pkill -f "next dev"   # 재시작 시 먼저 종료
```

## 아키텍처

### 인증 패턴
- `currentUser()` — Server Component / Server Action에서 사용
- `auth()` — middleware에서만 사용
- `AuthNavServer` — 서버 컴포넌트 래퍼, Clerk userId로 unreadCount를 가져와 클라이언트 `AuthNav`에 prop 전달

### Supabase 패턴
- `getSupabaseAdmin()` — service role key 사용, RLS 우회. `app/lib/supabase.ts`에 정의
- `withDataTimeout(promise, fallback, ms)` — 2.5초 타임아웃 래퍼
- RPC 호출: `void supabase.rpc(...)` — `.catch()` 사용 금지 (TypeScript 오류)

### 사용자 등급 & 권한
| 등급 | 기준 | 접근 범위 |
|---|---|---|
| 비로그인 | - | 글 목록만 |
| 일반 회원 | Clerk 로그인 | 공용 게시판 전체 |
| 구매 회원 | `hasPurchased()` — confirmed 주문 존재 | 제주컬러 전용 게시판 |
| 관리자 | `ADMIN_EMAIL` env와 일치 | 전체 |

### Server Actions 위치
- `app/checkout/actions.ts` — 주문 생성
- `app/mypage/actions.ts` — 아이디 저장, 입금 확인 (개발용)
- `app/community/write/actions.ts` — 글 작성
- `app/community/[id]/actions.ts` — 삭제, 댓글, 좋아요
- `app/community/[id]/edit/actions.ts` — 글 수정
- `app/notifications/actions.ts` — 읽음 처리
- `app/admin/actions.ts` — 주문 확정, 상품 토글

### 핵심 lib 파일
| 파일 | 역할 |
|---|---|
| `app/lib/supabase.ts` | Supabase 클라이언트, 타임아웃 유틸 |
| `app/lib/catalog.ts` | 상품 목록 (Supabase `products` 테이블) |
| `app/lib/orders.ts` | 주문 CRUD + `hasPurchased()` |
| `app/lib/posts.ts` | 게시글 CRUD + RPC 조회수 |
| `app/lib/comments.ts` | 댓글 트리 빌드 (2단계), 소프트 삭제 |
| `app/lib/likes.ts` | 좋아요 토글 |
| `app/lib/notifications.ts` | 알림 생성/읽음, unread count |
| `app/lib/profiles.ts` | 프로필 upsert, 아이디 저장 |
| `app/lib/admin.ts` | `isAdmin()`, 관리자 주문/상품 조회 |
| `app/lib/email.ts` | Resend 이메일 발송 |

## 환경 변수

`.env.example` 참조. 필수 항목:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL` — 관리자 이메일 (isAdmin() 기준)
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

## DB 스키마

`supabase_schema.sql` 참조. 16개 테이블:
- `profiles`, `products`, `orders`, `download_logs`, `cart`, `coupons`
- `posts`, `post_images`, `post_pins`, `comments`, `likes`
- `notifications`, `inquiries`, `reviews`, `user_deletions`
- RLS 정책 + RPC 함수(`increment_view_count`, `increment_like_count`, `decrement_like_count`, `increment_comment_count`) 포함

## 미들웨어 보호 경로

```ts
const isProtectedRoute = createRouteMatcher([
  "/mypage(.*)", "/community/write(.*)",
  "/community/(.+)/edit(.*)", "/admin(.*)", "/notifications(.*)"
]);
```
