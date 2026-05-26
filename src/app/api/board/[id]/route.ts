import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("board_posts")
    .select("id, user_id, camp, title, content, like_count, view_count, created_at")
    .eq("id", id)
    .single();

  if (error || !post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
  }

  // 조회수 증가 (비동기, 실패해도 무시)
  supabase
    .from("board_posts")
    .update({ view_count: post.view_count + 1 })
    .eq("id", id)
    .then(() => {});

  return NextResponse.json({ post: { ...post, view_count: post.view_count + 1 } });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  // 본인 글인지 확인
  const { data: post } = await supabase
    .from("board_posts")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
  }

  if (post.user_id !== user.id) {
    return NextResponse.json({ error: "본인의 글만 삭제할 수 있습니다" }, { status: 403 });
  }

  const { error } = await supabase.from("board_posts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "삭제에 실패했습니다" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
