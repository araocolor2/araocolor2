create table if not exists public.profiles (
  id text primary key,
  email text not null,
  full_name text,
  image_url text,
  username text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  slug text primary key,
  name text not null,
  description text not null,
  price_amount integer not null default 110000,
  label text not null default 'PACK',
  details jsonb not null default '[]'::jsonb,
  download_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  user_email text not null,
  product_slug text not null,
  product_name text not null,
  amount integer not null,
  payment_method text not null check (payment_method in ('kakao_link', 'bank_transfer')),
  status text not null check (status in ('confirmed', 'bank_transfer_pending')),
  download_url text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

insert into public.products (slug, name, description, price_amount, label, details, sort_order)
values
  ('basic-pack', '제주컬러 기본 팩', '제주 색상 기준표와 기본 팔레트 자료.', 110000, 'BASIC', '["기본 색상 팔레트", "브랜드 작업용 색상 기준", "다운로드형 디지털 자료"]'::jsonb, 1),
  ('image-pack', '제주컬러 이미지 팩', '상세 페이지와 게시글에 쓰기 좋은 이미지 자료.', 110000, 'IMAGE', '["상품 상세 이미지 참고", "게시글용 이미지 구성", "웹 운영용 시각 자료"]'::jsonb, 2),
  ('season-pack', '제주컬러 계절 팩', '봄, 여름, 가을, 겨울 감성별 색상 자료.', 110000, 'SEASON', '["계절별 색상 조합", "캠페인용 팔레트", "시즌 작업 참고 자료"]'::jsonb, 3),
  ('brand-pack', '제주컬러 브랜드 팩', '브랜드 작업에 바로 쓰기 좋은 조합 자료.', 110000, 'BRAND', '["브랜드 색상 조합", "로고/상세 페이지 참고", "실무 적용 예시"]'::jsonb, 4),
  ('detail-pack', '제주컬러 상세 팩', '상품 상세 화면 구성을 위한 참고 자료.', 110000, 'DETAIL', '["상세 화면 구성 참고", "상품 소개 문구 구조", "구매 전 미리보기 기준"]'::jsonb, 5),
  ('all-pack', '제주컬러 전체 팩', '전체 자료를 한 번에 확인하는 구성.', 110000, 'ALL', '["전체 상품 통합 구성", "브랜드/이미지/계절 자료 포함", "구매 내역에서 확인"]'::jsonb, 6)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price_amount = excluded.price_amount,
  label = excluded.label,
  details = excluded.details,
  sort_order = excluded.sort_order,
  updated_at = now();

-- =============================================
-- 커뮤니티 & 운영 테이블 (2차 작업)
-- =============================================

-- 게시글
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id text not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('notice', 'general', 'qna', 'jeju')),
  title text not null,
  content text not null,
  view_count integer not null default 0,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 게시글 이미지 (썸네일 200x200 / width 480 / width 1024)
create table if not exists public.post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  url_thumb text not null,
  url_480 text not null,
  url_1024 text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 상단 고정 게시글 (관리자 지정)
create table if not exists public.post_pins (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 댓글 + 대댓글 (parent_id가 있으면 대댓글)
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id text not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 좋아요 (게시글 또는 댓글)
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint likes_target_check check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  ),
  unique (user_id, post_id),
  unique (user_id, comment_id)
);

-- 알림 (댓글·좋아요·대댓글)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id text not null references public.profiles(id) on delete cascade,
  sender_id text references public.profiles(id) on delete set null,
  type text not null check (type in ('comment', 'like', 'reply')),
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 장바구니
create table if not exists public.cart (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  product_slug text not null references public.products(slug) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_slug)
);

-- 쿠폰
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('fixed', 'percent')),
  discount_value integer not null,
  min_amount integer not null default 0,
  max_uses integer,
  used_count integer not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 다운로드 이력
create table if not exists public.download_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id text not null references public.profiles(id) on delete cascade,
  product_slug text not null,
  download_count integer not null default 0,
  link_expires_at timestamptz,
  last_downloaded_at timestamptz,
  created_at timestamptz not null default now()
);

-- 문의
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  user_email text not null,
  inquiry_type text not null check (inquiry_type in ('payment', 'product', 'other')),
  content text not null,
  status text not null check (status in ('pending', 'resolved')) default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 상품 후기 (구매자만 작성)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id text not null references public.profiles(id) on delete cascade,
  product_slug text not null references public.products(slug) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  content text,
  created_at timestamptz not null default now(),
  unique (order_id, user_id)
);

