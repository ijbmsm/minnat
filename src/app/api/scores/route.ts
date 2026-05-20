import { NextResponse } from "next/server";
import { MOCK_ISSUES } from "@/lib/mock-data";
import { calculateScores, getCategoryBreakdown } from "@/lib/score";

export async function GET() {
  const score = calculateScores(MOCK_ISSUES);
  const blueBreakdown = getCategoryBreakdown(MOCK_ISSUES, "blue");
  const redBreakdown = getCategoryBreakdown(MOCK_ISSUES, "red");

  return NextResponse.json({
    ...score,
    breakdown: { blue: blueBreakdown, red: redBreakdown },
    updatedAt: new Date().toISOString(),
  });
}
