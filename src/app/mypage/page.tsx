import { redirect } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { SajuHistory } from "@/components/saju-history";
import { TodayButton } from "@/components/today-button";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "마이페이지 · 술자리" };

function formatBirthDate(p: {
  birth_year: number; birth_month: number; birth_day: number;
  birth_hour: number | null; birth_minute: number | null;
  birth_sex: string | null; birth_name: string | null;
}): string {
  let s = `${p.birth_year}년 ${p.birth_month}월 ${p.birth_day}일`;
  if (p.birth_hour !== null && p.birth_hour !== undefined) {
    const h = p.birth_hour;
    const ampm = h < 12 ? '오전' : '오후';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const m = p.birth_minute ?? 0;
    s += ` ${ampm} ${h12}시${m > 0 ? ` ${m}분` : ''}`;
  }
  s += ` · ${p.birth_sex === 'male' ? '남' : '여'}`;
  if (p.birth_name) s += ` · ${p.birth_name}`;
  return s;
}

const SAJU_TYPES = [
  { href: '/saju/full',   label: '종합 풀이' },
  { href: '/saju/love',   label: '연애운' },
  { href: '/saju/career', label: '직업운' },
  { href: '/saju/today',  label: '오늘의 사주' },
] as const;

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/mypage');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('kakao_nickname, profile_image, birth_year, birth_month, birth_day, birth_hour, birth_minute, birth_sex, birth_name, birth_longitude')
    .eq('id', user.id)
    .single();

  const hasBirth = profile?.birth_year != null;

  return (
    <>
      <Nav />
      <main className="min-h-dvh pt-14 pb-20">
        <div className="mx-auto max-w-[500px] px-4 py-10 space-y-8">

          {/* 프로필 */}
          <div className="flex items-center gap-4">
            {profile?.profile_image ? (
              <img
                src={profile.profile_image}
                alt="프로필"
                className="w-12 h-12 rounded-full border border-white/10 object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                <span className="text-white/30 text-lg">☿</span>
              </div>
            )}
            <div>
              <p className="text-white font-medium text-lg leading-tight">
                {profile?.kakao_nickname ?? '사용자'}
              </p>
              <p className="text-white/30 text-xs mt-0.5">마이페이지</p>
            </div>
          </div>

          {/* 오늘의 사주 빠른 접근 */}
          {hasBirth && profile && (
            <section>
              <p className="text-[10px] text-white/25 tracking-widest mb-3">오늘</p>
              <TodayButton profile={{
                birth_year: profile.birth_year!,
                birth_month: profile.birth_month!,
                birth_day: profile.birth_day!,
                birth_hour: profile.birth_hour ?? null,
                birth_minute: profile.birth_minute ?? 0,
                birth_sex: profile.birth_sex ?? 'male',
                birth_longitude: profile.birth_longitude ?? 127.0,
                birth_name: profile.birth_name ?? null,
              }} />
            </section>
          )}

          {/* 내 사주 정보 */}
          <section>
            <p className="text-[10px] text-white/25 tracking-widest mb-3">내 사주 정보</p>
            <div className="rounded-2xl border border-white/[0.07] p-5 space-y-4"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              {hasBirth ? (
                <>
                  <div>
                    <p className="text-white/40 text-xs mb-1">저장된 출생 정보</p>
                    <p className="text-white text-sm leading-relaxed">
                      {formatBirthDate(profile as Parameters<typeof formatBirthDate>[0])}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {SAJU_TYPES.map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        className="rounded-xl border border-white/[0.08] px-3 py-2.5 text-center text-sm text-white/70 transition-all hover:border-white/[0.18] hover:text-white hover:bg-white/[0.04]"
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                  <p className="text-[11px] text-white/20 text-center pt-1">
                    사주 페이지에서 정보를 수정하면 자동 저장돼요
                  </p>
                </>
              ) : (
                <div className="py-4 text-center space-y-3">
                  <p className="text-white/35 text-sm">아직 저장된 출생 정보가 없어요</p>
                  <Link
                    href="/saju/full"
                    className="inline-block rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.08] transition-all"
                  >
                    사주 보러 가기
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* 열람 내역 */}
          <section>
            <SajuHistory maxItems={20} />
          </section>

        </div>
      </main>
    </>
  );
}