-- 탈퇴 이력
create table if not exists public.user_deletions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  email text not null,
  deleted_at timestamptz not null default now(),
  restore_deadline timestamptz not null default (now() + interval '30 days'),
  restored_at timestamptz
);

-- =============================================
-- RLS 활성화
-- =============================================
alter table public.posts enable row level security;
alter table public.post_images enable row level security;
alter table public.post_pins enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.notifications enable row level security;
alter table public.cart enable row level security;
alter table public.coupons enable row level security;
alter table public.download_logs enable row level security;
alter table public.inquiries enable row level security;
alter table public.reviews enable row level security;
alter table public.user_deletions enable row level security;

-- =============================================
-- RLS 정책
-- =============================================

-- profiles: 본인만 수정, 전체 읽기
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid()::text = id);
create policy "profiles_update" on public.profiles for update using (auth.uid()::text = id);

-- products: 전체 읽기, 수정 불가 (서비스롤로만)
create policy "products_select" on public.products for select using (active = true);

-- orders: 본인 주문만
create policy "orders_select" on public.orders for select using (auth.uid()::text = user_id);
create policy "orders_insert" on public.orders for insert with check (auth.uid()::text = user_id);

-- posts: 카테고리별 권한
create policy "posts_select_public" on public.posts for select using (category in ('notice', 'general', 'qna'));
create policy "posts_insert" on public.posts for insert with check (auth.uid()::text = author_id);
create policy "posts_update" on public.posts for update using (auth.uid()::text = author_id);
create policy "posts_delete" on public.posts for delete using (auth.uid()::text = author_id);

-- post_images: 전체 읽기
create policy "post_images_select" on public.post_images for select using (true);

-- post_pins: 전체 읽기
create policy "post_pins_select" on public.post_pins for select using (true);

-- comments: 전체 읽기, 본인만 작성/수정/삭제
create policy "comments_select" on public.comments for select using (true);
create policy "comments_insert" on public.comments for insert with check (auth.uid()::text = author_id);
create policy "comments_update" on public.comments for update using (auth.uid()::text = author_id);
create policy "comments_delete" on public.comments for delete using (auth.uid()::text = author_id);

-- likes: 전체 읽기, 본인만 추가/삭제
create policy "likes_select" on public.likes for select using (true);
create policy "likes_insert" on public.likes for insert with check (auth.uid()::text = user_id);
create policy "likes_delete" on public.likes for delete using (auth.uid()::text = user_id);

-- notifications: 본인 알림만
create policy "notifications_select" on public.notifications for select using (auth.uid()::text = recipient_id);
create policy "notifications_update" on public.notifications for update using (auth.uid()::text = recipient_id);

-- cart: 본인 장바구니만
create policy "cart_select" on public.cart for select using (auth.uid()::text = user_id);
create policy "cart_insert" on public.cart for insert with check (auth.uid()::text = user_id);
create policy "cart_delete" on public.cart for delete using (auth.uid()::text = user_id);

-- coupons: 읽기만 (서비스롤로 관리)
create policy "coupons_select" on public.coupons for select using (active = true);

-- download_logs: 본인만
create policy "download_logs_select" on public.download_logs for select using (auth.uid()::text = user_id);

-- inquiries: 본인만
create policy "inquiries_select" on public.inquiries for select using (auth.uid()::text = user_id);
create policy "inquiries_insert" on public.inquiries for insert with check (auth.uid()::text = user_id);

-- reviews: 전체 읽기, 본인만 작성
create policy "reviews_select" on public.reviews for select using (true);
create policy "reviews_insert" on public.reviews for insert with check (auth.uid()::text = user_id);

-- =============================================
-- 카운터 RPC 함수
-- =============================================

create or replace function increment_view_count(post_id uuid)
returns void language sql as $$
  update public.posts set view_count = view_count + 1 where id = post_id;
$$;

create or replace function increment_like_count(post_id uuid)
returns void language sql as $$
  update public.posts set like_count = like_count + 1 where id = post_id;
$$;

create or replace function decrement_like_count(post_id uuid)
returns void language sql as $$
  update public.posts set like_count = greatest(0, like_count - 1) where id = post_id;
$$;

create or replace function increment_comment_count(post_id uuid)
returns void language sql as $$
  update public.posts set comment_count = comment_count + 1 where id = post_id;
$$;

-- =============================================
-- 알림 자동 삭제 (30일 후) — pg_cron 미설치 시 생략 가능
-- =============================================
-- select cron.schedule('delete-old-notifications', '0 3 * * *', $$
--   delete from public.notifications where created_at < now() - interval '30 days';
-- $$);
