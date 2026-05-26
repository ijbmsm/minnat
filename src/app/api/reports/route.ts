import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { reportLimiter, checkRateLimit } from "@/lib/ratelimit";

export async function POST(request: Request) {
  const body = await request.json();
  const { reporter_name, actor_name, category, description, source_url } = body;

  if (!actor_name || !category || !description || !source_url) {
    return NextResponse.json(
      { error: "필수 항목을 모두 입력해주세요" },
      { status: 400 }
    );
  }

  // 기본 URL 형식 검증
  if (!source_url.startsWith("http://") && !source_url.startsWith("https://")) {
    return NextResponse.json(
      { error: "올바른 URL을 입력해주세요 (http:// 또는 https://)" },
      { status: 400 }
    );
  }

  // 레이트리밋
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = await checkRateLimit(reportLimiter, ip);
  if (!allowed) {
    return NextResponse.json({ error: "너무 많은 제보를 보냈습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_name: reporter_name || "익명",
    actor_name,
    category,
    description,
    source_url,
  });

  if (error) {
    console.error("[api] report insert error:", error.message);
    return NextResponse.json({ error: "제보 등록에 실패했습니다" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
