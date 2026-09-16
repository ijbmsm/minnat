import { describe, it, expect } from 'vitest';
import { INVITE_HOOKS, spouseElement, buildInviteHook } from '../hooks';
import { STEMS, ELEMENTS } from '../constants';

describe('초대 후킹 템플릿 50개', () => {
  it('일간 10 × 오행 5 전부 비어 있지 않고 서로 다르다', () => {
    const all: string[] = [];
    for (const s of STEMS) for (const e of ELEMENTS) {
      const line = INVITE_HOOKS[s][e];
      expect(line.length).toBeGreaterThan(10);
      expect(line).not.toMatch(/\d{4}/); // 연도·생년 없음
      all.push(line);
    }
    expect(all).toHaveLength(50);
    expect(new Set(all).size).toBe(50);
  });

  it('배우자성: 남=재성(극하는 오행), 여=관성(극당하는 오행)', () => {
    expect(spouseElement('갑', 'male')).toBe('토');
    expect(spouseElement('갑', 'female')).toBe('금');
    expect(spouseElement('병', 'male')).toBe('금');
    expect(spouseElement('병', 'female')).toBe('수');
    expect(spouseElement('임', 'female')).toBe('토');
  });

  it('buildInviteHook 은 일주 한자와 상대 오행을 채운다', () => {
    const h = buildInviteHook({ stem: '병', branchHanja: '戌', sex: 'female', keyword: '에너지' });
    expect(h.dayPillarHanja).toBe('丙戌');
    expect(h.partnerElement).toBe('수');
    expect(h.partnerElementHanja).toBe('水');
    expect(h.line).toBe(INVITE_HOOKS['병']['수']);
  });
});
