import sharp from "sharp";
import { getSupabaseAdmin } from "./supabase";

const BUCKET = "hero-images";
const FILE_KEY = "hero.webp";

export async function getHeroImageUrl(): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(FILE_KEY);
  if (!data?.publicUrl) return null;

  // 버킷이 없거나 파일이 없으면 null 반환 — HEAD로 존재 확인
  try {
    const res = await fetch(data.publicUrl, { method: "HEAD", cache: "no-store" });
    if (!res.ok) return null;
  } catch {
    return null;
  }

  // 캐시 무효화를 위해 타임스탬프 쿼리 파라미터 추가
  return data.publicUrl;
}

export async function uploadHeroImage(file: File): Promise<{ ok: boolean; url?: string; message?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, message: "Supabase 설정이 없습니다." };

  // 버킷 없으면 생성
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (createError) return { ok: false, message: createError.message };
  }

  const bytes = await file.arrayBuffer();

  // 1024px 너비로 리사이즈 + WebP 압축 (quality 82)
  const compressed = await sharp(Buffer.from(bytes))
    .resize({ width: 1024, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(FILE_KEY, compressed, {
      contentType: "image/webp",
      upsert: true,
    });

  if (error) return { ok: false, message: error.message };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(FILE_KEY);
  return { ok: true, url: data.publicUrl };
}
