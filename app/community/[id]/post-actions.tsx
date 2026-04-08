"use client";

import Link from "next/link";
import { deletePostAction, toggleLikeAction } from "./actions";

type Props = {
  postId: string;
  userId: string | null;
  isAuthor: boolean;
  likeCount: number;
  liked: boolean;
  category: string;
};

export function PostActions({ postId, userId, isAuthor, likeCount, liked, category }: Props) {
  return (
    <div className="post-actions">
      <form action={toggleLikeAction}>
        <input type="hidden" name="postId" value={postId} />
        <input type="hidden" name="userId" value={userId ?? ""} />
        <button
          type="submit"
          className={`like-button${liked ? " liked" : ""}`}
          disabled={!userId}
        >
          {liked ? "♥" : "♡"} 좋아요 {likeCount}
        </button>
      </form>

      {isAuthor ? (
        <div className="author-actions">
          <Link href={`/community/${postId}/edit`} className="pill-link">
            수정
          </Link>
          <form action={deletePostAction} onSubmit={(e) => {
            if (!confirm("게시글을 삭제하시겠습니까?")) e.preventDefault();
          }}>
            <input type="hidden" name="postId" value={postId} />
            <input type="hidden" name="authorId" value={userId ?? ""} />
            <input type="hidden" name="category" value={category} />
            <button type="submit" className="text-link" style={{ color: "#b00020" }}>
              삭제
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
