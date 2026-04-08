import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { AuthNavServer } from "../../../components/auth-nav-server";
import { SiteFooter } from "../../../components/site-footer";
import { getPost, CATEGORY_LABELS } from "../../../lib/posts";
import { updatePostAction } from "./actions";

export default async function EditPostPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, user] = await Promise.all([getPost(id), currentUser()]);

  if (!post) notFound();
  if (!user || user.id !== post.authorId) redirect(`/community/${id}`);

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
        <h1>글 수정</h1>

        <form action={updatePostAction} className="post-form">
          <input type="hidden" name="postId" value={post.id} />
          <input type="hidden" name="authorId" value={user.id} />

          <div className="form-field">
            <label>게시판</label>
            <p>{CATEGORY_LABELS[post.category]}</p>
          </div>

          <div className="form-field">
            <label htmlFor="title">제목</label>
            <input id="title" name="title" defaultValue={post.title} required maxLength={100} />
          </div>

          <div className="form-field">
            <label htmlFor="content">내용</label>
            <textarea id="content" name="content" defaultValue={post.content} required rows={12} />
          </div>

          <div className="form-actions">
            <Link href={`/community/${id}`} className="button" style={{ background: "var(--color-soft)", color: "var(--color-text)" }}>
              취소
            </Link>
            <button type="submit" className="button button-primary">저장</button>
          </div>
        </form>
      </section>

      <SiteFooter />
    </main>
  );
}
