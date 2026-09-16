/**
 * POST /api/saju/compat/invite/[token]/preview — B 가 로그인 없이 보는 엔진 분석 (점수·요약).
 * A 의 chart 는 서버에만 있고 응답에는 분석 결과만 나간다. LLM 없음.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { loadInvite } from '@/lib/saju/invite-server';
import { computeCompat, PersonSchema } from '@/lib/saju/compat-server';
import type { CompatAnalysis } from '@/lib/saju/compat';

const RequestSchema = z.object({ person: PersonSchema });

export interface InvitePreviewResponse { analysis: CompatAnalysis }

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await params;
  const invite = await loadInvite(token);
  if (!invite) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (invite.expired) return NextResponse.json({ error: 'expired' }, { status: 410 });

  let body: z.infer<typeof RequestSchema>;
  try { body = RequestSchema.parse(await req.json()); }
  catch { return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 }); }

  try {
    const { analysis } = computeCompat(invite.person_a, body.person, invite.relation);
    const res: InvitePreviewResponse = { analysis };
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json({ error: `사주 계산 오류: ${err instanceof Error ? err.message : err}` }, { status: 500 });
  }
}
