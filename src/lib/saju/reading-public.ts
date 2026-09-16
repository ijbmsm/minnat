/**
 * 공개 공유용 리딩 로더 — 서버 전용.
 * 출생정보는 절대 밖으로 내보내지 않는다. chart 가 없는 옛 row 는 서버에서 계산해 채운다.
 */
import { createServiceClient } from '@/lib/supabase/service';
import { calcSajuServer } from '@/lib/saju/server';
import { FACTSHEET_VERSION } from '@/lib/saju/factsheet';
import type { FourPillars } from '@/lib/saju/engine';

export interface PublicReading {
  id:             string;
  type:           string;
  chart:          FourPillars;
  engine_version: string;
  ai_sections:    { title: string; body: string }[] | null;
  day_stem:       string | null;
  day_element:    string | null;
  created_at:     string;
}

interface Row {
  id: string; type: string;
  chart: FourPillars | null; engine_version: string | null;
  ai_sections: { title: string; body: string }[] | null;
  day_stem: string | null; day_element: string | null; created_at: string;
  birth_year: number; birth_month: number; birth_day: number;
  birth_hour: number | null; birth_minute: number | null;
  birth_sex: 'male' | 'female'; birth_longitude: number | null;
}

export async function loadPublicReading(id: string): Promise<PublicReading | null> {
  const { data, error } = await createServiceClient()
    .from('saju_readings')
    .select('id,type,chart,engine_version,ai_sections,day_stem,day_element,created_at,birth_year,birth_month,birth_day,birth_hour,birth_minute,birth_sex,birth_longitude')
    .eq('id', id)
    .single<Row>();
  if (error || !data) return null;

  let chart = data.chart;
  let engineVersion = data.engine_version;
  if (!chart) {
    // 016 이전 row — 서버에서 계산 (출생정보는 여기서만 쓰고 응답에 넣지 않는다)
    try {
      chart = calcSajuServer(
        data.birth_year, data.birth_month, data.birth_day, data.birth_hour,
        data.birth_sex, data.birth_longitude ?? 127.0, data.birth_minute ?? 0, 'midnight',
      );
      engineVersion = FACTSHEET_VERSION;
    } catch {
      return null;
    }
  }

  return {
    id: data.id, type: data.type,
    chart, engine_version: engineVersion ?? FACTSHEET_VERSION,
    ai_sections: data.ai_sections,
    day_stem: data.day_stem, day_element: data.day_element,
    created_at: data.created_at,
  };
}
