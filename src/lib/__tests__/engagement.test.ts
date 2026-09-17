import { describe, it, expect } from 'vitest';
import { maskName, isMissingTable } from '../engagement';

describe('maskName', () => {
  it('앞 한 글자만 남기고 가린다', () => {
    expect(maskName('박정훈')).toBe('박**');
    expect(maskName('이수')).toBe('이*');
  });

  it('긴 닉네임도 별 두 개까지만', () => {
    expect(maskName('아주긴닉네임입니다')).toBe('아**');
  });

  it('한 글자 닉네임', () => {
    expect(maskName('김')).toBe('김*');
  });

  it('이모지·서러게이트 페어를 쪼개지 않는다', () => {
    expect(maskName('🐱냥이')).toBe('🐱**');
  });

  it('비어 있으면 익명', () => {
    expect(maskName(null)).toBe('익명');
    expect(maskName(undefined)).toBe('익명');
    expect(maskName('   ')).toBe('익명');
  });
});

describe('isMissingTable', () => {
  it('테이블 없음 코드를 잡는다', () => {
    expect(isMissingTable({ code: '42P01' })).toBe(true);
    expect(isMissingTable({ code: 'PGRST205' })).toBe(true);
  });

  it('메시지로도 잡는다', () => {
    expect(isMissingTable({ message: 'relation "issue_follows" does not exist' })).toBe(true);
    expect(isMissingTable({ message: "Could not find the table in the schema cache" })).toBe(true);
  });

  it('다른 오류는 통과시키지 않는다', () => {
    expect(isMissingTable({ code: '23505', message: 'duplicate key value' })).toBe(false);
    expect(isMissingTable(null)).toBe(false);
    expect(isMissingTable(undefined)).toBe(false);
  });
});
