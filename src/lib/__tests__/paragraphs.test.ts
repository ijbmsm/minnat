import { describe, it, expect } from 'vitest';
import { splitParagraphs } from '../paragraphs';

const NL = String.fromCharCode(10);

describe('splitParagraphs', () => {
  it('빈 값은 빈 배열', () => {
    expect(splitParagraphs('')).toEqual([]);
    expect(splitParagraphs(null)).toEqual([]);
    expect(splitParagraphs(undefined)).toEqual([]);
    expect(splitParagraphs('   ')).toEqual([]);
  });

  it('짧은 요약(3문장 이하)은 한 덩어리로 둔다', () => {
    const s = '이재명 대통령이 정상회담을 개최했다. 양국은 핵심광물 협력을 논의했다.';
    expect(splitParagraphs(s)).toEqual([s]);
  });

  it('빈 줄이 이미 있으면 그 경계를 존중한다', () => {
    const s = `첫 문단.${NL}${NL}둘째 문단.`;
    expect(splitParagraphs(s)).toEqual(['첫 문단.', '둘째 문단.']);
  });

  it('한 줄바꿈도 작성자의 의도로 본다', () => {
    const s = `첫 줄.${NL}둘째 줄.`;
    expect(splitParagraphs(s)).toEqual(['첫 줄.', '둘째 줄.']);
  });

  it('긴 한 덩어리는 문장 단위로 묶어 나눈다', () => {
    const s = [
      '가나다라마바사아자차카타파하 첫 번째 문장이다.',
      '두 번째 문장으로 갈등이 전개된다.',
      '세 번째 문장에서 이 기사의 사건이 벌어진다.',
      '네 번째 문장은 현재 상태를 말한다.',
      '다섯 번째 문장은 남은 변수를 짚는다.',
      '여섯 번째 문장으로 마무리한다.',
    ].join(' ');
    const out = splitParagraphs(s);
    expect(out.length).toBeGreaterThan(1);
    // 원문이 손실되지 않아야 한다
    expect(out.join(' ')).toBe(s);
  });

  it('마지막 한 문장만 남으면 앞 문단에 붙인다', () => {
    const s = [
      '문장 하나.', '문장 둘.', '문장 셋.', '문장 넷.',
    ].join(' ');
    const out = splitParagraphs(s);
    expect(out).toHaveLength(1);
    expect(out[0]).toBe(s);
  });

  it('나눈 결과를 다시 이어 붙이면 원문과 같다', () => {
    const s = Array.from({ length: 9 }, (_, i) => `아주 긴 문장 번호 ${i} 입니다 여기에 내용이 더 붙습니다.`).join(' ');
    expect(splitParagraphs(s).join(' ')).toBe(s);
  });
});
