import { describe, it, expect } from 'vitest';
import { stripLeadingActor } from '../actor-name';

describe('stripLeadingActor', () => {
  it('"이름, 제목" 에서 이름과 쉼표를 뗀다', () => {
    expect(stripLeadingActor('이재명, 추석 명절 각계 선물 증정', '이재명'))
      .toBe('추석 명절 각계 선물 증정');
  });

  it('"이름 직함, …" 에서 이름만 떼고 직함은 남긴다', () => {
    expect(stripLeadingActor('김민석 당대표, 당내통합·진보대통합 추진 선언', '김민석'))
      .toBe('당대표, 당내통합·진보대통합 추진 선언');
  });

  it('이름 뒤에 따옴표가 와도 뗀다', () => {
    expect(stripLeadingActor('한동훈 "김승원 임명 땐 대통령 임기 못 마쳐"', '한동훈'))
      .toBe('"김승원 임명 땐 대통령 임기 못 마쳐"');
  });

  it('요약이 다른 말로 시작하면 그대로 둔다', () => {
    const s = '민주당 법사위원들, 김승원 후보자 \'적임자\' 평가';
    expect(stripLeadingActor(s, '서영교')).toBe(s);
  });

  it('요약 중간에 이름이 있어도 앞머리가 아니면 그대로 둔다', () => {
    const s = '국회 본회의서 이재명 대통령 시정연설';
    expect(stripLeadingActor(s, '이재명')).toBe(s);
  });

  it('이름이 다른 단어에 이어지면 건드리지 않는다', () => {
    const s = '이재명그룹 계열사 압수수색';
    expect(stripLeadingActor(s, '이재명')).toBe(s);
  });

  it('요약이 이름뿐이면 지우지 않는다', () => {
    expect(stripLeadingActor('이재명', '이재명')).toBe('이재명');
    expect(stripLeadingActor('이재명,', '이재명')).toBe('이재명,');
  });

  it('"성 + 직함" 축약형은 성씨 한 글자만 뗀다', () => {
    expect(stripLeadingActor('이 대통령, 한-중앙아시아 5개국과 경제·안보 협력 강조', '이재명'))
      .toBe('대통령, 한-중앙아시아 5개국과 경제·안보 협력 강조');
    expect(stripLeadingActor('한 대표 "김승원 임명 반대"', '한동훈'))
      .toBe('대표 "김승원 임명 반대"');
  });

  it('복성은 두 글자를 성씨로 본다', () => {
    expect(stripLeadingActor('남궁 의원, 본회의 불참', '남궁인'))
      .toBe('의원, 본회의 불참');
  });

  it('지시관형사 "이" 를 성씨로 오인하지 않는다', () => {
    const s = '이 사건은 검찰이 무혐의 처분했다';
    expect(stripLeadingActor(s, '이재명')).toBe(s);
  });

  it('성씨는 같지만 직함이 아니면 그대로 둔다', () => {
    const s = '김 후임 인선 난항';
    expect(stripLeadingActor(s, '김민석')).toBe(s);
  });

  it('actorName 이 없거나 빈 문자열이면 원본', () => {
    expect(stripLeadingActor('추석 선물 증정', null)).toBe('추석 선물 증정');
    expect(stripLeadingActor('추석 선물 증정', '')).toBe('추석 선물 증정');
    expect(stripLeadingActor('추석 선물 증정', '   ')).toBe('추석 선물 증정');
  });

  it('summary 가 비어 있으면 원본', () => {
    expect(stripLeadingActor('', '이재명')).toBe('');
  });

  it('앞 공백과 하이픈 구분자도 처리한다', () => {
    expect(stripLeadingActor('  정점식 — 김승원 지명 철회 촉구', '정점식'))
      .toBe('김승원 지명 철회 촉구');
  });
});
