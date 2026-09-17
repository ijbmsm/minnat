import { describe, it, expect } from 'vitest';
import { buildHeadline, buildSubline } from '../headline';
import type { IssueEvent } from '@/types';

const ev = (summary: string | null, extra: Partial<IssueEvent> = {}): IssueEvent =>
  ({ summary, category: 'media_coverage', actor_name: '이재명', ...extra } as IssueEvent);

describe('buildHeadline', () => {
  it('첫 문장을 헤드라인으로 쓴다', () => {
    const e = ev('이재명 대통령이 정상회담을 개최했다. 양국은 협력을 논의했다.');
    expect(buildHeadline(e)).toBe('이재명 대통령이 정상회담을 개최했다');
  });

  it('60자를 넘으면 자르고 말줄임표', () => {
    const long = '가'.repeat(80);
    const out = buildHeadline(ev(long));
    expect(out).toHaveLength(61);
    expect(out.endsWith('…')).toBe(true);
  });

  it('요약이 없거나 너무 짧으면 actor + 카테고리로 대체', () => {
    expect(buildHeadline(ev(null))).toContain('이재명');
    expect(buildHeadline(ev('짧다.'))).toContain('이재명');
  });
});

describe('buildSubline', () => {
  it('한 문장짜리 요약이면 null — 헤드라인과 같은 줄이 두 번 나오는 걸 막는다', () => {
    const e = ev('이재명 대통령이 정상회담을 개최했다.');
    expect(buildSubline(e, buildHeadline(e))).toBeNull();
  });

  it('여러 문장이면 헤드라인에 안 쓰인 나머지를 준다', () => {
    const e = ev('이재명 대통령이 정상회담을 개최했다. 양국은 협력을 논의했다.');
    expect(buildSubline(e, buildHeadline(e))).toBe('양국은 협력을 논의했다.');
  });

  it('헤드라인이 잘렸어도 나머지를 정확히 떼어낸다', () => {
    const long = '가'.repeat(80) + ' 그리고 뒷이야기가 이어진다.';
    const e = ev(long);
    const sub = buildSubline(e, buildHeadline(e));
    expect(sub).not.toBeNull();
    expect(sub!.startsWith('가')).toBe(true);
    expect(sub).toContain('뒷이야기');
  });

  it('요약이 비면 null', () => {
    expect(buildSubline(ev(null), '무엇')).toBeNull();
    expect(buildSubline(ev('   '), '무엇')).toBeNull();
  });

  it('헤드라인이 fallback(요약과 무관)이면 요약 전체를 준다', () => {
    const e = ev('짧다.');
    // fallback 헤드라인은 "이재명, …" 이라 요약과 겹치지 않는다
    expect(buildSubline(e, buildHeadline(e))).toBe('짧다.');
  });

  it('구분자만 남으면 null', () => {
    const e = ev('이재명 대통령이 정상회담을 개최했다. ');
    expect(buildSubline(e, '이재명 대통령이 정상회담을 개최했다')).toBeNull();
  });
});
