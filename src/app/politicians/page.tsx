import { Nav } from "@/components/nav";
import { getPoliticians } from "@/lib/data";
import { CAMP_COLORS } from "@/lib/constants";
import Link from "next/link";

export const metadata = {
  title: "정치인 스코어카드 — 민낯",
  description: "정치인별 이슈 점수와 의정 활동 요약",
};

export const revalidate = 300;

export default async function PoliticiansPage() {
  const politicians = await getPoliticians();

  const blueList = politicians.filter((p) => p.party?.camp === "blue");
  const redList = politicians.filter((p) => p.party?.camp === "red");

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-4 pt-24 pb-20">
        <h1 className="mb-2 text-3xl font-bold">정치인 스코어카드</h1>
        <p className="mb-8 text-sm text-white/40">
          각 정치인의 이슈 기반 점수와 활동 요약
        </p>

        {/* 역대 대통령 링크 */}
        <Link
          href="/politicians/presidents"
          className="group mb-10 flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-white/10 hover:bg-white/[0.04]"
        >
          <div>
            <h2 className="text-lg font-semibold text-white/80 transition-colors group-hover:text-white">
              역대 대통령
            </h2>
            <p className="mt-1 text-xs text-white/30">
              형사 처분 · 가족측근 비리 · 사면 · 경제 성적표
            </p>
          </div>
          <span className="text-white/20 transition-colors group-hover:text-white/40">&rarr;</span>
        </Link>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          {/* 파랑 */}
          <div>
            <h2
              className="mb-4 text-sm font-semibold tracking-wide"
              style={{ color: CAMP_COLORS.blue.glow }}
            >
              {CAMP_COLORS.blue.label} ({blueList.length}명)
            </h2>
            <div className="space-y-1">
              {blueList.map((p) => (
                <Link
                  key={p.id}
                  href={`/politicians/${p.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5"
                >
                  <span className="text-white/70">{p.name}</span>
                  <span className="text-xs text-white/30">{p.position}</span>
                </Link>
              ))}
              {blueList.length === 0 && (
                <p className="py-4 text-center text-xs text-white/20">데이터 없음</p>
              )}
            </div>
          </div>

          {/* 빨강 */}
          <div>
            <h2
              className="mb-4 text-sm font-semibold tracking-wide"
              style={{ color: CAMP_COLORS.red.glow }}
            >
              {CAMP_COLORS.red.label} ({redList.length}명)
            </h2>
            <div className="space-y-1">
              {redList.map((p) => (
                <Link
                  key={p.id}
                  href={`/politicians/${p.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5"
                >
                  <span className="text-white/70">{p.name}</span>
                  <span className="text-xs text-white/30">{p.position}</span>
                </Link>
              ))}
              {redList.length === 0 && (
                <p className="py-4 text-center text-xs text-white/20">데이터 없음</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
