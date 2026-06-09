"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SajuHistory } from "@/components/saju-history";

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

// ── DailyFree chip ──
function DailyFree({ total = 4, used = 0 }: { total?: number; used?: number }) {
  const left = total - used;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      border: `1px solid ${INK.cardLine}`, borderRadius: 999,
      padding: '7px 14px 7px 13px', background: INK.card,
    }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: 3,
            background: i < left ? INK.gold : INK.ink28,
          }} />
        ))}
      </div>
      <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 0.5, color: INK.ink70 }}>
        오늘 무료 {left}/{total}회
      </span>
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
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // 마운트 시 auth 상태 미리 로드 — 클릭 시 즉시 반응하기 위해
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  const handleClick = useCallback(
    (href: string) => {
      if (isLoggedIn === null) return; // 아직 로드 중
      if (isLoggedIn) {
        router.push(href);
      } else {
        setPendingHref(href);
      }
    },
    [router, isLoggedIn],
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
        padding: isMobile ? '34px 18px 56px' : '60px 40px 80px',
      }}>

        {/* HERO ROW */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: isMobile ? 'flex-start' : 'space-between',
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          gap: isSmall ? 18 : 24,
          marginBottom: isSmall ? 48 : 64,
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
          <DailyFree total={4} used={0} />
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

      {/* 로그인 유도 모달 */}
      {pendingHref && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            paddingBottom: 32, paddingLeft: 16, paddingRight: 16,
          }}
          onClick={() => setPendingHref(null)}
        >
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.60)',
            backdropFilter: 'blur(4px)',
          }} />
          <div
            style={{
              position: 'relative', width: '100%', maxWidth: 420,
              borderRadius: 16, border: `1px solid rgba(255,255,255,0.08)`,
              padding: 24, background: 'rgba(18,18,22,0.97)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              position: 'absolute', left: 0, right: 0, top: 0, height: 1,
              borderRadius: '16px 16px 0 0',
              background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)',
            }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 4 }}>로그인이 필요해요</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>
              로그인하면 하루 4회 무료로 사주를 볼 수 있어요.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPendingHref(null)}
                style={{
                  flex: 1, borderRadius: 12, border: `1px solid rgba(255,255,255,0.08)`,
                  padding: '10px 0', fontSize: 13, color: 'rgba(255,255,255,0.5)',
                  background: 'transparent', cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={() => router.push(`/auth/login?next=${encodeURIComponent(pendingHref)}`)}
                style={{
                  flex: 1, borderRadius: 12, background: '#fff',
                  border: 'none', padding: '10px 0', fontSize: 13,
                  fontWeight: 600, color: '#000', cursor: 'pointer',
                }}
              >
                로그인하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
