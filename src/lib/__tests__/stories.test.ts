import { describe, it, expect } from "vitest";
import { deriveGrade, storyDuration, campBalance } from "../story-format";
import type { StorylineSummary } from "@/types";

/**
 * 등급 도출은 크롤러(storyline_shape.event_grade)와 **같은 규칙이어야 한다.**
 * 한쪽만 바뀌면 목록의 배지와 DB 의 장 등급이 서로 다른 말을 한다.
 * 크롤러 쪽 테스트는 tests/test_storyline_shape.py 에 같은 표로 있다.
 */
const issue = (over: Partial<Parameters<typeof deriveGrade>[0]> = {}) => ({
  criminal_stage: null,
  institutional_stage: null,
  category: "media_coverage",
  source_tier: 3,
  verified: false,
  ...over,
});

describe("deriveGrade", () => {
  it("법원 판단이 난 단계는 확정", () => {
    for (const stage of ["guilty_1st", "guilty_2nd", "confirmed", "pardoned"]) {
      expect(deriveGrade(issue({ criminal_stage: stage }))).toBe("confirmed");
    }
  });

  it("무죄·혐의없음도 확정이다", () => {
    // 유죄만 확정으로 치면 한쪽만 기록된다
    expect(deriveGrade(issue({ criminal_stage: "not_guilty" }))).toBe("confirmed");
    expect(deriveGrade(issue({ criminal_stage: "no_charges" }))).toBe("confirmed");
  });

  it("수사·기소는 혐의지 확정이 아니다", () => {
    for (const stage of ["investigation", "indicted", "suspended_indictment"]) {
      expect(deriveGrade(issue({ criminal_stage: stage }))).toBe("alleged");
    }
  });

  it("본인 시인·공식기관 처분은 검증됐을 때만 확정", () => {
    expect(deriveGrade(issue({ category: "self_admission", verified: true }))).toBe("confirmed");
    expect(deriveGrade(issue({ category: "self_admission", verified: false }))).toBe("alleged");
  });

  it("1차 출처 기록은 확정", () => {
    expect(deriveGrade(issue({ category: "policy_record", source_tier: 1, verified: true }))).toBe("confirmed");
  });

  it("보도·논란 발언은 주장", () => {
    expect(deriveGrade(issue({ category: "media_coverage" }))).toBe("claim");
    expect(deriveGrade(issue({ category: "controversial_statement" }))).toBe("claim");
  });

  it("제도적 결정은 확정이다", () => {
    // 국회가 가결했다·헌재가 인용했다는 일어난 사실이다
    for (const stage of ["impeachment_upheld", "impeachment_rejected", "impeachment_passed"]) {
      expect(deriveGrade(issue({ institutional_stage: stage }))).toBe("confirmed");
    }
  });

  it("형사 혐의와 섞이면 제도 쪽이 이긴다", () => {
    // 실제로 났던 사고: 헌재 파면 기사에 criminal_stage=indicted 가 붙어
    // 확정된 결정이 '혐의'로 표시됐다
    expect(
      deriveGrade(issue({ institutional_stage: "impeachment_upheld", criminal_stage: "indicted" })),
    ).toBe("confirmed");
  });

  it("모르는 제도 단계는 무시한다", () => {
    expect(deriveGrade(issue({ institutional_stage: "made_up", criminal_stage: "indicted" }))).toBe("alleged");
  });

  it("값이 비어 있어도 주장으로 떨어진다", () => {
    expect(deriveGrade({ criminal_stage: null, institutional_stage: null, category: null, source_tier: null, verified: null })).toBe("claim");
  });
});

describe("storyDuration", () => {
  const base = { started_at: "2020-01-01" };

  it("진행중이면 오늘까지 세고 '일째'", () => {
    const out = storyDuration({ ...base, ended_at: null, status: "ongoing" }, new Date("2020-01-11T00:00:00Z"));
    expect(out.label).toBe("10일째");
  });

  it("종결이면 연도 범위만 쓴다 — 종료일이 보도일이라 일 단위는 틀린 숫자가 된다", () => {
    // 국정농단은 2016~2021 사안인데 보도일 기준으로는 "175일간"이 나왔다
    const out = storyDuration({ started_at: "2016-10-24", ended_at: "2017-04-17", status: "closed" });
    expect(out.label).toBe("2016 – 2017");
  });

  it("종결이고 같은 해면 연도 하나", () => {
    expect(storyDuration({ started_at: "2018-03-01", ended_at: "2018-08-01", status: "closed" }).label).toBe("2018");
  });

  it("날짜가 깨져 있으면 빈 라벨", () => {
    expect(storyDuration({ started_at: "", ended_at: null, status: "ongoing" }).label).toBe("");
  });
});

describe("campBalance", () => {
  it("진영별로 센다", () => {
    const mk = (camp: StorylineSummary["camp"]) => ({ camp }) as StorylineSummary;
    expect(campBalance([mk("blue"), mk("blue"), mk("red"), mk("both")])).toEqual({
      blue: 2, red: 1, both: 1,
    });
  });
});
