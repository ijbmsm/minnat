import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { likeLimiter, checkRateLimit } from "@/lib/ratelimit";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  // 레이트리밋
  const ip = _request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = await checkRateLimit(likeLimiter, ip);
  if (!allowed) {
    return NextResponse.json({ error: "너무 많은 요청입니다" }, { status: 429 });
  }

  // 이미 추천했는지 확인
  const { data: existing } = await supabase
    .from("board_likes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("post_id", id)
    .single();

  if (existing) {
    // 추천 취소
    await supabase
      .from("board_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", id);

    return NextResponse.json({ liked: false });
  }

  // 추천
  const { error } = await supabase
    .from("board_likes")
    .insert({ user_id: user.id, post_id: id });

  if (error) {
    console.error("[api] like error:", error.message);
    return NextResponse.json({ error: "추천에 실패했습니다" }, { status: 500 });
  }

  return NextResponse.json({ liked: true });
}
