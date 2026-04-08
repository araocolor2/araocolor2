"use client";

import Link from "next/link";
import { useState } from "react";
import { addCommentAction, deleteCommentAction } from "./actions";
import type { Comment } from "../../lib/comments";

type Props = {
  postId: string;
  userId: string | null;
  comments: Comment[];
};

function CommentItem({ comment, postId, userId }: { comment: Comment; postId: string; userId: string | null }) {
  const [showReply, setShowReply] = useState(false);
  const isAuthor = userId === comment.authorId;

  return (
    <li className="comment-item">
      <div className="comment-header">
        <span className="comment-author">{comment.authorUsername ?? "알 수 없음"}</span>
        <span className="comment-date">{new Date(comment.createdAt).toLocaleDateString("ko-KR")}</span>
      </div>
      <p className={`comment-content${comment.isDeleted ? " deleted" : ""}`}>{comment.content}</p>
      <div className="comment-footer">
        {userId && !comment.isDeleted ? (
          <button className="text-link" onClick={() => setShowReply(!showReply)}>
            답글
          </button>
        ) : null}
        {isAuthor && !comment.isDeleted ? (
          <form action={deleteCommentAction}>
            <input type="hidden" name="commentId" value={comment.id} />
            <input type="hidden" name="authorId" value={userId ?? ""} />
            <input type="hidden" name="postId" value={postId} />
            <button type="submit" className="text-link" style={{ color: "#b00020" }}>
              삭제
            </button>
          </form>
        ) : null}
      </div>

      {showReply ? (
        <form action={addCommentAction} className="reply-form">
          <input type="hidden" name="postId" value={postId} />
          <input type="hidden" name="authorId" value={userId ?? ""} />
          <input type="hidden" name="parentId" value={comment.id} />
          <textarea name="content" placeholder="답글을 입력하세요" rows={3} required />
          <div className="form-actions">
            <button type="button" className="text-link" onClick={() => setShowReply(false)}>취소</button>
            <button type="submit" className="button button-primary" style={{ fontSize: "14px", minHeight: "36px" }}>등록</button>
          </div>
        </form>
      ) : null}

      {comment.replies.length > 0 ? (
        <ul className="reply-list">
          {comment.replies.map((reply) => (
            <li key={reply.id} className="comment-item reply-item">
              <div className="comment-header">
                <span className="comment-author">↳ {reply.authorUsername ?? "알 수 없음"}</span>
                <span className="comment-date">{new Date(reply.createdAt).toLocaleDateString("ko-KR")}</span>
              </div>
              <p className={`comment-content${reply.isDeleted ? " deleted" : ""}`}>{reply.content}</p>
              {userId === reply.authorId && !reply.isDeleted ? (
                <form action={deleteCommentAction}>
                  <input type="hidden" name="commentId" value={reply.id} />
                  <input type="hidden" name="authorId" value={userId ?? ""} />
                  <input type="hidden" name="postId" value={postId} />
                  <button type="submit" className="text-link" style={{ color: "#b00020" }}>삭제</button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function CommentSection({ postId, userId, comments }: Props) {
  return (
    <section className="comment-section">
      <h2 className="comment-title">댓글 {comments.length}</h2>

      {comments.length > 0 ? (
        <ul className="comment-list">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} postId={postId} userId={userId} />
          ))}
        </ul>
      ) : (
        <p className="empty-comment">첫 댓글을 남겨보세요.</p>
      )}

      {userId ? (
        <form action={addCommentAction} className="comment-form">
          <input type="hidden" name="postId" value={postId} />
          <input type="hidden" name="authorId" value={userId} />
          <textarea name="content" placeholder="댓글을 입력하세요" rows={4} required />
          <div className="form-actions">
            <button type="submit" className="button button-primary">댓글 등록</button>
          </div>
        </form>
      ) : (
        <p className="notice">댓글을 작성하려면 <Link href="/sign-in" className="pill-link">로그인</Link>이 필요합니다.</p>
      )}
    </section>
  );
}
