import { Nav } from "@/components/nav";
import { SCORED_CATEGORIES, ARCHIVE_CATEGORIES, CRIMINAL_STAGE_LABEL, CRIMINAL_STAGE_WEIGHT } from "@/lib/constants";

export const metadata = {
  title: "방법론 — 민낯",
  description: "민낯의 점수 산출 방법론, 데이터 수집 기준, 신뢰도 게이트를 전체 공개합니다.",
};

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 pt-24 pb-20">
        <h1 className="mb-2 text-3xl font-bold">방법론</h1>
        <p className="mb-12 text-sm text-white/40">
          민낯의 모든 룰은 공개합니다. 시비 들어오면 룰로 답합니다.
        </p>

        {/* 핵심 철학 */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-white/90">핵심 철학</h2>
          <div className="space-y-3 text-sm leading-relaxed text-white/60">
            <p className="font-medium text-white/80">
              &quot;우리는 점수 매기지 않는다. 사회·제도의 반응을 측정만 한다.&quot;
            </p>
            <p>
              검찰이 기소했다, 법원이 유죄를 선고했다, 감사원이 적발했다 —
              이런 공식 처분만 점수화합니다. 막말, 위선, 정책 호불호는
              원문을 보존하되 점수를 매기지 않습니다.
            </p>
            <p>
              정치인 개인을 종합 평가하지 않습니다. 이슈 단위만 다룹니다.
              판단은 사용자의 몫입니다.
            </p>
          </div>
        </section>

        {/* 점수 카테고리 */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-white/90">점수 카테고리 (공식 처분)</h2>
          <div className="space-y-3">
            {SCORED_CATEGORIES.map((cat) => (
              <div key={cat.key} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-sm font-medium text-white/70">{cat.label}</p>
                <p className="text-xs text-white/40">{cat.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Archive 카테고리 */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-white/90">기록 카테고리 (점수 없음)</h2>
          <p className="mb-4 text-sm text-white/40">
            원문과 맥락을 보존하되 점수를 매기지 않습니다. 판단은 사용자의 몫입니다.
          </p>
          <div className="space-y-2">
            {ARCHIVE_CATEGORIES.map((cat) => (
              <div key={cat.key} className="flex items-center justify-between rounded-lg border border-white/[0.03] px-4 py-2.5">
                <span className="text-sm text-white/50">{cat.label}</span>
                <span className="text-xs text-white/25">{cat.description}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 형사 단계 가중치 */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-white/90">형사 처분 단계별 가중치</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs text-white/30">
                  <th className="pb-2 pr-4">단계</th>
                  <th className="pb-2 pr-4 text-right">가중치</th>
                  <th className="pb-2">처리</th>
                </tr>
              </thead>
              <tbody>
                {(Object.entries(CRIMINAL_STAGE_WEIGHT) as [string, number][]).map(([stage, weight]) => (
                  <tr key={stage} className="border-b border-white/[0.03]">
                    <td className="py-2.5 pr-4 text-white/60">{CRIMINAL_STAGE_LABEL[stage as keyof typeof CRIMINAL_STAGE_LABEL]}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-white/50">{weight}</td>
                    <td className="py-2.5 text-xs text-white/30">
                      {weight === 0 ? "점수 0 (UI 숨김)" : weight === 10 && stage === "pardoned" ? "점수 유지 (죄 무효 X)" : "점수 반영"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 점수 공식 */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-white/90">점수 공식</h2>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <div className="space-y-2 font-mono text-sm text-white/60">
              <p>base = 보도량(×0.40) + 공식처리단계(×0.35) + 지속일수(×0.25)</p>
              <p>score = base × 진영다양도(0.7~1.3) × 직책가중치(0.5~1.2) × 시간감쇠</p>
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-white/30">
              <p>보도량: 보도 매체 수 (1~15+ → 0~1 정규화)</p>
              <p>공식처리: 형사 = 단계별 가중치, 기타 = 기본 5/10</p>
              <p>지속일수: 첫 보도~마지막 보도 일수 (1~20+ → 0~1)</p>
              <p>진영다양도: 좌+중+우 ×1.3 / 두 진영 ×1.0 / 단독 ×0.7</p>
              <p>직책: 대통령 ×1.2 / 의원 ×0.8 / 후보 ×0.5</p>
            </div>
          </div>
        </section>

        {/* 시간 감쇠 */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-white/90">시간 감쇠 (뷰별)</h2>
          <div className="space-y-2 text-sm">
            {[
              { view: "최근 30일 (Hot)", formula: "score / (경과시간+2)^1.8" },
              { view: "1년 (Recent)", formula: "score × e^(-0.005t) — 반감기 140일" },
              { view: "5년 (Mid-term)", formula: "score × max(0.3, e^(-0.002t)) — 30% floor" },
              { view: "역대 (All-time)", formula: "무감쇠" },
            ].map((item) => (
              <div key={item.view} className="flex items-center justify-between rounded-lg border border-white/[0.03] px-4 py-2.5">
                <span className="text-white/50">{item.view}</span>
                <span className="font-mono text-xs text-white/30">{item.formula}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 신뢰도 게이트 */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-white/90">신뢰도 게이트</h2>
          <div className="space-y-3">
            {[
              { signal: "자기 진영 매체가 자기 진영 비판 + 다수 매체", level: "HIGH" },
              { signal: "좌+중+우 매체 다양 보도", level: "HIGH" },
              { signal: "본인 공식 시인·사과", level: "HIGH" },
              { signal: "공식 기관 처분 (검찰·법원·윤리위·감사원·선관위)", level: "HIGH" },
              { signal: "다중 매체 + 물증 (영상·녹취)", level: "HIGH" },
              { signal: "반대 진영 매체 단독 보도", level: "LOW — 보류" },
            ].map((item) => (
              <div key={item.signal} className="flex items-start gap-3 rounded-lg border border-white/[0.03] px-4 py-2.5">
                <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  item.level === "HIGH" ? "bg-green-500/10 text-green-400/60" : "bg-amber-500/10 text-amber-400/60"
                }`}>
                  {item.level.split(" ")[0]}
                </span>
                <span className="text-sm text-white/50">{item.signal}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 안 하는 것 */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-white/90">명시적으로 안 하는 것</h2>
          <div className="space-y-1.5">
            {[
              "정치인 개인 종합 점수",
              "정치인 랭킹 (TOP 10 등)",
              '"X당이 더 나쁘다" 결론 문구',
              "막말·위선·정책 호불호 점수화",
              "표결 점수화 (의견은 점수 X)",
              "법안 통과 자체 가점",
              "추측·평가·단정 표현",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-red-400/40">✕</span>
                <span className="text-white/40">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 핵심 원칙 */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-white/90">핵심 원칙</h2>
          <div className="space-y-2">
            {[
              "사회·제도의 반응 측정 — 우리가 판단하지 않는다",
              "출처 투명 — 모든 점수에 원문 링크",
              "방법론 공개 — 가중치, 공식, 룰 전체 Git 기록",
              "양쪽 동일 기준 — 동일 처분 동일 점수",
              "의석수 보정 — 총합 + 1인당 평균 병기",
              "편향 감사 — 주간 자동 + 분기 자문위 점검",
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
