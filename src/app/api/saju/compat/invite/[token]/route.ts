/**
 * GET /api/saju/compat/invite/[token] — 초대 공개 조회. 출생정보 없음.
 */
import { NextRequest, NextResponse } from 'next/server';
import { loadInvite, publicInviteView } from '@/lib/saju/invite-server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await params;
  const invite = await loadInvite(token);
  if (!invite) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(publicInviteView(invite), { headers: { 'Cache-Control': 'no-store' } });
}
