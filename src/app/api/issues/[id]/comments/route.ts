/**
 * 이슈 댓글 — 목록(GET) · 작성(POST).
 *
 * 진영 배지는 추정하지 않는다. 작성 시점의 user_profiles.display_camp (본인이 고른 값)를
 * 복사해 저장한다. board_posts.camp 와 같은 규약.
 */
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { postLimiter, checkRateLimit } from "@/lib/ratelimit";
import {
  isMissingTable, maskName, COMMENT_MAX, COMMENT_PAGE,
  type CommentsResponse, type IssueCommentDto, type CommentSort,
} from "@/lib/engagement";

type Params = { params: Promise<{ id: string }> };

interface CommentRow {
  id: string;
  user_id: string;
  camp: "blue" | "red" | "free";
  body: string;
  like_count: number;
  created_at: string;
}

const EMPTY = (loggedIn: boolean): CommentsResponse => ({ available: false, total: 0, items: [], loggedIn });

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const sort: CommentSort = searchParams.get("sort") === "new" ? "new" : "top";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("issue_comments")
    .select("id, user_id, camp, body, like_count, created_at", { count: "exact" })
    .eq("issue_id", id)
    .is("deleted_at", null);

  query = sort === "top"
    ? query.order("like_count", { ascending: false }).order("created_at", { ascending: false })
    : query.order("created_at", { ascending: false });

  const { data, error, count } = await query.limit(COMMENT_PAGE);

  if (error) {
    if (!isMissingTable(error)) console.error("[api] comments list error:", error.message);
    return NextResponse.json(EMPTY(!!user));
  }

  const rows = (data ?? []) as CommentRow[];
  if (rows.length === 0) {
    return NextResponse.json({ available: true, total: count ?? 0, items: [], loggedIn: !!user } satisfies CommentsResponse);
  }

  // 닉네임 · 내가 누른 공감 — 두 번의 in() 쿼리로 끝낸다 (N+1 금지)
  const userIds = [...new Set(rows.map(r => r.user_id))];
  const commentIds = rows.map(r => r.id);

  const [{ data: profiles }, { data: myLikes }] = await Promise.all([
    supabase.from("user_profiles").select("id, kakao_nickname").in("id", userIds),
    user
      ? supabase.from("issue_comment_likes").select("comment_id").eq("user_id", user.id).in("comment_id", commentIds)
      : Promise.resolve({ data: [] as { comment_id: string }[] }),
  ]);

  const nickById = new Map((profiles ?? []).map(p => [p.id as string, p.kakao_nickname as string | null]));
  const liked = new Set((myLikes ?? []).map(l => (l as { comment_id: string }).comment_id));

  const items: IssueCommentDto[] = rows.map(r => {
    const nick = nickById.get(r.user_id) ?? null;
    const mine = user?.id === r.user_id;
    const masked = mine ? "나" : maskName(nick);
    return {
      id: r.id,
      maskedName: masked,
      initial: [...masked][0] ?? "익",
      camp: r.camp,
      body: r.body,
      likeCount: r.like_count ?? 0,
      createdAt: r.created_at,
      likedByMe: liked.has(r.id),
      mine,
    };
  });

  return NextResponse.json({ available: true, total: count ?? items.length, items, loggedIn: !!user } satisfies CommentsResponse);
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const { allowed } = await checkRateLimit(postLimiter, `issue-comment:${user.id}`);
  if (!allowed) return NextResponse.json({ error: "잠시 후 다시 시도해주세요" }, { status: 429 });

  const payload = await req.json().catch(() => ({})) as { body?: unknown };
  const body = typeof payload.body === "string" ? payload.body.trim().slice(0, COMMENT_MAX) : "";
  if (body.length < 2) return NextResponse.json({ error: "2자 이상 입력해주세요" }, { status: 400 });

  // 기사 존재 확인 — 없는 id 로 행이 쌓이는 걸 막는다
  const { data: issue } = await supabase.from("issues").select("id").eq("id", id).maybeSingle();
  if (!issue) return NextResponse.json({ error: "기사를 찾을 수 없습니다" }, { status: 404 });

  const { data: profile } = await supabase
    .from("user_profiles").select("display_camp, kakao_nickname").eq("id", user.id).maybeSingle<{ display_camp: string | null; kakao_nickname: string | null }>();
  const camp = (["blue", "red", "free"] as const).find(c => c === profile?.display_camp) ?? "free";

  const { data, error } = await supabase
    .from("issue_comments")
    .insert({ issue_id: id, user_id: user.id, camp, body })
    .select("id, created_at")
    .single<{ id: string; created_at: string }>();

  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json({ error: "아직 준비되지 않은 기능입니다" }, { status: 503 });
    }
    console.error("[api] comment insert error:", error.message);
    return NextResponse.json({ error: "등록하지 못했습니다" }, { status: 500 });
  }

  const item: IssueCommentDto = {
    id: data.id,
    maskedName: "나",
    initial: "나",
    camp,
    body,
    likeCount: 0,
    createdAt: data.created_at,
    likedByMe: false,
    mine: true,
  };
  return NextResponse.json({ item }, { status: 201 });
}
