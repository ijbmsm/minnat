/** 댓글 공감 토글. 1인 1공감 (PK 로 보장), 공감수는 트리거가 갱신한다. */
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { likeLimiter, checkRateLimit } from "@/lib/ratelimit";
import { isMissingTable } from "@/lib/engagement";

type Params = { params: Promise<{ commentId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { commentId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const { allowed } = await checkRateLimit(likeLimiter, `icl:${user.id}`);
  if (!allowed) return NextResponse.json({ error: "요청이 너무 많습니다" }, { status: 429 });

  const payload = await req.json().catch(() => ({})) as { liked?: boolean };
  const want = payload.liked !== false;

  const { error } = want
    ? await supabase.from("issue_comment_likes").upsert({ user_id: user.id, comment_id: commentId })
    : await supabase.from("issue_comment_likes").delete().eq("user_id", user.id).eq("comment_id", commentId);

  if (error) {
    if (isMissingTable(error)) return NextResponse.json({ error: "아직 준비되지 않은 기능입니다" }, { status: 503 });
    console.error("[api] comment like error:", error.message);
    return NextResponse.json({ error: "처리하지 못했습니다" }, { status: 500 });
  }
  return NextResponse.json({ liked: want });
}
