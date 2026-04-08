import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { AuthNavServer } from "../components/auth-nav-server";
import { SiteFooter } from "../components/site-footer";
import { getPosts, CATEGORY_LABELS, CATEGORY_KEYS } from "../lib/posts";
import { hasPurchased } from "../lib/orders";

export default async function CommunityPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string; page?: string; blocked?: string }>;
}) {
  const params = await searchParams;
  const category = CATEGORY_KEYS.includes(params.category as never) ? params.category : "general";
  const page = Math.max(1, Number(params.page ?? 1));
  const pageSize = 20;

  const user = await currentUser();

  // 제주컬러 전용 게시판은 구매회원만 접근
  if (category === "jeju") {
    if (!user) redirect("/sign-in");
    const purchased = await hasPurchased(user.id);
    if (!purchased) redirect("/community?category=general&blocked=jeju");
  }

  const purchased = user ? await hasPurchased(user.id) : false;
  const { posts, total } = await getPosts(category, page, pageSize);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <main>
      <header className="site-header">
        <Link href="/" className="brand">
          제주컬러
        </Link>
        <AuthNavServer />
      </header>

      <section className="section narrow">
        <p className="eyebrow">COMMUNITY</p>
        <h1>게시판</h1>

        <nav className="category-tabs">
          {CATEGORY_KEYS.map((key) => {
            if (key === "jeju" && !purchased) {
              return (
                <span key={key} className="category-tab locked" title="상품 구매 후 이용 가능합니다">
                  {CATEGORY_LABELS[key]} 🔒
                </span>
              );
            }
            return (
              <Link
                key={key}
                href={`/community?category=${key}`}
                className={`category-tab${category === key ? " active" : ""}`}
              >
                {CATEGORY_LABELS[key]}
              </Link>
            );
          })}
        </nav>

        {params.blocked === "jeju" ? (
          <div className="access-denied-box">
            <div className="access-denied-icon" aria-hidden="true">🔒</div>
            <p className="access-denied-title">이용 권한이 변경되었습니다</p>
            <p className="access-denied-desc">제주컬러 전용 게시판은 상품 구매 후 이용 가능합니다.</p>
            <Link href="/#products" className="button button-primary">
              상품 페이지로 이동
            </Link>
          </div>
        ) : null}

        {user && category !== "notice" ? (
          <div className="community-toolbar">
            <Link href={`/community/write?category=${category}`} className="button button-primary">
              글 쓰기
            </Link>
          </div>
        ) : null}

        {posts.length === 0 ? (
          <div className="empty-state">
            <p>아직 게시글이 없습니다.</p>
            {user && category !== "notice" ? (
              <Link href={`/community/write?category=${category}`} className="pill-link">
                첫 글을 남겨보세요 &gt;
              </Link>
            ) : null}
          </div>
        ) : (
          <ul className="post-list">
            {posts.map((post) => (
              <li key={post.id} className={`post-item${post.isPinned ? " pinned" : ""}`}>
                <Link href={`/community/${post.id}`} className="post-link">
                  <div className="post-meta">
                    {post.isPinned ? <span className="pin-badge">공지</span> : null}
                    <span className="post-category">{CATEGORY_LABELS[post.category]}</span>
                  </div>
                  <h2 className="post-title">{post.title}</h2>
                  <div className="post-info">
                    <span>{post.authorUsername ?? "알 수 없음"}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
                    <span>조회 {post.viewCount}</span>
                    <span>댓글 {post.commentCount}</span>
                    <span>좋아요 {post.likeCount}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 ? (
          <nav className="pagination">
            {page > 1 ? (
              <Link href={`/community?category=${category}&page=${page - 1}`} className="pill-link">
                이전
              </Link>
            ) : null}
            <span>{page} / {totalPages}</span>
            {page < totalPages ? (
              <Link href={`/community?category=${category}&page=${page + 1}`} className="pill-link">
                다음
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>

      <SiteFooter />
    </main>
  );
}
