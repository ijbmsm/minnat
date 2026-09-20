import Link from "next/link";
import { Nav } from "@/components/nav";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { listStories } from "@/lib/stories";
import { storyDuration, campBalance } from "@/lib/story-format";
import { CampChip } from "@/components/camp-chip";
import { CAMP_COLORS } from "@/lib/constants";

export const metadata = {
  title: "사건 추적",
  description:
    "하나의 사안이 처음 제기된 시점부터 지금까지 어떻게 이어졌는지를 국면별로 정리합니다. 확정된 사실과 수사기관의 혐의, 한쪽의 주장을 구분해 표시합니다.",
  alternates: { canonical: "https://drinkplace.kr/stories" },
};

export const revalidate = 300;

export default async function Page() {
  const stories = await listStories();
  const balance = campBalance(stories);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "술자리", url: "https://drinkplace.kr" },
          { name: "사건 추적", url: "https://drinkplace.kr/stories" },
        ]}
      />
      <Nav />
      <main className="min-h-screen bg-[#0a0a0a] px-5 pb-28 text-[#e8e8e8]">
        <div className="mx-auto w-full max-w-[680px] pt-28">
          <h1 className="m-0 text-[32px] font-extrabold tracking-[-0.025em] text-white">사건 추적</h1>
          <p className="mt-3 text-[15px] leading-[1.8] text-[#8a8a8a] [text-wrap:pretty]">
            하나의 사안이 처음 제기된 시점부터 지금까지 어떻게 이어졌는지를 국면별로 정리합니다.
            확정된 사실과 수사기관의 혐의, 한쪽의 주장을 색으로 구분합니다.
          </p>

          {/* 진영 균형 — 한쪽만 잘 정리돼 있으면 그 자체가 편향이다. 숨기지 않고 드러낸다 */}
          <div className="mt-6 rounded-xl border border-[#1c1c1f] bg-[#0e0e10] px-4 py-3.5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px]">
              <span className="text-[#6f6f6f]">정리된 사안</span>
              {(["blue", "red"] as const).map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5" style={{ color: CAMP_COLORS[c].glow }}>
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CAMP_COLORS[c].primary }} />
                  {CAMP_COLORS[c].label} {balance[c]}건
                </span>
              ))}
              {balance.both > 0 && <span className="text-[#c8c8c8]">양측 {balance.both}건</span>}
            </div>
            <div aria-hidden className="mt-3 flex h-1 gap-0.5 overflow-hidden rounded-full bg-[#17171a]">
              <span className="h-full" style={{ flexGrow: balance.blue, backgroundColor: "#2563eb" }} />
              <span className="h-full" style={{ flexGrow: balance.both, backgroundColor: "#4a4a4f" }} />
              <span className="h-full" style={{ flexGrow: balance.red, backgroundColor: "#dc2626" }} />
            </div>
            <p className="m-0 mt-2.5 text-[12px] leading-[1.7] text-[#5f5f5f]">
              건수는 어느 진영의 잘못이 많다는 뜻이 아니라, 우리가 어느 쪽을 덜 정리했는지를 보여주는 숫자입니다.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            {stories.map((s) => (
              <Link
                key={s.slug}
                href={`/stories/${s.slug}`}
                className="group rounded-2xl border border-[#1c1c1f] bg-[#0e0e10] px-5 py-5 transition-colors hover:border-[#2c2c31] hover:bg-[#131316]"
              >
                <div className="flex flex-wrap items-center gap-2.5 text-[12.5px]">
                  <span className="inline-flex items-center gap-1.5 text-[#c8c8c8]">
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: s.status === "ongoing" ? "#d3a24a" : "#6f6f6f" }}
                    />
                    {s.status === "ongoing" ? "진행중" : "종결"}
                  </span>
                  <span className="text-[#5f5f5f]">·</span>
                  <span className="tabular-nums text-[#8a8a8a]">{storyDuration(s).label}</span>
                  <span className="text-[#5f5f5f]">·</span>
                  <span className="text-[#8a8a8a]">{s.status_label}</span>
                  <span className="ml-auto"><CampChip camp={s.camp} /></span>
                </div>

                <h2 className="m-0 mt-3 text-[22px] font-bold tracking-[-0.02em] text-white transition-colors group-hover:text-white">
                  {s.title}
                </h2>
                <p className="m-0 mt-2.5 text-[15px] leading-[1.75] text-[#8f8f8f] [text-wrap:pretty]">
                  {s.blurb}
                </p>
                <p className="m-0 mt-3.5 text-[12.5px] text-[#5f5f5f]">
                  {s.chapter_count}개 국면 · 근거 기사 {s.article_count}건
                </p>
              </Link>
            ))}
          </div>

          {stories.length === 0 && (
            <p className="mt-8 rounded-2xl border border-[#1c1c1f] py-12 text-center text-[14px] text-[#6f6f6f]">
              아직 정리된 사안이 없습니다.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
