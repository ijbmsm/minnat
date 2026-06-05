import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// anon 클라이언트 — 쿠키 없이 공개 정책으로 읽음
function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  const { data, error } = await anonClient()
    .from('saju_readings')
    .select('id,type,birth_year,birth_month,birth_day,birth_hour,birth_minute,birth_sex,birth_longitude,birth_name,concern,ai_sections,day_stem,day_element,created_at')
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(data);
}
