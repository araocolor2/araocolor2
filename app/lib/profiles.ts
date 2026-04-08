import { getSupabaseAdmin, withDataTimeout } from "./supabase";

export type ProfileInput = {
  id: string;
  email: string;
  fullName?: string | null;
  imageUrl?: string | null;
};

export type Profile = {
  id: string;
  email: string;
  fullName: string | null;
  imageUrl: string | null;
  username: string | null;
};

export async function upsertProfile(input: ProfileInput) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return { ok: false, message: "Supabase 설정이 없습니다." };
  }

  const { error } = await withDataTimeout(
    supabase.from("profiles").upsert(
      {
        id: input.id,
        email: input.email,
        full_name: input.fullName ?? null,
        image_url: input.imageUrl ?? null,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    ),
    { data: null, error: { message: "Supabase 저장 시간 초과" } }
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "프로필 저장 완료" };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return null;
  }

  const { data, error } = await withDataTimeout(
    supabase
      .from("profiles")
      .select("id,email,full_name,image_url,username")
      .eq("id", userId)
      .maybeSingle(),
    { data: null, error: { message: "Supabase 조회 시간 초과" } }
  );

  if (error || !data) {
    return null;
  }

  return {
    id: String(data.id),
    email: String(data.email),
    fullName: data.full_name ? String(data.full_name) : null,
    imageUrl: data.image_url ? String(data.image_url) : null,
    username: data.username ? String(data.username) : null
  };
}

export async function updateUsername(userId: string, username: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return { ok: false, message: "Supabase 설정이 없습니다." };
  }

  const normalized = username.trim().toLowerCase();

  if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
    return { ok: false, message: "아이디는 영문 소문자, 숫자, 밑줄 3~20자로 입력하세요." };
  }

  const { data: duplicate, error: duplicateError } = await withDataTimeout(
    supabase
      .from("profiles")
      .select("id")
      .eq("username", normalized)
      .neq("id", userId)
      .maybeSingle(),
    { data: null, error: { message: "Supabase 조회 시간 초과" } }
  );

  if (duplicateError) {
    return { ok: false, message: duplicateError.message };
  }

  if (duplicate) {
    return { ok: false, message: "이미 사용 중인 아이디입니다." };
  }

  const { error } = await withDataTimeout(
    supabase
      .from("profiles")
      .update({ username: normalized, updated_at: new Date().toISOString() })
      .eq("id", userId),
    { data: null, error: { message: "Supabase 저장 시간 초과" } }
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "아이디 저장 완료" };
}
