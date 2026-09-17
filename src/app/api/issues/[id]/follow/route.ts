/**
 * 이슈 라인 팔로우.
 *
 * 팔로우 단위는 기사가 아니라 사건(issue_clusters)이다. 같은 사건의 다른 기사로
 * 넘어가도 상태가 유지돼야 하기 때문. 경로의 id 는 기사 id 이고 서버에서 event_id 로 바꾼다.
 */
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { likeLimiter, checkRateLimit } from "@/lib/ratelimit";
import { isMissingTable } from "@/lib/engagement";

type Params = { params: Promise<{ id: string }> };

async function resolveEventId(supabase: Awaited<ReturnType<typeof createClient>>, issueId: string) {
  const { data } = await supabase.from("issues").select("event_id").eq("id", issueId).maybeSingle<{ event_id: string | null }>();
  return data?.event_id ?? null;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // 비로그인이어도 테이블 존재는 확인한다 — 021 미적용 환경에서 버튼만 떠 있다가
  // 로그인 후 503 이 나는 상황을 막는다.
  if (!user) {
    const { error } = await supabase.from("issue_follows").select("event_id").limit(1);
    if (error && isMissingTable(error)) {
      return NextResponse.json({ available: false, loggedIn: false, following: false });
    }
    return NextResponse.json({ available: true, loggedIn: false, following: false });
  }

  const eventId = await resolveEventId(supabase, id);
  if (!eventId) return NextResponse.json({ available: false, loggedIn: true, following: false });

  const { data, error } = await supabase
    .from("issue_follows")
    .select("event_id")
    .eq("user_id", user.id)
    .eq("event_id", eventId)
    .maybeSingle();

  if (error && isMissingTable(error)) {
    return NextResponse.json({ available: false, loggedIn: true, following: false });
  }
  if (error) {
    console.error("[api] follow get error:", error.message);
    return NextResponse.json({ available: false, loggedIn: true, following: false });
  }
  return NextResponse.json({ available: true, loggedIn: true, following: !!data });
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const { allowed } = await checkRateLimit(likeLimiter, `follow:${user.id}`);
  if (!allowed) return NextResponse.json({ error: "요청이 너무 많습니다" }, { status: 429 });

  const eventId = await resolveEventId(supabase, id);
  if (!eventId) return NextResponse.json({ error: "사건을 찾을 수 없습니다" }, { status: 404 });

  const body = await req.json().catch(() => ({})) as { following?: boolean };
  const want = body.following !== false;

  const { error } = want
    ? await supabase.from("issue_follows").upsert({ user_id: user.id, event_id: eventId })
    : await supabase.from("issue_follows").delete().eq("user_id", user.id).eq("event_id", eventId);

  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json({ error: "아직 준비되지 않은 기능입니다", available: false }, { status: 503 });
    }
    console.error("[api] follow toggle error:", error.message);
    return NextResponse.json({ error: "처리하지 못했습니다" }, { status: 500 });
  }

  return NextResponse.json({ available: true, loggedIn: true, following: want });
}
