import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface SajuHistoryItem {
  id:             string;
  type:           'full' | 'today' | 'love';
  birth_year:     number;
  birth_month:    number;
  birth_day:      number;
  birth_hour:     number | null;
  birth_minute:   number | null;
  birth_sex:      string;
  birth_longitude: number;
  birth_name:     string | null;
  concern:        string | null;
  cache_key:      string;
  day_stem:       string | null;
  day_element:    string | null;
  last_viewed_at: string;
  created_at:     string;
}

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('saju_readings')
    .select('id,type,birth_year,birth_month,birth_day,birth_hour,birth_minute,birth_sex,birth_longitude,birth_name,concern,cache_key,day_stem,day_element,last_viewed_at,created_at')
    .eq('user_id', user.id)
    .order('last_viewed_at', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data as SajuHistoryItem[] });
}
