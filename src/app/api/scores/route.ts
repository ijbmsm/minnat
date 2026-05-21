import { NextResponse } from "next/server";
import { getIssues } from "@/lib/data";
import { calculateScores, getCategoryBreakdown } from "@/lib/score";

export async function GET() {
  const issues = await getIssues();
  const score = calculateScores(issues);
  const blueBreakdown = getCategoryBreakdown(issues, "blue");
  const redBreakdown = getCategoryBreakdown(issues, "red");

  return NextResponse.json({
    ...score,
    breakdown: { blue: blueBreakdown, red: redBreakdown },
    updatedAt: new Date().toISOString(),
  });
}
