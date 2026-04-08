import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { AuthNavServer } from "../../components/auth-nav-server";
import { SiteFooter } from "../../components/site-footer";
import { getPost, CATEGORY_LABELS } from "../../lib/posts";
import { getComments } from "../../lib/comments";
import { getPostLike } from "../../lib/likes";
import { hasPurchased } from "../../lib/orders";
import { PostActions } from "./post-actions";
import { CommentSection } from "./comment-section";

export default async function PostDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ deleted?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const [post, user] = await Promise.all([getPost(id), currentUser()]);
  if (!post) notFound();

  // 제주컬러 전용 게시글은 구매회원만 접근
  if (post.category === "jeju") {
    if (!user) redirect("/sign-in");
    const purchased = await hasPurchased(user.id);
    if (!purchased) redirect("/community?category=general&blocked=jeju");
  }

  const [{ comments }, liked] = await Promise.all([
    getComments(id),
    user ? getPostLike(id, user.id) : Promise.resolve(false)
  ]);

  const isAuthor = user?.id === post.authorId;

  return (
    <main>
      <header className="site-header">
        <Link href="/" className="brand">
          제주컬러
        </Link>
        <AuthNavServer />
      </header>

      <section className="section narrow">
        <div className="post-breadcrumb">
          <Link href={`/community?category=${post.category}`} className="pill-link">
            ← {CATEGORY_LABELS[post.category]}
          </Link>
        </div>

        {sp.error ? <p className="notice notice-error">{sp.error}</p> : null}

        <article className="post-detail">
          <header className="post-detail-header">
            <p className="eyebrow">{CATEGORY_LABELS[post.category]}</p>
            <h1>{post.title}</h1>
            <div className="post-info">
              <span>{post.authorUsername ?? "알 수 없음"}</span>
              <span>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
              <span>조회 {post.viewCount}</span>
            </div>
          </header>

          <div className="post-content">
            {post.content.replace(/\\n/g, "\n").split("\n").map((line, i) => (
              <p key={i}>{line || "\u00A0"}</p>
            ))}
          </div>

          <PostActions
            postId={post.id}
            userId={user?.id ?? null}
            isAuthor={isAuthor}
            likeCount={post.likeCount}
            liked={liked}
            category={post.category}
          />
        </article>

        <CommentSection
          postId={post.id}
          userId={user?.id ?? null}
          comments={comments}
        />
      </section>

      <SiteFooter />
    </main>
  );
}
