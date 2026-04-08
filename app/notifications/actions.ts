"use server";

import { redirect } from "next/navigation";
import { markAllRead, markOneRead } from "../lib/notifications";

export async function markAllReadAction(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;
  await markAllRead(userId);
  redirect("/notifications");
}

export async function markOneReadAction(formData: FormData) {
  const notificationId = String(formData.get("notificationId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const postId = String(formData.get("postId") ?? "");
  if (!notificationId || !userId) return;
  await markOneRead(notificationId, userId);
  if (postId) redirect(`/community/${postId}`);
  else redirect("/notifications");
}
