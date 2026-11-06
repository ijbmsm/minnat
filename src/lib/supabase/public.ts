import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * 공개 읽기 전용 클라이언트 — anon 키, 쿠키 없음.
 *
 * 공개 페이지(정치·이슈·사안·정치인)의 데이터 조회는 이걸 쓴다.
 * supabase/server.ts 의 createClient() 는 cookies() 를 읽는데, 페이지 렌더 중에
 * cookies() 를 한 번이라도 부르면 Next 가 그 페이지를 동적 렌더로 바꿔
 * `export const revalidate = 300` 이 무시된다 (2026-11-03 실측: 매 요청 MISS, TTFB 2.4s).
 * 로그인 사용자별 데이터가 필요한 곳(API·마이페이지·사주)은 계속 server.ts 를 쓴다.
 */
let client: SupabaseClient | null = null;

export function createPublicClient(): SupabaseClient {
  client ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return client;
}
