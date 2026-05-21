import { NextRequest, NextResponse } from "next/server";
import { getIssues } from "@/lib/data";
import { calculateIssueScore } from "@/lib/score";
import type { Camp, IssueCategory } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const camp = searchParams.get("camp") as Camp | null;
  const category = searchParams.get("category") as IssueCategory | null;
  const sort = searchParams.get("sort") ?? "latest";

  let issues = await getIssues({
    camp: camp ?? undefined,
    category: category ?? undefined,
  });

  if (sort === "score") {
    issues.sort((a, b) => calculateIssueScore(b) - calculateIssueScore(a));
  }

  return NextResponse.json({
    issues,
    total: issues.length,
  });
}
