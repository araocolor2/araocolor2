"use server";

import { redirect } from "next/navigation";
import { updatePost } from "../../../lib/posts";

export async function updatePostAction(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const authorId = String(formData.get("authorId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  const result = await updatePost(postId, authorId, title, content);
  if (!result.ok) {
    redirect(`/community/${postId}?error=${encodeURIComponent(result.message ?? "수정 실패")}`);
  }
  redirect(`/community/${postId}`);
}
