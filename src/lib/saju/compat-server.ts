/**
 * 궁합 서버 공통 — /api/saju/compat 와 초대 수락 라우트가 같이 쓴다.
 * 계산(엔진) → 캐시 키 → 프롬프트 → 저장(양쪽 saju_readings, type='compat', partner JSONB).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { calcSajuServer } from '@/lib/saju/server';
import { buildFactSheet, FACTSHEET_VERSION } from '@/lib/saju/factsheet';
import { compareCharts, buildCompatPrompt, type CompatAnalysis, type CompatRelation } from '@/lib/saju/compat';
import { STEM_DATA } from '@/lib/saju/constants';
import type { FourPillars } from '@/lib/saju/engine';
import { parseJsonArrayLoose } from '@/lib/saju/json-repair';

export const PersonSchema = z.object({
  year:           z.number().int().min(1880).max(2100),
  month:          z.number().int().min(1).max(12),
  day:            z.number().int().min(1).max(31),
  hour:           z.number().int().min(0).max(23).nullable(),
  minute:         z.number().int().min(0).max(59).default(0),
  dayBoundaryRule: z.enum(['midnight', 'zi_hour']).default('midnight'),
  sex:            z.enum(['male', 'female']),
  longitudeE:     z.number().min(-180).max(180).default(127.0),
  name:           z.string().max(20).optional(),
});

export const RelationSchema = z.enum(['lover', 'friend', 'coworker', 'family']).default('lover');

export const COMPAT_MAX_TOKENS = 4400;

/** 초대 토큰 — 12자 base62. */
export function newInviteToken(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
}

export interface CompatPerson {
  year: number; month: number; day: number;
  hour: number | null; minute: number;
  dayBoundaryRule: 'midnight' | 'zi_hour';
  sex: 'male' | 'female';
  longitudeE: number;
  name?: string;
}

export interface CompatComputed {
  fpA: FourPillars;
  fpB: FourPillars;
  analysis: CompatAnalysis;
  cacheKey: string;
  system: string;
  user: string;
}

export const COMPAT_PROMPT_VERSION = '1.2';

export function computeCompat(personA: CompatPerson, personB: CompatPerson, relation: CompatRelation, tier: 'free' | 'paid' = 'free'): CompatComputed {
  const fpA = calcSajuServer(personA.year, personA.month, personA.day, personA.hour, personA.sex, personA.longitudeE, personA.minute, personA.dayBoundaryRule);
  const fpB = calcSajuServer(personB.year, personB.month, personB.day, personB.hour, personB.sex, personB.longitudeE, personB.minute, personB.dayBoundaryRule);
  const fsA = buildFactSheet(fpA, tier, 'love', { name: personA.name });
  const fsB = buildFactSheet(fpB, tier, 'love', { name: personB.name });
  const analysis = compareCharts(fpA, fpB, fsA.advanced.strengths.ratios, fsB.advanced.strengths.ratios);

  const hA = fpA.hour ? String(fpA.hour.gz) : 'x';
  const hB = fpB.hour ? String(fpB.hour.gz) : 'x';
  const year = new Date(Date.now() + 9 * 60 * 60 * 1000).getUTCFullYear();
  // A/B 순서가 바뀌어도 같은 키 — 두 차트 문자열을 정렬해 붙인다 (초대: 양쪽이 같은 풀이를 본다)
  const sigA = `${fpA.year.gz}-${fpA.month.gz}-${fpA.day.gz}-${hA}`;
  const sigB = `${fpB.year.gz}-${fpB.month.gz}-${fpB.day.gz}-${hB}`;
  const [s1, s2] = [sigA, sigB].sort();
  const cacheKey = `saju:compat:${COMPAT_PROMPT_VERSION}:${relation}:${s1}:${s2}:y${year}`;

  const { system, user } = buildCompatPrompt({
    personA: { stem: fpA.day.stem, branch: fpA.day.branch, element: fsA.dayMaster.element, bodyStrength: fsA.bodyStrength, yongsin: fsA.advanced.yongSin.yongsin },
    personB: { stem: fpB.day.stem, branch: fpB.day.branch, element: fsB.dayMaster.element, bodyStrength: fsB.bodyStrength, yongsin: fsB.advanced.yongSin.yongsin },
    analysis,
    relation,
  });

  return { fpA, fpB, analysis, cacheKey, system, user };
}

/** saju_readings.partner — 상대 정보 (결정 ③: 저장하되 이름은 선택, 삭제 가능) */
export interface CompatPartner {
  name:  string | null;
  sex:   'male' | 'female';
  birth: { year: number; month: number; day: number; hour: number | null; minute: number; longitudeE: number };
  chart: FourPillars;
  day_stem: string;
  relation: CompatRelation;
}

export interface CompatSectionLike { label?: string; title: string; body: string }

/**
 * 한 사람 관점의 궁합 리딩 저장. self 가 주체, partner 가 상대.
 * client 는 세션 클라이언트(본인) 또는 service 클라이언트(상대 행 작성 시).
 */
export async function saveCompatReading(args: {
  client: SupabaseClient;
  userId: string;
  self: CompatPerson; fpSelf: FourPillars;
  partner: CompatPerson; fpPartner: FourPillars;
  relation: CompatRelation;
  cacheKey: string;
  sections: CompatSectionLike[];
}): Promise<string | null> {
  const { client, userId, self, fpSelf, partner, fpPartner, relation, cacheKey, sections } = args;
  const partnerJson: CompatPartner = {
    name: partner.name ?? null,
    sex: partner.sex,
    birth: { year: partner.year, month: partner.month, day: partner.day, hour: partner.hour, minute: partner.minute, longitudeE: partner.longitudeE },
    chart: fpPartner,
    day_stem: fpPartner.day.stem,
    relation,
  };
  try {
    const { data, error } = await client.from('saju_readings').upsert({
      user_id: userId,
      type: 'compat',
      birth_year: self.year, birth_month: self.month, birth_day: self.day,
      birth_hour: self.hour, birth_minute: self.minute,
      birth_sex: self.sex, birth_longitude: self.longitudeE,
      birth_name: self.name ?? null,
      cache_key: cacheKey,
      day_stem: fpSelf.day.stem,
      day_element: STEM_DATA[fpSelf.day.stem].element,
      chart: fpSelf,
      engine_version: FACTSHEET_VERSION,
      partner: partnerJson,
      ai_sections: sections,
      last_viewed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,cache_key' }).select('id').single<{ id: string }>();
    if (error || !data) return null;
    return data.id;
  } catch { return null; }
}

export function parseCompatSections(raw: string): CompatSectionLike[] {
  interface RawSection { label?: string | number | null; title?: string | number | null; body?: string | number | null }
  const parsed = parseJsonArrayLoose<RawSection>(raw);
  if (!Array.isArray(parsed)) throw new Error('LLM 응답이 배열이 아님');
  const out = parsed
    .map(s => {
      const label = String(s?.label ?? '').replace(/^\[|\]$/g, '').trim();
      return { ...(label ? { label } : {}), title: String(s?.title ?? ''), body: String(s?.body ?? '') };
    })
    .filter(s => s.title || s.body);
  if (out.length === 0) throw new Error('파싱된 섹션 없음');
  return out;
}
