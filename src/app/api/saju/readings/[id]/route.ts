import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ReadingSection } from '@/app/api/saju/reading/route';

export interface SavedReading {
  id:             string;
  type:           string;
  birth_year:     number;
  birth_month:    number;
  birth_day:      number;
  birth_hour:     number | null;
  birth_minute:   number;
  birth_sex:      string;
  birth_longitude: number;
  birth_name:     string | null;
  concern:        string | null;
  ai_sections:    ReadingSection[] | null;
  day_stem:       string | null;
  day_element:    string | null;
  created_at:     string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('saju_readings')
    .select('id,type,birth_year,birth_month,birth_day,birth_hour,birth_minute,birth_sex,birth_longitude,birth_name,concern,ai_sections,day_stem,day_element,created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(data as SavedReading);
}
