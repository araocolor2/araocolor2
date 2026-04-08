"use server";

import { redirect } from "next/navigation";
import { deletePost, getPost } from "../../lib/posts";
import { createComment, deleteComment } from "../../lib/comments";
import { togglePostLike } from "../../lib/likes";
import { createNotification } from "../../lib/notifications";

export async function deletePostAction(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const authorId = String(formData.get("authorId") ?? "");
  const category = String(formData.get("category") ?? "general");

  const result = await deletePost(postId, authorId);
  if (!result.ok) {
    redirect(`/community/${postId}?error=${encodeURIComponent(result.message ?? "삭제 실패")}`);
  }
  redirect(`/community?category=${category}`);
}

export async function addCommentAction(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const authorId = String(formData.get("authorId") ?? "");
  const content = String(formData.get("content") ?? "");
  const parentId = formData.get("parentId") ? String(formData.get("parentId")) : undefined;

  if (!authorId) redirect("/sign-in");

  await createComment(postId, authorId, content, parentId);

  // 알림 생성: 글 작성자에게
  const post = await getPost(postId);
  if (post && post.authorId !== authorId) {
    await createNotification({
      recipientId: post.authorId,
      senderId: authorId,
      type: parentId ? "reply" : "comment",
      postId
    });
  }

  redirect(`/community/${postId}`);
}

export async function deleteCommentAction(formData: FormData) {
  const commentId = String(formData.get("commentId") ?? "");
  const authorId = String(formData.get("authorId") ?? "");
  const postId = String(formData.get("postId") ?? "");

  await deleteComment(commentId, authorId);
  redirect(`/community/${postId}`);
}

export async function toggleLikeAction(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const userId = String(formData.get("userId") ?? "");

  if (!userId) redirect("/sign-in");

  const result = await togglePostLike(postId, userId);

  // 좋아요 추가 시만 알림
  if (result.liked) {
    const post = await getPost(postId);
    if (post && post.authorId !== userId) {
      await createNotification({
        recipientId: post.authorId,
        senderId: userId,
        type: "like",
        postId
      });
    }
  }

  redirect(`/community/${postId}`);
}
