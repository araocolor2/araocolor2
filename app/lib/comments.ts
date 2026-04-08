import { getSupabaseAdmin, withDataTimeout } from "./supabase";

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  authorUsername: string | null;
  parentId: string | null;
  content: string;
  isDeleted: boolean;
  likeCount: number;
  createdAt: string;
  replies: Comment[];
};

function mapComment(row: Record<string, unknown>): Comment {
  const profile = row.profiles as Record<string, unknown> | null;
  return {
    id: String(row.id),
    postId: String(row.post_id),
    authorId: String(row.author_id),
    authorUsername: profile?.username ? String(profile.username) : null,
    parentId: row.parent_id ? String(row.parent_id) : null,
    content: row.is_deleted ? "(삭제된 댓글입니다)" : String(row.content),
    isDeleted: Boolean(row.is_deleted),
    likeCount: Number(row.like_count ?? 0),
    createdAt: String(row.created_at),
    replies: []
  };
}

export async function getComments(postId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, comments: [] as Comment[] };

  const { data, error } = await withDataTimeout(
    supabase
      .from("comments")
      .select("*, profiles(username)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true }),
    { data: null, error: { message: "시간 초과" } }
  );

  if (error || !data) return { ok: false, comments: [] as Comment[] };

  const all = (data as Record<string, unknown>[]).map(mapComment);
  const roots = all.filter((c) => !c.parentId);
  const replies = all.filter((c) => c.parentId);

  roots.forEach((root) => {
    root.replies = replies.filter((r) => r.parentId === root.id);
  });

  return { ok: true, comments: roots };
}

export async function createComment(postId: string, authorId: string, content: string, parentId?: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, message: "Supabase 설정이 없습니다." };

  const trimmed = content.trim();
  if (!trimmed) return { ok: false, message: "댓글 내용을 입력하세요." };

  const { error } = await withDataTimeout(
    supabase.from("comments").insert({
      post_id: postId,
      author_id: authorId,
      content: trimmed,
      parent_id: parentId ?? null
    }),
    { data: null, error: { message: "시간 초과" } }
  );

  if (error) return { ok: false, message: error.message };

  // 댓글 수 갱신
  void supabase.rpc("increment_comment_count", { post_id: postId });

  return { ok: true };
}

export async function deleteComment(id: string, authorId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, message: "Supabase 설정이 없습니다." };

  const { error } = await withDataTimeout(
    supabase
      .from("comments")
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("author_id", authorId),
    { data: null, error: { message: "시간 초과" } }
  );

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
