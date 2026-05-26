import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { postLimiter, checkRateLimit } from "@/lib/ratelimit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const camp = searchParams.get("camp");
  const popular = searchParams.get("popular") === "true";
  const cursor = searchParams.get("cursor"); // created_at of last item
  const limit = 20;

  const supabase = await createClient();

  let query = supabase
    .from("board_posts")
    .select("id, camp, title, like_count, view_count, created_at");

  if (camp && ["blue", "red", "free"].includes(camp)) {
    query = query.eq("camp", camp);
  }

  if (popular) {
    query = query.gte("like_count", 5).order("like_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  if (cursor) {
    if (popular) {
      query = query.lt("like_count", parseInt(cursor, 10));
    } else {
      query = query.lt("created_at", cursor);
    }
  }

  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error("[api] board list error:", error.message);
    return NextResponse.json({ error: "게시글을 불러올 수 없습니다" }, { status: 500 });
  }

  const posts = data ?? [];
  const nextCursor = posts.length === limit
    ? (popular ? String(posts[posts.length - 1].like_count) : posts[posts.length - 1].created_at)
    : null;

  return NextResponse.json({ posts, nextCursor });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const body = await request.json();
  const { camp, title, content } = body;

  if (!camp || !title || !content) {
    return NextResponse.json({ error: "모든 항목을 입력해주세요" }, { status: 400 });
  }

  if (!["blue", "red", "free"].includes(camp)) {
    return NextResponse.json({ error: "올바른 진영을 선택해주세요" }, { status: 400 });
  }

  if (title.length < 2 || title.length > 100) {
    return NextResponse.json({ error: "제목은 2~100자 사이로 입력해주세요" }, { status: 400 });
  }

  if (content.length < 10 || content.length > 5000) {
    return NextResponse.json({ error: "내용은 10~5000자 사이로 입력해주세요" }, { status: 400 });
  }

  // 레이트리밋
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = await checkRateLimit(postLimiter, ip);
  if (!allowed) {
    return NextResponse.json({ error: "너무 많은 글을 작성했습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  // Honeypot 체크
  if (body.website) {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 403 });
  }

  // 시간 검증 (3초 미만 거부)
  if (body._ts) {
    const elapsed = Date.now() - Number(body._ts);
    if (elapsed < 3000) {
      return NextResponse.json({ error: "너무 빠른 요청입니다" }, { status: 429 });
    }
  }

  const { data: post, error } = await supabase
    .from("board_posts")
    .insert({ user_id: user.id, camp, title, content })
    .select("id")
    .single();

  if (error) {
    console.error("[api] board post error:", error.message);
    return NextResponse.json({ error: "글 등록에 실패했습니다" }, { status: 500 });
  }

  return NextResponse.json({ id: post.id });
}
