"use server";

import { redirect } from "next/navigation";
import { createPost } from "../../lib/posts";

export async function createPostAction(formData: FormData) {
  const authorId = String(formData.get("authorId") ?? "");
  const category = String(formData.get("category") ?? "general") as "general" | "qna" | "jeju";
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!authorId) redirect("/sign-in");

  const result = await createPost({ authorId, category, title, content });

  if (!result.ok) {
    redirect(`/community/write?category=${category}&error=${encodeURIComponent(result.message ?? "저장 실패")}`);
  }

  redirect(`/community/${result.id}`);
}
