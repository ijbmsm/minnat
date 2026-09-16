import { NextRequest, NextResponse } from 'next/server';
import { loadPublicReading } from '@/lib/saju/reading-public';

/**
 * GET /api/saju/public/[id] — 공개 공유 조회.
 * 응답에는 출생정보·이름·고민이 없다. 원국은 저장된 chart 스냅샷(또는 서버 계산)으로 내려간다.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const reading = await loadPublicReading(id);
  if (!reading) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(reading, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
