import { getSupabaseAdmin, withDataTimeout } from "./supabase";

export type Notification = {
  id: string;
  type: "comment" | "like" | "reply";
  postId: string | null;
  commentId: string | null;
  senderUsername: string | null;
  isRead: boolean;
  createdAt: string;
};

function mapNotification(row: Record<string, unknown>): Notification {
  const sender = row.sender as Record<string, unknown> | null;
  return {
    id: String(row.id),
    type: row.type as Notification["type"],
    postId: row.post_id ? String(row.post_id) : null,
    commentId: row.comment_id ? String(row.comment_id) : null,
    senderUsername: sender?.username ? String(sender.username) : null,
    isRead: Boolean(row.is_read),
    createdAt: String(row.created_at)
  };
}

export async function getNotifications(userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, notifications: [] as Notification[], unreadCount: 0 };

  const { data, error } = await withDataTimeout(
    supabase
      .from("notifications")
      .select("*, sender:sender_id(username)")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    { data: null, error: { message: "시간 초과" } }
  );

  if (error || !data) return { ok: false, notifications: [] as Notification[], unreadCount: 0 };

  const notifications = (data as Record<string, unknown>[]).map(mapNotification);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return { ok: true, notifications, unreadCount };
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return 0;

  const { count } = await withDataTimeout(
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .eq("is_read", false),
    { data: null, error: null, count: 0 }
  );

  return count ?? 0;
}

export async function markAllRead(userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", userId)
    .eq("is_read", false);
}

export async function markOneRead(notificationId: string, userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("recipient_id", userId);
}

export async function createNotification({
  recipientId,
  senderId,
  type,
  postId,
  commentId
}: {
  recipientId: string;
  senderId: string;
  type: "comment" | "like" | "reply";
  postId?: string;
  commentId?: string;
}) {
  // 본인에게는 알림 생성 안 함
  if (recipientId === senderId) return;

  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  await supabase.from("notifications").insert({
    recipient_id: recipientId,
    sender_id: senderId,
    type,
    post_id: postId ?? null,
    comment_id: commentId ?? null
  });
}
