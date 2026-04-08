import { getSupabaseAdmin, withDataTimeout } from "./supabase";

export type Post = {
  id: string;
  authorId: string;
  authorUsername: string | null;
  category: "notice" | "general" | "qna" | "jeju";
  title: string;
  content: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PostInput = {
  authorId: string;
  category: "notice" | "general" | "qna" | "jeju";
  title: string;
  content: string;
};

export const CATEGORY_LABELS: Record<string, string> = {
  notice: "공지사항",
  general: "일반게시판",
  qna: "QnA",
  jeju: "제주컬러 전용"
};

export const CATEGORY_KEYS = ["notice", "general", "qna", "jeju"] as const;

function mapPost(row: Record<string, unknown>): Post {
  const profile = row.profiles as Record<string, unknown> | null;
  return {
    id: String(row.id),
    authorId: String(row.author_id),
    authorUsername: profile?.username ? String(profile.username) : null,
    category: row.category as Post["category"],
    title: String(row.title),
    content: String(row.content),
    viewCount: Number(row.view_count),
    likeCount: Number(row.like_count),
    commentCount: Number(row.comment_count),
    isPinned: Boolean(row.is_pinned),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

export async function getPosts(category?: string, page = 1, pageSize = 20) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, posts: [] as Post[], total: 0 };

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("posts")
    .select("*, profiles(username)", { count: "exact" })
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (category && CATEGORY_KEYS.includes(category as Post["category"])) {
    query = query.eq("category", category);
  }

  const { data, error, count } = await withDataTimeout(
    query,
    { data: null, error: { message: "시간 초과" }, count: 0 }
  );

  if (error || !data) return { ok: false, posts: [] as Post[], total: 0 };
  return { ok: true, posts: data.map(mapPost), total: count ?? 0 };
}

export async function getPost(id: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await withDataTimeout(
    supabase
      .from("posts")
      .select("*, profiles(username)")
      .eq("id", id)
      .maybeSingle(),
    { data: null, error: { message: "시간 초과" } }
  );

  if (error || !data) return null;
  return mapPost(data as Record<string, unknown>);
}

export async function createPost(input: PostInput) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, message: "Supabase 설정이 없습니다." };

  const title = input.title.trim();
  const content = input.content.trim();

  if (!title) return { ok: false, message: "제목을 입력하세요." };
  if (!content) return { ok: false, message: "내용을 입력하세요." };

  const { data, error } = await withDataTimeout(
    supabase
      .from("posts")
      .insert({ author_id: input.authorId, category: input.category, title, content })
      .select("id")
      .single(),
    { data: null, error: { message: "시간 초과" } }
  );

  if (error || !data) return { ok: false, message: error?.message ?? "저장 실패" };
  return { ok: true, id: String((data as Record<string, unknown>).id) };
}

export async function updatePost(id: string, authorId: string, title: string, content: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, message: "Supabase 설정이 없습니다." };

  const { error } = await withDataTimeout(
    supabase
      .from("posts")
      .update({ title: title.trim(), content: content.trim(), updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("author_id", authorId),
    { data: null, error: { message: "시간 초과" } }
  );

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function deletePost(id: string, authorId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, message: "Supabase 설정이 없습니다." };

  const { error } = await withDataTimeout(
    supabase.from("posts").delete().eq("id", id).eq("author_id", authorId),
    { data: null, error: { message: "시간 초과" } }
  );

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function incrementViewCount(id: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  void supabase.rpc("increment_view_count", { post_id: id });
}
