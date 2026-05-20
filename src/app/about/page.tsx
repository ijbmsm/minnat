import { Nav } from "@/components/nav";
import { CATEGORIES, SEVERITY_MULTIPLIER, IMPACT_MULTIPLIER, SOURCE_TIER_LABEL } from "@/lib/constants";

export const metadata = {
  title: "방법론 — 민낯",
  description: "민낯 스코어보드의 점수 산출 방법론과 데이터 수집 기준을 전체 공개합니다.",
};

export default function AboutPage() {
  const scoredCategories = CATEGORIES.filter((c) => c.isScored);
  const unscoredCategories = CATEGORIES.filter((c) => !c.isScored);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 pt-24 pb-20">
        <h1 className="mb-2 text-3xl font-bold">방법론</h1>
        <p className="mb-12 text-sm text-white/40">
          민낯의 점수 산출 방법, 데이터 수집 기준, 소스 신뢰도 체계를 전체 공개합니다.
        </p>

        {/* 프로젝트 취지 */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-white/90">프로젝트 취지</h2>
          <div className="space-y-3 text-sm leading-relaxed text-white/60">
            <p>
              정치판은 매일 상대 진영을 까내리기에 바쁩니다. 자기 진영의 문제는 눈 감고,
              상대방의 잘못만 확대합니다. 국민은 팩트가 뭔지 모른 채 감정에 휘둘립니다.
            </p>
            <p>
              민낯은 &quot;니네 진영 스스로 자정작용 할 생각은 없어?&quot;라는 질문에서 시작했습니다.
              공신력 있는 출처만으로 양쪽 진영의 점수를 동일한 기준으로 산출하고,
              모든 근거를 투명하게 공개합니다.
            </p>
            <p className="font-medium text-white/80">
              &quot;우리는 편들지 않는다. 팩트가 편을 든다.&quot;
            </p>
          </div>
        </section>

        {/* 소스 신뢰도 */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-white/90">소스 신뢰도 체계</h2>
          <p className="mb-4 text-sm text-white/40">
            소스 신뢰도는 점수에 곱하지 않습니다. 임계값 방식으로, 신뢰도가 낮은 소스의 이슈는 점수에 반영하지 않습니다.
          </p>
          <div className="space-y-3">
            {[
              { tier: 1, label: "공식 기관", desc: "국회, 법원, 선관위 등", rule: "즉시 점수 반영", examples: "국회 의안정보시스템, 대한민국 법원, 중앙선거관리위원회" },
              { tier: 2, label: "팩트체크 기관", desc: "대학/언론 팩트체크", rule: "즉시 점수 반영", examples: "SNU 팩트체크센터, JTBC 팩트체크, KBS 팩트체크" },
              { tier: 3, label: "주요 언론", desc: "스트레이트 뉴스만", rule: "교차검증 후 반영 (2개 이상 언론사 보도 시)", examples: "연합뉴스, KBS, MBC, SBS, 조선/중앙/동아, 한겨레/경향" },
              { tier: 4, label: "보조 참고", desc: "이슈 발굴용만", rule: "점수 절대 미반영 (회색 표시만)", examples: "위키트리, 인사이트 등" },
            ].map((item) => (
              <div key={item.tier} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold tabular-nums">
                    Tier {item.tier}
                  </span>
                  <span className="text-sm font-medium text-white/70">{item.label}</span>
                </div>
                <p className="mb-1 text-xs text-white/40">{item.desc}</p>
                <p className="mb-1 text-xs text-green-400/60">{item.rule}</p>
                <p className="text-xs text-white/25">{item.examples}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 카테고리 */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-white/90">이슈 카테고리</h2>

          <h3 className="mb-3 text-sm font-semibold text-white/50">점수 반영 (10개)</h3>
          <div className="mb-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs text-white/30">
                  <th className="pb-2 pr-4">카테고리</th>
                  <th className="pb-2 pr-4">설명</th>
                  <th className="pb-2 pr-4 text-right">가중치</th>
                  <th className="pb-2 text-right">유형</th>
                </tr>
              </thead>
              <tbody>
                {scoredCategories.map((cat) => (
                  <tr key={cat.key} className="border-b border-white/[0.03]">
                    <td className="py-2.5 pr-4 font-medium text-white/70">{cat.label}</td>
                    <td className="py-2.5 pr-4 text-white/40">{cat.description}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-white/50">
                      {cat.isPositive ? `+${cat.baseWeight}` : cat.baseWeight}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={`text-xs ${cat.isPositive ? "text-green-400/60" : "text-red-400/60"}`}>
                        {cat.isPositive ? "가점" : "감점"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mb-3 text-sm font-semibold text-white/50">점수 미반영 (1개)</h3>
          {unscoredCategories.map((cat) => (
            <div key={cat.key} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-sm font-medium text-amber-400/80">{cat.label}</p>
              <p className="text-xs text-white/40">{cat.description}</p>
            </div>
          ))}
        </section>

        {/* 점수 산출 공식 */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-white/90">점수 산출 공식</h2>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <p className="mb-4 font-mono text-sm text-white/70">
              이슈 점수 = 기본가중치 &times; 시간감쇠 &times; 심각도 &times; 영향범위
            </p>

            <div className="space-y-4 text-sm">
              <div>
                <p className="mb-2 text-white/40">심각도 배수</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(SEVERITY_MULTIPLIER) as [string, number][]).map(([key, val]) => (
                    <span key={key} className="rounded-md bg-white/5 px-2.5 py-1 text-xs text-white/50">
                      {key}: &times;{val}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-white/40">영향 범위 배수</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(IMPACT_MULTIPLIER) as [string, number][]).map(([key, val]) => (
                    <span key={key} className="rounded-md bg-white/5 px-2.5 py-1 text-xs text-white/50">
                      {key}: &times;{val}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-white/40">시간 감쇠</p>
                <p className="text-xs text-white/30">
                  e^(-0.01 &times; 경과일수) — 1일 전: 0.99, 30일: 0.74, 90일: 0.41, 365일: 0.026
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 진영별 퍼센티지 */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-white/90">진영별 퍼센티지 산출</h2>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 font-mono text-sm leading-relaxed text-white/60">
            <p>파랑 순점수 = 파랑 감점 합계 - 파랑 가점 합계</p>
            <p>빨강 순점수 = 빨강 감점 합계 - 빨강 가점 합계</p>
            <p className="mt-2">총합 = 파랑 순점수 + 빨강 순점수</p>
            <p>파랑 비율 = (파랑 순점수 / 총합) &times; 100%</p>
            <p>빨강 비율 = 100% - 파랑 비율</p>
            <p className="mt-2 text-white/30">
              → 비율이 높을수록 해당 진영의 부정적 이슈가 많다는 뜻
            </p>
          </div>
        </section>

        {/* 핵심 원칙 */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-white/90">핵심 원칙</h2>
          <div className="space-y-2">
            {[
              "팩트만 — 의견, 추측, 루머 수집 금지",
              "출처 투명 — 모든 점수에 원문 링크",
              "방법론 공개 — 가중치, 공식 전체 공개",
              "양쪽 동일 기준 — 동일 행위 동일 점수",
              "자정작용 — 상대편 까기 전에 니네 진영부터",
              "오류 정정 — 이의 제기 시 48시간 내 검토",
            ].map((principle, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 text-xs tabular-nums text-white/20">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-white/60">{principle}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
