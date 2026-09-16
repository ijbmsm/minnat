"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SajuHistory } from "@/components/saju-history";
import type { CreditsResponse } from "@/app/api/saju/credits/route";

// ── Design tokens ──
const INK = {
  bg:       '#0c0907',
  bgRaise:  '#14100c',
  card:     'rgba(232,223,200,0.035)',
  cardLine: 'rgba(232,223,200,0.10)',
  hair:     'rgba(232,223,200,0.085)',
  ink:      'rgba(232,223,200,0.94)',
  ink70:    'rgba(232,223,200,0.66)',
  ink45:    'rgba(232,223,200,0.42)',
  ink28:    'rgba(232,223,200,0.26)',
  gold:     '#c2a35b',
};
const SERIF   = 'var(--font-noto-serif-kr), serif';
const MONO    = 'var(--font-ibm-plex-mono), monospace';
const DISPLAY = '"Shilla", var(--font-noto-serif-kr), serif';

// ── Responsive hook ──
function useBp(bp: number) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp - 1}px)`);
    const h = () => setM(mq.matches);
    h();
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [bp]);
  return m;
}

// ── SAJU_TYPES ──
const SAJU_TYPES = [
  { id: 'full',   href: '/saju/full',   seal: '命', ko: '종합 사주',   tagline: '성격, 연애, 직업,\n올해 운세까지 전부.',  featured: true },
  { id: 'today',  href: '/saju/today',  seal: '日', ko: '오늘의 사주', tagline: '오늘 일진으로 보는\n하루 에너지 흐름.' },
  { id: 'love',   href: '/saju/love',   seal: '緣', ko: '연애운',      tagline: '내 연애 패턴과\n잘 맞는 상대 유형.' },
  { id: 'career', href: '/saju/career', seal: '財', ko: '직업·재물운', tagline: '어울리는 일의 방향과\n재물 성향.' },
  { id: 'compat', href: '/saju/compat', seal: '合', ko: '궁합',        tagline: '두 사주로 보는 케미.\n끌리는 이유, 부딪히는 이유.' },
];

// ── CreditBadge — 3상태: 비로그인 / 무료 1회 남음 / 크레딧 N ──
function CreditBadge({ loggedIn, credits }: { loggedIn: boolean | null; credits: CreditsResponse | null }) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 10,
    border: `1px solid ${INK.cardLine}`, borderRadius: 999,
    padding: '7px 14px', background: INK.card,
    fontFamily: MONO, fontSize: 11, letterSpacing: 0.5, color: INK.ink70,
  };
  if (loggedIn === null) return <div style={{ ...base, opacity: 0.4 }}>·</div>;
  if (!loggedIn) return <div style={base}>가입하면 1회 무료 · 오늘의 사주는 매일</div>;
  if (!credits) return <div style={{ ...base, opacity: 0.6 }}>크레딧 확인 중</div>;
  const parts: string[] = [];
  if (!credits.freeUsed) parts.push('무료 1회 남음');
  if (credits.balance > 0) parts.push(`크레딧 ${credits.balance}`);
  if (credits.todayFree) parts.push('오늘의 사주 무료');
  if (parts.length === 0) parts.push('공유·초대로 +1');
  return (
    <div style={base}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: (!credits.freeUsed || credits.balance > 0 || credits.todayFree) ? INK.gold : INK.ink28 }} />
      {parts.join(' · ')}
    </div>
  );
}

// ── Seal component ──
function Seal({ ch, size = 34, color = INK.gold }: { ch: string; size?: number; color?: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: 5,
      border: `1px solid ${color}55`, color,
      fontFamily: SERIF, fontSize: size * 0.52, fontWeight: 500,
      flexShrink: 0,
    }}>
      {ch}
    </span>
  );
}

// ── SectionHead ──
function SectionHead({ ko, en }: { ko: string; en: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 8px 14px', marginBottom: 0 }}>
      <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: INK.ink70 }}>{ko}</span>
      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: INK.ink28 }}>{en}</span>
      <div style={{ flex: 1, height: 1, background: INK.hair }} />
    </div>
  );
}

export function SajuCards() {
  const router = useRouter();
  const isMobile = useBp(940);
  const isSmall = useBp(760);
  const [hovered, setHovered] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [credits, setCredits] = useState<CreditsResponse | null>(null);

  // auth 상태 + 크레딧 배지
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
      if (user) {
        fetch('/api/saju/credits').then(r => r.ok ? r.json() : null).then((d: CreditsResponse | null) => { if (d) setCredits(d); }).catch(() => {});
      }
    });
  }, []);

  // 비로그인도 바로 폼으로 (P1-1). 로그인은 AI 풀이 단계에서.
  const handleClick = useCallback(
    (href: string) => { router.push(href); },
    [router],
  );

  const sealSize = isSmall ? 42 : 48;
  const titleSize = isSmall ? '18px' : '21px';
  const rowPadding = isSmall ? '18px 6px' : '22px 8px';
  const rowGap = isSmall ? 16 : 22;

  return (
    <div style={{
      background: INK.bg,
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      color: INK.ink,
      fontFamily: SERIF,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 1080,
        margin: '0 auto',
        boxSizing: 'border-box',
        padding: isMobile ? '60px 18px 56px' : '96px 40px 80px',
      }}>

        {/* HERO ROW */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: isMobile ? 'flex-start' : 'space-between',
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          gap: isSmall ? 18 : 24,
          marginBottom: isSmall ? 32 : 46,
        }}>
          <div>
            <h1 style={{
              fontFamily: DISPLAY,
              fontSize: isSmall ? '54px' : '78px',
              color: INK.ink,
              letterSpacing: 2,
              margin: 0,
              fontWeight: 400,
              lineHeight: 1,
            }}>
              사주팔자
            </h1>
            <p style={{
              fontFamily: SERIF,
              fontSize: isSmall ? '15px' : '17px',
              color: INK.ink45,
              marginTop: 12,
              marginBottom: 0,
            }}>
              나는 왜 이런가.
            </p>
          </div>
          <CreditBadge loggedIn={isLoggedIn} credits={credits} />
        </div>

        {/* MAIN GRID */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) 320px',
          gap: isMobile ? 40 : 56,
          alignItems: 'start',
        }}>

          {/* LEFT — list */}
          <div>
            <SectionHead ko="무엇을 볼까" en="READINGS" />
            <div style={{ borderTop: `1px solid ${INK.hair}` }}>
              {SAJU_TYPES.map(t => (
                <div
                  key={t.id}
                  onClick={() => handleClick(t.href)}
                  onMouseEnter={() => setHovered(t.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    padding: rowPadding,
                    borderBottom: `1px solid ${INK.hair}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: rowGap,
                    cursor: 'pointer',
                    background: hovered === t.id ? 'rgba(232,223,200,0.02)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Seal */}
                  <Seal
                    ch={t.seal}
                    size={sealSize}
                    color={t.featured ? INK.gold : INK.ink45}
                  />

                  {/* Middle */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontFamily: SERIF,
                        fontSize: titleSize,
                        fontWeight: 600,
                        color: INK.ink,
                      }}>
                        {t.ko}
                      </span>
                      {t.id === 'today' && credits?.todayFree && (
                        <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: 1.5, color: INK.gold, border: `1px solid ${INK.gold}55`, borderRadius: 4, padding: '2px 6px' }}>
                          오늘 무료
                        </span>
                      )}
                      {t.featured && (
                        <span style={{
                          fontFamily: MONO,
                          fontSize: 9.5,
                          letterSpacing: 1.5,
                          color: INK.gold,
                          border: `1px solid ${INK.gold}55`,
                          borderRadius: 4,
                          padding: '2px 6px',
                        }}>
                          추천
                        </span>
                      )}
                    </div>
                    <p style={{
                      fontFamily: SERIF,
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      color: INK.ink45,
                      marginTop: 5,
                      marginBottom: 0,
                      whiteSpace: 'pre-line',
                    }}>
                      {t.tagline}
                    </p>
                  </div>

                  {/* Chevron */}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M5 3l5 5-5 5" stroke={INK.ink28} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ))}
            </div>

            {/* On mobile: history below list */}
            {isMobile && (
              <SajuHistory variant="standalone" />
            )}
          </div>

          {/* RIGHT sidebar (desktop only) */}
          {!isMobile && (
            <div style={{
              background: INK.card,
              border: `1px solid ${INK.cardLine}`,
              borderRadius: 14,
              padding: '10px 16px 14px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 6px 10px',
              }}>
                <span style={{ fontFamily: SERIF, fontSize: 14.5, fontWeight: 600, color: INK.ink70 }}>
                  최근 열람
                </span>
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: INK.ink28, cursor: 'pointer' }}>
                  모두 보기
                </span>
              </div>
              <SajuHistory variant="sidebar" />
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
