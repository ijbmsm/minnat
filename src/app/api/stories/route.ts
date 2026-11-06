import { NextResponse, type NextRequest } from "next/server";
import { listStories } from "@/lib/stories";

/** GET /api/stories?offset=30&limit=30 — 사안 목록 "더 보기". 정렬은 /stories 와 같다 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const offset = Math.max(0, Number(sp.get("offset")) || 0);
  const limit = Math.min(60, Math.max(1, Number(sp.get("limit")) || 30));
  const stories = await listStories();
  return NextResponse.json(stories.slice(offset, offset + limit), {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
