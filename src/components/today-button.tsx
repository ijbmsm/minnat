"use client";

import { useRouter } from "next/navigation";

interface BirthProfile {
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_hour: number | null;
  birth_minute: number;
  birth_sex: string;
  birth_longitude: number;
  birth_name: string | null;
}

export function TodayButton({ profile }: { profile: BirthProfile }) {
  const router = useRouter();

  function go() {
    try {
      sessionStorage.setItem('saju:pending-compute', JSON.stringify({
        year:       profile.birth_year,
        month:      profile.birth_month,
        day:        profile.birth_day,
        hour:       profile.birth_hour,
        minute:     profile.birth_minute,
        sex:        profile.birth_sex,
        longitudeE: profile.birth_longitude,
        name:       profile.birth_name ?? undefined,
        dayBoundaryRule: 'midnight',
        applyHapHwa: false,
      }));
    } catch { /* ignore */ }
    router.push('/saju/today');
  }

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <button
      onClick={go}
      className="w-full flex items-center justify-between rounded-2xl border border-white/[0.07] px-5 py-4 text-left transition-all hover:border-white/[0.14] hover:bg-white/[0.02] active:scale-[0.99]"
      style={{ background: 'rgba(255,255,255,0.012)' }}
    >
      <div>
        <p className="text-white font-medium text-sm">{dateStr} 오늘의 사주</p>
        <p className="text-white/30 text-xs mt-0.5">저장된 정보로 바로 풀이</p>
      </div>
      <span className="text-white/25 text-lg">→</span>
    </button>
  );
}
