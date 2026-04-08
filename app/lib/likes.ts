import { getSupabaseAdmin, withDataTimeout } from "./supabase";

export async function togglePostLike(postId: string, userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, liked: false, message: "Supabase 설정이 없습니다." };

  const { data: existing } = await withDataTimeout(
    supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle(),
    { data: null, error: null }
  );

  if (existing) {
    await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", userId);
    void supabase.rpc("decrement_like_count", { post_id: postId });
    return { ok: true, liked: false };
  }

  await supabase.from("likes").insert({ post_id: postId, user_id: userId });
  void supabase.rpc("increment_like_count", { post_id: postId });
  return { ok: true, liked: true };
}

export async function getPostLike(postId: string, userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { data } = await withDataTimeout(
    supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle(),
    { data: null, error: null }
  );

  return !!data;
}
