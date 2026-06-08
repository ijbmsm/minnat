/**
 * POST /api/saju/compat
 *
 * 두 사람 생년월일시 입력 → 궁합 분석 → AI 해석 반환
 * calcSajuServer() × 2 → compareCharts() → buildCompatPrompt() → Anthropic
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Redis } from '@upstash/redis';
import { z } from 'zod';
import { calcSajuServer } from '@/lib/saju/server';
import { buildFactSheet } from '@/lib/saju/factsheet';
import { compareCharts, buildCompatPrompt, type CompatAnalysis } from '@/lib/saju/compat';
import { createClient } from '@/lib/supabase/server';

// ── 요청 스키마 ──

const PersonSchema = z.object({
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

const RequestSchema = z.object({
  personA: PersonSchema,
  personB: PersonSchema,
  tier:    z.enum(['free', 'paid']).default('free'),
});

// ── 응답 타입 ──

export interface CompatSection {
  title: string;
  body:  string;
}

export interface CompatResponse {
  cacheKey:  string;
  cached:    boolean;
  sections:  CompatSection[];
  analysis:  CompatAnalysis;
  tier:      'free' | 'paid';
}

// ── Redis ──
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url:   process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// ── Anthropic ──
let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

// ── JSON 파싱 ──
function parseSections(raw: string): CompatSection[] {
  const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error('LLM 응답이 배열이 아님');
  return parsed.map((s: { title?: unknown; body?: unknown }) => ({
    title: String(s.title ?? ''),
    body:  String(s.body  ?? ''),
  }));
}

// ── 캐시 키 ──
function makeCompatCacheKey(
  fpA: ReturnType<typeof calcSajuServer>,
  fpB: ReturnType<typeof calcSajuServer>,
  tier: string,
): string {
  const hA = fpA.hour ? String(fpA.hour.gz) : 'x';
  const hB = fpB.hour ? String(fpB.hour.gz) : 'x';
  // 연도 의존 (세운이 연도 기반)
  const year = new Date(Date.now() + 9 * 60 * 60 * 1000).getUTCFullYear();
  return `saju:compat:1.0:${tier}:${fpA.year.gz}-${fpA.month.gz}-${fpA.day.gz}-${hA}:${fpB.year.gz}-${fpB.month.gz}-${fpB.day.gz}-${hB}:y${year}`;
}

// ── Route Handler ──

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY 미설정' }, { status: 503 });
  }

  // 인증 확인
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // 파싱 & 검증
  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 });
  }

  const { personA, personB, tier } = body;

  // 무료 차트 캡 공유 (compat도 같은 캡 사용)
  if (tier === 'free' && redis) {
    const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const dateStr = `${kstNow.getUTCFullYear()}${String(kstNow.getUTCMonth()+1).padStart(2,'0')}${String(kstNow.getUTCDate()).padStart(2,'0')}`;
    const capKey = `saju:cap:free:${user.id}:${dateStr}`;
    const count = await redis.incr(capKey);
    if (count === 1) {
      const tomorrow = new Date(kstNow);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      const ttl = Math.ceil((tomorrow.getTime() - Date.now()) / 1000);
      await redis.expire(capKey, ttl);
    }
    if (count > 4) {
      return NextResponse.json(
        { error: '오늘 무료 풀이 횟수(4회)를 모두 사용했습니다. 내일 다시 시도해주세요.' },
        { status: 429 },
      );
    }
  }

  // 두 사람 사주 계산
  let fpA: ReturnType<typeof calcSajuServer>;
  let fpB: ReturnType<typeof calcSajuServer>;
  try {
    fpA = calcSajuServer(personA.year, personA.month, personA.day, personA.hour, personA.sex, personA.longitudeE, personA.minute, personA.dayBoundaryRule);
    fpB = calcSajuServer(personB.year, personB.month, personB.day, personB.hour, personB.sex, personB.longitudeE, personB.minute, personB.dayBoundaryRule);
  } catch (err) {
    return NextResponse.json({ error: `사주 계산 오류: ${err instanceof Error ? err.message : err}` }, { status: 500 });
  }

  // 팩트시트 (오행 세력 비율 추출)
  const fsA = buildFactSheet(fpA, tier, 'love', { name: personA.name });
  const fsB = buildFactSheet(fpB, tier, 'love', { name: personB.name });

  // 궁합 분석
  const analysis = compareCharts(fpA, fpB, fsA.advanced.strengths.ratios, fsB.advanced.strengths.ratios);

  const cacheKey = makeCompatCacheKey(fpA, fpB, tier);

  // 캐시 확인
  if (redis) {
    const hit = await redis.get<string>(cacheKey);
    if (hit) {
      try {
        const sections = parseSections(hit);
        const response: CompatResponse = { cacheKey, cached: true, sections, analysis, tier };
        return NextResponse.json(response);
      } catch {
        await redis.del(cacheKey);
      }
    }
  }

  // LLM 프롬프트 생성
  const { system, user: userMsg } = buildCompatPrompt({
    personA: {
      stem: fpA.day.stem, branch: fpA.day.branch,
      element: fsA.dayMaster.element,
      bodyStrength: fsA.bodyStrength,
      yongsin: fsA.advanced.yongSin.yongsin,
    },
    personB: {
      stem: fpB.day.stem, branch: fpB.day.branch,
      element: fsB.dayMaster.element,
      bodyStrength: fsB.bodyStrength,
      yongsin: fsB.advanced.yongSin.yongsin,
    },
    analysis,
  });

  const model    = tier === 'paid' ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';
  const maxToks  = tier === 'paid' ? 3200 : 2000;

  let raw: string;
  try {
    const msg = await getAnthropic().messages.create({
      model,
      max_tokens: maxToks,
      system,
      messages: [{ role: 'user', content: userMsg }],
    });
    const textBlock = msg.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') throw new Error('LLM 응답 없음');
    raw = textBlock.text.trim();
  } catch (err) {
    return NextResponse.json({ error: `AI 해석 실패: ${err instanceof Error ? err.message : err}` }, { status: 502 });
  }

  let sections: CompatSection[];
  try {
    sections = parseSections(raw);
  } catch {
    return NextResponse.json({ error: 'AI 응답 파싱 실패', raw }, { status: 502 });
  }

  // 캐시 저장 (궁합은 연도 만료)
  if (redis) {
    await redis.set(cacheKey, raw);
  }

  const response: CompatResponse = { cacheKey, cached: false, sections, analysis, tier };
  return NextResponse.json(response);
}
