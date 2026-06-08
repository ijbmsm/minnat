import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BIRTH_FIELDS = [
  'birth_year', 'birth_month', 'birth_day', 'birth_hour',
  'birth_minute', 'birth_sex', 'birth_name', 'birth_longitude',
] as const;

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('user_profiles')
    .select('kakao_nickname, profile_image, ' + BIRTH_FIELDS.join(', '))
    .eq('id', user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? {});
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const update = Object.fromEntries(
    Object.entries(body).filter(([k]) => (BIRTH_FIELDS as readonly string[]).includes(k))
  );
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'no valid fields' }, { status: 400 });
  }

  const { error } = await supabase
    .from('user_profiles')
    .update(update)
    .eq('id', user.id);

  if (error) {
    console.error('[profile PATCH] supabase error:', JSON.stringify(error));
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
