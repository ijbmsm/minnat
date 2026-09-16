/**
 * POST /api/saju/compat/invite/[token]/accept — B 가 로그인 후 수락.
 * 궁합 풀이 1회 생성(캐시 키 공유) → A·B 양쪽 saju_readings 저장 → 양쪽 +1 크레딧.
 * 초대 경유 궁합은 양쪽 모두 크레딧 소모 없음 (코멘트: "상대가 자기 정보 입력했을 때 무료로").
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { callSajuLLM } from '@/lib/saju/llm';
import { cacheGet, cacheSet, cacheDel } from '@/lib/saju/cache';
import { grantCredit } from '@/lib/saju/credits';
import { reserveLLMCall, releaseLLMCall, MonthlyCapError } from '@/lib/saju/spend';
import { loadInvite } from '@/lib/saju/invite-server';
import { computeCompat, saveCompatReading, parseCompatSections, PersonSchema, COMPAT_MAX_TOKENS } from '@/lib/saju/compat-server';
import type { CompatResponse } from '@/app/api/saju/compat/route';

const RequestSchema = z.object({ person: PersonSchema });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY 미설정' }, { status: 503 });
  }
  const { token } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const invite = await loadInvite(token);
  if (!invite) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (invite.expired) return NextResponse.json({ error: 'expired', message: '초대가 만료됐어. 다시 보내달라고 해줘.' }, { status: 410 });
  if (invite.inviter_id === user.id) return NextResponse.json({ error: 'self', message: '내가 만든 초대는 내가 수락할 수 없어.' }, { status: 400 });
  if (invite.status === 'accepted' && invite.invitee_id !== user.id) {
    return NextResponse.json({ error: 'taken', message: '이미 다른 사람이 수락한 초대야.' }, { status: 409 });
  }

  let body: z.infer<typeof RequestSchema>;
  try { body = RequestSchema.parse(await req.json()); }
  catch { return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 }); }
  const personB = body.person;

  let computed: ReturnType<typeof computeCompat>;
  try { computed = computeCompat(invite.person_a, personB, invite.relation); }
  catch (err) { return NextResponse.json({ error: `사주 계산 오류: ${err instanceof Error ? err.message : err}` }, { status: 500 }); }
  const { fpA, fpB, analysis, cacheKey, system, user: userMsg } = computed;

  // 풀이 원문: 캐시 → LLM
  let sections: ReturnType<typeof parseCompatSections> | null = null;
  let cached = false;
  {
    const hit = await cacheGet(cacheKey);
    if (hit) { try { sections = parseCompatSections(hit); cached = true; } catch { await cacheDel(cacheKey); } }
  }
  if (!sections) {
    try { await reserveLLMCall(user.id); }
    catch (err) {
      if (err instanceof MonthlyCapError) {
        return NextResponse.json({ error: 'monthly_cap', message: '이번 달 준비된 풀이가 다 나갔어. 다음 달 1일에 다시 열려.' }, { status: 503 });
      }
      throw err;
    }
    let raw: string;
    try {
      const { text } = await callSajuLLM({ label: `compat:invite:${invite.relation}`, system, user: userMsg, maxTokens: COMPAT_MAX_TOKENS });
      raw = text;
    } catch (err) {
      await releaseLLMCall(user.id);
      return NextResponse.json({ error: `AI 해석 실패: ${err instanceof Error ? err.message : err}` }, { status: 502 });
    }
    try { sections = parseCompatSections(raw); }
    catch { return NextResponse.json({ error: 'AI 응답 파싱 실패', raw }, { status: 502 }); }
    await cacheSet(cacheKey, raw);
  }

  // 양쪽 저장 — B 는 세션 클라이언트, A 는 service 클라이언트 (RLS 상 남의 행)
  const svc = createServiceClient();
  const inviteeReadingId = await saveCompatReading({
    client: supabase, userId: user.id, self: personB, fpSelf: fpB, partner: invite.person_a, fpPartner: fpA,
    relation: invite.relation, cacheKey, sections,
  });
  await saveCompatReading({
    client: svc, userId: invite.inviter_id, self: invite.person_a, fpSelf: fpA, partner: personB, fpPartner: fpB,
    relation: invite.relation, cacheKey, sections,
  });

  // 최초 수락일 때만 보상·상태 갱신 (같은 B 가 다시 열면 그냥 결과)
  if (invite.status === 'pending') {
    await svc.from('saju_invites').update({
      status: 'accepted', invitee_id: user.id, reading_id: inviteeReadingId, accepted_at: new Date().toISOString(),
    }).eq('token', token).eq('status', 'pending');
    await Promise.all([
      grantCredit(user.id, 1, 'invite_accept', token),
      grantCredit(invite.inviter_id, 1, 'invite_accept', token),
    ]);
  }

  const response: CompatResponse = {
    cacheKey, cached, sections, analysis, tier: 'free',
    ...(inviteeReadingId ? { readingId: inviteeReadingId } : {}),
    credit: { via: 'invite', balance: -1 },
  };
  return NextResponse.json(response);
}
