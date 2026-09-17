/**
 * POST /api/saju/compat
 *
 * 두 사람 생년월일시 입력 → 궁합 분석 → AI 해석 반환
 * 크레딧 판정(credits.ts) · 월 킬스위치(spend.ts) · 양쪽 저장은 본인 행만 (상대는 초대 경로에서만 저장)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { CompatAnalysis } from '@/lib/saju/compat';
import { createClient } from '@/lib/supabase/server';
import { callSajuLLM } from '@/lib/saju/llm';
import { cacheGet, cacheSet, cacheDel } from '@/lib/saju/cache';
import { chargeForReading, refundCredit, maybeRewardReferrer } from '@/lib/saju/credits';
import { reserveLLMCall, releaseLLMCall, MonthlyCapError } from '@/lib/saju/spend';
import { computeCompat, saveCompatReading, parseCompatSections, PersonSchema, RelationSchema, COMPAT_MAX_TOKENS, type CompatPerson } from '@/lib/saju/compat-server';
import type { ReadingCredit } from '@/app/api/saju/reading/route';

// ── 요청 스키마 ──

const RequestSchema = z.object({
  personA:  PersonSchema,
  personB:  PersonSchema,
  relation: RelationSchema,
  tier:     z.enum(['free', 'paid']).default('free'),
  refresh:  z.boolean().default(false),
});

// ── 응답 타입 ──

export interface CompatSection {
  /** 고정 카테고리 라벨 (케미·속도·갈등…). 구버전 저장분에는 없을 수 있다. */
  label?: string;
  title: string;
  body:  string;
}

export interface CompatResponse {
  cacheKey:   string;
  cached:     boolean;
  sections:   CompatSection[];
  analysis:   CompatAnalysis;
  tier:       'free' | 'paid';
  readingId?: string;
  credit?:    ReadingCredit;
}


// ── Route Handler ──

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY 미설정' }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 });
  }
  const { personA, personB, relation, tier, refresh } = body;
  const a: CompatPerson = personA;
  const b: CompatPerson = personB;

  let computed: ReturnType<typeof computeCompat>;
  try {
    computed = computeCompat(a, b, relation, tier);
  } catch (err) {
    return NextResponse.json({ error: `사주 계산 오류: ${err instanceof Error ? err.message : err}` }, { status: 500 });
  }
  const { fpA, fpB, analysis, cacheKey, system, user: userMsg } = computed;

  const respond = (sections: CompatSection[], cached: boolean, readingId: string | null, credit: ReadingCredit) => {
    const response: CompatResponse = { cacheKey, cached, sections, analysis, tier, ...(readingId ? { readingId } : {}), credit };
    return NextResponse.json(response);
  };
  const save = (sections: CompatSection[]) => saveCompatReading({
    client: supabase, userId: user.id, self: a, fpSelf: fpA, partner: b, fpPartner: fpB, relation, cacheKey, sections,
  });

  // 1) 내 DB 에 있으면 무료 재열람
  if (!refresh) {
    const { data: mine } = await supabase
      .from('saju_readings').select('id, ai_sections')
      .eq('user_id', user.id).eq('cache_key', cacheKey)
      .maybeSingle<{ id: string; ai_sections: CompatSection[] | null }>();
    if (mine?.ai_sections?.length) {
      await cacheSet(cacheKey, JSON.stringify(mine.ai_sections));
      return respond(mine.ai_sections, true, mine.id, { via: 'seen', balance: -1 });
    }
  }

  // 2) 크레딧
  const charge = await chargeForReading({ supabase, userId: user.id, type: 'compat', cacheKey, refresh });
  if (!charge.ok) {
    return NextResponse.json(
      { error: 'credit', message: '크레딧을 다 썼어. 상대에게 초대 링크를 보내면 크레딧 없이 둘 다 볼 수 있어.', balance: charge.balance, earn: charge.earn },
      { status: 402 },
    );
  }
  const credit: ReadingCredit = { via: charge.via, balance: charge.balance };
  const undoCharge = async () => {
    if (charge.via === 'credit') await refundCredit(user.id, cacheKey);
  };

  // 3) Redis
  if (!refresh) {
    const hit = await cacheGet(cacheKey);
    if (hit) {
      try {
        const sections = parseCompatSections(hit);
        const readingId = await save(sections);
        void maybeRewardReferrer(user.id);
        return respond(sections, true, readingId, credit);
      } catch {
        await cacheDel(cacheKey);
      }
    }
  }

  // 4) 킬스위치 → LLM
  try {
    await reserveLLMCall(user.id);
  } catch (err) {
    await undoCharge();
    if (err instanceof MonthlyCapError) {
      return NextResponse.json({ error: 'monthly_cap', message: '이번 달 준비된 풀이가 다 나갔어. 다음 달 1일에 다시 열려.' }, { status: 503 });
    }
    throw err;
  }

  let raw: string;
  try {
    const { text } = await callSajuLLM({ label: `compat:${relation}`, system, user: userMsg, maxTokens: COMPAT_MAX_TOKENS });
    raw = text;
  } catch (err) {
    await releaseLLMCall(user.id);
    await undoCharge();
    return NextResponse.json({ error: `AI 해석 실패: ${err instanceof Error ? err.message : err}` }, { status: 502 });
  }

  let sections: CompatSection[];
  try {
    sections = parseCompatSections(raw);
  } catch {
    await undoCharge();
    return NextResponse.json({ error: 'AI 응답 파싱 실패', raw }, { status: 502 });
  }

  await cacheSet(cacheKey, raw);
  const readingId = await save(sections);
  void maybeRewardReferrer(user.id);
  return respond(sections, false, readingId, credit);
}
