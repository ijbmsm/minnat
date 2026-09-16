import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * service_role 클라이언트 — 서버 전용. RLS 를 우회하므로 절대 클라이언트 번들에 넣지 말 것.
 * 공개 공유 조회처럼 "행은 읽되 민감 컬럼은 응답에서 걸러야 하는" 경로에서만 쓴다.
 */
export function createServiceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_KEY 미설정");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
