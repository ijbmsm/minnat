import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const bluePct = Number(searchParams.get("blue") ?? 50);
  const redPct = Number(searchParams.get("red") ?? 50);
  const title = searchParams.get("title") ?? "팩트로 보는 대한민국 정치";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0c",
          fontFamily: "sans-serif",
        }}
      >
        {/* 타이틀 */}
        <div
          style={{
            fontSize: 24,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.15em",
            marginBottom: 16,
          }}
        >
          술자리
        </div>
        <div
          style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.3)",
            marginBottom: 40,
            maxWidth: 500,
            textAlign: "center",
          }}
        >
          {title}
        </div>

        {/* 게이지바 */}
        <div
          style={{
            display: "flex",
            width: 800,
            height: 80,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {/* 파랑 */}
          <div
            style={{
              width: `${bluePct}%`,
              height: "100%",
              background: "linear-gradient(135deg, #2563ebcc, #2563eb66)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 36, fontWeight: 700, color: "white" }}>
              {bluePct}%
            </span>
          </div>
          {/* 빨강 */}
          <div
            style={{
              width: `${redPct}%`,
              height: "100%",
              background: "linear-gradient(135deg, #dc262666, #dc2626cc)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 36, fontWeight: 700, color: "white" }}>
              {redPct}%
            </span>
          </div>
        </div>

        {/* 라벨 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: 800,
            marginTop: 16,
          }}
        >
          <span style={{ fontSize: 14, color: "#3b82f6" }}>더불어민주당 계열</span>
          <span style={{ fontSize: 14, color: "#ef4444" }}>국민의힘 계열</span>
        </div>

        {/* 부제 */}
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.2)",
            marginTop: 40,
          }}
        >
          색안경 벗고, 팩트로 보는 정치 — drinkplace.kr
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
