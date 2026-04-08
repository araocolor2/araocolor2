import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { AuthNavServer } from "../../components/auth-nav-server";
import { SiteFooter } from "../../components/site-footer";
import { CATEGORY_LABELS, CATEGORY_KEYS } from "../../lib/posts";
import { createPostAction } from "./actions";

export default async function WritePostPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string; error?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const params = await searchParams;
  const category = CATEGORY_KEYS.includes(params.category as never) && params.category !== "notice"
    ? params.category as "general" | "qna" | "jeju"
    : "general";

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
        <h1>글 쓰기</h1>

        {params.error ? (
          <p className="notice notice-error">{params.error}</p>
        ) : null}

        <form action={createPostAction} className="post-form">
          <input type="hidden" name="authorId" value={user.id} />

          <div className="form-field">
            <label htmlFor="category">게시판</label>
            <select id="category" name="category" defaultValue={category}>
              {CATEGORY_KEYS.filter((k) => k !== "notice").map((key) => (
                <option key={key} value={key}>
                  {CATEGORY_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="title">제목</label>
            <input id="title" name="title" placeholder="제목을 입력하세요" required maxLength={100} />
          </div>

          <div className="form-field">
            <label htmlFor="content">내용</label>
            <textarea id="content" name="content" placeholder="내용을 입력하세요" required rows={12} />
          </div>

          <div className="form-actions">
            <Link href={`/community?category=${category}`} className="button button-ghost" style={{ color: "var(--color-text)", background: "var(--color-soft)" }}>
              취소
            </Link>
            <button type="submit" className="button button-primary">
              등록
            </button>
          </div>
        </form>
      </section>

      <SiteFooter />
    </main>
  );
}
