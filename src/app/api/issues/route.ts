import { NextRequest, NextResponse } from "next/server";
import { MOCK_ISSUES } from "@/lib/mock-data";
import { calculateIssueScore } from "@/lib/score";
import type { Camp, IssueCategory } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const camp = searchParams.get("camp") as Camp | null;
  const category = searchParams.get("category") as IssueCategory | null;
  const sort = searchParams.get("sort") ?? "latest";

  let issues = [...MOCK_ISSUES];

  if (camp) {
    issues = issues.filter((i) => i.camp === camp);
  }
  if (category) {
    issues = issues.filter((i) => i.category === category);
  }

  if (sort === "score") {
    issues.sort((a, b) => calculateIssueScore(b) - calculateIssueScore(a));
  } else {
    issues.sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
  }

  return NextResponse.json({
    issues,
    total: issues.length,
  });
}
